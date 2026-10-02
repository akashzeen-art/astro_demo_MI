export type PanditKind = "real" | "bot";
/** API: available | busy | break | offline. Bots only use busy | break. */
export type PanditStatus = "available" | "busy" | "break" | "offline";
export type PanditGender = "male" | "female" | "other";

export interface PanditProfile {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experienceYears: number;
  /** Hardcoded for API Pandit Ji / bots. */
  rating: number;
  sessions: number;
  image: string;
  gender: PanditGender;
  languages: string[];
  /** Real Pandit Ji from API — used for outbound call connect. */
  phoneNumber?: string;
  kind: PanditKind;
  /** API status for real; bots ignore and rotate busy/break. */
  baseAvailability: PanditStatus;
  featured?: boolean;
  /** Hardcoded badges */
  verified: boolean;
  trusted: boolean;
}

/** Local portraits from New Pandit Images (1–33, no 9/16). */
export const PANDIT_PORTRAITS = [
  1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32, 33,
].map((n) => `/pandit-profiles/${n}.png`);

/** Display names never end with "Ji" — titles come from the prefix (Acharya, Guruji, Pandit…). */
const PANDIT_TITLE_PATTERN =
  /^(acharya|maharaj|jyotishacharya|guruji|pandit|mahant|purohit)(\s|$)/i;

export const GURU_MAHARAJ_NAME = "Maharaj Vinay Bhardwaj";

export function cleanPanditName(raw: string): string {
  const name = raw
    .trim()
    .replace(/[\s,.-]+(ji|jee)\.?$/i, "")
    .replace(/^dr\.?\s+/i, "")
    .trim();
  if (/vinay\s+bhardwaj/i.test(name)) return GURU_MAHARAJ_NAME;
  if (!name || PANDIT_TITLE_PATTERN.test(name)) return name;
  return `Pandit ${name}`;
}

