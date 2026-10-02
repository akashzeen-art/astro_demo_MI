import { Link } from "react-router-dom";
import {
  Phone,
  Clock,
  Shield,
  Star,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  Flame,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TalkButton from "./TalkButton";
import { cn } from "@/lib/utils";

export const CONSULTATION_TOPICS = [
  "Kundli Analysis",
  "Muhurat",
  "Remedies",
  "Marriage",
  "Career",
  "Health",
];

const BENEFITS = [
  { icon: Phone, title: "Live Voice Call", desc: "Speak directly with a verified Pandit Ji in real time.", accent: "from-orange-500/20 to-amber-900/10" },
  { icon: Clock, title: "12-Minute Session", desc: "Focused guidance tailored to your questions.", accent: "from-amber-500/15 to-orange-900/10" },
  { icon: Shield, title: "Private & Secure", desc: "Your consultation stays confidential and protected.", accent: "from-teal-500/15 to-emerald-900/10" },
  { icon: Star, title: "Expert Verified", desc: "4.9★ rated — 2,300+ sessions completed.", accent: "from-rose-500/15 to-orange-900/10" },
];

const STEPS = [
  { step: "01", title: "Recharge", desc: "Choose the ₹551 consultation plan.", icon: Flame },
  { step: "02", title: "Connect", desc: "Get connected to Maharaj Vinay Bhardwaj.", icon: Phone },
  { step: "03", title: "Guidance", desc: "Receive personalized Vedic advice live.", icon: MessageCircle },
];

export const PANDIT_TIMINGS = ["10:00 AM – 2:00 PM", "5:00 PM – 9:00 PM"];

const GURU_MAHARAJ_IMAGE = "/guru-maharaj.jpg";

const GuruMaharajPortrait = ({ size = "md" }: { size?: "md" | "lg" }) => {
  const width = size === "lg" ? "w-64 sm:w-72 md:w-80" : "w-56 md:w-64";
  return (
    <div className={cn("relative mx-auto shrink-0", width)}>
      <img
        src={GURU_MAHARAJ_IMAGE}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 rounded-[2rem] object-cover opacity-60 blur-3xl saturate-150"
      />
      <div
        className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.32),transparent_65%)] blur-2xl"
        aria-hidden
      />
      <div className="pointer-events-none absolute -inset-8 opacity-70" aria-hidden>
        <div className="sacred-ring" />
        <div className="sacred-ring-inner" />
      </div>

      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border-2 border-amber-400/45 bg-orange-950/60 shadow-[0_24px_60px_-18px_rgba(251,146,60,0.55)]">
        <img
          src={GURU_MAHARAJ_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-xl"
        />
        <img
          src={GURU_MAHARAJ_IMAGE}
          alt="Guru Maharaj — Maharaj Vinay Bhardwaj"
          className="relative h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-green-400/45 bg-green-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-50 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          Live
        </span>
      </div>
    </div>
  );
};

const PanditTimings = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "inline-flex flex-col gap-2 rounded-2xl border border-amber-400/20 bg-orange-950/25 px-4 py-3 backdrop-blur-sm",
      className,
    )}
  >
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/85">
      <Clock className="h-3.5 w-3.5" />
      Timings for Pandit Ji
    </p>
    <div className="flex flex-wrap gap-2">
      {PANDIT_TIMINGS.map((slot, i) => (
        <span
          key={slot}
          className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-950/30 px-3 py-1 text-xs font-medium text-teal-100/90"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500/25 text-[10px] font-bold text-teal-200">
            {i + 1}
          </span>
          {slot}
        </span>
      ))}
    </div>
  </div>
);

interface LiveConsultationSectionProps {
  variant?: "banner" | "full";
  onTalkClick: () => void;
  className?: string;
  animateClass?: string;
}

