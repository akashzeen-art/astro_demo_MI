/**
 * Performance optimization utilities
 * Throttle and debounce functions for better performance
 */

// Throttle function to limit how often a function can be called
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Debounce function to delay execution until after a period of inactivity
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Optimized requestAnimationFrame wrapper
export const requestAnimationFrameThrottle = (callback: () => void): (() => void) => {
  let rafId: number | null = null;
  let lastTime = 0;
  const fps = 30; // Limit to 30fps for better performance
  const frameInterval = 1000 / fps;

  return () => {
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed >= frameInterval) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        callback();
        lastTime = Date.now();
      });
    }
  };
};

