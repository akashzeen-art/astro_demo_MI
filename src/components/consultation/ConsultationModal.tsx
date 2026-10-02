import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Clock,
  Star,
  Shield,
  BadgeCheck,
  Languages,
  Loader2,
  Sparkles,
  Plus,
  Check,
  ArrowLeft,
  X,
} from "lucide-react";
import { getOrGenerateClickId } from "@/utils/clickIdManager";
import { CALL_PAYMENT_CONFIG, FEATURES } from "@/lib/config";
import {
  fetchCallBalance,
  fetchCallPortalPricing,
  initiateCallPayment,
  grantCallCredit,
  formatSecsAsMins,
  getCallMobile,
  type CallBalance,
  type CallPack,
  type CallSessionStart,
} from "@/services/callPaymentApi";
import { cn } from "@/lib/utils";
import { DAKSHINA } from "@/lib/dakshina";

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
  onProceed: (start: CallSessionStart) => void;
  pandit?: {
    name?: string;
    title?: string;
    image?: string;
    specialty?: string;
    rating?: number;
    sessions?: number;
    experienceYears?: number;
    languages?: string[];
    phoneNumber?: string;
  } | null;
  /** When true, force pack purchase UI even if balance remains (e.g. recharge). */
  forceRecharge?: boolean;
}