const LiveConsultationSection = ({
  variant = "banner",
  onTalkClick,
  className,
  animateClass = "",
}: LiveConsultationSectionProps) => {
  if (variant === "banner") {
    return (
      <section className={cn("container mx-auto px-4 pt-5 md:pt-7", className)}>
        <div
          className={cn(
            "consult-reveal consult-banner-mesh consult-shimmer relative overflow-hidden rounded-3xl border border-orange-500/15 bg-transparent",
            animateClass
          )}
        >
          {/* Corner accents */}
          <div className="pointer-events-none absolute top-0 left-0 h-24 w-24 border-l border-t border-amber-400/20 rounded-tl-3xl" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 border-r border-b border-teal-400/20 rounded-br-3xl" aria-hidden />

          <div className="relative grid gap-8 p-6 md:p-8 lg:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-200">
                  <Sparkles className="mr-1 h-3 w-3" /> Sacred Live Session
                </Badge>
                <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-300">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Pandit Online
                </Badge>
              </div>

              <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-amber-50 mb-3 leading-[1.1]">
                Speak with
                <span className="block text-[#FF6600]">Guru Maharaj</span>
              </h2>

              <p className="text-orange-100/65 text-sm md:text-base max-w-xl mx-auto lg:mx-0 mb-3 leading-relaxed">
                Astrological & Spiritual Guidance for your Daily Life — remedies regarding New Job,
                Marriage, Financial Growth, Love Relationships and perfect Vaastu & Kundli consultation
                for a peaceful home and happy married life. Talk to our reverend Guruji Maharaj,
                Acharya’s and renowned Pandit ji’s, now!
              </p>

              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 md:text-sm">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                15+ years of minimum astrology experience of our Acharya’s & Pandit ji’s
              </p>

              <div className="mb-6 flex justify-center lg:justify-start">
                <PanditTimings />
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-6 lg:justify-start">
                {CONSULTATION_TOPICS.map((t) => (
                  <span
                    key={t}
                    className="text-xs md:text-xs px-3 py-1 rounded-full border border-teal-600/20 text-teal-300/85 bg-teal-950/10 backdrop-blur-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Stats strip */}
              <div className="flex flex-wrap justify-center gap-3 lg:justify-start mb-6">
                {[
                  { v: "4.9★", l: "Rating" },
                  { v: "2.3K+", l: "Sessions" },
                  { v: "₹551", l: "12 Min" },
                ].map(({ v, l }) => (
                  <div
                    key={l}
                    className="min-w-[4.5rem] rounded-xl border border-orange-500/15 bg-orange-950/10 px-3 py-2 text-center backdrop-blur-sm"
                  >
                    <p className="font-display text-sm font-bold text-amber-300">{v}</p>
                    <p className="text-xs uppercase tracking-wider text-orange-200/40">{l}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 lg:justify-start">
                <TalkButton onClick={onTalkClick} />
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-orange-500/25 bg-orange-950/10 px-6 text-amber-200 hover:bg-orange-500/10"
                >
                  <Link to="/live-consultation">
                    Explore Session <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex flex-col items-center gap-5">
              <GuruMaharajPortrait size="lg" />
              <div className="max-w-[18rem] text-center space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/85">
                  Guru Maharaj
                </p>
                <p className="font-display text-lg md:text-xl font-semibold leading-snug text-amber-50">
                  Maharaj Vinay Bhardwaj
                </p>
                <p className="text-xs text-orange-200/60 leading-relaxed">
                  Instant connect · Hindi & English · Confidential guidance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={cn("space-y-6 md:space-y-10", className)}>
      {/* Hero */}
      <div className="consult-banner-mesh relative overflow-hidden rounded-3xl border border-orange-500/20 p-6 md:p-10 backdrop-blur-xl">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <GuruMaharajPortrait size="lg" />
          <div className="text-center lg:text-left">
            <p className="text-teal-400/80 text-xs font-medium tracking-[0.2em] uppercase mb-2">Guru Maharaj · Live</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-amber-50 mb-2">
              Maharaj Vinay <span className="sutra-text">Bhardwaj</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-sm text-orange-200/50">4.9 · 2,300+ sacred sessions</span>
            </div>
            <p className="text-orange-100/60 text-sm md:text-base max-w-2xl leading-relaxed mb-3">
              Astrological & Spiritual Guidance for your Daily Life — remedies regarding New Job,
              Marriage, Financial Growth, Love Relationships and perfect Vaastu & Kundli consultation
              for a peaceful home and happy married life. Talk to our reverend Guruji Maharaj,
              Acharya’s and renowned Pandit ji’s, now!
            </p>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 md:text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              15+ years of minimum astrology experience of our Acharya’s & Pandit ji’s
            </p>
            <div className="mb-6 flex justify-center lg:justify-start">
              <PanditTimings />
            </div>
            <TalkButton onClick={onTalkClick} />
          </div>
        </div>
      </div>

      {/* Benefits bento */}
      <div className="grid sm:grid-cols-2 gap-4">
        {BENEFITS.map(({ icon: Icon, title, desc, accent }) => (
          <div
            key={title}
            className={cn(
              "group glass-card rounded-2xl border border-orange-500/15 p-5 flex gap-4 hover:border-orange-500/35 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-br",
              accent
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/25 group-hover:sutra-glow transition-shadow">
              <Icon className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-amber-100 mb-1">{title}</h3>
              <p className="text-sm text-orange-100/50 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Topics + pricing */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card rounded-2xl border border-teal-500/20 p-6 md:p-8">
          <h3 className="font-display text-xl font-semibold text-amber-100 mb-5 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" /> Sacred Topics Covered
          </h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {CONSULTATION_TOPICS.map((t, i) => (
              <span
                key={t}
                className="text-xs px-3 py-1.5 rounded-full border border-teal-600/25 text-teal-300/85 bg-teal-950/25"
                style={{ transform: i % 2 === 1 ? "rotate(-1deg)" : "rotate(1deg)" }}
              >
                {t}
              </span>
            ))}
          </div>
          <ul className="space-y-3">
            {["Instant connect after recharge", "Hindi & English guidance", "Remedies & muhurat advice"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-orange-100/60">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 glass-card relative overflow-hidden rounded-2xl border border-amber-500/30 p-6 md:p-8 bg-gradient-to-br from-orange-950/40 to-amber-950/25">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" aria-hidden />
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/70 mb-3">Dakshina Plan</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-5xl font-bold text-amber-50">₹551</span>
          </div>
          <p className="text-sm text-orange-200/50 mb-1">12 minutes · ₹45.9/min</p>
          <p className="text-xs text-orange-200/35 mb-8">Demo mode — no real payment processed</p>
          <TalkButton onClick={onTalkClick} />
        </div>
      </div>

      {/* Timeline steps */}
      <div className="glass-card relative rounded-2xl border border-orange-500/15 p-6 md:p-10">
        <h3 className="font-display text-xl md:text-2xl font-semibold text-amber-100 mb-8 text-center">
          Your Path to <span className="sutra-text">Guidance</span>
        </h3>
        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="step-timeline-line" aria-hidden />
          {STEPS.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="relative text-center group">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-600/20 to-amber-900/20 font-display text-sm font-bold text-amber-400 group-hover:sutra-glow transition-shadow">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-400/50 mb-1">Step {step}</p>
              <h4 className="font-display text-lg font-semibold text-amber-100 mb-2">{title}</h4>
              <p className="text-sm text-orange-100/50 leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveConsultationSection;
