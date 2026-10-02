import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useReadings } from "@/contexts/ReadingsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Camera,
  FileImage,
  CheckCircle,
  AlertCircle,
  Hand,
  Sparkles,
  Zap,
  X,
  SwitchCamera,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { preparePalmImageForUpload, isIosDevice } from "@/lib/palmImageUtils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_FILE_MB = 10;

function isAcceptedImage(file: File): boolean {
  if (file.type.startsWith("image/") || ACCEPTED_TYPES.includes(file.type)) return true;
  if (/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return true;
  // iOS camera/gallery often omits MIME type
  return !file.type;
}

function isPhoneDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

const PalmUpload = () => {
  const { tr } = useLanguage();
  const isMobile = useIsMobile();
  const isPhone = isPhoneDevice();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const { startPalmAnalysis, isAnalyzing, progress } = useReadings();

  const applyFile = useCallback(async (file: File) => {
    if (!isAcceptedImage(file)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_MB}MB.`);
      return;
    }

    setError(null);
    setAnalysisComplete(false);
    setIsProcessingImage(true);

    try {
      const prepared = await preparePalmImageForUpload(file);
      setSelectedFile(prepared);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(prepared);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not process this photo.";
      setError(msg);
      setSelectedFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setIsProcessingImage(false);
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(uploadRef.current, { opacity: 0, scale: 0.96 });
      gsap.to(uploadRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
        delay: 0.15,
      });
    }, uploadRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (previewUrl && previewRef.current) {
      gsap.fromTo(
        previewRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
      );
    }
  }, [previewUrl]);

  useEffect(() => {
    if (isAnalyzing && progressRef.current) {
      gsap.fromTo(progressRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 });
    }
  }, [isAnalyzing]);

  const stopCamera = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setShowCamera(false);
    setCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const attachVideoStream = useCallback(
    (video: HTMLVideoElement | null) => {
      videoRef.current = video;
      if (!video) {
        setCameraReady(false);
        return;
      }
      if (!stream) return;

      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      const onReady = () => {
        video
          .play()
          .then(() => setCameraReady(true))
          .catch(() => {
            setError("Could not start camera preview.");
            stopCamera();
          });
      };

      video.onloadedmetadata = onReady;
      if (video.readyState >= 1) onReady();
    },
    [stream, stopCamera],
  );

  useEffect(() => {
    if (!showCamera || !stream || !videoRef.current) return;
    attachVideoStream(videoRef.current);
  }, [showCamera, stream, attachVideoStream]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) applyFile(file);
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent) => event.preventDefault();

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) applyFile(file);
  };

  /** Opens native phone camera app (best on iOS / Android) */
  const openNativeCamera = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setError(null);
    cameraInputRef.current?.click();
  };

  /** Desktop/Android: native camera app; iOS: in-browser camera (avoids HEIC issues) */
  const handleTakePhoto = (e?: React.MouseEvent) => {
    if (isIosDevice()) {
      startLiveCamera(e);
    } else if (isMobile || isPhone) {
      openNativeCamera(e);
    } else {
      startLiveCamera(e);
    }
  };

  const openGallery = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setError(null);
    galleryInputRef.current?.click();
  };

  const startLiveCamera = async (e?: React.MouseEvent, mode?: "environment" | "user") => {
    e?.stopPropagation();
    setError(null);
    setCameraReady(false);

    const cameraFacing = mode ?? facingMode;

    if (!navigator.mediaDevices?.getUserMedia) {
      openNativeCamera();
      return;
    }

    try {
      const useMobileCamera = isMobile || isPhone;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: useMobileCamera
          ? {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 960, max: 1080 },
            }
          : {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      });

      if (mode) setFacingMode(mode);
      else if (!useMobileCamera) setFacingMode("user");
      setShowCamera(true);
      setStream(mediaStream);
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Camera permission denied. Use “Take Photo” to open your phone camera instead.");
      } else {
        setError("Live camera unavailable. Opening your device camera…");
      }
      setTimeout(() => openNativeCamera(), 400);
    }
  };

  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    stopCamera();
    await new Promise((r) => setTimeout(r, 200));
    startLiveCamera(undefined, next);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `palm-${Date.now()}.jpg`, { type: "image/jpeg" });
        applyFile(file);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const showPalmResults = () => {
    window.dispatchEvent(new CustomEvent("showPalmResults"));
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;
    setError(null);
    setAnalysisComplete(false);
    try {
      const reading = await startPalmAnalysis(selectedFile);
      setAnalysisComplete(true);
      showPalmResults();
      if (!reading?.results) {
        setError("Analysis finished but results were empty. Please try another photo.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      let errorMessage = msg;
      if (msg.includes("Network") || msg.includes("Failed to fetch") || /load failed/i.test(msg)) {
        errorMessage = "Unable to connect to the server. Check your internet and try again.";
      } else if (msg.includes("Not authenticated")) {
        errorMessage = "Please log in to use this feature.";
      } else if (msg.includes("400")) {
        errorMessage = "Invalid image. Please upload a clear photo of your open palm.";
      }
      setError(errorMessage);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    setAnalysisComplete(false);
    stopCamera();
  };

  const mirrorPreview = facingMode === "user";

  const cameraView = showCamera && !previewUrl && (
    <div
      className={cn(
        "z-[70]",
        isMobile
          ? "fixed inset-0 flex flex-col bg-black"
          : "relative rounded-xl overflow-hidden",
      )}
    >
      <div
        className={cn(
          "relative flex-1 bg-black",
          isMobile ? "min-h-0" : "aspect-[4/3] w-full max-h-[min(70vh,520px)]",
        )}
      >
        <video
          ref={attachVideoStream}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            mirrorPreview && "scale-x-[-1]",
          )}
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-6 sm:p-10">
          <div className="relative flex h-[min(72%,420px)] w-[min(78%,280px)] items-center justify-center rounded-[2.5rem] border-2 border-dashed border-amber-400/45 bg-black/20 shadow-[inset_0_0_40px_hsl(43_96%_56%/0.08)]">
            <Hand className="h-24 w-24 text-amber-400/25 sm:h-32 sm:w-32" strokeWidth={1} />
          </div>
          <p className="mt-4 max-w-xs text-center text-xs font-medium text-amber-100/80 sm:text-sm">
            Fit your open palm inside the frame · fingers spread · good light
          </p>
        </div>

        {!cameraReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          </div>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={stopCamera}
            className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {(isIosDevice() || isPhone) && (
          <button
            type="button"
            onClick={flipCamera}
            className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
            aria-label="Switch camera"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "relative z-10 flex shrink-0 flex-col gap-3 p-4",
          isMobile ? "safe-area-bottom border-t border-white/10 bg-[hsl(14_28%_6%/0.95)]" : "pt-4",
        )}
      >
        <div className="flex gap-3">
          <Button
            onClick={capturePhoto}
            disabled={!cameraReady}
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-orange-500/30 touch-manipulation disabled:opacity-50"
          >
            <Camera className="mr-2 h-5 w-5" />
            Capture Palm
          </Button>
          {!isMobile && (
            <Button
              onClick={stopCamera}
              variant="outline"
              className="h-14 rounded-2xl border-red-400/40 text-red-300 touch-manipulation"
            >
              <X className="mr-2 h-5 w-5" />
              Cancel
            </Button>
          )}
        </div>
        {!isMobile && (
          <p className="text-center text-xs text-orange-200/50">
            Position your palm in frame · keep it flat · avoid shadows
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div ref={uploadRef} className="space-y-4 sm:space-y-6">
      {/* Tips */}
      <Card className="glass-card border-orange-500/20">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-white sm:text-base">
            <Hand className="h-4 w-4 text-amber-400" />
            {tr.palm.howToTake}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: Camera, title: tr.palm.goodLighting, desc: tr.palm.goodLightingDesc, bg: "bg-orange-500/20", color: "text-amber-400" },
              { icon: Hand, title: tr.palm.openPalm, desc: tr.palm.openPalmDesc, bg: "bg-teal-500/20", color: "text-teal-400" },
              { icon: CheckCircle, title: tr.palm.clearFocus, desc: tr.palm.clearFocusDesc, bg: "bg-amber-500/20", color: "text-amber-400" },
            ].map(({ icon: Icon, title, desc, bg, color }) => (
              <div key={title} className="rounded-lg p-2 text-center sm:p-3">
                <div className={cn("mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10", bg)}>
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
                </div>
                <p className="text-xs font-medium text-white sm:text-sm">{title}</p>
                <p className="mt-0.5 text-xs leading-tight text-gray-400 sm:text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full-screen live camera (mobile) or inline (desktop) */}
      {isMobile ? (
        cameraView
      ) : (
        showCamera &&
        !previewUrl && (
          <Card className="glass-card border-orange-500/20 overflow-hidden">
            <CardContent className="p-4 sm:p-6">{cameraView}</CardContent>
          </Card>
        )
      )}

      {/* Upload picker */}
      {!previewUrl && !showCamera && (
        <Card className="glass-card border-orange-500/20">
          <CardContent className="p-4 sm:p-6">
            <div
              className="upload-area rounded-xl border-2 border-dashed border-amber-400/30 p-5 text-center transition-colors hover:border-amber-400/50 hover:bg-orange-500/5 sm:p-8"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10">
                <Hand className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="mb-1 font-display text-lg font-semibold text-amber-50 sm:text-xl">
                {isMobile ? "Scan Your Palm" : tr.palm.takePhotoTitle}
              </h3>
              <p className="mb-6 text-xs text-orange-200/55 sm:text-sm">
                {isMobile
                  ? "Take a photo with your phone camera or pick one from your gallery."
                  : tr.palm.takePhotoDesc}
              </p>

              <div className="mx-auto flex max-w-md flex-col gap-3">
                {/* Primary: native camera — best for phones */}
                <Button
                  onClick={handleTakePhoto}
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-base font-semibold text-white shadow-lg shadow-orange-500/25 touch-manipulation"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  {isMobile ? "Take Photo with Camera" : tr.palm.directCamera}
                </Button>

                <Button
                  onClick={openGallery}
                  variant="outline"
                  className="h-12 w-full rounded-xl border-teal-500/35 bg-teal-950/20 text-teal-200 touch-manipulation"
                  size="lg"
                >
                  <FileImage className="mr-2 h-5 w-5" />
                  {tr.palm.galleryUpload}
                </Button>

                {(isMobile || isPhone) && (
                  <button
                    type="button"
                    onClick={isIosDevice() ? openNativeCamera : startLiveCamera}
                    className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-orange-200/50 transition-colors hover:text-amber-300 touch-manipulation"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {isIosDevice() ? "Use iPhone camera app instead" : "Use in-browser live camera"}
                  </button>
                )}
              </div>

              {!isMobile && (
                <p className="mt-5 text-xs text-gray-500">Or drag and drop an image here</p>
              )}
            </div>

            {error && !showCamera && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300 sm:text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {(previewUrl || isProcessingImage) && (
        <Card className="glass-card border-orange-500/20">
          <CardContent className="p-4 sm:p-6">
            <div ref={previewRef} className="space-y-4">
              {isProcessingImage ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  <p className="text-sm text-amber-200/80">Preparing your photo…</p>
                </div>
              ) : previewUrl ? (
              <div className="relative mx-auto max-w-sm">
                <img
                  src={previewUrl}
                  alt="Palm preview"
                  className="w-full rounded-xl border border-amber-400/30 object-cover"
                  onError={() =>
                    setError("Could not display this photo. Please take a new picture.")
                  }
                />
                <Button
                  onClick={resetUpload}
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2 border-amber-400/30 bg-black/40 text-amber-200 backdrop-blur-sm touch-manipulation"
                >
                  Retake
                </Button>
              </div>
              ) : null}

              {isAnalyzing && (
                <div ref={progressRef} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>AI analyzing your palm…</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {analysisComplete && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Analysis complete!</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-teal-500 text-white touch-manipulation"
                    onClick={showPalmResults}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    View Your Reading
                  </Button>
                </div>
              )}

              {error && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <Button variant="outline" className="w-full touch-manipulation" onClick={resetUpload}>
                    Try Again
                  </Button>
                </div>
              )}

              {!isAnalyzing && !analysisComplete && !error && !isProcessingImage && previewUrl && (
                <Button
                  onClick={analyzeImage}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-teal-500 text-base font-semibold text-white touch-manipulation"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze My Palm
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden inputs — capture=environment opens rear camera on phones */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden
      />

      <Card className="glass-card border-emerald-500/20">
        <CardContent className="flex items-start gap-3 p-3 sm:p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-xs font-medium text-white sm:text-sm">{tr.palm.privacySecurity}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-400 sm:text-xs">
              {tr.palm.privacySecurityDesc}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PalmUpload;