const ConsultationModal = ({
  open,
  onClose,
  onProceed,
  pandit,
  forceRecharge = false,
}: ConsultationModalProps) => {
  const [balance, setBalance] = useState<CallBalance | null>(null);
  const [packs, setPacks] = useState<CallPack[]>([]);
  const [selected, setSelected] = useState<CallPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [showBuyMore, setShowBuyMore] = useState(forceRecharge);

  const name = pandit?.name || "Pandit Ji";
  const title = pandit?.title || "Vedic Acharya";
  const specialty = pandit?.specialty || "Vedic Astrology · Guidance";
  const rating = pandit?.rating ?? 4.9;
  const sessions = pandit?.sessions ?? 2300;
  const years = pandit?.experienceYears ?? 20;
  const languages = (pandit?.languages || ["Hindi", "English"]).join(" · ");

  const hasTime = (balance?.remainingSecs || 0) > 0;
  const needsPayment = forceRecharge || showBuyMore || !hasTime;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setSelected(null);
    setShowBuyMore(forceRecharge);
    setBalance(null);
    setPacks([]);

    const mobile = getCallMobile();

    (async () => {
      try {
        if (mobile.length !== 10) {
          if (!cancelled) {
            setError("Add a valid mobile number before calling.");
          }
          return;
        }

        const bal = await fetchCallBalance(mobile).catch(() => null);
        if (cancelled) return;
        setBalance(bal);

        const needPacks = forceRecharge || !bal || bal.remainingSecs <= 0;
        if (needPacks) {
          const pricing = await fetchCallPortalPricing();
          if (cancelled) return;
          setPacks(pricing.packs);
          if (pricing.packs.length > 0) setSelected(pricing.packs[0]);
        }
      } catch {
        if (!cancelled) setError("Could not check your talk balance. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, forceRecharge]);

  const loadPacksIfNeeded = async () => {
    if (packs.length > 0) {
      setShowBuyMore(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const pricing = await fetchCallPortalPricing();
      setPacks(pricing.packs);
      if (pricing.packs.length > 0) setSelected(pricing.packs[0]);
      setShowBuyMore(true);
    } catch {
      setError("Could not load call packs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTalkWithBalance = () => {
    if (!balance || balance.remainingSecs <= 0) return;
    onProceed({
      mode: "balance",
      remainingSecs: balance.remainingSecs,
      balance,
    });
  };

  const handlePay = async () => {
    if (!selected) {
      setError("Please select a talk pack.");
      return;
    }

    const mobile = getCallMobile();
    if (mobile.length !== 10) {
      setError("Add a valid mobile number in your profile before calling.");
      return;
    }

    setPaying(true);
    setError("");

    if (!FEATURES.PAYMENTS) {
      grantCallCredit(selected);
      setPaying(false);
      onProceed({
        mode: "pack",
        pack: selected,
        remainingSecs: selected.minutes * 60,
      });
      return;
    }

    const clickId = getOrGenerateClickId(CALL_PAYMENT_CONFIG.PORTAL_ID);
    localStorage.setItem("postCallPath", "/consultation");
    initiateCallPayment({ clickId, mobile, pack: selected });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "max-w-[420px] mx-auto max-h-[92dvh] overflow-y-auto border-0 bg-transparent p-0 text-white shadow-none sm:rounded-[1.75rem]",
          // Hide default Radix X — we render a proper one inside the card
          "[&>button]:hidden",
        )}
      >
        <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-400/25 bg-[linear-gradient(165deg,hsl(18_28%_12%)_0%,hsl(16_35%_7%)_45%,hsl(14_40%_5%)_100%)] shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)]">
          {/* Hero */}
          <div className="relative h-[7.5rem] overflow-hidden">
            {pandit?.image ? (
              <img
                src={pandit.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top scale-110 opacity-45"
                aria-hidden
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.35),transparent_60%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[hsl(16_32%_8%/0.55)] to-[hsl(16_35%_7%)]" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[hsl(16_35%_7%)] to-transparent" />

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:border-white/40 hover:bg-black/75 hover:text-amber-100"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>

            <DialogHeader className="relative z-10 px-5 pt-5 pr-14">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300/75">
                Live consultation
              </p>
              <DialogTitle className="mt-1 text-center font-display text-xl font-bold tracking-wide text-amber-50">
                {needsPayment ? "Choose Talk Pack" : "Start Consultation"}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="relative z-10 -mt-10 space-y-4 px-4 pb-5 sm:px-5">
            {/* Pandit Ji card */}
            <div className="rounded-2xl border border-amber-400/30 bg-[hsl(16_28%_10%/0.95)] p-3.5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <div className="flex items-start gap-3">
                {pandit?.image ? (
                  <img
                    src={pandit.image}
                    alt={name}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover object-top border-2 border-amber-400/40 shadow-lg"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-2xl shadow-lg">
                    🧘
                  </div>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-200">
                    <BadgeCheck className="h-3 w-3" />
                    Verified · Available
                  </div>
                  <p className="font-display text-[15px] font-bold leading-snug text-amber-50">
                    {name}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-amber-300/85">{title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-orange-100/55">
                    <span className="inline-flex items-center gap-0.5 font-medium text-amber-200">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {rating.toFixed(1)}
                    </span>
                    <span>· {sessions.toLocaleString()}+</span>
                    <span>· {years}+ yrs</span>
                  </div>
                  <p className="mt-1 text-[11px] text-orange-100/45 line-clamp-1">{specialty}</p>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-orange-100/50">
                <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
                Checking your talk time…
              </div>
            )}

            {/* Has balance — Talk Now */}
            {!loading && hasTime && !needsPayment && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-green-400/30 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent p-4">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-400/10 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-300/85">
                        Talk time available
                      </p>
                      <p className="mt-1 font-display text-[1.65rem] font-bold leading-none text-green-50">
                        {formatSecsAsMins(balance!.remainingSecs)}
                      </p>
                      <p className="mt-1.5 text-[11px] text-green-100/55">
                        Total {formatSecsAsMins(balance!.totalSecs)} · Used{" "}
                        {formatSecsAsMins(balance!.usedSecs)}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-green-400/30 bg-green-500/15 text-green-300">
                      <Clock className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleTalkWithBalance}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-base font-bold text-white shadow-lg shadow-orange-500/35 hover:from-orange-400 hover:to-red-500"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Talk Now · {formatSecsAsMins(balance!.remainingSecs)}
                </Button>

                <button
                  type="button"
                  onClick={loadPacksIfNeeded}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 text-sm font-semibold text-amber-100 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)] transition hover:border-amber-300/55 hover:from-amber-500/25 hover:to-orange-500/20 hover:text-amber-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-500/20 text-amber-200 transition group-hover:scale-105">
                    <Plus className="h-4 w-4" />
                  </span>
                  Buy More Minutes Instead
                  <Sparkles className="h-3.5 w-3.5 text-amber-300/70" />
                </button>
              </div>
            )}

            {/* Pack purchase */}
            {!loading && needsPayment && (
              <div className="space-y-3">
                {hasTime && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-amber-300" />
                    <p className="text-[11px] leading-snug text-amber-100/85">
                      You still have{" "}
                      <span className="font-semibold text-amber-50">
                        {formatSecsAsMins(balance!.remainingSecs)}
                      </span>
                      . Buying adds more time on top.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-100/50">
                    {hasTime ? "और दक्षिणा जोड़ें" : DAKSHINA.packages}
                  </p>
                  {selected && (
                    <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                      {selected.minutes} min · ₹{selected.price}
                    </span>
                  )}
                </div>

                {packs.length === 0 && !error && (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-sm text-orange-100/50">
                    No call packs available right now.
                  </p>
                )}

                <div className="grid gap-2.5">
                  {packs.map((pack) => {
                    const perMin =
                      pack.minutes > 0 ? (pack.price / pack.minutes).toFixed(1) : "0";
                    const active = selected?.packType === pack.packType;
                    return (
                      <button
                        key={pack.packType}
                        type="button"
                        onClick={() => {
                          setSelected(pack);
                          setError("");
                        }}
                        className={cn(
                          "relative flex items-center justify-between overflow-hidden rounded-2xl border px-3.5 py-3.5 text-left transition",
                          active
                            ? "border-amber-400/55 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_12px_28px_-16px_rgba(251,146,60,0.45)]"
                            : "border-white/10 bg-white/[0.03] hover:border-amber-400/30 hover:bg-white/[0.05]",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold",
                              active
                                ? "border-amber-400/45 bg-amber-500/25 text-amber-100"
                                : "border-white/10 bg-black/30 text-orange-100/70",
                            )}
                          >
                            <Clock className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-amber-50">
                              {pack.minutes} min talk
                            </p>
                            <p className="mt-0.5 text-[11px] text-orange-100/45">
                              ₹{perMin} / min · one-time
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold tabular-nums text-white">
                            ₹{pack.price}
                          </p>
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border transition",
                              active
                                ? "border-amber-300 bg-amber-400 text-[hsl(16_40%_10%)]"
                                : "border-white/20 bg-transparent",
                            )}
                          >
                            {active ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={handlePay}
                  disabled={paying || loading || !selected}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-base font-bold text-white shadow-lg shadow-orange-500/35 hover:from-orange-400 hover:to-red-500 disabled:opacity-50"
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting to payment…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selected
                        ? `दक्षिणा ₹${selected.price} · ${selected.minutes} मिनट`
                        : DAKSHINA.packages}
                    </span>
                  )}
                </Button>

                {hasTime && !forceRecharge && (
                  <button
                    type="button"
                    onClick={() => setShowBuyMore(false)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-medium text-orange-100/70 transition hover:border-green-400/30 hover:bg-green-500/10 hover:text-green-100"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Use remaining {formatSecsAsMins(balance!.remainingSecs)} instead
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
                {error}
              </p>
            )}

            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-orange-100/45">
                <Languages className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{languages} · private voice call</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-orange-100/35">
                <Shield className="h-3 w-3 shrink-0" />
                {needsPayment
                  ? "Secure one-time payment for this call only"
                  : "No payment needed — using your remaining talk time"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationModal;
