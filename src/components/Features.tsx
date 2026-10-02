import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { whenPreloaderReady, refreshScrollTriggers } from "@/lib/scrollAnimations";
import {
  Brain,
  Camera,
  Calendar,
  Shield,
  Zap,
  TrendingUp,
  Heart,
  Eye,
  Clock,
  Hash,
  Calculator,
  Target,
  Sparkles,
  Star,
  Moon,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Phone,
  Headphones,
} from "lucide-react";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ShootingStar component for card overlay
const ShootingStar: React.FC<{ cardWidth: number; cardHeight: number }> = ({ cardWidth, cardHeight }) => {
  const [stars, setStars] = useState([
    // Each star: {id, startX, startY, size, duration, delay}
  ]);

  // Helper to generate a random star config
  const generateStar = (id: number) => {
    const size = Math.random() * 32 + 24; // 24px to 56px
    // Start from top right, end at bottom left
    const startX = cardWidth - (Math.random() * (cardWidth * 0.3) + size); // randomize a bit near top right
    const startY = Math.random() * 20; // a little vertical randomness at top
    const duration = Math.random() * 1.2 + 1.2; // 1.2s to 2.4s
    const delay = Math.random() * 2.5; // 0s to 2.5s
    return { id, startX, startY, size, duration, delay };
  };

  useEffect(() => {
    // Generate 2-3 stars per card
    setStars([
      generateStar(1),
      generateStar(2),
      Math.random() > 0.5 ? generateStar(3) : null,
    ].filter(Boolean));
  }, [cardWidth, cardHeight]);

  return (
    <>
      {stars.map((star) => (
        <img
          key={star.id}
          src="/images/shootingstar.png"
          alt="Shooting Star"
          style={{
            position: "absolute",
            left: star.startX,
            top: star.startY,
            width: star.size,
            height: "auto",
            pointerEvents: "none",
            zIndex: 30,
            opacity: 0.85,
            filter: "drop-shadow(0 0 8px #fff8) blur(0.5px)",
            transform: "rotate(180deg)",
            animation: `shooting-star-fall-${star.id} ${star.duration}s linear ${star.delay}s infinite`,
          }}
        />
      ))}
      {/* Keyframes for each star */}
      <style>{`
        ${stars
          .map(
            (star) => `@keyframes shooting-star-fall-${star.id} {
              0% { opacity: 0; transform: translate(0, 0) scale(0.8) rotate(180deg); }
              10% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; transform: translate(-${cardWidth - star.startX + 40}px, ${cardHeight + 40}px) scale(1.1) rotate(180deg); }
            }`
          )
          .join("\n")}
      `}</style>
    </>
  );
};

// Animated Floating Images Component
const AnimatedFloatingImages = () => {
  const [img1, setImg1] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    z: 1,
  });
  const [img2, setImg2] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    z: 2,
  });
  const requestRef = useRef<number>();
  const startTime = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (!startTime.current) startTime.current = time;
      const t = (time - startTime.current) / 1000;
      // Animate img1
      setImg1({
        x: Math.sin(t * 0.5) * 120 + 80,
        y: Math.cos(t * 0.7) * 60 + 120,
        scale: 1 + 0.2 * Math.sin(t * 0.8),
        rotate: (t * 40) % 360,
        z: 1 + Math.round((Math.sin(t * 0.6) + 1) * 1),
      });
      // Animate img2
      setImg2({
        x: Math.cos(t * 0.6) * 100 + 400,
        y: Math.sin(t * 0.9) * 80 + 200,
        scale: 1.1 + 0.15 * Math.cos(t * 0.5),
        rotate: (t * 60) % 360,
        z: 1 + Math.round((Math.cos(t * 0.8) + 1) * 1),
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <>
      <img
        src="/images/animate1.png"
        alt="Animated 1"
        style={{
          position: "absolute",
          top: `${img1.y}px`,
          left: `${img1.x}px`,
          width: `${120 * img1.scale}px`,
          height: `${120 * img1.scale}px`,
          borderRadius: "50%",
          backgroundColor: "transparent",
          // boxShadow: "0 0 32px 0 rgba(80, 80, 180, 0.10)",
          zIndex: 30, // <-- set high z-index
          transform: `rotate(${img1.rotate}deg)`,
          transition: "box-shadow 0.3s",
          pointerEvents: "none",
        }}
        // className="shadow-2xl"
        draggable={false}
      />
      <img
        src="/images/animate2.png"
        alt="Animated 2"
        style={{
          position: "absolute",
          top: `${img2.y}px`,
          left: `${img2.x}px`,
          width: `${100 * img2.scale}px`,
          height: `${100 * img2.scale}px`,
          borderRadius: "50%",
          // background: "rgba(255,255,255,0.7)",
          // boxShadow: "0 0 32px 0 rgba(180, 80, 80, 0.10)",
          zIndex: 30, // <-- set high z-index
          transform: `rotate(${img2.rotate}deg)`,
          transition: "box-shadow 0.3s",
          pointerEvents: "none",
        }}
        // className="shadow-2xl"
        draggable={false}
      />
    </>
  );
};

