import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CallScreen from "@/components/consultation/CallScreen";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Phone } from "lucide-react";
import { loadBirthProfile } from "@/services/userProfileApi";
import {
  activatePendingCallCredit,
  fetchCallBalance,
  getCallMobile,
  grantCallCredit,
  secsToCallMinutes,
  type CallPack,
  type CallSessionStart,
} from "@/services/callPaymentApi";
import ConsultationModal from "@/components/consultation/ConsultationModal";

const generateSessionId = () =>
  "CALL" + Math.random().toString(36).substring(2, 8).toUpperCase();

type SelectedPandit = {
  id: string;
  name: string;
  title: string;
  image: string;
  specialty: string;
  phoneNumber?: string;
  rating?: number;
  sessions?: number;
  experienceYears?: number;
  languages?: string[];
};

function loadSelectedPandit(): SelectedPandit | null {
  try {
    const raw = localStorage.getItem("selected_pandit");
    return raw ? (JSON.parse(raw) as SelectedPandit) : null;
  } catch {
    return null;
  }
}

function readActiveCallSecs(): number {
  const raw = localStorage.getItem("active_call_secs");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const Consultation = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(generateSessionId);
  const [checking, setChecking] = useState(true);
  const [durationSecs, setDurationSecs] = useState(0);
  const [credit, setCredit] = useState<CallPack | null>(null);
  const [selectedPandit] = useState(() => loadSelectedPandit());
  const [panditStatus, setPanditStatus] = useState<"online" | "busy" | "offline">(
    () =>
      selectedPandit
        ? "online"
        : (localStorage.getItem("pandit_status") as "online" | "busy" | "offline") ||
          "busy",
  );
  const [ended, setEnded] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [forceRecharge, setForceRecharge] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setPanditStatus((e as CustomEvent).detail);
    };
    window.addEventListener("pandit-status-change", handler);
    return () => window.removeEventListener("pandit-status-change", handler);
  }, []);

  // Always re-check server balance (and pending payment) before starting
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setChecking(true);
      try {
        const pending = activatePendingCallCredit();
        if (pending) {
          // Fresh purchase — wait for server sync, still prefer API balance if available
          const bal = await fetchCallBalance(getCallMobile()).catch(() => null);
          if (cancelled) return;
          if (bal && bal.remainingSecs > 0) {
            setDurationSecs(bal.remainingSecs);
            localStorage.setItem("active_call_secs", String(bal.remainingSecs));
          } else {
            const secs = pending.minutes * 60;
            setDurationSecs(secs);
            setCredit(pending);
            localStorage.setItem("active_call_secs", String(secs));
          }
          setShowPackModal(false);
          return;
        }

        const bal = await fetchCallBalance(getCallMobile()).catch(() => null);
        if (cancelled) return;

        if (bal && bal.remainingSecs > 0) {
          setDurationSecs(bal.remainingSecs);
          localStorage.setItem("active_call_secs", String(bal.remainingSecs));
          setShowPackModal(false);
          return;
        }

        const staged = readActiveCallSecs();
        if (staged > 0) {
          setDurationSecs(staged);
          setShowPackModal(false);
          return;
        }

        setDurationSecs(0);
        setShowPackModal(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!durationSecs || checking) return;
    const profile = loadBirthProfile();
    const minutes = secsToCallMinutes(durationSecs);
    const session = {
      sessionId,
      startTime: new Date().toISOString(),
      minutes,
      durationSecs,
      amount: credit?.price ?? 0,
      packType: credit?.packType,
      status: "active",
      pandit: selectedPandit,
      customer: profile
        ? {
            fullName: profile.fullName,
            birthDate: profile.birthDate,
            birthTime: profile.birthTime,
            birthPlace: profile.birthPlace,
            gender: profile.gender,
            mobile: profile.mobile,
          }
        : null,
    };
    try {
      const stored = JSON.parse(localStorage.getItem("call_sessions") || "[]");
      if (Array.isArray(stored)) {
        stored.push(session);
        localStorage.setItem("call_sessions", JSON.stringify(stored));
      }
    } catch {
      localStorage.setItem("call_sessions", JSON.stringify([session]));
    }
  }, [sessionId, selectedPandit, durationSecs, credit, checking]);

  const handleEnd = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("call_sessions") || "[]");
      if (Array.isArray(stored)) {
        const updated = stored.map((s: { sessionId?: string }) =>
          s.sessionId === sessionId
            ? { ...s, status: "completed", endTime: new Date().toISOString() }
            : s,
        );
        localStorage.setItem("call_sessions", JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
    localStorage.removeItem("active_call_secs");
    setEnded(true);
  };

  const handleSessionStart = (start: CallSessionStart) => {
    if (start.mode === "pack") {
      grantCallCredit(start.pack);
      setCredit(start.pack);
    }
    setDurationSecs(start.remainingSecs);
    localStorage.setItem("active_call_secs", String(start.remainingSecs));
    setEnded(false);
    setShowPackModal(false);
    setForceRecharge(false);
  };

  const handleRechargeFromCall = (newMinutes: number) => {
    const secs = newMinutes * 60;
    setDurationSecs(secs);
    localStorage.setItem("active_call_secs", String(secs));
    setEnded(false);
    setShowPackModal(false);
  };

  if (checking) {
    return (
      <Layout fullBleed noMobileFabPad>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
          <p className="text-sm text-orange-100/50">Checking your talk time...</p>
        </div>
      </Layout>
    );
  }

  if (showPackModal && durationSecs <= 0) {
    return (
      <Layout fullBleed noMobileFabPad>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <ConsultationModal
            open
            pandit={selectedPandit}
            forceRecharge={forceRecharge}
            onClose={() => navigate("/live-consultation")}
            onProceed={handleSessionStart}
          />
        </div>
      </Layout>
    );
  }

  if (panditStatus === "offline") {
    return (
      <Layout fullBleed noMobileFabPad>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <div className="sutra-panel max-w-sm space-y-4 p-8 text-center">
            <div className="text-5xl">🧘</div>
            <h2 className="font-display text-xl font-bold text-amber-50">
              Pandit Ji is Offline
            </h2>
            <p className="text-sm text-orange-100/50">
              Not available right now. Please try again later.
            </p>
            <Button
              onClick={() => navigate("/live-consultation")}
              variant="outline"
              className="sutra-btn-outline"
            >
              Back to Pandit Ji
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (ended) {
    return (
      <Layout fullBleed noMobileFabPad>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <div className="sutra-panel max-w-sm space-y-5 p-8 text-center">
            {selectedPandit?.image ? (
              <img
                src={selectedPandit.image}
                alt=""
                className="mx-auto h-20 w-20 rounded-full object-cover object-top border-2 border-amber-400/40"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400/50 bg-orange-500/20">
                <Phone className="h-10 w-10 text-amber-400" />
              </div>
            )}
            <h2 className="font-display text-xl font-bold text-amber-50">
              Consultation Ended
            </h2>
            <p className="text-sm text-orange-100/50">
              Thank you for consulting with {selectedPandit?.name || "Pandit Ji"}.
            </p>
            <p className="text-sm text-orange-100/50">
              Session ID:{" "}
              <span className="font-mono text-amber-300">{sessionId}</span>
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setForceRecharge(false);
                  setShowPackModal(true);
                  setDurationSecs(0);
                }}
                className="sutra-btn-primary font-bold"
              >
                <Phone className="mr-2 h-4 w-4" /> Talk Again
              </Button>
              <Button
                onClick={() => navigate("/live-consultation")}
                variant="outline"
                className="sutra-btn-outline"
              >
                Choose Another Pandit Ji
              </Button>
            </div>
          </div>
        </div>
        <ConsultationModal
          open={showPackModal}
          pandit={selectedPandit}
          forceRecharge={forceRecharge}
          onClose={() => setShowPackModal(false)}
          onProceed={handleSessionStart}
        />
      </Layout>
    );
  }

  return (
    <CallScreen
      sessionId={sessionId}
      minutes={secsToCallMinutes(durationSecs)}
      durationSecs={durationSecs}
      panditStatus={panditStatus}
      onEnd={handleEnd}
      onRecharge={handleRechargeFromCall}
      panditName={selectedPandit?.name}
      panditTitle={selectedPandit?.title}
      panditSpecialty={selectedPandit?.specialty}
      panditImage={selectedPandit?.image}
      agentPhone={selectedPandit?.phoneNumber}
      customerPhone={getCallMobile()}
    />
  );
};

export default Consultation;
