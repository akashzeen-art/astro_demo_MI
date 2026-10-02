import { useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SectionHeader from "@/components/SectionHeader";
import LiveConsultationSection from "@/components/consultation/LiveConsultationSection";
import HomeQuickReadings from "@/components/HomeQuickReadings";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whenPreloaderReady, refreshScrollTriggers } from "@/lib/scrollAnimations";
import HomeAmbientAudio from "@/components/HomeAmbientAudio";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    path: "/astrology",
    icon: Star,
    title: "Jyotish",
    subtitle: "Birth Chart",
    desc: "Vedic kundli with planetary positions, dashas, and personalized predictions.",
    num: "01",
    accent: "linear-gradient(90deg, #14b8a6, #2dd4bf)",
    glow: "group-hover:shadow-[0_0_30px_hsl(168_55%_42%/0.15)]",
    lift: "",
  },
];

const Index = () => {
  const { requestService } = useSubscription();
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: gsap.Context | undefined;

    const setup = () => {
      ctx = gsap.context(() => {
        gsap.set(".consult-reveal", { opacity: 0, y: 32, scale: 0.98 });
        gsap.set(".service-card", { opacity: 0, y: 56 });

        gsap.to(".consult-reveal", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          delay: 0.15,
        });

        gsap.to(".service-card", {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: {
            trigger: servicesRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });
      });
      refreshScrollTriggers();
    };

    const removePreloaderListener = whenPreloaderReady(setup);

    return () => {
      removePreloaderListener();
      ctx?.revert();
    };
  }, []);

  return (
    <Layout>
      <HomeAmbientAudio />

      <LiveConsultationSection
        variant="banner"
        onTalkClick={() => requestService("/live-consultation")}
      />

      <Hero />

      <HomeQuickReadings />

      <section ref={servicesRef} className="relative container mx-auto px-4 py-14 md:py-24 bg-transparent">
        <SectionHeader
          eyebrow="Sacred Sciences"
          badgeIcon={Sparkles}
          title={
            <>
              Your Path to <span className="sutra-text">Self-Discovery</span>
            </>
          }
          subtitle="Your Vedic birth chart, illuminated by intelligent readings rooted in ancient sutras."
        />

        <div className="grid gap-5 md:gap-6 max-w-md mx-auto items-stretch">
          {SERVICES.map((s) => (
            <button
              key={s.path}
              type="button"
              onClick={() => requestService(s.path)}
              style={{ ["--path-accent" as string]: s.accent }}
              className={cn(
                "service-card path-card group p-6 md:p-7 border border-orange-500/20 hover:border-orange-400/45 transition-all duration-500 rounded-2xl text-left w-full",
                s.glow,
                s.lift
              )}
            >
              <span className="path-card-num" aria-hidden>{s.num}</span>

              <div className="relative mb-5 inline-flex">
                <div className="absolute inset-0 rounded-xl bg-orange-500/20 blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-900/20 border border-orange-500/30 group-hover:rotate-3 transition-transform duration-500">
                  <s.icon className="w-7 h-7 text-amber-400" />
                </div>
              </div>

              <p className="text-xs text-teal-400/75 uppercase tracking-[0.2em] mb-1.5">{s.subtitle}</p>
              <h3 className="font-display text-2xl md:text-[1.65rem] font-semibold text-amber-100 mb-2.5">{s.title}</h3>
              <p className="text-sm text-orange-100/50 leading-relaxed mb-6">{s.desc}</p>

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400/80 group-hover:text-amber-300 transition-colors">
                Begin Reading
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 md:mt-14 sutra-divider max-w-lg mx-auto" />
      </section>

      <Features />
    </Layout>
  );
};

export default Index;
