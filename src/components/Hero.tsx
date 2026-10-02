import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { whenPreloaderReady } from "@/lib/scrollAnimations";
import { BRAND } from "@/lib/brand";
import { useSubscription } from "@/contexts/SubscriptionContext";

const Hero = () => {
  const { requestService } = useSubscription();
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: gsap.Context | undefined;

    const run = () => {
      if (!contentRef.current) return;
      ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.children,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.1, ease: "power3.out", delay: 0.2 }
        );
      }, heroRef);
    };

    if (document.querySelector(".consult-reveal")) {
      const remove = whenPreloaderReady(run);
      return () => {
        remove();
        ctx?.revert();
      };
    }

    run();
    return () => ctx?.revert();
  }, []);

  const stats = [
    { value: "50K+", label: "Readings", icon: "✦" },
    { value: "99%", label: "Accuracy", icon: "◎" },
    { value: "24/7", label: "Guidance", icon: "☽" },
    { value: "5★", label: "Rated", icon: "★" },
  ];

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-transparent">
      {/* Subtle hero halo */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.04] blur-3xl"
        aria-hidden
      />

      <div className="container mx-auto px-4 py-10 md:py-16 lg:py-20">
        <div ref={contentRef} className="max-w-3xl mx-auto text-center relative">
          {/* <Badge className="mb-5 bg-orange-500/10 text-amber-300 border-orange-500/25 hover:bg-orange-500/15 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1.5" />
            AI · Vedic · Personalized
          </Badge> */}

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-amber-50 leading-[1.08] mb-5">
            Your Destiny
            <span className="block mt-1 sutra-text">Written in the Stars</span>
          </h1>

          <p className="text-orange-100/55 text-base sm:text-lg max-w-2xl mx-auto mb-9 leading-relaxed">
            {BRAND.NAME} blends ancient Vedic sutras with intelligent readings — palmistry, numerology, and birth charts crafted for your unique cosmic signature.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => requestService("/live-consultation")}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 h-12 px-8 shadow-lg shadow-orange-500/25"
            >
              <Phone className="mr-2 w-4 h-4" /> Talk to Pandit Ji
            </Button>
            <Button
              size="lg"
              onClick={() => requestService("/astrology")}
              className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-0 sutra-glow h-12 px-8"
            >
              Explore Kundli <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            {/* TEMPORARY: Palm scanning disabled — uncomment to re-enable
            <Button
              variant="outline"
              size="lg"
              onClick={() => requestService("/palm-analysis")}
              className="rounded-full h-12 border-teal-600/35 text-teal-200 hover:bg-teal-900/30 hover:text-teal-100 bg-teal-950/10"
            >
              Palm Reading
            </Button>
            */}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {stats.map((s) => (
              <div
                key={s.label}
                className="sutra-card rounded-xl px-2 py-3.5 text-center border-orange-500/15 hover:border-orange-500/30 transition-colors"
              >
                <span className="block text-[10px] text-amber-400/50 mb-0.5" aria-hidden>{s.icon}</span>
                <p className="font-display text-lg sm:text-xl font-bold text-amber-300">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-orange-200/45 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-2">
        <div className="sutra-divider" />
      </div>
    </section>
  );
};

export default Hero;
