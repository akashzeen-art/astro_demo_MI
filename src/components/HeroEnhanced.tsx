import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Hand, Stars, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import gsap from "gsap";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [titleRef.current, subtitleRef.current],
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.3,
          ease: "power3.out",
        }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Stars className="absolute top-20 left-20 h-6 w-6 text-amber-400 opacity-50 animate-pulse" />
        <Sparkles className="absolute top-32 right-32 h-4 w-4 text-pink-300 opacity-40 animate-bounce" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 relative z-10">
        <GlassCard className="max-w-4xl mx-auto p-8 text-center">
          <Badge
            variant="outline"
            className="mb-6 px-4 py-2 border-orange-500/50 text-amber-300 bg-orange-500/10"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Mystical Insights
          </Badge>

          <h1
            ref={titleRef}
            className="text-5xl font-bold mb-6 leading-tight text-white"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            Discover Your{" "}
            <span className="bg-gradient-to-r from-amber-400 to-teal-400 bg-clip-text text-transparent">
              Destiny
            </span>
            <br />
            Through{" "}
            <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
              Ancient Wisdom
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Unlock your palm lines and birth chart secrets with advanced AI. Get personalized insights into your personality, relationships, and future.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* TEMPORARY: Palm scanning disabled — uncomment to re-enable
            <Link to="/palm-analysis">
              <Button className="bg-gradient-to-r from-orange-500 to-teal-600 text-white px-6 py-3 group shadow-lg hover:scale-105 transition-all duration-300">
                <Hand className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Analyze Your Palm
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            */}
            <Link to="/astrology">
              <Button
                variant="outline"
                className="border-amber-400/50 text-amber-300 hover:bg-orange-500/10 px-6 py-3 group"
              >
                <Stars className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-700" />
                Get Astrology Reading
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Readings", value: "10K+", color: "text-amber-400" },
              { label: "Accuracy", value: "98%", color: "text-teal-400" },
              { label: "Users", value: "5K+", color: "text-amber-400" },
              { label: "Available", value: "24/7", color: "text-emerald-400" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
};

export default Hero;