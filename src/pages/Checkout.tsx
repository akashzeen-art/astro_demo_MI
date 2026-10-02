import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield } from "lucide-react";
import { FEATURES } from "@/lib/config";
import { getPortalIdFromUrl, getOrGenerateClickId } from "@/utils/clickIdManager";
import { fetchPricingData, parsePricingForUI } from "@/services/pricingApi";
import { checkUserStatus, isUserSubscribed } from "@/services/userStatusApi";
import { initiatePayment } from "@/services/paymentApi";
import { DAKSHINA } from "@/lib/dakshina";
import { syncSubscriptionFromApi } from "@/lib/subscription";
import { hasCompleteBirthProfile, syncBirthProfileFromApi } from "@/services/userProfileApi";

interface PlanOption {
  packType: string;
  price: number;
  name?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPack, setSelectedPack] = useState("");
  const [portalId, setPortalId] = useState("");
  const [clickId, setClickId] = useState("");
  const [success, setSuccess] = useState(false);

  const useApiPayments = FEATURES.PAYMENTS;

  useEffect(() => {
    if (!useApiPayments) {
      setPlans([
        { packType: "weekly", price: 49 },
        { packType: "monthly", price: 149 },
      ]);
      setSelectedPack("weekly");
      setLoading(false);
      return;
    }

    const currentPortalId = getPortalIdFromUrl();
    const currentClickId = getOrGenerateClickId(currentPortalId);

    setPortalId(currentPortalId);
    setClickId(currentClickId);

    fetchPricingData(currentPortalId, currentClickId)
      .then((config) => {
        const hasValidPackType =
          config?.multiplePackType &&
          typeof config.multiplePackType === "object" &&
          Object.keys(config.multiplePackType).length > 0;

        if (hasValidPackType) {
          const parsed = parsePricingForUI(config).ordered.map((plan) => ({
            packType: plan.packType,
            price: plan.discountedPrice,
            name: plan.name,
          }));
          setPlans(parsed);
          if (parsed[0]) setSelectedPack(parsed[0].packType);
        }
        setLoading(false);
      })
      .catch(() => {
        setPlans([
          { packType: "weekly", price: 49 },
          { packType: "monthly", price: 149 },
        ]);
        setSelectedPack("weekly");
        setLoading(false);
      });
  }, [useApiPayments]);

  const handleDemoPayment = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));

    localStorage.setItem(
      "subscription",
      JSON.stringify({
        userId: "demo_user_123",
        plan: selectedPack,
        amount: plans.find((p) => p.packType === selectedPack)?.price,
        status: "paid",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    );

    setLoading(false);
    setSuccess(true);
    setTimeout(async () => {
      const profile = await syncBirthProfileFromApi(mobile);
      navigate(hasCompleteBirthProfile(profile ?? undefined) ? "/" : "/profile/setup");
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (plans.length === 0) {
      alert("Price information is not available. Please try again later.");
      return;
    }

    const selected = plans.find((p) => p.packType === selectedPack);
    if (!selected) return;

    if (!mobile || mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!useApiPayments) {
      await handleDemoPayment();
      return;
    }

    setLoading(true);

    try {
      const statusData = await checkUserStatus(mobile, portalId);

      if (isUserSubscribed(statusData)) {
        syncSubscriptionFromApi(mobile, statusData.packType);
        localStorage.setItem("isSubscribed", "true");
        localStorage.setItem("userMobile", mobile);
        localStorage.setItem("subscriptionData", JSON.stringify(statusData));
        setSuccess(true);
        setTimeout(async () => {
          const profile = await syncBirthProfileFromApi(mobile);
          if (hasCompleteBirthProfile(profile ?? undefined)) {
            window.location.href = `${window.location.origin}/?msisdn=${mobile}&id=${portalId}`;
          } else {
            localStorage.setItem("postProfilePath", "/");
            navigate("/profile/setup");
          }
        }, 1500);
        return;
      }
    } catch {
      console.warn("Status check failed - proceeding with payment");
    }

    setLoading(false);

    initiatePayment({
      portalId,
      mobile,
      clickId,
      packType: selected.packType,
      price: selected.price,
    });
  };

  if (loading && plans.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-400/50">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {useApiPayments ? "Already Subscribed!" : "Payment Successful!"}
            </h2>
            <p className="text-gray-400">Redirecting...</p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-md">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 border-amber-400/50 text-amber-300 bg-orange-500/10">
            {DAKSHINA.title}
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">{DAKSHINA.chooseTitle}</h1>
          <p className="text-gray-400">{DAKSHINA.chooseHint}</p>
        </div>

        <Card className="glass-card border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-center">{DAKSHINA.packages}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-6">
              {plans.map((plan) => (
                <label
                  key={plan.packType}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPack === plan.packType
                      ? "border-amber-400 bg-amber-500/10"
                      : "border-white/10 hover:border-amber-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pack"
                      value={plan.packType}
                      checked={selectedPack === plan.packType}
                      onChange={() => setSelectedPack(plan.packType)}
                      className="accent-amber-500"
                    />
                    <span className="text-white font-semibold">
                      {plan.name || "Plan"}
                    </span>
                  </div>
                  <span className="text-amber-400 font-bold">₹{plan.price}</span>
                </label>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  Mobile Number
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex h-12 shrink-0 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-semibold text-amber-300">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    maxLength={10}
                  />
                </div>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading || plans.length === 0}
                className="w-full bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl"
              >
                {loading ? "Processing..." : useApiPayments ? DAKSHINA.completeOrder : `दक्षिणा ₹${plans.find((p) => p.packType === selectedPack)?.price} — Demo`}
              </Button>

              {!useApiPayments && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />
                  Demo mode — no real payment processed
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Checkout;
