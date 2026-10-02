import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { notifyPreloaderComplete } from "@/lib/scrollAnimations";
import { cn } from "@/lib/utils";

/** Blur ramps up over the final 2 seconds of the preloader video */
const VIDEO_BLUR_LEAD_SEC = 2;
const FADE_DURATION = 1_100;
const MAX_WAIT_MS = 15_000;
const MAX_BLUR_PX = 28;

type Phase = "playing" | "fade-out" | "hidden";

function stopPreloaderVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.muted = true;
  video.volume = 0;
}

const PRELOADER_SEEN_KEY = "myastrosutra_preloader_seen";

const LoadingOverlay: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      if (sessionStorage.getItem(PRELOADER_SEEN_KEY)) {
        queueMicrotask(() => notifyPreloaderComplete());
        return "hidden";
      }
    } catch {
      /* ignore */
    }
    return "playing";
  });
  const [blurProgress, setBlurProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const stopBlurLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const beginExit = useCallback(() => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    clearFallback();
    stopBlurLoop();
    setBlurProgress(1);
    stopPreloaderVideo(videoRef.current);
    notifyPreloaderComplete();
    try {
      sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setPhase("fade-out");
    window.setTimeout(() => setPhase("hidden"), FADE_DURATION);
  }, [clearFallback, stopBlurLoop]);

  const updateBlurFromVideo = useCallback((video: HTMLVideoElement) => {
    const { duration, currentTime } = video;
    if (!duration || !Number.isFinite(duration)) return;

    const remaining = duration - currentTime;
    if (remaining <= VIDEO_BLUR_LEAD_SEC) {
      const progress = 1 - remaining / VIDEO_BLUR_LEAD_SEC;
      setBlurProgress(Math.min(1, Math.max(0, progress)));
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scheduleFallback = () => {
      clearFallback();
      const durationMs =
        video.duration && Number.isFinite(video.duration)
          ? video.duration * 1000 + 400
          : MAX_WAIT_MS;
      fallbackTimerRef.current = window.setTimeout(beginExit, Math.min(durationMs, MAX_WAIT_MS));
    };

    const tick = () => {
      if (!exitedRef.current && videoRef.current) {
        updateBlurFromVideo(videoRef.current);
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onEnded = () => beginExit();
    const onLoadedMetadata = () => {
      scheduleFallback();
      rafRef.current = requestAnimationFrame(tick);
    };
    const onError = () => beginExit();

    video.volume = 1;
    video.muted = false;

    const playWithSound = async () => {
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
      } catch {
        video.muted = true;
        await video.play().catch(() => beginExit());
      }
    };

    const unlockSound = () => {
      if (!video || exitedRef.current) return;
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
    };

    playWithSound();

    video.addEventListener("ended", onEnded);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("error", onError);

    const events = ["pointerdown", "touchstart", "keydown", "click"] as const;
    events.forEach((event) => {
      document.addEventListener(event, unlockSound, { once: true, capture: true });
    });

    fallbackTimerRef.current = window.setTimeout(beginExit, MAX_WAIT_MS);

    return () => {
      clearFallback();
      stopBlurLoop();
      stopPreloaderVideo(video);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("error", onError);
      events.forEach((event) => {
        document.removeEventListener(event, unlockSound, { capture: true });
      });
    };
  }, [beginExit, clearFallback, stopBlurLoop, updateBlurFromVideo]);

  if (phase === "hidden") return null;

  const isFading = phase === "fade-out";
  const blurPx = blurProgress * MAX_BLUR_PX;
  const scale = 1 + blurProgress * 0.09;
  const brightness = 1 - blurProgress * 0.42;
  const veilOpacity = blurProgress * 0.52;
  const backdropBlurPx = blurProgress * 14;
  const vignetteOpacity = blurProgress * 0.85;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] overflow-hidden bg-black",
        isFading && "pointer-events-none",
      )}
      style={{
        opacity: isFading ? 0 : 1,
        transition: isFading
          ? `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
          : undefined,
      }}
      aria-hidden={isFading}
    >
      <video
        ref={videoRef}
        src={BRAND.VIDEO_PRELOADER}
        autoPlay
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover will-change-[filter,transform]"
        style={{
          filter: `blur(${blurPx}px) brightness(${brightness})`,
          transform: `scale(${scale})`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: `rgba(0,0,0,${veilOpacity})`,
          backdropFilter: `blur(${backdropBlurPx}px)`,
          WebkitBackdropFilter: `blur(${backdropBlurPx}px)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: vignetteOpacity,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {!isFading && (
        <button
          type="button"
          onClick={beginExit}
          className="absolute bottom-8 right-6 z-10 rounded-full border border-white/25 bg-black/45 px-5 py-2.5 text-sm font-semibold tracking-wide text-white/90 shadow-lg backdrop-blur-md transition hover:border-white/45 hover:bg-black/60 hover:text-white sm:bottom-10 sm:right-10"
        >
          Skip
        </button>
      )}
    </div>
  );
};

export default LoadingOverlay;
