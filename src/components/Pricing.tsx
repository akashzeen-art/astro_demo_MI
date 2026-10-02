import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Cosmic Explorer",
      price: "Free",
      period: "",
      description: "Perfect for beginners exploring palmistry",
      icon: Star,
      color: "cosmic",
      popular: false,
      features: [
        "1 Palm Reading per month",
        "Basic personality analysis",
        "General life insights",
        "Community access",
        "Educational content",
      ],
      cta: "Start Free",
      link: "/palm-analysis",
    },
    {
      name: "Stellar Seeker",
      price: "$19",
      period: "/month",
      description: "Comprehensive readings for dedicated seekers",
      icon: Sparkles,
      color: "stellar",
      popular: true,
      features: [
        "Unlimited palm readings",
        "Detailed astrology reports",
        "Daily horoscopes",
        "Love compatibility analysis",
        "Career guidance",
        "Priority support",
        "Advanced AI insights",
      ],
      cta: "Get Started",
      link: "/palm-analysis",
    },
    {
      name: "Mystic Master",
      price: "$49",
      period: "/month",
      description: "Premium experience with personal consultation",
      icon: Crown,
      color: "golden",
      popular: false,
      features: [
        "Everything in Stellar Seeker",
        "1-on-1 astrologer consultation",
        "Custom birth chart analysis",
        "Weekly live readings",
        "Future predictions (6 months)",
        "Personalized remedies",
        "VIP customer support",
        "Early access to new features",
      ],
      cta: "Go Premium",
      link: "/palm-analysis",
    },
  ];

  const getIconClasses = (color: string) => {
    switch (color) {
      case "cosmic":
        return "text-cosmic bg-cosmic/20";
      case "stellar":
        return "text-stellar bg-stellar/20";
      case "golden":
        return "text-golden bg-golden/20";
      default:
        return "text-cosmic bg-cosmic/20";
    }
  };

  const getButtonClasses = (color: string, popular: boolean) => {
    if (popular) {
      return "bg-stellar-gradient hover:opacity-90 sutra-glow";
    }
    switch (color) {
      case "cosmic":
        return "border-cosmic/50 text-cosmic hover:bg-cosmic/20";
      case "golden":
        return "bg-golden-gradient hover:opacity-90 golden-glow text-background";
      default:
        return "border-cosmic/50 text-cosmic hover:bg-cosmic/20";
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 stars-bg opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-2 border-cosmic/50 text-cosmic bg-cosmic/10"
          >
            Pricing Plans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Choose Your <span className="cosmic-text">Cosmic Journey</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Select the perfect plan for your spiritual exploration. All plans
            include our advanced AI technology and secure, private readings.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto px-4">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={index}
                className={`glass-card hover:sutra-glow transition-all duration-300 relative ${
                  plan.popular ? "sm:scale-105 sutra-glow" : ""
                } ${plan.popular && index === 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-stellar-gradient sutra-glow px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <div
                      className={`p-4 rounded-full ${getIconClasses(plan.color)}`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>

                  {/* Plan name */}
                  <CardTitle className="text-2xl font-bold mb-2">
                    {plan.name}
                  </CardTitle>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-4xl font-bold cosmic-text">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Check className="h-4 w-4 text-cosmic mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link to={plan.link} className="block">
                    <Button
                      className={`w-full ${getButtonClasses(plan.color, plan.popular)}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Money back guarantee */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            ✨ 30-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
        </div>

        {/* Enterprise section */}
        <div className="mt-16 text-center">
          <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Need a Custom Solution?</h3>
            <p className="text-muted-foreground mb-6">
              We offer enterprise solutions for astrology businesses, spiritual
              centers, and wellness platforms. Get custom integrations,
              white-label options, and dedicated support.
            </p>
            <Button
              variant="outline"
              className="border-cosmic/50 text-cosmic hover:bg-cosmic/20"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
