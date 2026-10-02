import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  User,
  Hand,
  Calculator,
  Star,
  TrendingUp,
  Calendar,
  Crown,
  Heart,
  Brain,
  Clock,
  Download,
  Share2,
  Settings,
  Bell,
  Eye,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// Authentication removed - no auth checks needed
import { useToast } from "@/hooks/use-toast";
import {
  apiService,
  type DashboardData,
  type Reading as ApiReading,
  type DashboardPrediction,
} from "@/lib/apiService";
import {
  downloadReport,
  shareReading,
  shareWithReport,
  type ReadingData,
} from "@/lib/shareAndDownload";

const Dashboard = () => {
  const { tr } = useLanguage();
  // Authentication removed - using default values
  const authUser = null;
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [sharingIds, setSharingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Derived display values
  const displayName =
    authUser?.first_name || authUser?.username || authUser?.email || "Explorer";

  const memberSince = dashboard?.user_stats.member_since
    ? new Date(dashboard.user_stats.member_since).toLocaleDateString()
    : authUser?.date_joined
      ? new Date(authUser.date_joined).toLocaleDateString()
      : "Recently";

  const totalReadings = dashboard?.user_stats.total_readings ?? 0;
  const averageAccuracy = dashboard?.user_stats.average_accuracy ?? 0;
  const readingsThisWeek = dashboard?.user_stats.readings_this_week ?? 0;
  
  // Get user's current plan from user data or default
  const currentPlan = authUser?.current_plan 
    ? authUser.current_plan.split("_").map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" ")
    : authUser?.subscription_status === "premium" 
      ? "Mystic Master"
      : "Stellar Seeker";
  
  // Determine if user has enough reading data for predictions (threshold: at least 1 completed reading)
  const hasEnoughReadingData = totalReadings > 0;
  
  // Determine if user should see upgrade prompt
  // Show upgrade if: not premium AND (no readings OR less than 3 readings for better predictions)
  const shouldShowUpgrade = currentPlan !== "Mystic Master" && currentPlan !== "Cosmic Oracle";
  const isPremium = authUser?.is_premium || currentPlan === "Mystic Master" || currentPlan === "Cosmic Oracle";
  
  // Show upgrade message if user doesn't have enough data OR is not premium
  const shouldShowUpgradeMessage = shouldShowUpgrade && (!hasEnoughReadingData || totalReadings < 3);

  const weeklyData = dashboard?.weekly_activity ?? [];
  const spiritualProgress = dashboard?.spiritual_progress ?? [];
  const recentReadings = dashboard?.recent_readings ?? [];
  const upcomingFromApi = dashboard?.upcoming_predictions ?? [];
  const lastActivity = dashboard?.user_stats.last_reading_date
    ? new Date(dashboard.user_stats.last_reading_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : "No readings yet";

  const mappedRecentReadings = recentReadings.map((reading: ApiReading) => {
    // Map all three reading types properly
    let typeLabel = "Reading";
    const readingType = reading.type as string;
    
    if (readingType === "palm_analysis") {
      typeLabel = "Palm Analysis";
    } else if (readingType === "astrology_reading") {
      typeLabel = "Astrology Reading";
    } else if (readingType === "numerology") {
      typeLabel = "Numerology";
    } else if (readingType && typeof readingType === "string") {
      // Handle any other string types
      typeLabel = readingType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Use insights from backend if available, otherwise calculate
    let insights = (reading as any).insights || 0;
    
    // If backend didn't provide insights, calculate from results
    if (insights === 0) {
      const res: any = reading.results || {};
      
      // Palm Analysis insights - count all meaningful features
      if (reading.type === "palm_analysis" || typeLabel === "Palm Analysis") {
        // Count palm lines (Life, Head, Heart, Fate)
        if (res.lines) {
          const lines = res.lines || {};
          for (const lineKey of ["lifeLine", "headLine", "heartLine", "fateLine"]) {
            if (lines[lineKey] && lines[lineKey].quality?.toLowerCase() !== "absent") {
              insights += 1;
            }
          }
        }
        
        // Count personality traits
        if (res.personality?.traits && Array.isArray(res.personality.traits)) {
          insights += res.personality.traits.length;
        }
        
        // Count predictions
        if (Array.isArray(res.predictions)) {
          insights += res.predictions.length;
        }
        
        // Count special marks
        if (Array.isArray(res.specialMarks)) {
          insights += res.specialMarks.length;
        }
        
        // Count compatibility entries
        if (Array.isArray(res.compatibility)) {
          insights += res.compatibility.length;
        }
        
        // Count physical characteristics
        if (res.personality) {
          if (res.personality.dominantHand) insights += 1;
          if (res.personality.palmShape) insights += 1;
          if (res.personality.fingerLength) insights += 1;
          if (res.personality.handType) insights += 1;
        }
        
        // Overall score counts as 1 insight
        if (res.overallScore !== undefined && res.overallScore !== null) {
          insights += 1;
        }
      }
      
      // Numerology insights
      else if (reading.type === "numerology" || typeLabel === "Numerology") {
        if (res.lifePathNumber) insights += 1;
        if (res.destinyNumber) insights += 1;
        if (res.soulNumber) insights += 1;
        if (res.personalityNumber) insights += 1;
        if (res.interpretation) insights += 1;
        if (Array.isArray(res.compatibility)) insights += res.compatibility.length;
        if (Array.isArray(res.luckyNumbers)) insights += res.luckyNumbers.length;
        if (res.luckyColor) insights += 1;
        if (res.element) insights += 1;
      }
      
      // Astrology insights
      else if (reading.type === "astrology_reading" || typeLabel === "Astrology Reading") {
        if (res.sunSign) insights += 1;
        if (res.moonSign) insights += 1;
        if (res.risingSign) insights += 1;
        if (Array.isArray(res.planetaryPositions)) insights += res.planetaryPositions.length;
        if (Array.isArray(res.personalityTraits)) insights += res.personalityTraits.length;
        if (Array.isArray(res.lifePredictions)) insights += res.lifePredictions.length;
        if (Array.isArray(res.strengths)) insights += res.strengths.length;
        if (Array.isArray(res.challenges)) insights += res.challenges.length;
      }
    }
    
    // Ensure minimum insights count (at least 1)
    if (insights === 0) {
      insights = 1;
    }

    return {
      id: reading.id,
      type: typeLabel,
      date: reading.created_at,
      accuracy: reading.accuracy,
      insights,
      results: reading.results, // Include results for download/share
    };
  });

  // Handler functions for reading actions
  const handleDownloadReading = async (reading: typeof mappedRecentReadings[0]) => {
    setDownloadingIds((prev) => new Set(prev).add(reading.id));
    try {
      const readingData: ReadingData = {
        type: reading.type.toLowerCase().replace(/\s+/g, "_") as "palm" | "numerology" | "astrology",
        userInfo: {
          name: authUser?.first_name || authUser?.username || "User",
          date: new Date(reading.date).toLocaleDateString(),
          email: authUser?.email || "",
        },
        results: reading.results || {},
        overallScore: reading.accuracy || 0,
        timestamp: reading.date || new Date().toISOString(),
      };

      await downloadReport(readingData);

      toast({
        title: "Report Downloaded",
        description: `Your ${reading.type} report has been saved to your device.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reading.id);
        return newSet;
      });
    }
  };

  const handleShareReading = async (reading: typeof mappedRecentReadings[0]) => {
    setSharingIds((prev) => new Set(prev).add(reading.id));
    try {
      const readingData: ReadingData = {
        type: reading.type.toLowerCase().replace(/\s+/g, "_") as "palm" | "numerology" | "astrology",
        userInfo: {
          name: authUser?.first_name || authUser?.username || "User",
          date: new Date(reading.date).toLocaleDateString(),
          email: authUser?.email || "",
        },
        results: reading.results || {},
        overallScore: reading.accuracy || 0,
        timestamp: reading.date || new Date().toISOString(),
      };

      await shareReading(readingData);

      toast({
        title: "Shared Successfully",
        description: `Your ${reading.type} has been shared.`,
      });
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: "There was an error sharing your reading. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSharingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reading.id);
        return newSet;
      });
    }
  };

  const handleViewDetails = (reading: typeof mappedRecentReadings[0]) => {
    const readingType = reading.type.toLowerCase().replace(/\s+/g, "-");
    
    if (readingType.includes("palm") || readingType === "palm-analysis") {
      navigate("/palm-analysis", {
        state: { readingId: reading.id, readingData: reading.results },
      });
    } else if (readingType.includes("numerology")) {
      navigate("/numerology", { 
        state: { readingId: reading.id, readingData: reading.results } 
      });
    } else if (readingType.includes("astrology")) {
      navigate("/astrology", { 
        state: { readingId: reading.id, readingData: reading.results } 
      });
    } else {
      navigate("/palm-analysis", {
        state: { readingId: reading.id, readingData: reading.results },
      });
    }
  };

  const mappedUpcomingPredictions: Array<DashboardPrediction & { icon: React.ElementType }> =
    upcomingFromApi.map((p) => {
      const area = p.area.toLowerCase();
      let IconComp: React.ElementType = Star;
      if (area.includes("career") || area.includes("finance") || area.includes("work")) {
        IconComp = TrendingUp;
      } else if (area.includes("love") || area.includes("relationship") || area.includes("marriage")) {
        IconComp = Heart;
      } else if (area.includes("health") || area.includes("wellness")) {
        IconComp = Brain;
      }
      return { ...p, icon: IconComp };
    });

  // Real-time Dashboard refresh function
  const fetchDashboard = async (showLoading = false, isEventTriggered = false) => {
    try {
      if (showLoading) {
        setIsLoadingDashboard(true);
      } else if (isEventTriggered) {
        setIsUpdating(true);
      }
      setError(null); // Clear previous errors
      const data = await apiService.getDashboardData();
      setDashboard(data);
      setLastUpdateTime(new Date());
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
        setError(err?.message || "Failed to load your dashboard. Please try again.");
    } finally {
      setIsLoadingDashboard(false);
      if (isEventTriggered) {
        // Keep updating indicator visible briefly
        setTimeout(() => setIsUpdating(false), 1000);
      }
    }
  };

  // Fetch dashboard data and poll periodically for "real-time" updates
  useEffect(() => {
    let cancelled = false;

    // Initial fetch
    fetchDashboard(true);

    // Poll every 15 seconds for updates
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        fetchDashboard(false); // Don't show loading spinner on polling
      }
    }, 15000);

    // Listen for real-time reading-saved events
    const handleReadingSaved = (event: CustomEvent) => {
      const readingType = event.detail?.reading_type || "reading";
      const typeLabel = readingType === "palm_analysis" ? "Palm Reading" 
        : readingType === "astrology_reading" ? "Astrology Reading"
        : readingType === "numerology" ? "Numerology"
        : "Reading";
      
      console.log("🔄 Reading saved event received, refreshing Dashboard...", event.detail);
      
      // Show toast notification
      toast({
        title: "Reading Saved!",
        description: `Your ${typeLabel} has been saved to your Dashboard.`,
        duration: 3000,
      });
      
      // Immediately refresh Dashboard when a reading is saved
      fetchDashboard(false, true);
    };

    window.addEventListener("reading-saved", handleReadingSaved as EventListener);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("reading-saved", handleReadingSaved as EventListener);
    };
  }, []);

  // Authentication removed - no redirect needed

  return (
    <Layout>
        {/* Enhanced Header */}
        <section className="pb-8 sm:pb-12 relative overflow-hidden bg-transparent">
          <div className="sutra-page relative z-10">
            <div className="flex flex-col items-start gap-4 sm:gap-6 md:gap-8">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 sutra-glow flex-shrink-0 border-2 border-amber-400/50 shadow-lg shadow-orange-500/30">
                  <AvatarImage src={authUser?.avatar} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500/30 to-teal-500/30 text-white text-lg sm:text-xl font-bold">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                    Welcome back,{' '}
                    <span 
                      className="inline-block"
                      style={{
                        background: 'linear-gradient(135deg, #a78bfa, #fbbf24, #60a5fa, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        backgroundSize: '200% 200%',
                        animation: 'gradient-shift 5s ease infinite',
                      }}
                    >
                      {displayName}
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="border-amber-400/50 text-amber-300 bg-orange-500/20 px-2 py-0.5 text-xs"
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      {currentPlan}
                    </Badge>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-400">
                      Member since {memberSince}
                    </p>
                    {lastActivity !== "No readings yet" && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-400">
                          Last activity: {lastActivity}
                        </p>
                      </>
                    )}
                </div>
                  {isLoadingDashboard && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 w-2 bg-amber-300 rounded-full animate-pulse"></div>
                      <p className="text-xs text-amber-300 animate-pulse">
                        {isLoadingDashboard ? tr.dashboard.loading : tr.dashboard.loading}
                      </p>
              </div>
                  )}
                  {error && !isLoadingDashboard && (
                    <p className="text-xs text-red-400 mt-2">{error}</p>
                  )}
                  {!isLoadingDashboard && !error && dashboard && (
                    <div className="flex items-center gap-2 mt-2">
                      {isUpdating ? (
                        <>
                          <div className="h-1.5 w-1.5 bg-amber-300 rounded-full animate-pulse"></div>
                          <p className="text-xs text-amber-300">{tr.dashboard.updating}</p>
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 w-1.5 bg-green-300 rounded-full"></div>
                          <p className="text-xs text-green-300">
                            Dashboard synced{lastUpdateTime ? ` • ${lastUpdateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}` : ""}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Settings",
                      description: "Settings page coming soon!",
                    });
                  }}
                  className="border-amber-400/50 text-amber-300 hover:bg-orange-500/20 bg-white/10 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  {tr.dashboard.settings}
                </Button>
                {/* TEMPORARY: Palm scanning disabled
                <Link to="/palm-analysis" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-4 py-2 text-sm font-medium w-full sm:w-auto"
                  >
                    <Hand className="h-3.5 w-3.5 mr-1.5" />
                    {tr.dashboard.newReading}
                  </Button>
                </Link>
                */}
                <Link to="/numerology" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-4 py-2 text-sm font-medium w-full sm:w-auto"
                  >
                    <Calculator className="h-3.5 w-3.5 mr-1.5" />
                    {tr.dashboard.newReading}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </section>

        {/* Main Dashboard */}
        <section className="pb-12 sm:pb-20 bg-transparent">
          <div className="container mx-auto px-3 sm:px-4">
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-10">
              <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-transform duration-200 hover:shadow-2xl hover:shadow-orange-500/20 rounded-2xl overflow-hidden group">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 font-medium">
                        {tr.dashboard.totalReadings}
                      </p>
                      <p 
                        className="text-2xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {totalReadings}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500/30 to-orange-600/30 rounded-lg shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Hand className="h-5 w-5 text-amber-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-teal-500/30 hover:border-teal-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/20 rounded-2xl overflow-hidden group">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 font-medium">
                        {tr.dashboard.accuracyRate}
                      </p>
                      <p 
                        className="text-2xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #60a5fa, #fbbf24)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {averageAccuracy}%
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-teal-500/30 to-amber-500/30 rounded-lg shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Star className="h-5 w-5 text-teal-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 rounded-2xl overflow-hidden group">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 font-medium">
                        {tr.dashboard.thisWeek}
                      </p>
                      <p 
                        className="text-2xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #fbbf24, #ec4899)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {readingsThisWeek}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-amber-500/30 to-pink-500/30 rounded-lg shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-5 w-5 text-amber-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-transform duration-200 hover:shadow-2xl hover:shadow-orange-500/20 rounded-2xl overflow-hidden group">
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 font-medium">
                        {tr.dashboard.currentPlan}
                      </p>
                      <p 
                        className="text-lg font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #a78bfa, #fbbf24)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {currentPlan}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-lg shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Crown className="h-5 w-5 text-amber-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs for different sections */}
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6 md:space-y-8">
              <TabsList className="grid w-full grid-cols-4 glass-card border-orange-500/30 p-0.5 sm:p-1 rounded-lg sm:rounded-xl overflow-x-auto">
                <TabsTrigger 
                  value="overview"
                  className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-colors duration-200 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="readings"
                  className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-colors duration-200 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation"
                >
                  Readings
                </TabsTrigger>
                <TabsTrigger 
                  value="progress"
                  className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-colors duration-200 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation"
                >
                  Progress
                </TabsTrigger>
                <TabsTrigger 
                  value="predictions"
                  className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-colors duration-200 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation"
                >
                  Predictions
                </TabsTrigger>
              </TabsList>

              {/* Enhanced Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Enhanced Weekly Activity Chart */}
                  <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white text-base">
                        <div className="p-1.5 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-md">
                          <BarChart className="h-4 w-4 text-amber-300" />
                        </div>
                        {tr.dashboard.weeklyActivity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                        <BarChart data={weeklyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                          />
                          <XAxis
                            dataKey="day"
                            stroke="rgba(255,255,255,0.7)"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(30, 30, 50, 0.95)",
                              border: "1px solid rgba(139, 92, 246, 0.5)",
                              borderRadius: "12px",
                              color: "#fff",
                              backdropFilter: "blur(10px)",
                            }}
                          />
                          <Bar
                            dataKey="readings"
                            radius={[8, 8, 0, 0]}
                            stroke="none"
                            strokeWidth={0}
                          >
                            {weeklyData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`hsl(${240 + index * 20}, 70%, 60%)`}
                          />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Enhanced Spiritual Progress */}
                  <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white text-base">
                        <div className="p-1.5 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-md">
                          <Eye className="h-4 w-4 text-amber-300" />
                        </div>
                        {tr.dashboard.spiritualProgress}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {spiritualProgress.map((item, index) => (
                          <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-white">{item.name}</span>
                              <span className="text-xs font-bold" style={{ color: item.color }}>
                                {item.value}%
                            </span>
                            </div>
                            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${item.value}%`,
                                  background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                                  boxShadow: `0 0 10px ${item.color}40`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Recent Activity */}
                <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                      <div className="p-1.5 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-md">
                        <Clock className="h-4 w-4 text-amber-300" />
                      </div>
                      {tr.dashboard.recentActivity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mappedRecentReadings.length > 0 ? (
                        mappedRecentReadings.slice(0, 3).map((reading) => (
                        <div
                          key={reading.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-orange-500/20 hover:border-amber-400/40 hover:bg-orange-500/5 transition-colors duration-200 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md shadow-orange-500/20">
                                <Hand className="h-5 w-5 text-amber-300" />
                            </div>
                            <div>
                                <p className="font-medium text-white text-sm">{reading.type}</p>
                                <p className="text-xs text-gray-400">
                                {new Date(reading.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                              <Badge className="bg-gradient-to-r from-orange-600/30 to-teal-600/30 text-amber-300 border-amber-400/50 px-2 py-0.5 text-xs">
                              {reading.accuracy}% accuracy
                            </Badge>
                          </div>
                        </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-400">
                          <Hand className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{tr.dashboard.noReadings}. {tr.dashboard.startFirstReading}!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Readings Tab */}
              <TabsContent value="readings" className="space-y-4 sm:space-y-6">
                {mappedRecentReadings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {mappedRecentReadings.map((reading) => (
                    <Card
                      key={reading.id}
                        className="glass-card border-orange-500/30 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-transform duration-200 cursor-pointer rounded-2xl group overflow-hidden"
                    >
                        <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <Badge
                            variant="outline"
                              className="border-amber-400/50 text-amber-300 bg-orange-500/20 backdrop-blur-md"
                          >
                            {reading.type}
                          </Badge>
                          <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadReading(reading);
                                }}
                                disabled={downloadingIds.has(reading.id)}
                                className="hover:bg-orange-500/20 text-gray-400 hover:text-amber-300 disabled:opacity-50"
                                title="Download Report"
                              >
                                {downloadingIds.has(reading.id) ? (
                                  <div className="h-4 w-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                ) : (
                              <Download className="h-4 w-4" />
                                )}
                            </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareReading(reading);
                                }}
                                disabled={sharingIds.has(reading.id)}
                                className="hover:bg-orange-500/20 text-gray-400 hover:text-amber-300 disabled:opacity-50"
                                title="Share Reading"
                              >
                                {sharingIds.has(reading.id) ? (
                                  <div className="h-4 w-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                ) : (
                              <Share2 className="h-4 w-4" />
                                )}
                            </Button>
                          </div>
                        </div>

                          <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Date:</span>
                              <span className="text-white font-medium">
                                {new Date(reading.date).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                              <span className="text-gray-400">
                              Accuracy:
                            </span>
                              <span 
                                className="font-bold"
                                style={{
                                  background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                }}
                              >
                              {reading.accuracy}%
                            </span>
                          </div>
                        </div>

                        <Button
                            onClick={() => handleViewDetails(reading)}
                            className="w-full bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-md shadow-orange-500/30 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                            size="sm"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {tr.dashboard.viewDetails}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                ) : (
                  <Card className="glass-card border-orange-500/30 rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <Hand className="h-12 w-12 text-amber-300 mx-auto mb-3 opacity-50" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                          {tr.dashboard.noReadings}
                      </h3>
                      <p className="text-sm text-gray-400 mb-5">
                        Start your first reading to see your results here
                      </p>
                      {/* TEMPORARY: Palm scanning disabled
                      <Link to="/palm-analysis">
                        <Button className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]">
                          <Hand className="h-3.5 w-3.5 mr-1.5" />
                          Start Your First Reading
                        </Button>
                      </Link>
                      */}
                      <Link to="/numerology">
                        <Button className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]">
                          <Calculator className="h-3.5 w-3.5 mr-1.5" />
                          Start Your First Reading
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Enhanced Progress Tab */}
              <TabsContent value="progress" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-md">
                          <TrendingUp className="h-4 w-4 text-amber-300" />
                        </div>
                        {tr.dashboard.accuracyTrend}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                        <LineChart data={weeklyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                          />
                          <XAxis
                            dataKey="day"
                            stroke="rgba(255,255,255,0.7)"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(30, 30, 50, 0.95)",
                              border: "1px solid rgba(139, 92, 246, 0.5)",
                              borderRadius: "12px",
                              color: "#fff",
                              backdropFilter: "blur(10px)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="url(#colorGradient)"
                            strokeWidth={3}
                            dot={{
                              fill: "#a78bfa",
                              strokeWidth: 2,
                              stroke: "#fff",
                              r: 5,
                            }}
                            activeDot={{
                              r: 7,
                              stroke: "#a78bfa",
                              strokeWidth: 2,
                              fill: "#fff",
                            }}
                            connectNulls={false}
                          />
                          <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#a78bfa" />
                              <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-md">
                          <Brain className="h-4 w-4 text-amber-300" />
                        </div>
                        {tr.dashboard.spiritualDevelopment}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {spiritualProgress.map((item, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-white">{item.name}</span>
                            <span className="text-xs font-bold" style={{ color: item.color }}>
                              {item.value}%
                            </span>
                          </div>
                          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${item.value}%`,
                                background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                                boxShadow: `0 0 10px ${item.color}40`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Enhanced Predictions Tab */}
              <TabsContent value="predictions" className="space-y-4 sm:space-y-6">
                {/* Show predictions if user has enough reading data AND predictions exist */}
                {hasEnoughReadingData && mappedUpcomingPredictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {mappedUpcomingPredictions.map((prediction, index) => {
                    const Icon = prediction.icon;
                    return (
                      <Card
                        key={index}
                          className="glass-card border-orange-500/30 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 rounded-2xl group overflow-hidden"
                      >
                          <CardContent className="p-6 relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Icon className="h-6 w-6 text-amber-300" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white text-sm">{prediction.area}</h3>
                                <p className="text-xs text-gray-400">
                                {prediction.timeframe}
                              </p>
                            </div>
                          </div>

                            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                            {prediction.prediction}
                          </p>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">
                                Confidence:
                              </span>
                                <span className="font-bold text-amber-300">
                                {prediction.confidence}%
                              </span>
                            </div>
                              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${prediction.confidence}%`,
                                    background: `linear-gradient(90deg, #a78bfa, #60a5fa)`,
                                    boxShadow: `0 0 10px rgba(139, 92, 246, 0.5)`,
                                  }}
                                />
                              </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                ) : (
                  <>
                    {/* No Predictions Message */}
                    <Card className="glass-card border-orange-500/30 rounded-2xl">
                      <CardContent className="p-8 text-center">
                        <Star className="h-12 w-12 text-amber-300 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {tr.dashboard.noPredictions}
                        </h3>
                        <p className="text-sm text-gray-400 mb-5">
                          {tr.dashboard.noPredictionsDesc}
                        </p>
                        {/* TEMPORARY: Palm scanning disabled
                        <Link to="/palm-analysis">
                          <Button className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]">
                            <Hand className="h-3.5 w-3.5 mr-1.5" />
                            {hasEnoughReadingData ? tr.dashboard.startAnotherReading : tr.dashboard.startFirstReading}
                          </Button>
                        </Link>
                        */}
                        <Link to="/numerology">
                          <Button className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]">
                            <Calculator className="h-3.5 w-3.5 mr-1.5" />
                            {hasEnoughReadingData ? tr.dashboard.startAnotherReading : tr.dashboard.startFirstReading}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                    
                    {/* Priority Upgrade Ad Section - Show when user doesn't have enough data */}
                    {shouldShowUpgradeMessage && (
                      <Card className="glass-card border-amber-500/50 hover:border-amber-400/70 transition-all duration-300 rounded-2xl bg-gradient-to-br from-amber-900/20 to-orange-950/20">
                        <CardContent className="p-6 text-center">
                          <div className="p-3 bg-gradient-to-br from-amber-500/40 to-orange-500/40 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md shadow-amber-500/30">
                            <Bell className="h-8 w-8 text-amber-300" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">
                            {tr.dashboard.upgradeTitle}
                          </h3>
                          <p className="text-sm text-gray-300 mb-5 max-w-md mx-auto">
                            {!hasEnoughReadingData 
                              ? "Start your spiritual journey and get personalized predictions with your first reading."
                              : "Upgrade to Mystic Master for 6-month future predictions, personalized remedies, and advanced spiritual insights."}
                          </p>
                          {!hasEnoughReadingData ? (
                            <>
                              {/* TEMPORARY: Palm scanning disabled
                              <Link to="/palm-analysis">
                                <Button className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] w-full sm:w-auto">
                                  <Hand className="h-3.5 w-3.5 mr-1.5" />
                                  Start Your First Reading
                                </Button>
                              </Link>
                              */}
                              <Link to="/numerology">
                                <Button className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-lg shadow-orange-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] w-full sm:w-auto">
                                  <Calculator className="h-3.5 w-3.5 mr-1.5" />
                                  Start Your First Reading
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Link to="/pricing">
                              <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] w-full sm:w-auto">
                                <Crown className="h-3.5 w-3.5 mr-1.5" />
                                Upgrade Plan
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Standard Upgrade Section - Show for non-premium users with some readings */}
                {shouldShowUpgrade && !shouldShowUpgradeMessage && (
                  <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <div className="p-3 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md shadow-amber-500/20">
                        <Bell className="h-8 w-8 text-amber-300" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">
                      Want More Detailed Predictions?
                    </h3>
                      <p className="text-sm text-gray-300 mb-5 max-w-md mx-auto">
                        Upgrade to <span className="font-bold text-amber-300">Mystic Master</span> for 6-month future predictions,
                        personalized remedies, and advanced spiritual insights.
                      </p>
                      <Link to="/pricing">
                        <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] w-full sm:w-auto">
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      Upgrade Plan
                    </Button>
                      </Link>
                  </CardContent>
                </Card>
                )}
                
                {!shouldShowUpgrade && (
                  <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <div className="p-3 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md shadow-orange-500/20">
                        <Crown className="h-8 w-8 text-amber-300" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        Premium Member Benefits
                      </h3>
                      <p className="text-sm text-gray-300 mb-5 max-w-md mx-auto">
                        You're enjoying all premium features including extended predictions,
                        personalized remedies, and priority support.
                      </p>
                      <Badge className="bg-gradient-to-r from-orange-600 to-teal-600 text-white px-4 py-1.5 text-xs">
                        <Crown className="h-3.5 w-3.5 mr-1.5" />
                        {currentPlan} Member
                      </Badge>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
    </Layout>
  );
};

export default Dashboard;
