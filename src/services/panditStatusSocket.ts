import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { normalizeMobile } from "@/lib/subscription";
import { PANDIT_WS_CONFIG } from "@/lib/config";
import type { PanditProfile, PanditStatus } from "@/data/pandits";

export type PanditWsStatusPayload = {
  mobile: string;
  status: PanditStatus;
};

/** From /topic/call/status — e.g. { mobile, status: "CALL ENDED" } */
export type CallWsStatusPayload = {
  mobile: string;
  status: string;
};

const WS_EVENT = "pandit-ws-status";
const CALL_WS_EVENT = "call-ws-status";

/** Latest status by mobile — wins over REST until refreshed. */
const statusByMobile = new Map<string, PanditStatus>();

let client: Client | null = null;
let started = false;
let connected = false;

export function isPanditStatusSocketConnected(): boolean {
  return connected;
}

export function normalizePanditWsStatus(raw?: string): PanditStatus {
  const s = (raw || "").trim().toLowerCase();
  if (s === "available" || s === "online" || s === "free") return "available";
  if (s === "break" || s === "on_break" || s === "onbreak") return "break";
  if (s === "offline") return "busy";
  return "busy";
}

export function isCallEndedStatus(raw?: string): boolean {
  const s = (raw || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  return (
    s === "call ended" ||
    s === "ended" ||
    s === "call end" ||
    s === "disconnected" ||
    s === "hangup" ||
    s === "hang up"
  );
}

export function isCallConnectedStatus(raw?: string): boolean {
  const s = (raw || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  return (
    s === "connected" ||
    s === "call connected" ||
    s === "answered" ||
    s === "in progress" ||
    s === "call started" ||
    s === "started" ||
    s === "ongoing" ||
    s === "calling" ||
    s === "ringing" ||
    s === "in call"
  );
}

export function isCallCallingStatus(raw?: string): boolean {
  const s = (raw || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  return s === "calling" || s === "ringing" || s === "in call" || s === "call started";
}

export function isCallQueuedStatus(raw?: string): boolean {
  const s = (raw || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  return s === "queued" || s === "in queue" || s === "added in queue";
}

export function getPanditWsStatus(mobile?: string): PanditStatus | undefined {
  if (!mobile) return undefined;
  return statusByMobile.get(normalizeMobile(mobile));
}

const LOG_PREFIX = "[websocket]";

function wsLog(...args: unknown[]) {
  console.log(LOG_PREFIX, ...args);
}

function wsWarn(...args: unknown[]) {
  console.warn(LOG_PREFIX, ...args);
}

function wsError(...args: unknown[]) {
  console.error(LOG_PREFIX, ...args);
}

export function applyPanditWsStatus(
  mobile: string,
  statusRaw: string,
): PanditWsStatusPayload | null {
  const digits = normalizeMobile(mobile);
  if (digits.length < 10) {
    wsWarn("pandit status ignored — invalid mobile", mobile, statusRaw);
    return null;
  }

  const status = normalizePanditWsStatus(statusRaw);
  statusByMobile.set(digits, status);
  wsLog("pandit status updated →", { mobile: digits, status, raw: statusRaw });

  const detail: PanditWsStatusPayload = { mobile: digits, status };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WS_EVENT, { detail }));
  }
  return detail;
}

export function applyCallWsStatus(
  mobile: string,
  statusRaw: string,
): CallWsStatusPayload | null {
  const digits = normalizeMobile(mobile);
  if (digits.length < 10) {
    wsWarn("call status ignored — invalid mobile", mobile, statusRaw);
    return null;
  }

  const status = (statusRaw || "").trim();
  const detail: CallWsStatusPayload = { mobile: digits, status };
  wsLog("call status updated →", {
    mobile: digits,
    status,
    isEnded: isCallEndedStatus(status),
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CALL_WS_EVENT, { detail }));
  }
  return detail;
}

/** Merge live overrides onto pandit list (by phoneNumber). */
export function applyWsOverridesToPandits(
  list: PanditProfile[],
): PanditProfile[] {
  return list.map((p) => {
    const override = getPanditWsStatus(p.phoneNumber);
    if (!override) return p;
    return { ...p, baseAvailability: override };
  });
}

export function onPanditWsStatus(
  callback: (payload: PanditWsStatusPayload) => void,
): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<PanditWsStatusPayload>).detail);
  };
  window.addEventListener(WS_EVENT, handler);
  return () => window.removeEventListener(WS_EVENT, handler);
}

export function onCallWsStatus(
  callback: (payload: CallWsStatusPayload) => void,
): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<CallWsStatusPayload>).detail);
  };
  window.addEventListener(CALL_WS_EVENT, handler);
  return () => window.removeEventListener(CALL_WS_EVENT, handler);
}

/**
 * SockJS URL must be https:// (not ws/wss).
 * Production: always same-origin `/api/ws` so nginx + cookies work.
 * Local dev: hit UPSTREAM directly (Vite has no reliable SockJS proxy).
 */
