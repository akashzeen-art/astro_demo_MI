import { ASTRO_USER_CONFIG } from "@/lib/config";
import {
  cleanPanditName,
  panditPortrait,
  type PanditGender,
  type PanditProfile,
  type PanditStatus,
} from "@/data/pandits";

/** Fields returned by GET /api/astro/pandit/all */
export interface PanditApiItem {
  id: string | number;
  /** Backend may send either */
  name?: string;
  fullName?: string;
  title?: string;
  specialty?: string;
  imageUrl?: string;
  gender?: string;
  /** Array or comma-separated string */
  languages?: string[] | string;
  sessions?: number | string;
  experienceYears?: number | string;
  /** available | busy | break (any case) */
  status?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

const HARDCODED_RATING = 4.8;
const DEFAULT_LANGUAGES = ["Hindi", "English"];

function normalizeStatus(raw?: string): PanditStatus {
  const s = (raw || "").trim().toLowerCase();
  if (s === "available") return "available";
  if (s === "break") return "break";
  if (s === "offline") return "offline";
  return "busy";
}

function normalizeGender(raw?: string): PanditGender {
  const g = (raw || "").trim().toLowerCase();
  if (g === "female") return "female";
  if (g === "other") return "other";
  return "male";
}

function normalizeLanguages(raw?: string[] | string): string[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((l) => String(l).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return DEFAULT_LANGUAGES;
}

function toNumber(raw: number | string | undefined, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits || undefined;
}

/** True when a string is (or is mostly) a phone number — never show these on UI. */
function looksLikePhone(raw?: string): boolean {
  if (!raw) return false;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 10) return false;
  const withoutDigits = String(raw).replace(/[\d\s+\-().]/g, "").trim();
  return withoutDigits.length <= 2;
}

function safeDisplayText(raw: string | undefined, fallback: string): string {
  const text = (raw || "").trim();
  if (!text || looksLikePhone(text)) return fallback;
  return text;
}

function resolvePanditImage(item: PanditApiItem, index = 0): string {
  const raw = (item.imageUrl || "").trim();
  if (
    raw &&
    (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/"))
  ) {
    return raw;
  }
  return panditPortrait(index);
}

/** Map API pandit → profile. Everything not in API is hardcoded. */
export function mapApiPanditToProfile(item: PanditApiItem, index = 0): PanditProfile {
  const displayName = cleanPanditName(safeDisplayText(item.fullName || item.name, "Pandit"));

  return {
    id: String(item.id ?? `api-${index}`),
    name: displayName,
    title: safeDisplayText(item.title, "Vedic Acharya"),
    specialty: safeDisplayText(item.specialty, "Vedic Guidance"),
    image: resolvePanditImage(item, index),
    gender: normalizeGender(item.gender),
    languages: normalizeLanguages(item.languages).filter((l) => !looksLikePhone(l)),
    sessions: toNumber(item.sessions),
    experienceYears: toNumber(item.experienceYears),
    // Used only for Knowlarity dial — never render in UI
    phoneNumber: normalizePhone(item.phoneNumber),
    baseAvailability: normalizeStatus(item.status),
    kind: "real",
    // Hardcoded extras
    rating: HARDCODED_RATING,
    verified: true,
    trusted: true,
    featured: false,
  };
}

/** GET /api/astro/pandit/all — real Pandit Ji only. */
const PANDIT_LIST_CACHE_MS = 45_000;
let panditListCache: { at: number; data: PanditProfile[] } | null = null;
let panditListInflight: Promise<PanditProfile[]> | null = null;

export async function fetchRealPandits(options?: { force?: boolean }): Promise<PanditProfile[]> {
  const force = options?.force ?? false;
  const now = Date.now();

  if (
    !force &&
    panditListCache &&
    now - panditListCache.at < PANDIT_LIST_CACHE_MS
  ) {
    return panditListCache.data;
  }

  if (panditListInflight) {
    return panditListInflight;
  }

  const apiUrl = ASTRO_USER_CONFIG.PANDIT_ALL_URL;

  panditListInflight = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Pandit list failed (${response.status})`);
      }

      const data = await response.json();
      const list: PanditApiItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.gurus)
          ? data.gurus
          : Array.isArray(data?.pandits)
            ? data.pandits
            : Array.isArray(data?.data)
              ? data.data
              : [];

      const profiles = list
        .filter((item) => item && (item.fullName || item.name || item.id != null))
        .map((item, index) => mapApiPanditToProfile(item, index));

      panditListCache = { at: Date.now(), data: profiles };
      return profiles;
    } finally {
      window.clearTimeout(timeoutId);
      panditListInflight = null;
    }
  })();

  return panditListInflight;
}

export type PanditDashboardProfile = {
  id: string;
  fullName: string;
  title: string;
  specialty: string;
  imageUrl: string;
  languages: string;
  sessions: string;
  experienceYears: string;
  phoneNumber: string;
  gender: string;
  status: PanditStatus;
  isActive: boolean;
};

export type PanditToggleStatus = "available" | "busy" | "break";

const PANDIT_MOBILE_KEY = "pandit_mobile";

export function getStoredPanditMobile(): string {
  return normalizePhone(localStorage.getItem(PANDIT_MOBILE_KEY) || "") || "";
}

export function storePanditMobile(mobile: string): void {
  const digits = normalizePhone(mobile);
  if (digits && digits.length >= 10) {
    localStorage.setItem(PANDIT_MOBILE_KEY, digits);
  }
}

function statusToApiParam(status: PanditToggleStatus): string {
  if (status === "available") return "AVAILABLE";
  if (status === "break") return "BREAK";
  return "BUSY";
}

export function mapApiItemToDashboard(
  item: PanditApiItem,
): PanditDashboardProfile {
  return {
    id: String(item.id ?? ""),
    fullName: (item.fullName || item.name || "Pandit Ji").trim(),
    title: (item.title || "Vedic Acharya").trim(),
    specialty: (item.specialty || "Vedic Guidance").trim(),
    imageUrl: resolvePanditImage(item, Number(item.id) || 0),
    languages: Array.isArray(item.languages)
      ? item.languages.join(", ")
      : String(item.languages || "Hindi, English"),
    sessions: String(item.sessions ?? "0"),
    experienceYears: String(item.experienceYears ?? "0"),
    phoneNumber: normalizePhone(item.phoneNumber) || "",
    gender: item.gender || "",
    status: normalizeStatus(item.status),
    isActive: item.isActive !== false,
  };
}

/** GET /api/astro/pandit?mobile= */
export async function fetchPanditByMobile(
  mobile: string,
): Promise<PanditDashboardProfile> {
  const msisdn = normalizePhone(mobile);
  if (!msisdn || msisdn.length < 10) {
    throw new Error("Enter a valid 10-digit mobile number");
  }

  const apiUrl = `${ASTRO_USER_CONFIG.PANDIT_BY_MOBILE_URL}?mobile=${encodeURIComponent(msisdn)}`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) {
    throw new Error("No Pandit Ji profile found for this number");
  }
  if (!response.ok) {
    throw new Error(`Could not load profile (${response.status})`);
  }

  const data = (await response.json()) as PanditApiItem;
  if (!data || !(data.fullName || data.name || data.id != null)) {
    throw new Error("No Pandit Ji profile found for this number");
  }

  storePanditMobile(msisdn);
  return mapApiItemToDashboard(data);
}

/**
 * POST /api/astro/pandit/status?mobile=&status=AVAILABLE|BUSY|BREAK
 */
export async function updatePanditStatus(
  mobile: string,
  status: PanditToggleStatus,
): Promise<void> {
  const msisdn = normalizePhone(mobile);
  if (!msisdn || msisdn.length < 10) {
    throw new Error("Valid mobile required");
  }

  const apiUrl =
    `${ASTRO_USER_CONFIG.PANDIT_STATUS_URL}` +
    `?mobile=${encodeURIComponent(msisdn)}` +
    `&status=${encodeURIComponent(statusToApiParam(status))}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Status update failed (${response.status})`);
  }
}

