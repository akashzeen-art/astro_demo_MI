import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PRELOADER_EVENT = "app-preloader-complete";

declare global {
  interface Window {
    __preloaderComplete?: boolean;
  }
}

/** Re-measure scroll positions after preloader / layout shifts */
export function refreshScrollTriggers() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh(true);
  });
}

export function markPreloaderComplete() {
  window.__preloaderComplete = true;
}

export function isPreloaderComplete() {
  return window.__preloaderComplete === true;
}

export function onPreloaderComplete(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(PRELOADER_EVENT, handler);
  return () => window.removeEventListener(PRELOADER_EVENT, handler);
}

/** Run after splash screen — or immediately if it already finished */
export function whenPreloaderReady(callback: () => void) {
  if (isPreloaderComplete()) {
    callback();
    return () => {};
  }
  return onPreloaderComplete(callback);
}

export function notifyPreloaderComplete() {
  markPreloaderComplete();
  window.dispatchEvent(new CustomEvent(PRELOADER_EVENT));
  refreshScrollTriggers();
}
