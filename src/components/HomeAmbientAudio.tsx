import { useEffect, useRef } from "react";
import { BRAND } from "@/lib/brand";
import { whenPreloaderReady } from "@/lib/scrollAnimations";

/** Plays Gayatri mantra on home after the preloader finishes. */
const HomeAmbientAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(BRAND.AUDIO_HOME_MANTRA);
    audio.volume = 0.1;
    audio.loop = true;
    audioRef.current = audio;

    const playMantra = async () => {
      try {
        await audio.play();
      } catch {
        const unlock = () => {
          audio.play().catch(() => {});
        };
        document.addEventListener("pointerdown", unlock, { once: true, capture: true });
        document.addEventListener("click", unlock, { once: true, capture: true });
      }
    };

    const removeListener = whenPreloaderReady(playMantra);

    return () => {
      removeListener();
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  return null;
};

export default HomeAmbientAudio;