// Animated Counter Component
const AnimatedCounter = ({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: any;
}) => {
  const counterRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const targetValue = parseInt(value.replace(/\D/g, ""));
          const duration = 2000;
          const increment = targetValue / (duration / 16);
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
              current = targetValue;
              clearInterval(timer);
            }
            setCount(Math.floor(current));
          }, 16);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={counterRef} className="text-center group">
      <div className="mb-3 sm:mb-4 flex justify-center">
        <div className="p-3 sm:p-4 rounded-full bg-gradient-to-r from-orange-500 to-teal-500 group-hover:scale-110 transition-all duration-500 shadow-lg">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
      </div>
      <div className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-teal-600 to-amber-600 bg-clip-text text-transparent mb-2 sm:mb-3">
        {value.includes("+")
          ? `${count}+`
          : value.includes("%")
          ? `${count}%`
          : value.includes("★")
          ? `${count}★`
          : value}
      </div>
      <div className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium">
        {label}
      </div>
    </div>
  );
};

// Animated Stat Image Component
const AnimatedStatImage = ({
  children,
  imgSrc,
  speed = 1,
  size = 140,
}: {
  children: React.ReactNode;
  imgSrc: string;
  speed?: number;
  size?: number;
}) => {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setRotation((r) => (r + speed) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [speed]);
  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt="Animated Stat BG"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: "50%",
          zIndex: 1,
          transform: `rotate(${rotation}deg)`,
          transition: "box-shadow 0.3s",
          pointerEvents: "none",
        }}
        draggable={false}
      />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );
};

// Animated Stat SVG Component (for shape.svg)
const AnimatedStatSVG = ({
  value,
  label,
  speed = 0.3,
  isStar = false,
}: {
  value: string;
  label: string;
  speed?: number;
  isStar?: boolean;
}) => {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setRotation((r) => (r + speed) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [speed]);
  return (
    <div className="flex flex-col items-center justify-center group">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 180, height: 180 }}
      >
        <img
          src="/images/shape.svg"
          alt="Stat Shape"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 180,
            height: 180,
            zIndex: 1,
            transform: `rotate(${rotation}deg)`,
            transition: "box-shadow 0.3s",
            pointerEvents: "none",
          }}
          draggable={false}
        />
        {/* Transparent dark circle behind number */}
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(10,20,40,0.55)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ></span>
        <span
          className="relative z-10 text-[2rem] md:text-3xl font-extrabold flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-teal-500"
          style={{ fontFamily: "inherit", letterSpacing: 1 }}
        >
          {isStar ? (
            <>
              5
              <span className="ml-1 text-[1.5rem] md:text-2xl text-teal-700 align-middle">
                ★
              </span>
            </>
          ) : (
            value
          )}
        </span>
      </div>
      <div
        className="mt-4 text-white text-lg md:text-xl font-semibold text-center transition-colors duration-300 group-hover:text-orange-400"
        style={{ fontFamily: "inherit" }}
      >
        {label}
      </div>
    </div>
  );
};

