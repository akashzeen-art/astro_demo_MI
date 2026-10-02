import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  generateHoroscopeWithOpenAI,
  type HoroscopePeriod,
  type HoroscopeResult,
} from "@/lib/openaiService";
import {
  Sparkles, Heart, Briefcase, Activity, Coins, Lightbulb, Star, RefreshCw,
  UserRound, Calendar,
} from "lucide-react";
import {
  loadBirthProfile,
  zodiacSignFromBirthDate,
  type BirthProfile,
} from "@/services/userProfileApi";

const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "♈", dates: "Mar 21 – Apr 19" },
  { name: "Taurus", symbol: "♉", dates: "Apr 20 – May 20" },
  { name: "Gemini", symbol: "♊", dates: "May 21 – Jun 20" },
  { name: "Cancer", symbol: "♋", dates: "Jun 21 – Jul 22" },
  { name: "Leo", symbol: "♌", dates: "Jul 23 – Aug 22" },
  { name: "Virgo", symbol: "♍", dates: "Aug 23 – Sep 22" },
  { name: "Libra", symbol: "♎", dates: "Sep 23 – Oct 22" },
  { name: "Scorpio", symbol: "♏", dates: "Oct 23 – Nov 21" },
  { name: "Sagittarius", symbol: "♐", dates: "Nov 22 – Dec 21" },
  { name: "Capricorn", symbol: "♑", dates: "Dec 22 – Jan 19" },
  { name: "Aquarius", symbol: "♒", dates: "Jan 20 – Feb 18" },
  { name: "Pisces", symbol: "♓", dates: "Feb 19 – Mar 20" },
];

const PERIODS: Array<{ id: HoroscopePeriod; label: string }> = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: `Year ${new Date().getFullYear()}` },
];

const SECTIONS: Array<{
  key: keyof Pick<HoroscopeResult, "love" | "career" | "health" | "finance">;
  label: string;
  icon: typeof Heart;
}> = [
  { key: "love", label: "Love & Relationships", icon: Heart },
  { key: "career", label: "Career & Work", icon: Briefcase },
  { key: "health", label: "Health & Wellbeing", icon: Activity },
  { key: "finance", label: "Money & Finance", icon: Coins },
];

