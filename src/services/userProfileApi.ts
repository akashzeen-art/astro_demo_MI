import { ASTRO_USER_CONFIG, STORAGE_KEYS } from "@/lib/config";
import { normalizeMobile } from "@/lib/subscription";

export interface BirthProfile {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthState: string;
  /** Composed as "City, State" for Kundli / Horoscope consumers. */
  birthPlace: string;
  gender: string;
  mobile: string;
  maritalStatus?: string;
  occupation?: string;
  timezone: string;
  updatedAt: string;
}

export type BirthProfileInput = Omit<BirthProfile, "updatedAt" | "birthPlace"> & {
  birthPlace?: string;
};

/** Response shape from GET /api/astro/getdata?msisdn= */
export interface AstroUserApiResponse {
  id?: number;
  fullName?: string;
  phoneNumber?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
  maritalStatus?: string | null;
  occupation?: string | null;
}

const PROFILE_STORAGE_KEY = "myastrosutra_birth_profile";

const KNOWN_STATES = new Set([
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]);

export function composeBirthPlace(city: string, state: string): string {
  return [city.trim(), state.trim()].filter(Boolean).join(", ");
}

function splitBirthPlace(place: string): { birthCity: string; birthState: string } {
  const trimmed = place.trim();
  if (!trimmed) return { birthCity: "", birthState: "" };

  if (trimmed.includes(",")) {
    const [city, ...rest] = trimmed.split(",").map((p) => p.trim());
    return { birthCity: city || "", birthState: rest.join(", ") };
  }

  // Single value: if it matches a state/UT, use it for both; else treat as city.
  if (KNOWN_STATES.has(trimmed)) {
    return { birthCity: trimmed, birthState: trimmed };
  }
  return { birthCity: trimmed, birthState: "" };
}

/** Normalize API time "14:30:00" → "14:30" */
function normalizeBirthTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeStoredProfile(raw: BirthProfile & { email?: string }): BirthProfile {
  const birthCity = raw.birthCity?.trim() || "";
  const birthState = raw.birthState?.trim() || "";
  let birthPlace = composeBirthPlace(birthCity, birthState);

  if (!birthPlace && raw.birthPlace?.trim()) {
    const split = splitBirthPlace(raw.birthPlace);
    birthPlace = composeBirthPlace(split.birthCity, split.birthState) || raw.birthPlace.trim();
    return {
      ...raw,
      birthCity: birthCity || split.birthCity,
      birthState: birthState || split.birthState,
      birthPlace,
      birthTime: normalizeBirthTime(raw.birthTime || ""),
    };
  }

  return {
    ...raw,
    birthCity,
    birthState,
    birthPlace: birthPlace || raw.birthPlace?.trim() || "",
    birthTime: normalizeBirthTime(raw.birthTime || ""),
  };
}

export function mapApiUserToBirthProfile(api: AstroUserApiResponse): BirthProfile | null {
  const mobile = normalizeMobile(api.phoneNumber || "");
  const fullName = (api.fullName || "").trim();
  const birthDate = (api.birthDate || "").trim();
  const birthTime = normalizeBirthTime(api.birthTime || "");
  const place = (api.birthPlace || "").trim();
  const gender = (api.gender || "").trim().toLowerCase();

  if (!fullName || !birthDate || !birthTime || !place || !gender || mobile.length !== 10) {
    return null;
  }

  const { birthCity, birthState } = splitBirthPlace(place);
  return {
    fullName,
    birthDate,
    birthTime,
    birthCity,
    birthState,
    birthPlace: composeBirthPlace(birthCity, birthState) || place,
    gender,
    mobile,
    maritalStatus: api.maritalStatus?.trim() || undefined,
    occupation: api.occupation?.trim() || undefined,
    timezone: "Asia/Kolkata",
    updatedAt: new Date().toISOString(),
  };
}

function persistLocalProfile(profile: BirthProfile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (storedUser) {
      const user = JSON.parse(storedUser) as Record<string, unknown>;
      const [firstName, ...lastParts] = profile.fullName.split(/\s+/);
      localStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify({
          ...user,
          first_name: firstName,
          last_name: lastParts.join(" "),
          phone_number: profile.mobile,
          birth_date: profile.birthDate,
          birth_time: profile.birthTime,
          birth_place: profile.birthPlace,
          birth_city: profile.birthCity,
          birth_state: profile.birthState,
          gender: profile.gender,
          timezone: profile.timezone,
        }),
      );
    }
  } catch {
    // Keep the dedicated birth profile even if legacy user data is malformed.
  }
  window.dispatchEvent(new CustomEvent("birth-profile-updated", { detail: profile }));
}

