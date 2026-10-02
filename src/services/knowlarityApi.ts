import { ASTRO_USER_CONFIG, KNOWLARITY_CONFIG } from "@/lib/config";
import { normalizeMobile } from "@/lib/subscription";

export interface MakeCallPayload {
  /** Pandit Ji phone number */
  agent: string;
  /** End-user (customer) phone number */
  customer: string;
  configId?: number;
}

export interface MakeCallResult {
  ok: boolean;
  status: number;
  queued?: boolean;
  calling?: boolean;
  data?: unknown;
  /** Backend success/error message, e.g. "Call placed successfully" */
  message?: string;
  error?: string;
}

function toDialNumber(raw: string): string {
  return normalizeMobile(raw) || raw.replace(/\D/g, "");
}

/**
 * POST /api/knowlarity/make-call
 * Bridges Pandit Ji (agent) ↔ customer via Knowlarity.
 */
export async function makeKnowlarityCall(
  input: MakeCallPayload,
): Promise<MakeCallResult> {
  const agent = toDialNumber(input.agent);
  const customer = toDialNumber(input.customer);

  if (agent.length < 10 || customer.length < 10) {
    return {
      ok: false,
      status: 0,
      error: "Valid Pandit Ji and customer mobile numbers are required.",
    };
  }

  const payload = {
    agent,
    customer,
    configId: input.configId ?? KNOWLARITY_CONFIG.CONFIG_ID,
  };

  try {
    const response = await fetch(KNOWLARITY_CONFIG.MAKE_CALL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const body = data as { message?: string; status?: string } | null;
    const bodyStatus = (body?.status || "").trim().toUpperCase();
    const bodyMessage = body?.message || "";

    if (bodyStatus === "QUEUED" || bodyStatus === "IN_QUEUE" || bodyStatus === "IN QUEUE") {
      return {
        ok: true,
        queued: true,
        status: response.status,
        data,
        message: bodyMessage || "Added in queue",
      };
    }

    if (bodyStatus === "CALLING" || bodyStatus === "RINGING" || bodyStatus === "CONNECTED") {
      return {
        ok: true,
        queued: false,
        calling: true,
        status: response.status,
        data,
        message: bodyMessage || "Call started",
      };
    }

    if (!response.ok) {
      const message =
        bodyMessage ||
        (data as { error?: string } | null)?.error ||
        `Call failed (${response.status})`;
      return { ok: false, status: response.status, data, error: message, message };
    }

    const successMessage = bodyMessage || "Call placed successfully";

    if (bodyStatus && bodyStatus !== "SUCCESS" && bodyStatus !== "OK") {
      return {
        ok: false,
        status: response.status,
        data,
        error: successMessage,
        message: successMessage,
      };
    }

    return {
      ok: true,
      queued: false,
      status: response.status,
      data,
      message: successMessage,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Network error while dialing",
    };
  }
}

/**
 * GET /api/astro/queue/cancel?agent=&customer=
 * Removes the customer from queue if they hang up before the call joins.
 */
export async function cancelQueuedCall(input: {
  agent: string;
  customer: string;
}): Promise<{ ok: boolean; message: string }> {
  const agent = toDialNumber(input.agent);
  const customer = toDialNumber(input.customer);

  if (agent.length < 10 || customer.length < 10) {
    return { ok: false, message: "Valid agent and customer numbers are required." };
  }

  const url =
    `${ASTRO_USER_CONFIG.QUEUE_CANCEL_URL}?agent=${encodeURIComponent(agent)}` +
    `&customer=${encodeURIComponent(customer)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json, text/plain" },
    });
    const text = (await response.text().catch(() => "")).trim();
    let message = text || "Queue cancelled successfully";
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      /* plain text body */
    }
    if (!response.ok) {
      return { ok: false, message: message || `Queue cancel failed (${response.status})` };
    }
    return { ok: true, message };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not cancel queue",
    };
  }
}
