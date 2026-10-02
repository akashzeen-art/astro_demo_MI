import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import PalmUpload from "@/components/PalmUpload";
import PalmResults from "@/components/PalmResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Hand,
  Brain,
  Heart,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  Lock,
} from "lucide-react";
import gsap from "gsap";
import { useReadings } from "@/contexts/ReadingsContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import type { PalmReading } from "@/lib/apiService";

const PalmAnalysis = () => {
  const { tr } = useLanguage();
  const { hasAccess, openSubscribeModal } = useSubscription();
  const [showResults, setShowResults] = useState(false);
  const { currentReading } = useReadings();
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasAccess) {
      openSubscribeModal("/palm-analysis");
    }
  }, [hasAccess, openSubscribeModal]);

  useEffect(() => {
    const handleShowResults = () => {
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("showPalmResults", handleShowResults);
    return () => window.removeEventListener("showPalmResults", handleShowResults);
  }, []);

  useEffect(() => {
    if (
      currentReading?.type === "palm_analysis" &&
      currentReading.results &&
      Object.keys(currentReading.results.lines || {}).length > 0
    ) {
      setShowResults(true);
    }
  }, [currentReading]);

  useEffect(() => {
    if (!pageRef.current || !contentRef.current || !sidebarRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set([contentRef.current, sidebarRef.current], {
        opacity: 0,
        y: 30,
      });

      const tl = gsap.timeline({ delay: 0.3 });

      tl.to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }).to(
        sidebarRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6",
      );

      gsap.to(".floating-icon", {
        y: "random(-3, 3)",
        rotation: "random(-5, 5)",
        duration: "random(3, 6)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.2,
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  if (!hasAccess) {
    return (
      <Layout>
        <div className="sutra-page flex min-h-[55vh] items-center justify-center px-4 py-16">
          <div className="mx-auto max-w-md rounded-2xl border border-orange-500/30 bg-orange-950/40 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-orange-500/15">
              <Lock className="h-8 w-8 text-amber-300" />
            </div>
            <h2 className="font-display mb-2 text-2xl font-bold text-amber-50">
              Subscribe to Scan Your Palm
            </h2>
            <p className="mb-6 text-sm text-orange-200/55">
              Weekly or monthly access unlocks AI palm scan, numerology, kundli, and live Pandit Ji
              consultations.
            </p>
            <Button
              onClick={() => openSubscribeModal("/palm-analysis")}
              className="bg-gradient-to-r from-orange-600 to-amber-600"
            >
              <Hand className="mr-2 h-4 w-4" />
              View Plans & Subscribe
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (showResults) {
    return (
      <Layout>
        <PalmResults />
      </Layout>
    );
  }

  return (
    <Layout>
      <div ref={pageRef} className="sutra-page">
        <PageHeader
          backLabel={tr.palm.backHome}
          badge={tr.palm.badge}
          badgeIcon={Hand}
          title={tr.palm.title}
          highlight={tr.palm.titleHighlight}
          subtitle={tr.palm.subtitle}
        />

        <main ref={contentRef}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Upload section */}
            <div className="lg:col-span-2">
              <PalmUpload />
            </div>

            {/* Sidebar with information */}
            <div ref={sidebarRef} className="space-y-4">
              {/* What we analyze */}
              <Card className="glass-card border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Brain className="h-4 w-4 text-amber-400" />
                    {tr.palm.whatWeAnalyze}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-orange-500/10 transition-colors">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{tr.palm.lifeLine}</h4>
                      <p className="text-xs text-gray-400">{tr.palm.lifeLineDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-teal-500/10 transition-colors">
                    <div className="w-2 h-2 bg-teal-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{tr.palm.headLine}</h4>
                      <p className="text-xs text-gray-400">{tr.palm.headLineDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-amber-500/10 transition-colors">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{tr.palm.heartLine}</h4>
                      <p className="text-xs text-gray-400">{tr.palm.heartLineDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{tr.palm.fateLine}</h4>
                      <p className="text-xs text-gray-400">{tr.palm.fateLineDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy info */}
              <Card className="glass-card border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Star className="h-4 w-4 text-amber-400" />
                    {tr.palm.aiAccuracy}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-500/10 transition-colors">
                      <span className="text-xs text-gray-400">{tr.palm.lineDetection}</span>
                      <span className="font-semibold text-lg text-amber-400">
                        {(() => {
                          const reading = currentReading as PalmReading | null;
                          const raw = reading?.results?.accuracy?.lineDetection ?? 0;
                          const value = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
                          return `${value}%`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-orange-500/10 transition-colors">
                      <span className="text-xs text-gray-400">{tr.palm.patternAnalysis}</span>
                      <span className="font-semibold text-lg text-amber-400">
                        {(() => {
                          const reading = currentReading as PalmReading | null;
                          const raw = reading?.results?.accuracy?.patternAnalysis ?? 0;
                          const value = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
                          return `${value}%`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-teal-500/10 transition-colors">
                      <span className="text-xs text-gray-400">{tr.palm.interpretation}</span>
                      <span className="font-semibold text-lg text-teal-400">
                        {(() => {
                          const reading = currentReading as PalmReading | null;
                          const raw = reading?.results?.accuracy?.interpretation ?? 0;
                          const value = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
                          return `${value}%`;
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 pt-2 border-t border-white/5">
                      Powered by live AI palm analysis. Values update after each reading.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="glass-card border-pink-500/20 hover:border-pink-500/40 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                    {tr.palm.readingFeatures}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-gray-300">{tr.palm.love}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-500/10 transition-colors">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">{tr.palm.career}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-500/10 transition-colors">
                    <Clock className="h-4 w-4 text-teal-400" />
                    <span className="text-sm text-gray-300">{tr.palm.lifeTimeline}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-500/10 transition-colors">
                    <Brain className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-gray-300">{tr.palm.personality}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default PalmAnalysis;
