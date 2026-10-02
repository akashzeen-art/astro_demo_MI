import { PAYMENT_CONFIG } from "@/lib/config";

export type SubscriptionPeriodId =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type ParsedPlan = {
  packType: string;
  discountedPrice: number;
  name: string;
  periodId: SubscriptionPeriodId;
};

const PERIOD_ORDER: SubscriptionPeriodId[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

const PERIOD_LABEL: Record<SubscriptionPeriodId, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/** Only Daily / Weekly / Monthly / Quarterly / Yearly. Drops Msec, Wsec, phones, etc. */
export function matchSubscriptionPeriod(key: string): SubscriptionPeriodId | null {
  const digits = String(key || "").replace(/\D/g, "");
  if (digits.length >= 8) return null;

  const compact = String(key || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (!compact) return null;
  if (compact.includes("quardt") || compact.includes("quart")) return "quarterly";
  if (compact.includes("month")) return "monthly";
  if (compact.includes("week")) return "weekly";
  if (compact.includes("year") || compact.includes("annual")) return "yearly";
  if (compact === "daily" || compact === "day" || compact.startsWith("daily")) return "daily";
  return null;
}

export const fetchPricingData = async (portalId: string, clickId: string) => {
  const apiUrl = `${PAYMENT_CONFIG.BASE_URL}/portal/${portalId}?clickid=${clickId}`;

  const response = await fetch(apiUrl, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

export const parsePricingForUI = (apiData: {
  portalId?: number;
  currencyCode?: string;
  multiplePackType?: Record<string, string>;
}) => {
  const { multiplePackType } = apiData;
  const plans: Record<string, ParsedPlan> = {};

  if (multiplePackType && typeof multiplePackType === "object") {
    Object.entries(multiplePackType).forEach(([key, value]) => {
      const periodId = matchSubscriptionPeriod(key);
      if (!periodId) return;

      const price = parseInt(String(value), 10);
      if (!Number.isFinite(price) || price <= 0) return;

      plans[key] = {
        packType: key,
        discountedPrice: price,
        name: PERIOD_LABEL[periodId],
        periodId,
      };
    });
  }

  const ordered = Object.values(plans).sort(
    (a, b) => PERIOD_ORDER.indexOf(a.periodId) - PERIOD_ORDER.indexOf(b.periodId),
  );

  return {
    portalId: apiData.portalId,
    currencyCode: apiData.currencyCode || "INR",
    plans,
    ordered,
  };
};
