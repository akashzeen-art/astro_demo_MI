import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Hand,
  Heart,
  Brain,
  TrendingUp,
  Clock,
  Star,
  Download,
  Share2,
  Eye,
  CheckCircle,
  Calendar,
  Shield,
  FileText,
  Copy,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  downloadReport,
  shareReading,
  shareWithReport,
  copyToClipboard,
  ReadingData,
} from "@/lib/shareAndDownload";
import { useReadings } from "@/contexts/ReadingsContext";
import type { PalmAnalysisResult, PalmReading } from "@/lib/apiService";

const PalmResults = () => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { currentReading } = useReadings();

  const palmReading = currentReading as PalmReading | null;
  const palmAnalysis = useMemo<PalmAnalysisResult | null>(() => {
    if (!palmReading || !palmReading.results) return null;

    // Normalise numeric fields that may come back as 0–1 from the API
    const normalizePercent = (value: number | undefined): number =>
      value && value <= 1 ? Math.round(value * 100) : Math.round(value || 0);

    const result = palmReading.results;

    const defaultLine = { quality: "Unknown", score: 0, meaning: "", details: "" };
    const lines = result.lines || {};
    const normalizedLines = {
      lifeLine: { ...defaultLine, ...lines.lifeLine, score: normalizePercent(lines.lifeLine?.score) },
      heartLine: { ...defaultLine, ...lines.heartLine, score: normalizePercent(lines.heartLine?.score) },
      headLine: { ...defaultLine, ...lines.headLine, score: normalizePercent(lines.headLine?.score) },
      fateLine: { ...defaultLine, ...lines.fateLine, score: normalizePercent(lines.fateLine?.score) },
    };

    const normalizedTraits = (result.personality?.traits ?? []).map((trait) => ({
      ...trait,
      score: normalizePercent(trait.score),
    }));

    const normalizedPredictions = (result.predictions ?? []).map((p) => ({
      ...p,
      confidence: normalizePercent(p.confidence),
    }));

    const normalizedCompatibility = (result.compatibility ?? []).map((c) => ({
      ...c,
      match: normalizePercent(c.match),
    }));

    const accuracy = result.accuracy || {};
    const normalizedAccuracy = {
      lineDetection: normalizePercent(accuracy.lineDetection),
      patternAnalysis: normalizePercent(accuracy.patternAnalysis),
      interpretation: normalizePercent(accuracy.interpretation),
      overall: normalizePercent(accuracy.overall),
    };

    return {
      ...result,
      lines: normalizedLines,
      personality: {
        traits: normalizedTraits,
        dominantHand: result.personality?.dominantHand ?? "",
        palmShape: result.personality?.palmShape ?? "",
        fingerLength: result.personality?.fingerLength ?? "",
        handType: result.personality?.handType ?? "",
        handTypeAnalysis: result.personality?.handTypeAnalysis,
        mounts: result.personality?.mounts,
        thumbShape: result.personality?.thumbShape,
      },
      predictions: normalizedPredictions,
      compatibility: normalizedCompatibility,
      accuracy: normalizedAccuracy,
      specialMarks: result.specialMarks ?? [],
      overallScore:
        result.overallScore && result.overallScore <= 1
          ? Math.round(result.overallScore * 100)
          : Math.round(result.overallScore || 0),
    };
  }, [palmReading]);

  const getLineColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case "strong":
      case "clear":
        return "text-cosmic";
      case "curved":
      case "present":
        return "text-stellar";
      default:
        return "text-golden";
    }
  };

  // Prepare reading data for sharing/downloading
  const getReadingData = (): ReadingData => ({
    type: "palm",
    userInfo: {
      name: "Palm Reading User",
      date: new Date().toLocaleDateString(),
      email: undefined,
    },
    // Pass the full palm analysis result so the PDF can include
    // all sections: lines, personality, predictions, special marks,
    // compatibility, accuracy, and summary.
    results: palmAnalysis,
    overallScore: palmAnalysis?.overallScore ?? 0,
    timestamp: new Date().toISOString(),
  });

  // Handle PDF download
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const readingData = getReadingData();
      await downloadReport(readingData);

      toast({
        title: "Report Downloaded",
        description: "Your palm reading report has been saved to your device.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description:
          "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle sharing
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const readingData = getReadingData();
      await shareReading(readingData);

      toast({
        title: "Shared Successfully",
        description: "Your palm reading has been shared.",
      });
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description:
          "There was an error sharing your reading. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle sharing with PDF report
  const handleShareWithReport = async () => {
    setIsSharing(true);
    try {
      const readingData = getReadingData();
      await shareWithReport(readingData);

      toast({
        title: "Shared with Report",
        description: "Your palm reading report has been shared.",
      });
    } catch (error) {
      console.error("Share with report error:", error);
      // Fallback to regular sharing
      try {
        const readingData = getReadingData();
        await shareReading(readingData);
        toast({
          title: "Shared Successfully",
          description:
            "Your palm reading has been shared (without file attachment).",
        });
      } catch (fallbackError) {
        toast({
          title: "Share Failed",
          description:
            "There was an error sharing your reading. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const readingData = getReadingData();
      await copyToClipboard(readingData);

      toast({
        title: "Copied to Clipboard",
        description: "Your reading summary has been copied to clipboard.",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Copy Failed",
        description:
          "There was an error copying your reading. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!palmAnalysis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Card className="glass-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>
              No palm reading is available yet. Please upload a palm image and run
              an analysis first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 pt-10 space-y-8">
      {/* Overall Score – circular glowing indicator */}
      <Card className="glass-card sutra-glow overflow-hidden">
        <CardContent className="px-6 py-8 flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-gradient-to-tr from-orange-500 via-fuchsia-400 to-sky-400 p-[3px] shadow-[0_0_35px_rgba(168,85,247,0.8)] animate-pulse-slow">
              <div className="h-full w-full rounded-full bg-slate-950/80 flex items-center justify-center">
                <div className="text-center space-y-1">
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                {palmAnalysis.overallScore}%
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-orange-200/80">
                    Overall Score
                  </div>
                </div>
            </div>
          </div>
            <div className="pointer-events-none absolute inset-0 blur-3xl bg-orange-500/20" />
          </div>

          <Badge className="bg-stellar-gradient sutra-glow px-4 py-2 flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle className="h-4 w-4" />
            Analysis Complete
          </Badge>

          <p className="mt-4 max-w-xl text-center text-sm sm:text-base text-muted-foreground">
            {palmAnalysis.summary || 
              `Your palm has been analyzed using advanced AI vision. The overall score of ${palmAnalysis.overallScore}% is calculated from 
              line quality, personality traits, mount development, and special markings, providing a comprehensive assessment of your palm characteristics.`}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="lines" className="space-y-6">
        <TabsList className="glass-card w-full flex md:grid md:grid-cols-4 overflow-x-auto no-scrollbar gap-1 p-1">
          <TabsTrigger
            value="lines"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_rgba(167,139,250,0.7)] transition-all duration-300 rounded-full px-4 py-2 text-xs sm:text-sm"
          >
            Palm Lines
          </TabsTrigger>
          <TabsTrigger
            value="personality"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_rgba(167,139,250,0.7)] transition-all duration-300 rounded-full px-4 py-2 text-xs sm:text-sm"
          >
            Personality
          </TabsTrigger>
          <TabsTrigger
            value="predictions"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_rgba(167,139,250,0.7)] transition-all duration-300 rounded-full px-4 py-2 text-xs sm:text-sm"
          >
            Predictions
          </TabsTrigger>
          <TabsTrigger
            value="special"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_rgba(167,139,250,0.7)] transition-all duration-300 rounded-full px-4 py-2 text-xs sm:text-sm"
          >
            Special Marks
          </TabsTrigger>
        </TabsList>

        {/* Palm Lines Tab */}
        <TabsContent value="lines" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(palmAnalysis.lines)
              .filter(([, line]) => {
                const quality = line.quality?.toLowerCase?.() ?? "";
                const details = (line.details || "").toLowerCase();
                const meaning = (line.meaning || "").toLowerCase();

                // 1) If the line is explicitly marked as absent with a 0 score and a
                //    "not visible" style details message, hide it from the UI.
                if (quality === "absent") return false;
                if (line.score === 0 && details.includes("not visible")) return false;

                // 2) Generic safeguard: if score is 0 AND there is no meaningful
                //    interpretation AND all metrics look like N/A / 0%, treat it as
                //    "no usable information" and hide this line.
                const hasMeaning = meaning.trim().length > 0;
                const metricsAllNA =
                  details.includes("clarity=n/a") &&
                  details.includes("depth=n/a") &&
                  (details.includes("calculated score=0%") ||
                    details.includes("calculated score=0 %"));

                if (line.score === 0 && !hasMeaning && metricsAllNA) {
                  return false;
                }

                return true;
              })
              .map(([lineKey, line]) => (
              <Card
                key={lineKey}
                className="glass-card hover:sutra-glow transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">
                      {lineKey.replace("Line", " Line")}
                    </span>
                    <Badge
                      variant="outline"
                      className={`border-cosmic/50 bg-cosmic/10 ${getLineColor(line.quality)}`}
                    >
                      {line.quality}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Quality Score:
                      </span>
                      <span className="font-medium">{line.score}%</span>
                    </div>
                    <Progress
                      value={line.score}
                      className="h-2 rounded-full bg-slate-900/60 overflow-hidden transition-all duration-700 ease-out"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-cosmic mb-2">
                      {line.meaning}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {line.details}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-cosmic" />
                  Personality Traits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {palmAnalysis.personality.traits.map((trait, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{trait.name}</span>
                      <span className="text-cosmic font-bold">
                        {trait.score}%
                      </span>
                    </div>
                    <Progress
                      value={trait.score}
                      className="h-2 rounded-full bg-slate-900/60 overflow-hidden transition-all duration-700 ease-out"
                    />
                    <p className="text-xs text-muted-foreground">
                      {trait.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5 text-cosmic" />
                  Physical Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Dominant Hand:
                    </span>
                    <span className="font-medium">
                      {palmAnalysis.personality.dominantHand}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Palm Shape:</span>
                    <span className="font-medium">
                      {palmAnalysis.personality.palmShape}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Finger Length:
                    </span>
                    <span className="font-medium">
                      {palmAnalysis.personality.fingerLength}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hand Type:</span>
                    <span className="font-medium">
                      {palmAnalysis.personality.handType}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-cosmic/10 rounded-lg">
                  <h4 className="font-medium text-cosmic mb-2">
                    Hand Type Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {palmAnalysis.personality.handTypeAnalysis || palmAnalysis.summary || "Analysis of your hand type characteristics and overall palm reading insights."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compatibility */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-cosmic" />
                Compatibility with Other Hand Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              {palmAnalysis.compatibility && palmAnalysis.compatibility.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {palmAnalysis.compatibility.map((compat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-cosmic/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-base">{compat.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {compat.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold cosmic-text">
                          {compat.match}%
                        </p>
                        <Progress
                          value={compat.match}
                          className="h-1 w-16 mt-1 rounded-full bg-slate-900/60 overflow-hidden transition-all duration-700 ease-out"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Compatibility analysis will be available after your palm reading is complete.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {palmAnalysis.predictions.map((prediction, index) => (
              <Card
                key={index}
                className="glass-card hover:sutra-glow transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cosmic/20 rounded-full">
                      {prediction.area === "Career" && (
                        <TrendingUp className="h-6 w-6 text-cosmic" />
                      )}
                      {prediction.area === "Relationships" && (
                        <Heart className="h-6 w-6 text-cosmic" />
                      )}
                      {prediction.area === "Health" && (
                        <Shield className="h-6 w-6 text-cosmic" />
                      )}
                      {prediction.area === "Finances" && (
                        <Star className="h-6 w-6 text-cosmic" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{prediction.area}</h3>
                      <p className="text-sm text-muted-foreground">
                        {prediction.timeframe}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-cosmic mb-1">
                        Prediction:
                      </p>
                      <p className="text-sm">{prediction.prediction}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-stellar mb-1">
                        Advice:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {prediction.advice}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Confidence:
                        </span>
                        <span className="font-medium text-cosmic">
                          {prediction.confidence}%
                        </span>
                      </div>
                      <Progress
                        value={prediction.confidence}
                        className="h-2 rounded-full bg-slate-900/60 overflow-hidden transition-all duration-700 ease-out"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Special Marks Tab */}
        <TabsContent value="special" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-cosmic" />
                Special Marks & Symbols
              </CardTitle>
            </CardHeader>
            <CardContent>
              {palmAnalysis.specialMarks && palmAnalysis.specialMarks.length > 0 ? (
                <div className="space-y-4">
                  {palmAnalysis.specialMarks.map((mark, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-cosmic/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-base">{mark.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mark.location || "On palm"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {mark.meaning}
                        </p>
                      </div>
                      <Badge
                        variant={
                          mark.significance === "High" ? "default" : "outline"
                        }
                        className={
                          mark.significance === "High"
                            ? "bg-cosmic/20 text-cosmic border-cosmic/30 ml-4"
                            : mark.significance === "Medium"
                              ? "border-stellar/50 text-stellar bg-stellar/10 ml-4"
                              : "border-golden/50 text-golden bg-golden/10 ml-4"
                        }
                      >
                        {mark.significance} Impact
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No special marks detected on this palm. This indicates a clear, unmarked palm with straightforward life patterns.
                  </p>
                </div>
              )}

              {palmAnalysis.specialMarks.length > 0 && (
              <div className="mt-6 p-4 bg-stellar/10 rounded-lg">
                <h4 className="font-medium text-stellar mb-2">
                  Symbol Interpretation
                </h4>
                <p className="text-sm text-muted-foreground">
                    {palmAnalysis.specialMarks
                      .map(
                        (m) =>
                          `${m.name} (${m.location}) – ${m.significance} impact.`
                      )
                      .join(" ")}
                </p>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {/* Download PDF Report */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-[0_0_18px_rgba(129,140,248,0.6)] hover:shadow-[0_0_26px_rgba(129,140,248,0.9)] rounded-xl px-5"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>

          {/* Share Reading */}
          <Button
            onClick={handleShare}
            disabled={isSharing}
            variant="outline"
            className="border-amber-300/70 text-orange-200 hover:bg-orange-500/10 rounded-xl shadow-[0_0_12px_rgba(167,139,250,0.35)] hover:shadow-[0_0_20px_rgba(167,139,250,0.6)]"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            {isSharing ? "Sharing..." : "Share"}
          </Button>

          {/* Share with Report */}
          <Button
            onClick={handleShareWithReport}
            disabled={isSharing}
            variant="outline"
            className="border-teal-300/70 text-blue-200 hover:bg-teal-500/10 rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.35)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isSharing ? "Sharing..." : "Share Report"}
          </Button>

          {/* Copy to Clipboard */}
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="border-gray-400/60 text-gray-100 hover:bg-gray-500/10 rounded-xl shadow-[0_0_12px_rgba(148,163,184,0.25)] hover:shadow-[0_0_18px_rgba(148,163,184,0.45)]"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Summary
          </Button>
          </div>
        </div>

        {/* Save to Dashboard */}
        <div className="flex justify-center">
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="border-amber-300/80 text-orange-200 hover:bg-orange-500/10 px-8 rounded-xl shadow-[0_0_14px_rgba(167,139,250,0.4)] hover:shadow-[0_0_22px_rgba(167,139,250,0.7)]"
            >
              <Eye className="h-4 w-4 mr-2" />
              Save to Dashboard
            </Button>
          </Link>
        </div>

        {/* Button tooltips / helper text */}
        <div className="text-center text-xs sm:text-sm text-gray-300 max-w-xl mx-auto space-y-1">
          <p>
            <strong>Download PDF:</strong> Get a detailed palm reading report.
          </p>
          <p>
            <strong>Share:</strong> Share your results on social media or chat.
          </p>
          <p>
            <strong>Share Report:</strong> Include the full PDF file when supported.
          </p>
          <p>
            <strong>Copy Summary:</strong> Copy a concise text summary of your reading.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PalmResults;
