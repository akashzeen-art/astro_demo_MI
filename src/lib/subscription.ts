import { STORAGE_KEYS } from "./config";

export type PlanId = "weekly" | "monthly";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  durationDays: number;
  features: string[];
  highlight?: boolean;
}

export interface Subscription {
  mobile: string;
  planId: PlanId;
  planName: string;
  price: number;
  status: "active" | "expired";
  subscribedAt: string;
  expiresAt: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "weekly",
    name: "Weekly Access",
    price: 49,
    period: "week",
    durationDays: 7,
    features: [
      "Palm Reading",
      "Numerology",
      "Astrology Birth Chart",
      "Dashboard & History",
      "Talk with Pandit Ji",
    ],
  },
  {
    id: "monthly",
    name: "Monthly Access",
    price: 149,
    period: "month",
    durationDays: 30,
    highlight: true,
    features: [
      "Everything in Weekly",
      "Unlimited Readings",
      "Priority Consultation",
      "PDF Download Reports",
      "Best Value",
    ],
  },
];

export const GATED_SERVICE_PATHS = [
  "/palm-analysis",
  "/numerology",
  "/astrology",
  "/horoscope",
  "/dashboard",
  "/consultation",
  "/live-consultation",
] as const;

export type GatedServicePath = (typeof GATED_SERVICE_PATHS)[number];

export function isGatedPath(path: string): path is GatedServicePath {
  return (GATED_SERVICE_PATHS as readonly string[]).includes(path);
}

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "").slice(-10);
}

export function isValidIndianMobile(mobile: string): boolean {
  const digits = normalizeMobile(mobile);
  return /^[6-9]\d{9}$/.test(digits);
}

export function loadSubscription(): Subscription | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    if (!raw) return null;
    const sub = JSON.parse(raw) as Subscription;
    if (new Date(sub.expiresAt) <= new Date()) {
      return { ...sub, status: "expired" };
    }
    return sub;
  } catch {
    return null;
  }
}

export function saveSubscription(sub: Subscription): void {
  localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
}

export function clearSubscription(): void {
  localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);
}

export function hasActiveSubscription(): boolean {
  if (localStorage.getItem("isSubscribed") === "true") {
    return true;
  }
  const sub = loadSubscription();
  return sub?.status === "active" && new Date(sub.expiresAt) > new Date();
}

export function hasApiSubscriptionFlag(): boolean {
  return localStorage.getItem("isSubscribed") === "true";
}

export function syncSubscriptionFromApi(mobile: string, packType?: string): Subscription {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sub: Subscription = {
    mobile: normalizeMobile(mobile),
    planId: "monthly",
    planName: packType || "Monthly Access",
    price: 0,
    status: "active",
    subscribedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveSubscription(sub);
  localStorage.setItem("isSubscribed", "true");
  localStorage.setItem("userMobile", normalizeMobile(mobile));
  return sub;
}

export function createSubscription(mobile: string, planId: PlanId): Subscription {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)!;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const sub: Subscription = {
    mobile: normalizeMobile(mobile),
    planId,
    planName: plan.name,
    price: plan.price,
    status: "active",
    subscribedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveSubscription(sub);
  return sub;
}