function formatBirthDate(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const Horoscope = () => {
  const [profile, setProfile] = useState<BirthProfile | null>(() => loadBirthProfile());
  const [period, setPeriod] = useState<HoroscopePeriod>("weekly");
  const [result, setResult] = useState<HoroscopeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const sign = useMemo(
    () => zodiacSignFromBirthDate(profile?.birthDate || ""),
    [profile?.birthDate],
  );

  const zodiacMeta = useMemo(
    () => ZODIAC_SIGNS.find((z) => z.name === sign),
    [sign],
  );

  useEffect(() => {
    const onProfileUpdate = (event: Event) => {
      const detail = (event as CustomEvent<BirthProfile>).detail;
      setProfile(detail || loadBirthProfile());
    };
    window.addEventListener("birth-profile-updated", onProfileUpdate);
    return () => window.removeEventListener("birth-profile-updated", onProfileUpdate);
  }, []);

  const load = useCallback(async (selectedSign: string, selectedPeriod: HoroscopePeriod) => {
    setLoading(true);
    setResult(null);
    try {
      const currentProfile = loadBirthProfile();
      const data = await generateHoroscopeWithOpenAI(
        selectedSign,
        selectedPeriod,
        currentProfile
          ? {
              fullName: currentProfile.fullName,
              birthDate: currentProfile.birthDate,
              birthTime: currentProfile.birthTime,
              birthPlace: currentProfile.birthPlace,
              gender: currentProfile.gender,
            }
          : undefined,
      );
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sign) load(sign, period);
  }, [sign, period, load]);

  return (
    <Layout>
      <div className="sutra-page max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
            <Sparkles className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="font-display text-3xl font-bold text-amber-50 mb-2">
            Predictions &amp; Horoscope
          </h1>
          <p className="text-orange-100/50 text-sm max-w-md mx-auto">
            Personalized weekly, monthly, and yearly predictions from your birth profile.
          </p>
        </div>

        {!profile?.birthDate || !sign ? (
          <div className="sutra-panel mx-auto max-w-lg p-8 text-center">
            <UserRound className="mx-auto mb-4 h-10 w-10 text-amber-300/80" />
            <h2 className="font-display text-lg font-semibold text-amber-100 mb-2">
              Complete your birth profile
            </h2>
            <p className="text-sm text-orange-100/55 mb-6 leading-relaxed">
              Add your date of birth so we can read your zodiac sign and tailor predictions for you.
            </p>
            <Link
              to="/profile/setup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:opacity-95 transition-opacity"
            >
              Set up profile
            </Link>
          </div>
        ) : (
          <>
            {/* Profile-based zodiac */}
            <div className="sutra-panel mb-8 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-4xl">
                  <span aria-hidden>{zodiacMeta?.symbol || "✨"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/70 mb-1">
                    Your zodiac sign
                  </p>
                  <h2 className="font-display text-xl font-bold text-amber-50">
                    {sign}
                    {profile.fullName ? (
                      <span className="font-normal text-orange-100/55 text-base ml-2">
                        for {profile.fullName.split(" ")[0]}
                      </span>
                    ) : null}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-orange-100/50">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-400/80" />
                      Born {formatBirthDate(profile.birthDate)}
                    </span>
                    {zodiacMeta?.dates ? (
                      <span>{zodiacMeta.dates}</span>
                    ) : null}
                    {profile.birthPlace ? (
                      <span>{profile.birthPlace}</span>
                    ) : null}
                  </div>
                </div>
                <Link
                  to="/profile/setup"
                  className="shrink-0 self-start sm:self-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-orange-100/70 hover:text-amber-100 hover:border-amber-400/30 transition-colors"
                >
                  Edit profile
                </Link>
              </div>
            </div>

            {/* Period tabs */}
            <div className="flex justify-center gap-2 mb-8">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    period === p.id
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                      : "border border-white/10 bg-white/5 text-orange-100/60 hover:text-amber-100 hover:border-amber-400/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
                <p className="text-sm text-orange-100/50">
                  Reading the stars for {profile.fullName?.split(" ")[0] || "you"} ({sign})...
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4 pb-10">
                {/* Summary */}
                <div className="sutra-panel p-6">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <h2 className="font-display text-xl font-bold text-amber-100">
                      {result.sign} — <span className="capitalize">{result.timeframe}</span>
                    </h2>
                    <div className="flex items-center gap-1" aria-label={`${result.rating} of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i <= result.rating ? "text-amber-400 fill-amber-400" : "text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-orange-100/70 leading-relaxed text-sm sm:text-base">
                    {result.summary}
                  </p>
                </div>

                {/* Area cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {SECTIONS.map((s) => (
                    <div key={s.key} className="rounded-xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-2.5 mb-2">
                        <s.icon className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-amber-100">{s.label}</h3>
                      </div>
                      <p className="text-sm text-orange-100/60 leading-relaxed">{result[s.key]}</p>
                    </div>
                  ))}
                </div>

                {/* Advice + lucky */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-300" />
                      <h3 className="text-sm font-semibold text-amber-100">Advice</h3>
                    </div>
                    <p className="text-sm text-amber-100/80 leading-relaxed">{result.advice}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-sm font-semibold text-amber-100 mb-3">Lucky For You</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {result.luckyNumbers.map((n) => (
                        <span
                          key={n}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-sm font-bold text-amber-200"
                        >
                          {n}
                        </span>
                      ))}
                      <span className="ml-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-orange-100/70">
                        Color: <span className="text-amber-200 font-semibold">{result.luckyColor}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => load(sign, period)}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-orange-100/70 hover:text-amber-100 hover:border-amber-400/30 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh Prediction
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Horoscope;