function resolveSockJsUrl(): string {
  let url = (PANDIT_WS_CONFIG.SOCKJS_URL || "/api/ws").trim();

  if (url.startsWith("wss://")) url = url.replace(/^wss:\/\//, "https://");
  if (url.startsWith("ws://")) url = url.replace(/^ws:\/\//, "http://");

  const { hostname, origin, protocol } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const brandHosts = ["cookstudio.live", "myastrosutra.live"];
  const pageHost = hostname.replace(/^www\./i, "");

  // Absolute override from env
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const target = new URL(url);
      const targetHost = target.hostname.replace(/^www\./i, "");
      // On live brand domains, never cross-origin SockJS (cookie_needed breaks it)
      if (
        brandHosts.includes(pageHost) &&
        targetHost !== pageHost &&
        !isLocal
      ) {
        const sameOrigin = `${origin}/api/ws`;
        wsLog("forcing same-origin SockJS (was cross-origin)", {
          page: origin,
          configured: url,
          using: sameOrigin,
        });
        return sameOrigin;
      }
    } catch {
      // fall through
    }
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;

  // Local Vite — talk to production API host directly
  if (isLocal || import.meta.env.DEV) {
    return `${PANDIT_WS_CONFIG.UPSTREAM.replace(/\/$/, "")}${path}`;
  }

  // Deployed site — same origin (https://this-host/api/ws)
  return `${protocol}//${hostname}${path}`;
}

function isSameOriginUrl(url: string): boolean {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function createSockJsSocket(url: string): WebSocket {
  const sameOrigin = isSameOriginUrl(url);
  // Same-origin: allow websocket (nginx Upgrade). Cross-origin: XHR only.
  const transports = sameOrigin
    ? (["websocket", "xhr-streaming", "xhr-polling"] as const)
    : (["xhr-streaming", "xhr-polling"] as const);

  wsLog("creating SockJS →", { url, sameOrigin, transports: [...transports] });

  const sock = new SockJS(url, null, {
    transports: [...transports],
    timeout: 12_000,
  });
  return sock as unknown as WebSocket;
}

/**
 * STOMP over SockJS (XHR only — no raw WebSocket upgrade).
 * Topics:
 *  - /topic/pandit/status  → { mobile, status: Available|busy|break }
 *  - /topic/call/status    → { mobile, status: "CALL ENDED" }
 */
export function startPanditStatusSocket(): void {
  if (typeof window === "undefined") return;
  if (started) {
    wsLog("already started — skip (connected=", connected, ")");
    return;
  }
  started = true;

  const sockJsUrl = resolveSockJsUrl();
  let failCount = 0;

  wsLog("starting STOMP client →", {
    url: sockJsUrl,
    panditTopic: PANDIT_WS_CONFIG.STATUS_TOPIC,
    callTopic: PANDIT_WS_CONFIG.CALL_STATUS_TOPIC,
    reconnectMs: PANDIT_WS_CONFIG.RECONNECT_MS,
  });

  client = new Client({
    webSocketFactory: () => createSockJsSocket(sockJsUrl),
    reconnectDelay: PANDIT_WS_CONFIG.RECONNECT_MS,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,
    debug: (msg) => {
      // STOMP frame-level debug (connect / subscribe / message)
      if (
        msg.includes("CONNECTED") ||
        msg.includes("SUBSCRIBE") ||
        msg.includes("MESSAGE") ||
        msg.includes("ERROR") ||
        msg.includes("<<<") ||
        msg.includes(">>>")
      ) {
        wsLog("stomp:", msg.trim());
      }
    },
    onConnect: (frame) => {
      connected = true;
      failCount = 0;
      wsLog("CONNECTED ✓", {
        url: sockJsUrl,
        headers: frame?.headers,
      });

      // Pandit Ji availability: Available / busy / break
      client?.subscribe(PANDIT_WS_CONFIG.STATUS_TOPIC, (message) => {
        wsLog("message ←", PANDIT_WS_CONFIG.STATUS_TOPIC, message.body);
        try {
          const data = JSON.parse(message.body) as {
            mobile?: string;
            status?: string;
          };
          if (!data?.mobile || !data?.status) {
            wsWarn("pandit status missing mobile/status", data);
            return;
          }
          applyPanditWsStatus(data.mobile, data.status);
        } catch (err) {
          wsError("bad pandit status JSON", message.body, err);
        }
      });
      wsLog("subscribed →", PANDIT_WS_CONFIG.STATUS_TOPIC);

      // Call lifecycle: { mobile: customer, status: "CALL ENDED" }
      client?.subscribe(PANDIT_WS_CONFIG.CALL_STATUS_TOPIC, (message) => {
        wsLog("message ←", PANDIT_WS_CONFIG.CALL_STATUS_TOPIC, message.body);
        try {
          const data = JSON.parse(message.body) as {
            mobile?: string;
            status?: string;
          };
          if (!data?.mobile || !data?.status) {
            wsWarn("call status missing mobile/status", data);
            return;
          }
          applyCallWsStatus(data.mobile, data.status);
        } catch (err) {
          wsError("bad call status JSON", message.body, err);
        }
      });
      wsLog("subscribed →", PANDIT_WS_CONFIG.CALL_STATUS_TOPIC);
    },
    onDisconnect: () => {
      connected = false;
      wsWarn("DISCONNECTED");
    },
    onStompError: (frame) => {
      connected = false;
      wsError("STOMP error", frame.headers["message"], frame.body);
    },
    onWebSocketClose: (evt) => {
      connected = false;
      wsWarn("socket closed", {
        code: (evt as CloseEvent | undefined)?.code,
        reason: (evt as CloseEvent | undefined)?.reason,
        wasClean: (evt as CloseEvent | undefined)?.wasClean,
      });
    },
    onWebSocketError: (err) => {
      connected = false;
      failCount += 1;
      wsError("socket error (#" + failCount + ")", sockJsUrl, err);
      if (failCount <= 2) {
        wsWarn("will retry / REST poll fallback active");
      }
    },
  });

  client.activate();
  wsLog("client.activate() called");
}

export function stopPanditStatusSocket(): void {
  wsLog("stopping socket…");
  started = false;
  connected = false;
  if (client) {
    void client.deactivate();
    client = null;
    wsLog("client deactivated");
  }
}
