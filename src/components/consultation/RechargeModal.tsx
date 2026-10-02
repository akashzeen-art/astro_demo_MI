import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Loader2, Phone } from "lucide-react";
import { getOrGenerateClickId } from "@/utils/clickIdManager";
import { CALL_PAYMENT_CONFIG, FEATURES } from "@/lib/config";
import {
  fetchCallBalance,
  fetchCallPortalPricing,
  formatSecsAsMins,
  getCallMobile,
  grantCallCredit,
  initiateCallPayment,
  type CallBalance,
  type CallPack,
} from "@/services/callPaymentApi";
import { cn } from "@/lib/utils";
import { DAKSHINA } from "@/lib/dakshina";

interface RechargeModalProps {
  open: boolean;
  type: "warning" | "expired";
  onRecharge: (minutes: number) => void;
  onClose: () => void;
}

const RechargeModal = ({ open, type, onRecharge, onClose }: RechargeModalProps) => {
  const isWarning = type === "warning";
  const [balance, setBalance] = useState<CallBalance | null>(null);
  const [packs, setPacks] = useState<CallPack[]>([]);
  const [selected, setSelected] = useState<CallPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [buyMore, setBuyMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setBuyMore(false);
    setSelected(null);

    (async () => {
      try {
        const bal = await fetchCallBalance(getCallMobile()).catch(() => null);
        if (cancelled) return;
        setBalance(bal);

        if (!bal || bal.remainingSecs <= 0 || type === "expired") {
          const pricing = await fetchCallPortalPricing();
          if (cancelled) return;
          setPacks(pricing.packs);
          if (pricing.packs.length) setSelected(pricing.packs[0]);
          setBuyMore(true);
        }
      } catch {
        if (!cancelled) setError("Could not load balance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, type]);

  const continueWithBalance = () => {
    if (!balance || balance.remainingSecs <= 0) return;
    const mins = Math.max(1, Math.ceil(balance.remainingSecs / 60));
    onRecharge(mins);
  };

  const pay = () => {
    if (!selected) return;
    const mobile = getCallMobile();
    if (mobile.length !== 10) {
      setError("Valid mobile required.");
      return;
    }

    if (!FEATURES.PAYMENTS) {
      grantCallCredit(selected);
      onRecharge(selected.minutes);
      return;
    }

    setPaying(true);
    localStorage.setItem("postCallPath", "/consultation");
    initiateCallPayment({
      clickId: getOrGenerateClickId(CALL_PAYMENT_CONFIG.PORTAL_ID),
      mobile,
      pack: selected,
    });
  };

  const hasTime = (balance?.remainingSecs || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[hsl(16_32%_9%)] border-red-500/30 text-white max-w-sm mx-auto text-center">
        <div className="py-4 space-y-4">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              isWarning
                ? "bg-yellow-500/20 border-2 border-yellow-400/50"
                : "bg-red-500/20 border-2 border-red-400/50"
            }`}
          >
            {isWarning ? (
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            ) : (
              <Clock className="w-8 h-8 text-red-400" />
            )}
          </div>

          <div>
            <h2
              className={`text-xl font-bold ${isWarning ? "text-yellow-400" : "text-red-400"}`}
            >
              {isWarning ? "Only 2 Minutes Remaining" : "Consultation Ended"}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {hasTime && !buyMore
                ? `You still have ${formatSecsAsMins(balance!.remainingSecs)} on this number.`
                : "Pick a talk pack to continue with Pandit Ji."}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
            </div>
          ) : hasTime && !buyMore ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-green-400/25 bg-green-500/10 p-3 text-left">
                <p className="text-sm font-semibold text-green-100">
                  {formatSecsAsMins(balance!.remainingSecs)} left
                </p>
                <p className="text-[11px] text-green-100/55 mt-0.5">
                  Ready to continue with Pandit Ji
                </p>
              </div>
              <Button
                onClick={continueWithBalance}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 font-bold"
              >
                <Phone className="mr-2 h-4 w-4" />
                Continue with remaining time
              </Button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const pricing = await fetchCallPortalPricing();
                    setPacks(pricing.packs);
                    if (pricing.packs.length) setSelected(pricing.packs[0]);
                    setBuyMore(true);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-xs text-orange-100/45 hover:text-amber-200"
              >
                Buy more minutes
              </button>
            </div>
          ) : (
            <div className="grid gap-2 text-left">
              <p className="text-center text-sm font-semibold text-amber-200/90">
                {DAKSHINA.packages}
              </p>
              {packs.map((pack) => (
                <button
                  key={pack.packType}
                  type="button"
                  onClick={() => setSelected(pack)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5",
                    selected?.packType === pack.packType
                      ? "border-amber-400/50 bg-amber-500/15"
                      : "border-white/10 bg-white/5",
                  )}
                >
                  <span className="text-sm font-medium">{pack.minutes} min</span>
                  <span className="font-bold">₹{pack.price}</span>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}

          {buyMore && (
            <div className="flex gap-3">
              {isWarning && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-white/20 text-gray-400 hover:bg-white/5"
                >
                  Continue
                </Button>
              )}
              <Button
                onClick={pay}
                disabled={!selected || paying || loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-bold"
              >
                {paying
                  ? "Processing…"
                  : selected
                    ? `दक्षिणा ₹${selected.price}`
                    : DAKSHINA.packages}
              </Button>
            </div>
          )}

          {!isWarning && buyMore && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-300 text-sm"
            >
              End Session
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RechargeModal;
