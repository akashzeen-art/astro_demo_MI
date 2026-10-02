import { useEffect, useRef, useState } from "react";
import { Calculator, Hand, Lock, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PalmUpload from "@/components/PalmUpload";
import PalmResults from "@/components/PalmResults";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";

const HomeQuickReadings = () => {
  const { hasAccess, openSubscribeModal } = useSubscription();
  const [showPalmResults, setShowPalmResults] = useState(false);
  const palmSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleShowResults = () => {
      setShowPalmResults(true);
      requestAnimationFrame(() => {
        palmSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    window.addEventListener("showPalmResults", handleShowResults);
    return () => window.removeEventListener("showPalmResults", handleShowResults);
  }, []);

  if (!hasAccess) {
    return (
      <section className="container mx-auto space-y-6 px-4 pb-8 pt-2 md:pb-12">
        <p className="mx-auto max-w-2xl text-center text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/55">
          Your Readings
        </p>
        <div className="mx-auto max-w-2xl rounded-2xl border border-orange-500/30 bg-orange-950/40 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-orange-500/15">
            <Lock className="h-8 w-8 text-amber-300" />
          </div>
          <h2 className="font-display mb-2 text-2xl font-bold text-amber-50">
            Unlock Palm Scan & Numerology
          </h2>
          <p className="mb-6 text-sm text-orange-200/55">
            Enter your mobile number, choose weekly or monthly plan, and get instant access to palm
            scan and numerology readings.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => openSubscribeModal("/palm-analysis")}
              className="bg-gradient-to-r from-orange-600 to-amber-600"
            >
              <Hand className="mr-2 h-4 w-4" />
              Subscribe — Palm Scan
            </Button>
            <Button
              variant="outline"
              onClick={() => openSubscribeModal("/numerology")}
              className="border-amber-400/40 text-amber-200"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Subscribe — Numerology
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto space-y-10 px-4 pb-8 pt-2 md:space-y-14 md:pb-12">
      <p className="mx-auto max-w-2xl text-center text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/55">
        Your Readings
      </p>

      <div ref={palmSectionRef} className="mx-auto max-w-5xl scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/45 bg-orange-600/30">
            <Hand className="h-6 w-6 text-amber-300" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-50 sm:text-3xl">Palm Scan</h2>
            <p className="text-sm text-orange-200/55">AI reads your life, heart, head, and fate lines</p>
          </div>
        </div>
        <div
          className={cn(
            "rounded-2xl border border-orange-500/30 bg-orange-950/25 p-4 sm:p-6",
            showPalmResults && "scroll-mt-24",
          )}
        >
          {!showPalmResults ? <PalmUpload /> : <PalmResults />}
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-teal-500/25 bg-teal-950/20 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-400/45 bg-teal-600/25">
                <Calculator className="h-6 w-6 text-teal-300" strokeWidth={2.25} />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-amber-50 sm:text-2xl">Numerology</h2>
                <p className="text-sm text-teal-200/55">Life path, destiny, and soul numbers</p>
              </div>
            </div>
            <Button
              asChild
              className="shrink-0 bg-gradient-to-r from-teal-600 to-emerald-600"
            >
              <Link to="/numerology">
                Open Numerology
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeQuickReadings;
