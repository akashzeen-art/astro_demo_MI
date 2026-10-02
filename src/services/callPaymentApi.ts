import { ASTRO_USER_CONFIG, CALL_PAYMENT_CONFIG } from "@/lib/config";
import { normalizeMobile } from "@/lib/subscription";
import { loadBirthProfile } from "@/services/userProfileApi";
import { getOrGenerateClickId } from "@/utils/clickIdManager";

export interface CallPack {
  /** Pack key from API, e.g. "5" or "10" — also the servicePack for payment. */
  packType: string;
  /** Minutes of talk time. */
  minutes: number;
  /** Price in INR. */
  price: number;
}

export interface CallPortalPricing {
  portalId: string;
  portalName?: string;
  currencyCode: string;
  packs: CallPack[];
}

/** Response from GET /api/astro/call-data?msisdn= */
export interface CallBalance {
  totalSecs: number;
  remainingSecs: number;
  usedSecs: number;
  portalId: number | string;
  msisdn: string;
}

export type CallSessionStart =
  | { mode: "balance"; remainingSecs: number; balance: CallBalance }
  | { mode: "pack"; pack: CallPack; remainingSecs: number };

const CALL_CREDIT_KEY = "call_credit";
const PENDING_CALL_PACK_KEY = "pending_call_pack";
const CALL_BALANCE_KEY = "call_balance";

export function getCallMobile(): string {
  return normalizeMobile(
    loadBirthProfile()?.mobile || localStorage.getItem("userMobile") || "",
  );
}

/** e.g. 400 secs → "6 min 40 sec" / 900 → "15 min" */
export function formatSecsAsMins(totalSecs: number): string {
  const secs = Math.max(0, Math.floor(totalSecs));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m <= 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

/** Whole minutes for timers that only take minutes (ceil so leftover secs aren't lost). */
export function secsToCallMinutes(totalSecs: number): number {
  if (totalSecs <= 0) return 0;
  return Math.max(1, Math.ceil(totalSecs / 60));
}

function parsePackMap(
  data: {
    multiplePackType?: Record<string, string | number>;
    multiplePackTypeJson?: string;
  },
): Record<string, string | number> {
  if (data.multiplePackType && typeof data.multiplePackType === "object") {
    return data.multiplePackType;
  }
  if (data.multiplePackTypeJson) {
    try {
      const parsed = JSON.parse(data.multiplePackTypeJson) as Record<
        string,
        string | number
      >;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // fall through
    }
  }
  return {};
}

export function parseCallPacks(apiData: {
  multiplePackType?: Record<string, string | number>;
  multiplePackTypeJson?: string;
}): CallPack[] {
  const map = parsePackMap(apiData);
  return Object.entries(map)
    .map(([key, value]) => {
      const minutes = Number(key);
      const price = Number(value);
      return {
        packType: String(key),
        minutes,
        price,
      };
    })
    .filter(
      (p) =>
        Number.isFinite(p.minutes) &&
        p.minutes > 0 &&
        Number.isFinite(p.price) &&
        p.price >= 0,
    )
    .sort((a, b) => a.minutes - b.minutes || a.price - b.price);
}

/** GET /api/astro/call-data?msisdn= — remaining talk time for this mobile. */
export async function fetchCallBalance(msisdn?: string): Promise<CallBalance | null> {
  const mobile = normalizeMobile(msisdn || getCallMobile());
  if (mobile.length !== 10) return null;

  const apiUrl = `${ASTRO_USER_CONFIG.CALL_DATA_URL}?msisdn=${encodeURIComponent(mobile)}`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Call balance request failed: ${response.status}`);
  }

  const data = (await response.json()) as Partial<CallBalance>;
  const balance: CallBalance = {
    totalSecs: Number(data.totalSecs) || 0,
    remainingSecs: Number(data.remainingSecs) || 0,
    usedSecs: Number(data.usedSecs) || 0,
    portalId: data.portalId ?? CALL_PAYMENT_CONFIG.PORTAL_ID,
    msisdn: normalizeMobile(String(data.msisdn || mobile)),
  };

  cacheCallBalance(balance);
  return balance;
}

export function cacheCallBalance(balance: CallBalance) {
  localStorage.setItem(
    CALL_BALANCE_KEY,
    JSON.stringify({ ...balance, fetchedAt: new Date().toISOString() }),
  );
}

export function loadCachedCallBalance(): CallBalance | null {
  try {
    const raw = localStorage.getItem(CALL_BALANCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CallBalance;
    if (!Number.isFinite(parsed.remainingSecs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** GET /api/payment/portal/1015?clickid= — dynamic minutes → price packs. */
export async function fetchCallPortalPricing(
  clickId?: string,
): Promise<CallPortalPricing> {
  const portalId = CALL_PAYMENT_CONFIG.PORTAL_ID;
  const cid = clickId || getOrGenerateClickId(portalId);
  const apiUrl = `${CALL_PAYMENT_CONFIG.BASE_URL}/portal/${portalId}?clickid=${encodeURIComponent(cid)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Call pricing request failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    portalId: String(data.portalId ?? portalId),
    portalName: data.portalName,
    currencyCode: data.currencyCode || "INR",
    packs: parseCallPacks(data),
  };
}

export function savePendingCallPack(pack: CallPack) {
  localStorage.setItem(
    PENDING_CALL_PACK_KEY,
    JSON.stringify({ ...pack, savedAt: new Date().toISOString() }),
  );
}

export function loadPendingCallPack(): CallPack | null {
  try {
    const raw = localStorage.getItem(PENDING_CALL_PACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CallPack;
    if (!parsed?.packType || !parsed.minutes) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingCallPack() {
  localStorage.removeItem(PENDING_CALL_PACK_KEY);
}

export function grantCallCredit(pack: CallPack) {
  localStorage.setItem(
    CALL_CREDIT_KEY,
    JSON.stringify({
      ...pack,
      purchasedAt: new Date().toISOString(),
    }),
  );
  clearPendingCallPack();
}

export function loadCallCredit(): (CallPack & { purchasedAt?: string }) | null {
  try {
    const raw = localStorage.getItem(CALL_CREDIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CallPack & { purchasedAt?: string };
  } catch {
    return null;
  }
}

export function clearCallCredit() {
  localStorage.removeItem(CALL_CREDIT_KEY);
}

/** Consume pending pack into call credit after payment return (or demo). */
export function activatePendingCallCredit(): CallPack | null {
  const pending = loadPendingCallPack();
  if (!pending) return loadCallCredit();
  grantCallCredit(pending);
  return pending;
}

export function initiateCallPayment(orderData: {
  clickId: string;
  mobile: string;
  pack: CallPack;
}) {
  const { clickId, mobile, pack } = orderData;
  const portalId = CALL_PAYMENT_CONFIG.PORTAL_ID;
  const apiUrl = `${CALL_PAYMENT_CONFIG.BASE_URL}/initiate`;

  savePendingCallPack(pack);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = apiUrl;

  const payload = {
    portalId: parseInt(portalId, 10),
    mobile,
    email: "",
    clickId,
    servicePack: pack.packType,
    amount: pack.price,
  };

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