const Features = () => {
  const { tr } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("numerology");

  const numerologyFeatures = [
    { icon: Calculator, title: tr.features.numerology.lifePathTitle, description: tr.features.numerology.lifePathDesc, color: "cosmic", badge: "Core Numbers" },
    { icon: Target, title: tr.features.numerology.destinyTitle, description: tr.features.numerology.destinyDesc, color: "stellar", badge: "Destiny" },
    { icon: Sparkles, title: tr.features.numerology.soulTitle, description: tr.features.numerology.soulDesc, color: "golden", badge: "Spiritual" },
    { icon: Brain, title: tr.features.numerology.aiTitle, description: tr.features.numerology.aiDesc, color: "mystic", badge: "AI-Powered" },
  ];

  const horoscopeFeatures = [
    { icon: Star, title: tr.features.horoscope.dailyTitle, description: tr.features.horoscope.dailyDesc, color: "cosmic", badge: "Daily" },
    { icon: Calendar, title: tr.features.horoscope.birthChartTitle, description: tr.features.horoscope.birthChartDesc, color: "stellar", badge: "Personalized" },
    { icon: Heart, title: tr.features.horoscope.loveTitle, description: tr.features.horoscope.loveDesc, color: "golden", badge: "Romance" },
    { icon: TrendingUp, title: tr.features.horoscope.forecastTitle, description: tr.features.horoscope.forecastDesc, color: "mystic", badge: "Forecasting" },
  ];

  const astrologyFeatures = [
    { icon: Moon, title: tr.features.astrology.lunarTitle, description: tr.features.astrology.lunarDesc, color: "cosmic", badge: "Lunar" },
    { icon: Eye, title: tr.features.astrology.spiritualTitle, description: tr.features.astrology.spiritualDesc, color: "stellar", badge: "Wisdom" },
    { icon: Hash, title: tr.features.astrology.planetaryTitle, description: tr.features.astrology.planetaryDesc, color: "golden", badge: "Live Updates" },
    { icon: Shield, title: tr.features.astrology.protectedTitle, description: tr.features.astrology.protectedDesc, color: "mystic", badge: "Secure" },
  ];

  const consultationFeatures = [
    { icon: Phone, title: "Live Voice Consultation", description: "Speak one-on-one with Guru Maharaj and our Acharyas for personalized Vedic guidance.", color: "cosmic", badge: "Live" },
    { icon: Headphones, title: "Instant Connect", description: "Recharge and connect within seconds — no long waiting queues.", color: "stellar", badge: "Fast" },
    { icon: Clock, title: "12-Minute Sessions", description: "Focused time for kundli, muhurat, remedies, marriage, and career questions.", color: "golden", badge: "Focused" },
    { icon: Shield, title: "Private & Trusted", description: "Confidential consultations backed by 2,300+ verified sessions.", color: "mystic", badge: "Secure" },
  ];

  useEffect(() => {
    let ctx: gsap.Context | undefined;

    const setup = () => {
      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        gsap.set(".header-animate", { opacity: 0, y: 50, scale: 0.9 });
        gsap.set(".feature-card", { opacity: 0, y: 50, scale: 0.95 });
        if (tabsRef.current) gsap.set(tabsRef.current, { opacity: 0, y: 30, scale: 0.95 });

        gsap.to(".header-animate", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });

        gsap.to(".feature-card", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            toggleActions: "play none none none",
            invalidateOnRefresh: true,
          },
        });

        if (tabsRef.current) {
          gsap.to(tabsRef.current, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: tabsRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
          });
        }
      }, sectionRef);

      refreshScrollTriggers();
    };

    const removePreloaderListener = whenPreloaderReady(setup);

    return () => {
      removePreloaderListener();
      ctx?.revert();
    };
  }, []);

  const getColorClasses = (color: string) => {
    switch (color) {
      case "cosmic":
        return "text-orange-600 bg-gradient-to-br from-orange-100 to-orange-200 dark:text-orange-400 dark:from-orange-900/30 dark:to-orange-800/30";
      case "stellar":
        return "text-teal-600 bg-gradient-to-br from-blue-100 to-teal-200 dark:text-teal-400 dark:from-teal-950/30 dark:to-teal-800/30";
      case "golden":
        return "text-amber-600 bg-gradient-to-br from-amber-100 to-amber-200 dark:text-amber-400 dark:from-amber-900/30 dark:to-amber-800/30";
      case "mystic":
        return "text-teal-700 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:text-indigo-400 dark:from-indigo-900/30 dark:to-indigo-800/30";
      default:
        return "text-orange-600 bg-gradient-to-br from-orange-100 to-orange-200 dark:text-orange-400 dark:from-orange-900/30 dark:to-orange-800/30";
    }
  };

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case "cosmic":
        return "border-orange-300 text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:border-orange-600 dark:text-orange-300 dark:from-orange-900/20 dark:to-orange-800/20";
      case "stellar":
        return "border-teal-300 text-teal-700 bg-gradient-to-r from-blue-50 to-teal-100 dark:border-teal-600 dark:text-teal-300 dark:from-teal-950/20 dark:to-teal-800/20";
      case "golden":
        return "border-amber-300 text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100 dark:border-amber-600 dark:text-amber-300 dark:from-amber-900/20 dark:to-amber-800/20";
      case "mystic":
        return "border-indigo-300 text-indigo-700 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:border-teal-700 dark:text-indigo-300 dark:from-indigo-900/20 dark:to-indigo-800/20";
      default:
        return "border-orange-300 text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:border-orange-600 dark:text-orange-300 dark:from-orange-900/20 dark:to-orange-800/20";
    }
  };

  const CARD_WIDTH = 420; // px (approximate, adjust as needed)
  const CARD_HEIGHT = 260; // px (approximate, adjust as needed)

  const renderFeatureGrid = (features: typeof numerologyFeatures) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <Card
            key={index}
            className="feature-card glass-card relative overflow-hidden border border-orange-500/20 rounded-lg sm:rounded-xl hover:border-orange-500/40 transition-all duration-300 group"
          >
            <CardContent className="p-4 sm:p-5 relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 rounded-md sm:rounded-lg bg-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
                <Badge
                  variant="outline"
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-xs bg-white/5 text-gray-300 border-gray-600/30"
                >
                  {feature.badge}
                </Badge>
              </div>

              <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 md:py-20 relative overflow-hidden min-h-screen bg-transparent"
    >
      <AnimatedFloatingImages />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
      <div className="container mx-auto px-3 sm:px-4 relative z-10">
        {/* Section header with enhanced animations */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="outline" className="header-animate mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-orange-500/50 text-orange-300 bg-orange-500/10">
            {tr.features.badge}
          </Badge>
          <h2 className="header-animate mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold text-white px-2">
            {tr.features.title}{' '}
            <span className="bg-gradient-to-r from-orange-400 via-teal-400 to-amber-400 bg-clip-text text-transparent">
              {tr.features.titleHighlight}
            </span>
          </h2>
          <p className="header-animate max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed px-2">
            {tr.features.subtitle}
          </p>
        </div>

        {/* Enhanced Features tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6 sm:mb-8">
            <TabsList
              ref={tabsRef}
              className="flex w-full max-w-2xl p-1 sm:p-2 justify-between gap-1 sm:gap-2 glass-card border-orange-500/20 rounded-lg sm:rounded-xl flex-wrap h-auto"
            >
              <TabsTrigger value="numerology" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-300 text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-white touch-manipulation">
                <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tr.features.tabs.numerology}</span>
              </TabsTrigger>
              <TabsTrigger value="horoscope" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-300 text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-amber-400 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-white touch-manipulation">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tr.features.tabs.horoscope}</span>
              </TabsTrigger>
              <TabsTrigger value="astrology" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-300 text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-white touch-manipulation">
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tr.features.tabs.astrology}</span>
              </TabsTrigger>
              <TabsTrigger value="consultation" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-300 text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-white touch-manipulation">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Live Pandit</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="numerology" className="mt-6 sm:mt-12">
            {renderFeatureGrid(numerologyFeatures)}
          </TabsContent>

          <TabsContent value="horoscope" className="mt-6 sm:mt-12">
            {renderFeatureGrid(horoscopeFeatures)}
          </TabsContent>

          <TabsContent value="astrology" className="mt-6 sm:mt-12">
            {renderFeatureGrid(astrologyFeatures)}
          </TabsContent>

          <TabsContent value="consultation" className="mt-6 sm:mt-12">
            {renderFeatureGrid(consultationFeatures)}
            <div className="mt-6 glass-card rounded-xl border border-orange-500/25 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-amber-100 mb-1">Ready to speak with Pandit Ji?</p>
                <p className="text-sm text-orange-100/50">Live guidance from ₹551 · 12 minutes</p>
              </div>
              <Link
                to="/live-consultation"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <Phone className="h-4 w-4" /> Book Consultation
              </Link>
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats section */}
        <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
          {[
            { value: "50K+", label: tr.features.stats.readings },
            { value: "99%", label: tr.features.stats.accuracy },
            { value: "24/7", label: tr.features.stats.available },
            { value: "5★", label: tr.features.stats.rating },
          ].map((stat, i) => (
            <div key={i} className="sutra-card text-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-orange-500/20">
              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent mb-0.5 sm:mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-xs text-gray-400 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to action section */}
      </div>
    </section>
  );
};

export default Features;
