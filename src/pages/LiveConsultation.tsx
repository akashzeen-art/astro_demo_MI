import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PanditGrid, { type RosterItem } from "@/components/consultation/PanditGrid";
import ConsultationModal from "@/components/consultation/ConsultationModal";
import { ArrowLeft, Clock, Loader2, Plus } from "lucide-react";
import { canStartSession } from "@/data/pandits";
import {
  fetchCallBalance,
  formatSecsAsMins,
  getCallMobile,
  grantCallCredit,
  type CallBalance,
  type CallSessionStart,
} from "@/services/callPaymentApi";

const LiveConsultation = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [forceRecharge, setForceRecharge] = useState(false);
  const [selected, setSelected] = useState<RosterItem | null>(null);
  const [balance, setBalance] = useState<CallBalance | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const mobile = getCallMobile();
    setCheckingBalance(true);

    if (mobile.length !== 10) {
      setCheckingBalance(false);
      return;
    }

    fetchCallBalance(mobile)
      .then((data) => {
        if (!cancelled) setBalance(data);
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingBalance(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCall = (pandit: RosterItem) => {
    if (!canStartSession(pandit)) return;
    setSelected(pandit);
    setForceRecharge(false);
    setShowModal(true);
  };

  const openBuyMore = () => {
    setForceRecharge(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForceRecharge(false);
  };

  const startCall = (start: CallSessionStart) => {
    if (selected) {
      localStorage.setItem(
        "selected_pandit",
        JSON.stringify({
          id: selected.id,
          name: selected.name,
          title: selected.title,
          image: selected.image,
          specialty: selected.specialty,
          phoneNumber: selected.phoneNumber || "",
          rating: selected.rating,
          sessions: selected.sessions,
          experienceYears: selected.experienceYears,
          languages: selected.languages,
        }),
      );
    }

    if (start.mode === "pack") {
      grantCallCredit(start.pack);
    }

    localStorage.setItem(
      "active_call_secs",
      String(start.remainingSecs),
    );

    // Bought minutes from banner without picking a Pandit Ji — stay here & refresh balance
    if (forceRecharge && !selected) {
      closeModal();
      const mobile = getCallMobile();
      if (mobile.length === 10) {
        fetchCallBalance(mobile)
          .then(setBalance)
          .catch(() => {});
      }
      return;
    }

    setShowModal(false);
    setForceRecharge(false);
    navigate("/consultation");
  };

  const remaining = balance?.remainingSecs || 0;

  return (
    <Layout noMobileFabPad>
      <div className="sutra-page pb-12">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 sutra-link text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Home
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
            </span>
            Live now
          </span>
        </div>

        <header className="mb-6 max-w-3xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-300/80">
            Pandit Ji Darshan
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] font-bold leading-[1.1] text-amber-50">
            Connect with a{" "}
            <span className="sutra-text">verified Pandit Ji</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-orange-100/55">
            See who is free right now. Your remaining talk time is checked from
            your mobile before every call.
          </p>
        </header>

        {/* Balance strip — always refreshed on this page */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
          {checkingBalance ? (
            <div className="flex items-center gap-2 text-sm text-orange-100/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking talk time for your number...
            </div>
          ) : remaining > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-400/30 bg-green-500/15 text-green-300">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-green-100">
                    {formatSecsAsMins(remaining)} remaining
                  </p>
                  <p className="text-[11px] text-orange-100/45">
                    Total {formatSecsAsMins(balance!.totalSecs)} · Used{" "}
                    {formatSecsAsMins(balance!.usedSecs)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-[11px] font-semibold text-green-300">
                  No recharge needed
                </span>
                <button
                  type="button"
                  onClick={openBuyMore}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/15 px-3.5 text-[11px] font-semibold text-amber-100 transition hover:border-amber-300/55 hover:from-amber-500/30 hover:to-orange-500/25 hover:text-amber-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add more minutes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-300">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    No talk time left
                  </p>
                  <p className="text-[11px] text-orange-100/45">
                    Choose a Pandit Ji and buy a talk pack to connect
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                Recharge required
              </span>
            </div>
          )}
        </div>

        <PanditGrid onCall={openCall} />

        <ConsultationModal
          open={showModal}
          pandit={selected}
          forceRecharge={forceRecharge}
          onClose={closeModal}
          onProceed={startCall}
        />
      </div>
    </Layout>
  );
};

export default LiveConsultation;