export function panditPortrait(index: number): string {
  const i = Math.abs(index) % PANDIT_PORTRAITS.length;
  return PANDIT_PORTRAITS[i];
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Give each filler Pandit Ji a unique local photo. Real Pandit Ji keep API image. */
export function assignUniquePortraits(list: PanditProfile[]): PanditProfile[] {
  const used = new Set<number>();
  return list.map((p) => {
    if (p.kind === "real") return p;

    let idx = hashId(p.id || p.name) % PANDIT_PORTRAITS.length;
    for (let n = 0; n < PANDIT_PORTRAITS.length; n++) {
      const candidate = (idx + n) % PANDIT_PORTRAITS.length;
      if (!used.has(candidate)) {
        used.add(candidate);
        return { ...p, image: PANDIT_PORTRAITS[candidate] };
      }
    }
    return { ...p, image: PANDIT_PORTRAITS[idx] };
  });
}

/** Local filler Pandit Ji only — never available; rotate busy ↔ break. */
export const BOT_PANDITS: PanditProfile[] = [
  {
    id: "bot-01",
    name: "Pandit Satyanarayan Shastri",
    title: "Vedic Reader",
    specialty: "General Guidance",
    experienceYears: 14,
    rating: 4.5,
    sessions: 640,
    image: panditPortrait(0),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-02",
    name: "Acharya Suresh Chandra",
    title: "Jyotish Guide",
    specialty: "Daily Predictions",
    experienceYears: 12,
    rating: 4.4,
    sessions: 520,
    image: panditPortrait(1),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-03",
    name: "Jyotishacharya Sunil Dwivedi",
    title: "Astro Advisor",
    specialty: "Love · Relationship",
    experienceYears: 13,
    rating: 4.6,
    sessions: 710,
    image: panditPortrait(2),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "break",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-04",
    name: "Guruji Naveen Joshi",
    title: "Temple Pandit",
    specialty: "Puja · Mantra",
    experienceYears: 16,
    rating: 4.5,
    sessions: 480,
    image: panditPortrait(3),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-05",
    name: "Maharaj Raghunath Shastri",
    title: "Kundli Expert",
    specialty: "Birth Chart Reading",
    experienceYears: 13,
    rating: 4.4,
    sessions: 590,
    image: panditPortrait(4),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "break",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-06",
    name: "Mahant Narendra Pathak",
    title: "Numerology Guide",
    specialty: "Name · Numbers · Destiny",
    experienceYears: 11,
    rating: 4.5,
    sessions: 460,
    image: panditPortrait(5),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-07",
    name: "Purohit Mohan Lal",
    title: "Vedic Counselor",
    specialty: "Career Advice",
    experienceYears: 10,
    rating: 4.3,
    sessions: 410,
    image: panditPortrait(6),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-08",
    name: "Pandit Dinesh Kumar Dubey",
    title: "Astrology Mentor",
    specialty: "Health · Wellness",
    experienceYears: 15,
    rating: 4.5,
    sessions: 680,
    image: panditPortrait(7),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "break",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-09",
    name: "Acharya Pradeep Verma",
    title: "Muhurat Guide",
    specialty: "Auspicious Timing",
    experienceYears: 12,
    rating: 4.6,
    sessions: 540,
    image: panditPortrait(8),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-10",
    name: "Jyotishacharya Prem Shankar",
    title: "Family Astrologer",
    specialty: "Marriage Matching",
    experienceYears: 14,
    rating: 4.5,
    sessions: 610,
    image: panditPortrait(9),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-11",
    name: "Guruji Yashwant Shastri",
    title: "Remedy Specialist",
    specialty: "Graha Shanti",
    experienceYears: 18,
    rating: 4.6,
    sessions: 730,
    image: panditPortrait(10),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "break",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-12",
    name: "Maharaj Shyam Tiwari",
    title: "Palm Reader",
    specialty: "Palmistry Insights",
    experienceYears: 11,
    rating: 4.5,
    sessions: 450,
    image: panditPortrait(11),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-13",
    name: "Mahant Kamlesh Prasad",
    title: "Spiritual Guide",
    specialty: "Peace · Meditation",
    experienceYears: 13,
    rating: 4.5,
    sessions: 570,
    image: panditPortrait(12),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-14",
    name: "Purohit Manoj Tiwari",
    title: "Vedic Scholar",
    specialty: "Scripture · Dharma",
    experienceYears: 17,
    rating: 4.6,
    sessions: 690,
    image: panditPortrait(13),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "break",
    verified: true,
    trusted: true,
  },
  {
    id: "bot-15",
    name: "Pandit Lakshman Shastri",
    title: "Live Advisor",
    specialty: "Quick Consultation",
    experienceYears: 19,
    rating: 4.7,
    sessions: 880,
    image: panditPortrait(14),
    gender: "male",
    languages: ["Hindi", "English"],
    kind: "bot",
    baseAvailability: "busy",
    verified: true,
    trusted: true,
  },
];

export function shufflePandits<T>(list: T[], seed = Date.now()): T[] {
  const arr = [...list];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Real: use API status as-is (available | busy | break).
 * Bot: never available — rotate busy ↔ break every ~5 min.
 */
export function resolvePanditStatus(
  pandit: PanditProfile,
  now = Date.now(),
): PanditStatus {
  if (pandit.kind === "bot") {
    const bucket = Math.floor(now / (5 * 60 * 1000));
    const flip = (hashString(pandit.id) + bucket) % 2 === 0;
    const base = pandit.baseAvailability === "break" ? "break" : "busy";
    if (flip) return base === "busy" ? "break" : "busy";
    return base;
  }

  const status = pandit.baseAvailability;
  if (status === "available" || status === "busy" || status === "break" || status === "offline") {
    return status;
  }
  return "busy";
}

export function canCallPandit(status: PanditStatus): boolean {
  return status === "available";
}

/** Busy real Pandit Ji can be joined via queue. */
export function canJoinQueue(pandit: {
  status: PanditStatus;
  kind?: PanditKind;
  phoneNumber?: string;
}): boolean {
  return (
    pandit.status === "busy" &&
    pandit.kind === "real" &&
    Boolean(pandit.phoneNumber)
  );
}

export function canStartSession(pandit: {
  status: PanditStatus;
  kind?: PanditKind;
  phoneNumber?: string;
}): boolean {
  return canCallPandit(pandit.status) || canJoinQueue(pandit);
}

/** Guru Maharaj — always the Top Pick and listed first in the roster. */
export function isPinnedPandit(pandit: { name?: string; kind?: PanditKind }): boolean {
  if (pandit.kind !== "real") return false;
  const name = (pandit.name || "").toLowerCase();
  return name.includes("vinay") && name.includes("bhardwaj");
}

/** Click to Call first, then Queued, then other statuses. */
export function sessionSortRank(pandit: {
  status: PanditStatus;
  kind?: PanditKind;
  phoneNumber?: string;
}): number {
  if (canCallPandit(pandit.status)) return 0;
  if (canJoinQueue(pandit)) return 1;
  if (pandit.status === "busy") return 2;
  if (pandit.status === "break") return 3;
  return 4;
}

/** Merge API Pandit Ji + 15 local filler profiles, shuffle, attach live status. */
export function getShuffledRoster(
  realPandits: PanditProfile[] = [],
  now = Date.now(),
) {
  const seed = Math.floor(now / (5 * 60 * 1000));
  const filler = BOT_PANDITS.slice(0, 15);
  const slots = PANDIT_PORTRAITS.length;
  const reals = realPandits.slice(0, Math.max(0, slots - filler.length));
  const all = assignUniquePortraits([...reals, ...filler]);

  // Mark first available real as featured (hardcoded Top pick)
  const withFeatured = all.map((p, index) => {
    if (p.kind !== "real") return { ...p, featured: false };
    return p;
  });

  const firstAvailableReal = withFeatured.find(
    (p) => p.kind === "real" && resolvePanditStatus(p, now) === "available",
  );
  const featuredId =
    withFeatured.find((p) => isPinnedPandit(p))?.id ||
    firstAvailableReal?.id ||
    withFeatured.find((p) => p.kind === "real")?.id ||
    null;

  const tagged = withFeatured.map((p) => ({
    ...p,
    featured: featuredId ? p.id === featuredId : false,
  }));

  return shufflePandits(tagged, seed).map((pandit) => ({
    ...pandit,
    status: resolvePanditStatus(pandit, now),
  }));
}
