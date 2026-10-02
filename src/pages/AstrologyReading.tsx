import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Heart,
  TrendingUp,
  Brain,
  Shield,
  Eye,
  CheckCircle,
  Share2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS, FEATURES } from "@/lib/config";
import { getMockAstrologyBackendResult } from "@/lib/mockAstrology";
import { generateAstrologyWithOpenAI, isOpenAIConfigured } from "@/lib/openaiService";
import { loadBirthProfile } from "@/services/userProfileApi";
const AstrologyReading = () => {
  // Authentication removed
  const { language, tr } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [birthData, setBirthData] = useState(() => {
    const profile = loadBirthProfile();
    return {
      name: profile?.fullName || "",
      birthDate: profile?.birthDate || "",
      birthTime: profile?.birthTime || "",
      birthPlace: profile?.birthPlace || "",
      gender: profile?.gender || "",
      questions: "",
    };
  });

  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const [astrologyResults, setAstrologyResults] = useState<{
    sunSign: string;
    moonSign: string;
    risingSign: string;
    planetaryPositions: { planet: string; sign: string; house: string; aspect: string }[];
    personalityTraits: { trait: string; score: number; description: string }[];
    strengths: { item: string; score: number; description: string }[];
    challenges: { item: string; score: number; description: string }[];
    lifePredictions: { area: string; timeframe: string; prediction: string; confidence: number }[];
    compatibility: { sign: string; match: number; type: string }[];
    personalitySummary: string;
    modelVersion: string;
    overview?: { summary: string; key_themes: string[]; confidence: number } | null;
    keyThemes?: string[];
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setBirthData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (id: string) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");

  const refreshAccessToken = async (): Promise<string> => {
    try {
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Refresh failed: ${response.statusText}`);
      }

      const accessToken: string = data.data.access_token;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      return accessToken;
    } catch (error) {
      console.error("🚨 Refresh token API call failed:", error);
      throw error;
    }
  };

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    const getAuthHeaders = () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers as HeadersInit),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return headers;
    };

    let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let response = await fetch(url, {
      ...options,
      headers: getAuthHeaders(),
      credentials: "include",
    });

    // If unauthorized, try to refresh the access token once
    if (response.status === 401) {
      try {
        token = await refreshAccessToken();
        response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers as HeadersInit),
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
      } catch (refreshError) {
        console.warn("🚨 Token refresh failed:", refreshError);
        throw new Error("Not authenticated. Please log in again.");
      }
    }

    return response;
  };

  // Authentication removed - no login check needed

  const handleNext = async () => {
    setError(null);
    try {
      if (FEATURES.MOCK_API) {
        if (currentStep === 1) {
          if (!birthData.name.trim() || !birthData.gender) {
            setError("Please enter your full name and select a gender.");
            return;
          }
          setSessionId(`mock_session_${Date.now()}`);
          setCurrentStep(2);
          return;
        }
        if (currentStep === 2) {
          if (!birthData.birthDate) {
            setError("Please enter your birth date.");
            return;
          }
          setCurrentStep(3);
          return;
        }
        if (currentStep === 3) {
          await generateReading();
        }
        return;
      }

      if (currentStep === 1) {
        if (!birthData.name.trim() || !birthData.gender) {
          setError("Please enter your full name and select a gender.");
          return;
        }
        const resp = await makeAuthenticatedRequest(
          `${baseUrl}/astrology/personal-info/`,
          {
            method: "POST",
            body: JSON.stringify({
              full_name: birthData.name.trim(),
              gender: birthData.gender,
              consent_to_store: true,
            }),
          },
        );
        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          throw new Error(data?.detail || "Failed to start astrology session.");
        }
        const data = await resp.json();
        setSessionId(data.session_id);
        setCurrentStep(2);
        return;
      }

      if (currentStep === 2) {
        if (!sessionId) {
          setError("Session not initialized. Please complete step 1 again.");
          return;
        }
        const body: any = { session_id: sessionId };
        if (birthData.birthDate) body.birth_date = birthData.birthDate;
        if (birthData.birthTime) body.birth_time = birthData.birthTime;
        if (birthData.birthPlace) body.birth_place = birthData.birthPlace;

        const resp = await makeAuthenticatedRequest(
          `${baseUrl}/astrology/birth-details/`,
          {
            method: "PATCH",
            body: JSON.stringify(body),
          },
        );
        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          throw new Error(data?.detail || "Failed to save birth details.");
        }
        setCurrentStep(3);
        return;
      }

      if (currentStep === 3) {
        await generateReading();
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
  };

  const pollForResult = async (statusUrl: string, resultUrl: string) => {
    const maxAttempts = 30;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const statusResp = await fetch(statusUrl);
      const statusData = await statusResp.json();
      if (statusData.status === "COMPLETED") break;
      if (statusData.status === "FAILED") {
        throw new Error("Astrology reading failed. Please try again later.");
      }
      attempts += 1;
      await new Promise((r) => setTimeout(r, 1500));
    }
    const resultResp = await fetch(resultUrl);
    if (!resultResp.ok) {
      throw new Error("Could not fetch astrology result.");
    }
    const data = await resultResp.json();
    return data.result;
  };

  const generateReading = async () => {
    if (!sessionId) {
      setError("Session not initialized. Please complete previous steps.");
      return;
    }
    setIsAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 300);

    try {
      let result: Record<string, any>;

      if (FEATURES.MOCK_API) {
        await new Promise((r) => setTimeout(r, 2200));
        result = isOpenAIConfigured()
          ? await generateAstrologyWithOpenAI(birthData, language, focusAreas)
          : getMockAstrologyBackendResult(birthData);
      } else {
      // Save preferences
      const preferencesPayload = {
        session_id: sessionId,
        preferences: {
          focus_areas: focusAreas,
          questions: birthData.questions || null,
        },
      };
      const prefResp = await makeAuthenticatedRequest(
        `${baseUrl}/astrology/preferences/`,
        {
          method: "PATCH",
          body: JSON.stringify(preferencesPayload),
        },
      );
      if (!prefResp.ok) {
        const data = await prefResp.json().catch(() => null);
        throw new Error(data?.detail || "Failed to save preferences.");
      }

      // Trigger generation
      const genResp = await makeAuthenticatedRequest(
        `${baseUrl}/astrology/generate-reading/`,
        {
          method: "POST",
          body: JSON.stringify({ session_id: sessionId, language }),
        },
      );
      if (!genResp.ok) {
        const data = await genResp.json().catch(() => null);
        throw new Error(data?.detail || "Failed to start astrology reading.");
      }
      const genData = await genResp.json();

      result = await pollForResult(genData.status_url, genData.result_url);
      }

      // Calculate compatibility scores based on sign elements
      const getCompatibility = (sunSign: string, moonSign: string, risingSign: string) => {
        const elements: Record<string, string> = {
          Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
          Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
          Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
        };
        const compatibleElements: Record<string, string[]> = {
          Fire: ["Fire", "Air"],
          Earth: ["Earth", "Water"],
          Air: ["Air", "Fire"],
          Water: ["Water", "Earth"],
        };
        const sunElement = elements[sunSign] || "Fire";
        const compatible = compatibleElements[sunElement] || [];
        const allSigns = Object.keys(elements);
        return allSigns
          .filter(sign => compatible.includes(elements[sign]))
          .slice(0, 6)
          .map(sign => ({
            sign,
            match: Math.floor(75 + Math.random() * 20), // 75-95% for compatible signs
            type: "High Compatibility",
          }));
      };

      // Map personality traits with individual scores
      const personalityTraits = (result.personality?.traits || []).map((trait: string, index: number) => {
        // Generate unique score for each trait (80-95% range with variation)
        const baseScore = Math.round((result.personality?.confidence ?? 0.85) * 100);
        const variation = Math.floor(Math.random() * 15) - 5; // -5 to +10 variation
        const score = Math.max(70, Math.min(100, baseScore + variation));
        
        // Create unique description for each trait based on the summary
        const summary = result.personality?.summary || "";
        const traitDescriptions: Record<string, string> = {
          "Detail-oriented": "You possess exceptional attention to detail and precision in everything you do.",
          "Nurturing": "You have a natural ability to care for and support others with genuine warmth.",
          "Diplomatic": "You excel at finding balance and harmony in relationships and situations.",
          "Intuitive": "You trust your inner wisdom and can sense things beyond the surface.",
          "Adaptable": "You easily adjust to new circumstances and embrace change with flexibility.",
          "Analytical": "You approach problems with logical thinking and systematic analysis.",
          "Creative": "You express yourself through innovative ideas and artistic pursuits.",
          "Ambitious": "You set high goals and work diligently to achieve your aspirations.",
          "Empathetic": "You deeply understand and share the feelings of others.",
          "Independent": "You value your freedom and prefer to make your own decisions.",
        };
        
        return {
          trait,
          score,
          description: traitDescriptions[trait] || `${trait}: ${summary}`,
        };
      });

      // Map strengths with individual scores
      const strengths = (result.strengths?.items || []).map((item: string, index: number) => {
        const baseScore = Math.round((result.strengths?.confidence ?? 0.85) * 100);
        const variation = Math.floor(Math.random() * 10);
        const score = Math.max(75, Math.min(100, baseScore + variation));
        return {
          item,
          score,
          description: result.strengths?.summary || `This is one of your key strengths.`,
        };
      });

      // Map challenges with individual scores
      const challenges = (result.challenges?.items || []).map((item: string, index: number) => {
        const baseScore = Math.round((result.challenges?.confidence ?? 0.75) * 100);
        const variation = Math.floor(Math.random() * 10);
        const score = Math.max(60, Math.min(90, baseScore + variation));
        return {
          item,
          score,
          description: result.challenges?.summary || `This is an area for growth.`,
        };
      });

      // Map backend result structure into UI-friendly structure
      // Handle new structure with overview, planetary_positions, life_predictions
      const planetaryPositions = result.planetary_positions && Array.isArray(result.planetary_positions) && result.planetary_positions.length > 0
        ? result.planetary_positions.map((pos: any) => ({
            planet: pos.planet || "Unknown",
            sign: pos.sign || "Unknown",
            house: pos.house || "Unknown House",
            aspect: pos.aspect || "",
          }))
        : [
            {
              planet: "Sun",
              sign: result.sun_sign || "Unknown",
              house: "1st House",
              aspect: "Your core identity and life force",
            },
            {
              planet: "Moon",
              sign: result.moon_sign || "Unknown",
              house: "4th House",
              aspect: "Your emotional world and instincts",
            },
            {
              planet: "Ascendant",
              sign: result.rising_sign || "Unknown",
              house: "1st House",
              aspect: "How you appear to others",
            },
          ];

      // Handle life_predictions array or fallback to individual fields
      const lifePredictions = result.life_predictions && Array.isArray(result.life_predictions) && result.life_predictions.length > 0
        ? result.life_predictions.map((pred: any) => ({
            area: pred.area || "General",
            timeframe: pred.timeframe || "Next 12 months",
            prediction: pred.prediction || "",
            confidence: Math.round((pred.confidence ?? 0.85) * 100),
          }))
        : [
      {
        area: "Career",
              timeframe: "Next 12 months",
              prediction: result.career_path?.text || "Your career path is evolving with new opportunities ahead.",
              confidence: Math.round((result.career_path?.confidence ?? 0.85) * 100),
            },
            {
              area: "Love & Relationships",
              timeframe: "Next 12 months",
              prediction: result.relationship_insights?.text || "Your relationships are deepening with meaningful connections.",
              confidence: Math.round((result.relationship_insights?.confidence ?? 0.88) * 100),
            },
            {
              area: "Spiritual Growth",
        timeframe: "Ongoing",
              prediction: result.spiritual_message?.text || "Your spiritual journey continues to unfold with wisdom and insight.",
              confidence: Math.round((result.spiritual_message?.confidence ?? 0.87) * 100),
            },
          ];

      // Use overview.summary if available, otherwise fallback to personality.summary
      const overviewSummary = result.overview?.summary || result.personality?.summary || "";

      const mapped = {
        sunSign: result.sun_sign || "Unknown",
        moonSign: result.moon_sign || "Unknown",
        risingSign: result.rising_sign || "Unknown",
        planetaryPositions,
        personalityTraits,
        strengths,
        challenges,
        lifePredictions,
        compatibility: getCompatibility(
          result.sun_sign || "Aries",
          result.moon_sign || "Aries",
          result.rising_sign || "Aries"
        ),
        personalitySummary: overviewSummary,
        modelVersion: result.model_version || "gpt-4o-mini-v1.0",
        overview: result.overview || null,
        keyThemes: result.overview?.key_themes || [],
      };

      setAstrologyResults(mapped);
      setProgress(100);
      setAnalysisComplete(true);

      // Automatically save reading to Dashboard
      try {
        const { apiService } = await import("@/lib/apiService");
        const accuracy = result.overview?.confidence 
          ? Math.round(result.overview.confidence * 100)
          : result.personality?.confidence 
          ? Math.round(result.personality.confidence * 100)
          : 85; // Default accuracy
        
        // Get latest palm reading for integration (if available)
        const palmReadingId = await apiService.getLatestPalmReadingId();
        
        await apiService.saveReading({
          reading_type: "astrology_reading",
          result: {
            ...result,
            session_id: sessionId,
            generated_at: new Date().toISOString(),
          },
          accuracy,
          source_id: `astrology-${sessionId}`,
          palm_reference_id: palmReadingId || undefined, // Link to palm reading if available
        });
        
        console.log("✅ Astrology reading saved to Dashboard", palmReadingId ? `(linked to palm reading ${palmReadingId})` : "");
        
        // Trigger Dashboard refresh event
        window.dispatchEvent(new CustomEvent("reading-saved", {
          detail: { reading_type: "astrology_reading" }
        }));
      } catch (error: any) {
        if (error?.message?.includes("Not authenticated")) {
          console.log("ℹ️ Please log in to save readings to your Dashboard");
    } else {
          console.warn("⚠️ Failed to save astrology reading to Dashboard:", error);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate astrology reading.");
    } finally {
          clearInterval(interval);
          setIsAnalyzing(false);
        }
  };

  const steps = [
    { number: 1, title: tr.astrology.steps.personalInfo, description: tr.astrology.steps.personalInfoDesc },
    { number: 2, title: tr.astrology.steps.birthDetails, description: tr.astrology.steps.birthDetailsDesc },
    { number: 3, title: tr.astrology.steps.preferences, description: tr.astrology.steps.preferencesDesc },
  ];

  if (analysisComplete && astrologyResults) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="relative z-10">
          <Navbar />

          {/* Header */}
          <section className="pt-20 sm:pt-24 pb-6 sm:pb-8 relative overflow-hidden">
            <div className="container mx-auto px-3 sm:px-4 relative z-10">
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-cosmic/50 text-cosmic bg-cosmic/10"
                >
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {tr.astrology.readingComplete}
                </Badge>
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2"
                  style={{
                    fontFamily: `'Playfair Display', 'DM Serif Display', 'Cinzel', serif`,
                    color: '#fff',
                    textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    letterSpacing: '0.01em',
                    lineHeight: 1.1,
                  }}
                >
                  Your{' '}
                  <span style={{background: 'linear-gradient(90deg,#a78bfa,#fbbf24,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{tr.astrology.cosmicBlueprint}</span>
                </h1>
                <p
                  className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-4 sm:mb-6 px-2"
                  style={{
                    fontFamily: `'Merriweather', 'Georgia', serif`,
                    color: '#e0e0e0',
                    textShadow: '0 1px 8px rgba(0,0,0,0.18)',
                    fontWeight: 400,
                    lineHeight: 1.3,
                  }}
                >
                  {tr.astrology.cosmicBlueprintSubtitle}
                </p>
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="pb-12 sm:pb-20">
            <div className="container mx-auto px-3 sm:px-4">
              <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-4 glass-card p-0.5 sm:p-1 rounded-lg sm:rounded-xl overflow-x-auto">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation">{tr.astrology.overview}</TabsTrigger>
                  <TabsTrigger value="personality" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation">{tr.astrology.personality}</TabsTrigger>
                  <TabsTrigger value="predictions" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation">{tr.astrology.predictions}</TabsTrigger>
                  <TabsTrigger value="compatibility" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation">{tr.astrology.compatibility}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                  {astrologyResults.personalitySummary && (
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-cosmic" />
                          {tr.astrology.cosmicSummary}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {astrologyResults.personalitySummary}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    <Card className="glass-card stellar-glow hover:scale-105 transition-transform">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <Sun className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-golden mx-auto mb-3 sm:mb-4 animate-glow" />
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">{tr.astrology.sunSign}</h3>
                        <p className="text-xl sm:text-2xl cosmic-text font-bold">
                          {astrologyResults.sunSign}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                          {tr.astrology.sunSignDesc}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card stellar-glow hover:scale-105 transition-transform">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <Moon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-stellar mx-auto mb-3 sm:mb-4 animate-glow" />
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">{tr.astrology.moonSign}</h3>
                        <p className="text-xl sm:text-2xl cosmic-text font-bold">
                          {astrologyResults.moonSign}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                          {tr.astrology.moonSignDesc}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card stellar-glow hover:scale-105 transition-transform">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <Globe className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-cosmic mx-auto mb-3 sm:mb-4 animate-glow" />
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">{tr.astrology.risingSign}</h3>
                        <p className="text-xl sm:text-2xl cosmic-text font-bold">
                          {astrologyResults.risingSign}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                          {tr.astrology.risingSignDesc}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle
                        className="text-lg sm:text-xl md:text-2xl font-bold mb-2 flex items-center gap-2"
                        style={{
                          fontFamily: `'Playfair Display', 'DM Serif Display', 'Cinzel', serif`,
                          color: '#fff',
                          textShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        }}
                      >
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" /> {tr.astrology.planetaryPositions}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 sm:space-y-4">
                        {astrologyResults.planetaryPositions.map(
                          (planet, index) => (
                            <div
                              key={index}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border/50 hover:border-cosmic/50 transition-colors gap-2 sm:gap-0"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-sm sm:text-base md:text-lg">
                                  {planet.planet} in {planet.sign}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                                  {planet.house}
                                </p>
                              </div>
                              <p className="text-xs sm:text-sm text-cosmic sm:text-right max-w-xs">
                                {planet.aspect}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {astrologyResults.modelVersion && (
                    <Card className="glass-card">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Analysis generated using model version {astrologyResults.modelVersion}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Personality Tab */}
                <TabsContent value="personality" className="space-y-4 sm:space-y-6">
                  {astrologyResults.personalitySummary && (
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Star className="h-4 w-4 text-cosmic" />
                          {tr.astrology.overview}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">
                          {astrologyResults.personalitySummary}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="h-4 w-4 text-cosmic" />
                        {tr.astrology.personalityTraits}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {astrologyResults.personalityTraits.length > 0 ? (
                        astrologyResults.personalityTraits.map(
                        (trait, index) => (
                          <div key={index} className="space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-sm sm:text-base md:text-lg">{trait.trait}</span>
                                <span className="text-cosmic font-bold text-sm sm:text-base md:text-lg">
                                {trait.score}%
                              </span>
                            </div>
                            <Progress value={trait.score} className="h-2 sm:h-3" />
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {trait.description}
                            </p>
                          </div>
                        ),
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">No personality traits available.</p>
                      )}
                    </CardContent>
                  </Card>

                  {astrologyResults.strengths.length > 0 && (
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Shield className="h-4 w-4 text-green-400" />
                          {tr.astrology.strengths}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        {astrologyResults.strengths.map((strength, index) => (
                          <div key={index} className="space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm sm:text-base md:text-lg">{strength.item}</span>
                              <span className="text-green-400 font-bold text-sm sm:text-base md:text-lg">
                                {strength.score}%
                              </span>
                            </div>
                            <Progress value={strength.score} className="h-2 sm:h-3" />
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {strength.description}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {astrologyResults.challenges.length > 0 && (
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Eye className="h-4 w-4 text-yellow-400" />
                          {tr.astrology.areasForGrowth}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        {astrologyResults.challenges.map((challenge, index) => (
                          <div key={index} className="space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm sm:text-base md:text-lg">{challenge.item}</span>
                              <span className="text-yellow-400 font-bold text-sm sm:text-base md:text-lg">
                                {challenge.score}%
                              </span>
                            </div>
                            <Progress value={challenge.score} className="h-2 sm:h-3" />
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {challenge.description}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Predictions Tab */}
                <TabsContent value="predictions" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {astrologyResults.lifePredictions.map(
                      (prediction, index) => (
                        <Card
                          key={index}
                          className="glass-card hover:stellar-glow transition-transform duration-200"
                        >
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className="p-2 sm:p-3 bg-cosmic/20 rounded-full flex-shrink-0">
                                {prediction.area === "Career" && (
                                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-cosmic" />
                                )}
                                {prediction.area === "Love" && (
                                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-cosmic" />
                                )}
                                {prediction.area === "Health" && (
                                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-cosmic" />
                                )}
                                {prediction.area === "Finance" && (
                                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-cosmic" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm sm:text-base">
                                  {prediction.area}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {prediction.timeframe}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                              {prediction.prediction}
                            </p>
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">
                                      {tr.astrology.confidence}:
                                </span>
                                <span className="font-medium text-cosmic">
                                  {prediction.confidence}%
                                </span>
                              </div>
                              <Progress
                                value={prediction.confidence}
                                className="h-1.5 sm:h-2"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </div>
                </TabsContent>

                {/* Compatibility Tab */}
                <TabsContent value="compatibility" className="space-y-4 sm:space-y-6">
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Heart className="h-4 w-4 text-cosmic" />
                        {tr.astrology.loveCompatibility}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                        Based on your Sun Sign ({astrologyResults.sunSign}), {tr.astrology.loveCompatibilityDesc}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {astrologyResults.compatibility.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {astrologyResults.compatibility.map((match, index) => (
                          <div
                            key={index}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border/50 hover:border-cosmic/50 transition-colors gap-2 sm:gap-0"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cosmic/20 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-cosmic" />
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm sm:text-base md:text-lg">{match.sign}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {match.type}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-lg sm:text-xl font-bold cosmic-text">
                                {match.match}%
                              </p>
                              <Progress
                                value={match.match}
                                  className="h-1.5 sm:h-2 w-full sm:w-24 mt-1"
                              />
                            </div>
                          </div>
                        ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                          Compatibility data will be calculated based on your birth chart.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-4 w-4 text-cosmic" />
                        {tr.astrology.cosmicTriad}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 rounded-lg border border-border/50">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">{tr.astrology.sunSign}</p>
                          <p className="text-lg sm:text-xl font-bold cosmic-text">{astrologyResults.sunSign}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{tr.astrology.coreIdentity}</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg border border-border/50">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">{tr.astrology.moonSign}</p>
                          <p className="text-lg sm:text-xl font-bold cosmic-text">{astrologyResults.moonSign}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{tr.astrology.emotionalNature}</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg border border-border/50">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">{tr.astrology.risingSign}</p>
                          <p className="text-lg sm:text-xl font-bold cosmic-text">{astrologyResults.risingSign}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{tr.astrology.outwardPersona}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Enhanced Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center items-center mt-8 sm:mt-12 px-3 sm:px-0">
                <Button 
                  onClick={async () => {
                    if (!astrologyResults || !sessionId) return;
                    try {
                      const { apiService } = await import("@/lib/apiService");
                      const accuracy = astrologyResults.overview?.confidence 
                        ? Math.round(astrologyResults.overview.confidence * 100)
                        : 85;
                      
                      // Get latest palm reading for integration (if available)
                      const palmReadingId = await apiService.getLatestPalmReadingId();
                      
                      await apiService.saveReading({
                        reading_type: "astrology_reading",
                        result: {
                          sun_sign: astrologyResults.sunSign,
                          moon_sign: astrologyResults.moonSign,
                          rising_sign: astrologyResults.risingSign,
                          personality: { summary: astrologyResults.personalitySummary },
                          planetary_positions: astrologyResults.planetaryPositions,
                          life_predictions: astrologyResults.lifePredictions,
                          session_id: sessionId,
                          generated_at: new Date().toISOString(),
                        },
                        accuracy,
                        source_id: `astrology-${sessionId}`,
                        palm_reference_id: palmReadingId || undefined, // Link to palm reading if available
                      });
                      
                      window.dispatchEvent(new CustomEvent("reading-saved", {
                        detail: { reading_type: "astrology_reading" }
                      }));
                      
                      // Show success message
                      alert("Reading saved to Dashboard successfully!");
                    } catch (error: any) {
                      console.error("Failed to save reading:", error);
                      alert("Failed to save reading. Please try again.");
                    }
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium transition-all hover:scale-[1.02] touch-manipulation"
                  size="sm"
                >
                  <Star className="h-4 w-4 mr-1.5 sm:mr-2" />
                  {tr.astrology.saveReading}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-purple-400/50 text-purple-300 hover:bg-purple-500/20 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium transition-all hover:scale-[1.02] touch-manipulation"
                >
                  <Share2 className="h-4 w-4 mr-1.5 sm:mr-2" />
                  {tr.astrology.shareResults}
                </Button>
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-blue-400/50 text-blue-300 hover:bg-blue-500/20 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium transition-all hover:scale-[1.02] touch-manipulation"
                  >
                    <Eye className="h-4 w-4 mr-1.5 sm:mr-2" />
                    {tr.astrology.viewDashboard}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="relative z-10">
        <Navbar />

        {/* Back Button on Left Side */}
        <div className="container mx-auto px-4 pt-20 pb-4">
          <Link to="/">
            <Button
              variant="outline"
              className="border-purple-400/50 text-purple-300 hover:bg-purple-500/10 bg-white/10 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              {tr.astrology.backHome}
            </Button>
              </Link>
        </div>

        {/* Enhanced Header */}
        <section className="pt-8 pb-12 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-8">
              <Badge
                variant="outline"
                className="mb-4 px-4 py-2 text-sm border-purple-400/50 text-purple-400 bg-purple-500/20 backdrop-blur-sm"
              >
                <Star className="h-3.5 w-3.5 mr-1.5" />
                {tr.astrology.badge}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Your{' '}
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
                  {tr.astrology.titleHighlight}
                </span>
              </h1>
              <p className="text-sm text-gray-300 max-w-xl mx-auto">
                Get personalized astrological insights based on your birth chart and planetary alignments.
              </p>
              <style>{`
                @keyframes gradient-shift {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
              `}</style>
            </div>
          </div>
        </section>

        {/* Enhanced Progress indicator - Centered with blank background */}
        <section className="pb-6 sm:pb-8 bg-transparent">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="max-w-4xl mx-auto bg-transparent">
              <div className="flex items-center justify-center mb-6 sm:mb-8 bg-transparent overflow-x-auto">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center bg-transparent">
                    <div className="flex flex-col items-center bg-transparent">
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        currentStep >= step.number
                            ? "border-purple-400 bg-gradient-to-br from-purple-500/30 to-purple-600/30 text-white shadow-md shadow-purple-500/30"
                            : "border-white/20 bg-white/5 text-gray-400"
                      }`}
                    >
                      {currentStep > step.number ? (
                          <CheckCircle className="h-5 w-5 text-purple-300" />
                      ) : (
                          <span className="font-bold text-base">{step.number}</span>
                      )}
                    </div>
                      <div className="mt-2 text-center bg-transparent">
                        <p className="text-xs font-medium text-white">{step.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                        {step.description}
                      </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-12 sm:w-16 mx-2 sm:mx-3 transition-all duration-200 flex-shrink-0 ${
                          currentStep > step.number 
                            ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                            : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Form steps */}
        <section className="pb-12 sm:pb-20">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="glass-card border-purple-500/30 hover:border-purple-400/50 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/20 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-6">
                  {error && (
                    <p className="mb-4 text-sm text-red-400 text-center">
                      {error}
                    </p>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-5">
                      <div className="text-center mb-6">
                        <h2 className="text-lg font-bold mb-2 text-white">
                          {tr.astrology.personalInfo}
                        </h2>
                        <p className="text-sm text-gray-300">
                          {tr.astrology.personalInfoSubtitle}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label 
                            htmlFor="name"
                            className="text-sm font-medium text-white mb-1.5 block"
                          >
                            {tr.astrology.fullName}
                          </Label>
                          <Input
                            id="name"
                            value={birthData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            placeholder={tr.astrology.fullNamePlaceholder}
                            className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg text-sm"
                          />
                        </div>

                        <div>
                          <Label 
                            htmlFor="gender"
                            className="text-sm font-medium text-white mb-1.5 block"
                          >
                            {tr.astrology.gender}
                          </Label>
                          <Select
                            value={birthData.gender}
                            onValueChange={(value) =>
                              handleInputChange("gender", value)
                            }
                          >
                            <SelectTrigger className="bg-white/10 border-purple-400/30 text-white focus:border-purple-400 focus:ring-purple-400/50 rounded-lg text-sm">
                              <SelectValue placeholder={tr.astrology.genderPlaceholder} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-purple-400/30">
                              <SelectItem value="Male">{tr.astrology.male}</SelectItem>
                              <SelectItem value="Female">{tr.astrology.female}</SelectItem>
                              <SelectItem value="Non-Binary">{tr.astrology.nonBinary}</SelectItem>
                              <SelectItem value="Prefer not to say">{tr.astrology.preferNotSay}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <p className="text-xs text-gray-400 pt-1">
                          {tr.astrology.consentText}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-5">
                      <div className="text-center mb-6">
                        <h2 className="text-lg font-bold mb-2 text-white">
                          {tr.astrology.birthDetails}
                        </h2>
                        <p className="text-sm text-gray-300">
                          {tr.astrology.birthDetailsSubtitle}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="birthDate"
                            className="flex items-center gap-1.5 text-sm font-medium text-white mb-1.5"
                          >
                            <Calendar className="h-4 w-4 text-purple-300" />
                            {tr.astrology.birthDate}
                          </Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={birthData.birthDate}
                            onChange={(e) =>
                              handleInputChange("birthDate", e.target.value)
                            }
                            className="bg-white/10 border-purple-400/30 text-white focus:border-purple-400 focus:ring-purple-400/50 rounded-lg text-sm"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="birthTime"
                            className="flex items-center gap-1.5 text-sm font-medium text-white mb-1.5"
                          >
                            <Clock className="h-4 w-4 text-purple-300" />
                            {tr.astrology.birthTime}
                          </Label>
                          <Input
                            id="birthTime"
                            type="time"
                            value={birthData.birthTime}
                            onChange={(e) =>
                              handleInputChange("birthTime", e.target.value)
                            }
                            className="bg-white/10 border-purple-400/30 text-white focus:border-purple-400 focus:ring-purple-400/50 rounded-lg text-sm"
                          />
                          <p className="text-xs text-gray-400 mt-1.5">
                            {tr.astrology.birthTimeHint}
                          </p>
                        </div>

                        <div>
                          <Label
                            htmlFor="birthPlace"
                            className="flex items-center gap-1.5 text-sm font-medium text-white mb-1.5"
                          >
                            <MapPin className="h-4 w-4 text-purple-300" />
                            {tr.astrology.birthPlace}
                          </Label>
                          <Input
                            id="birthPlace"
                            value={birthData.birthPlace}
                            onChange={(e) =>
                              handleInputChange("birthPlace", e.target.value)
                            }
                            placeholder={tr.astrology.birthPlacePlaceholder}
                            className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-5">
                      <div className="text-center mb-6">
                        <h2 className="text-lg font-bold mb-2 text-white">
                          {tr.astrology.readingFocus}
                        </h2>
                        <p className="text-sm text-gray-300">
                          {tr.astrology.readingFocusSubtitle}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            id: "love",
                            label: tr.astrology.love,
                            icon: Heart,
                            color: "from-pink-500/30 to-rose-500/30",
                            borderColor: "border-pink-400/50",
                            iconColor: "text-pink-300",
                          },
                          {
                            id: "career",
                            label: tr.astrology.career,
                            icon: TrendingUp,
                            color: "from-green-500/30 to-emerald-500/30",
                            borderColor: "border-green-400/50",
                            iconColor: "text-green-300",
                          },
                          {
                            id: "health",
                            label: tr.astrology.health,
                            icon: Shield,
                            color: "from-blue-500/30 to-cyan-500/30",
                            borderColor: "border-blue-400/50",
                            iconColor: "text-blue-300",
                          },
                          {
                            id: "spiritual",
                            label: tr.astrology.spiritual,
                            icon: Eye,
                            color: "from-purple-500/30 to-indigo-500/30",
                            borderColor: "border-purple-400/50",
                            iconColor: "text-purple-300",
                          },
                        ].map((focus) => {
                          const Icon = focus.icon;
                          const isActive = focusAreas.includes(focus.id);
                          return (
                            <div
                              key={focus.id}
                              className={`group p-3 border rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
                                isActive
                                  ? `bg-gradient-to-br ${focus.color} ${focus.borderColor} shadow-md`
                                  : "bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-white/10"
                              }`}
                              onClick={() => toggleFocusArea(focus.id)}
                            >
                              <div className={`p-2 rounded-md bg-gradient-to-br ${focus.color} ${focus.borderColor} mb-2 group-hover:scale-110 transition-transform inline-flex`}>
                                <Icon className={`h-4 w-4 ${focus.iconColor}`} />
                              </div>
                              <p className="font-medium text-white text-xs leading-tight">
                                {focus.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <Label 
                          htmlFor="questions"
                          className="text-sm font-medium text-white mb-1.5 block"
                        >
                          {tr.astrology.specificQuestions}
                        </Label>
                        <Textarea
                          id="questions"
                          placeholder={tr.astrology.specificQuestionsPlaceholder}
                          rows={3}
                          value={birthData.questions}
                          onChange={(e) =>
                            handleInputChange("questions", e.target.value)
                          }
                          className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg text-sm resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="text-center space-y-5 py-6">
                      <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30 inline-flex">
                        <Sparkles className="h-10 w-10 text-purple-300 animate-spin" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold mb-2 text-white">
                          {tr.astrology.calculating}
                        </h2>
                        <p className="text-sm text-gray-300 mb-4">
                          {tr.astrology.calculatingSubtitle}
                        </p>
                        <div className="max-w-md mx-auto space-y-2">
                        <Progress
                          value={progress}
                            className="w-full h-2"
                        />
                          <p className="text-sm text-purple-300 font-medium">
                          {progress}% Complete
                        </p>
                      </div>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        {progress < 25 && (
                          <p className="animate-pulse">{tr.astrology.mappingCoords}</p>
                        )}
                        {progress >= 25 && progress < 50 && (
                          <p className="animate-pulse">{tr.astrology.calculatingAspects}</p>
                        )}
                        {progress >= 50 && progress < 75 && (
                          <p className="animate-pulse">{tr.astrology.analyzingHouses}</p>
                        )}
                        {progress >= 75 && (
                          <p className="animate-pulse">{tr.astrology.generatingInsights}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isAnalyzing && (
                    <div className="flex justify-between items-center gap-3 pt-6 border-t border-white/10">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setCurrentStep(Math.max(1, currentStep - 1))
                        }
                        disabled={currentStep === 1}
                        className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 bg-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                        {tr.astrology.previous}
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="bg-gradient-to-r from-purple-600 via-blue-600 to-amber-600 hover:from-purple-700 hover:via-blue-700 hover:to-amber-700 text-white shadow-lg shadow-purple-500/30 rounded-lg px-6 py-2 text-sm font-medium transition-all hover:scale-[1.02]"
                      >
                        {currentStep === 3 ? (
                            <>{tr.astrology.generateReading}</>
                        ) : (
                            <>{tr.astrology.next}</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AstrologyReading;
