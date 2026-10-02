import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getMobileForVerification } from "@/utils/accessControlGuard";
import {
  hasActiveSubscription,
  loadSubscription,
  normalizeMobile,
  clearSubscription,
} from "@/lib/subscription";
import { LogOut, Phone, ShieldCheck, ShieldOff, User } from "lucide-react";

type StatusState = "active" | "inactive" | "unknown";

function readLocalStatus(hasAccess: boolean): StatusState {
  if (hasAccess || hasActiveSubscription()) return "active";
  const mobile = normalizeMobile(
    getMobileForVerification() ||
      loadSubscription()?.mobile ||
      localStorage.getItem("userMobile") ||
      "",
  );
  if (mobile.length === 10) return "inactive";
  return "unknown";
}

const MyAccount = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { subscription, hasAccess, openSubscribeModal } = useSubscription();
  const [mobile, setMobile] = useState("");
  const [status, setStatus] = useState<StatusState>(() => readLocalStatus(hasAccess));
  const [loggingOut, setLoggingOut] = useState(false);

  const resolveMobile = useCallback(() => {
    const fromUrlOrStore = getMobileForVerification();
    const fromSub = subscription?.mobile || loadSubscription()?.mobile;
    const stored = localStorage.getItem("userMobile");
    return normalizeMobile(fromUrlOrStore || fromSub || stored || "");
  }, [subscription]);

  const applyLocalStatus = useCallback(() => {
    setMobile(resolveMobile());
    setStatus(readLocalStatus(hasAccess));
  }, [resolveMobile, hasAccess]);

  useEffect(() => {
    applyLocalStatus();
  }, [applyLocalStatus]);

  useEffect(() => {
    const onUpdated = () => applyLocalStatus();
    window.addEventListener("subscription-activated", onUpdated);
    window.addEventListener("subscription-updated", onUpdated);
    return () => {
      window.removeEventListener("subscription-activated", onUpdated);
      window.removeEventListener("subscription-updated", onUpdated);
    };
  }, [applyLocalStatus]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      clearSubscription();
      setMobile("");
      setStatus("unknown");
      navigate("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const displayMobile = mobile
    ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
    : "Not linked";

  const isActive = status === "active";
  const canLogout = Boolean(mobile || isActive || hasAccess);

  return (
    <Layout>
      <div className="sutra-page max-w-lg mx-auto">
        <div className="sutra-panel p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
              <User className="h-8 w-8 text-amber-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-amber-50 mb-1">
              My Account
            </h1>
            <p className="text-orange-100/50 text-sm">
              Subscription &amp; profile details
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3 mb-1">
                <Phone className="h-4 w-4 text-amber-400" />
                <span className="text-xs uppercase tracking-wider text-orange-100/40">
                  Mobile Number
                </span>
              </div>
              <p className="text-xl font-semibold text-white pl-7">
                {displayMobile}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                  ) : (
                    <ShieldOff className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-xs uppercase tracking-wider text-orange-100/40">
                    Subscription Status
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    isActive
                      ? "bg-green-500/20 text-green-300 border border-green-400/40"
                      : status === "inactive"
                        ? "bg-red-500/20 text-red-300 border border-red-400/40"
                        : "bg-white/10 text-gray-300 border border-white/20"
                  }`}
                >
                  {isActive ? "Active" : status === "inactive" ? "Inactive" : "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {isActive && (
                <button
                  type="button"
                  onClick={() => navigate("/profile/setup")}
                  className="w-full sutra-btn-outline py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Edit Birth Profile
                </button>
              )}

              {!isActive && (
                <button
                  type="button"
                  onClick={() => openSubscribeModal("/my-account")}
                  className="w-full sutra-btn-primary py-3 rounded-xl font-semibold text-sm uppercase tracking-widest"
                >
                  {mobile ? "Subscribe Now" : "Sign In / Subscribe"}
                </button>
              )}

              {isActive && (
                <p className="text-center text-green-300/80 text-sm">
                  Your subscription is active. Enjoy full access to all services.
                </p>
              )}

              {canLogout && (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyAccount;