export function loadBirthProfile(): BirthProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeStoredProfile(JSON.parse(raw) as BirthProfile);
  } catch {
    return null;
  }
}

export function hasCompleteBirthProfile(profile = loadBirthProfile()): boolean {
  return Boolean(
    profile?.fullName.trim() &&
      profile.birthDate &&
      profile.birthTime &&
      (profile.birthCity?.trim() || profile.birthPlace?.trim()) &&
      profile.gender &&
      normalizeMobile(profile.mobile).length === 10,
  );
}

/**
 * GET /api/astro/getdata?msisdn=...
 */
export async function fetchBirthProfileByMsisdn(
  msisdn: string,
): Promise<BirthProfile | null> {
  const mobile = normalizeMobile(msisdn);
  if (mobile.length !== 10) return null;

  const url = `${ASTRO_USER_CONFIG.GET_DATA_URL}?msisdn=${encodeURIComponent(mobile)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Get user data failed (${response.status})`);
  }

  const data = (await response.json()) as AstroUserApiResponse;
  return mapApiUserToBirthProfile(data);
}

/**
 * Pulls remote profile for this mobile and caches it locally when found.
 * Returns the complete profile (local or remote), or null if none exists.
 */
export async function syncBirthProfileFromApi(
  msisdn?: string,
): Promise<BirthProfile | null> {
  const local = loadBirthProfile();
  if (hasCompleteBirthProfile(local)) return local;

  const mobile = normalizeMobile(
    msisdn || local?.mobile || localStorage.getItem("userMobile") || "",
  );
  if (mobile.length !== 10) return local;

  try {
    const remote = await fetchBirthProfileByMsisdn(mobile);
    if (remote && hasCompleteBirthProfile(remote)) {
      persistLocalProfile(remote);
      localStorage.setItem("profileSetupComplete", "true");
      return remote;
    }
  } catch (error) {
    console.warn("Could not load birth profile from API:", error);
  }

  return hasCompleteBirthProfile(local) ? local : null;
}

/**
 * Saves on-device immediately, then syncs to POST /api/astro/saveuserdata.
 */
export async function saveBirthProfile(
  input: BirthProfileInput,
): Promise<{ profile: BirthProfile; synced: boolean }> {
  const birthCity = input.birthCity.trim();
  const birthState = input.birthState.trim();
  const birthPlace = composeBirthPlace(birthCity, birthState);

  const profile: BirthProfile = {
    fullName: input.fullName.trim(),
    birthDate: input.birthDate,
    birthTime: normalizeBirthTime(input.birthTime),
    birthCity,
    birthState,
    birthPlace,
    gender: input.gender,
    mobile: normalizeMobile(input.mobile),
    maritalStatus: input.maritalStatus?.trim() || undefined,
    occupation: input.occupation?.trim() || undefined,
    timezone: input.timezone || "Asia/Kolkata",
    updatedAt: new Date().toISOString(),
  };

  persistLocalProfile(profile);

  const payload = {
    fullName: profile.fullName,
    phoneNumber: profile.mobile,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthPlace: profile.birthPlace,
    gender: profile.gender,
    ...(profile.maritalStatus ? { maritalStatus: profile.maritalStatus } : {}),
    ...(profile.occupation ? { occupation: profile.occupation } : {}),
  };

  try {
    const response = await fetch(ASTRO_USER_CONFIG.SAVE_USER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Profile sync failed (${response.status})`);
    return { profile, synced: true };
  } catch (error) {
    console.warn("Profile saved locally; backend sync is pending:", error);
    return { profile, synced: false };
  }
}

export function zodiacSignFromBirthDate(birthDate: string): string {
  const [, monthText, dayText] = birthDate.split("-");
  const month = Number(monthText);
  const day = Number(dayText);
  const cutoffs = [20, 19, 20, 20, 21, 21, 22, 22, 21, 22, 21, 20];
  const signs = [
    "Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini",
    "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius",
  ];
  if (!month || !day) return "";
  return day <= cutoffs[month - 1] ? signs[month - 1] : signs[month % 12];
}
