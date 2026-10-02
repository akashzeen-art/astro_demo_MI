import { BRAND } from "./brand";

/**
 * Every backend API is called directly on this domain (dev, preview and any
 * deployed host). cookstudio.live returns CORS headers for all origins.
 */
export const API_DOMAIN = "https://cookstudio.live";

const apiUrl = (path: string) => `${API_DOMAIN}${path}`;

export const API_CONFIG = {
  BASE_URL: apiUrl("/api/v1"),
  TIMEOUT: 120000,
  RETRY_ATTEMPTS: 3,
} as const;

export const APP_CONFIG = {
  NAME: BRAND.NAME,
  VERSION: "1.0.0",
  ENVIRONMENT: import.meta.env.MODE,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

export const FEATURES = {
  // Default ON — this app runs without Spring Boot. Set VITE_USE_MOCK_API=false to use a real backend.
  MOCK_API: import.meta.env.VITE_USE_MOCK_API !== "false",
  STANDALONE: import.meta.env.VITE_STANDALONE !== "false",
  OPENAI: true,
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  PAYMENTS:
    import.meta.env.VITE_ENABLE_PAYMENTS !== "false",
} as const;

export const PAYMENT_CONFIG = {
  BASE_URL: apiUrl("/api/payment"),
  DEFAULT_PORTAL_ID: "93",
} as const;

/** One-time Pandit Ji call packs (portal 1015) — minutes → price from API, never hardcode. */
export const CALL_PAYMENT_CONFIG = {
  BASE_URL: apiUrl("/api/payment"),
  PORTAL_ID: "1015",
} as const;

export const ASTRO_USER_CONFIG = {
  SAVE_USER_URL: apiUrl("/api/astro/saveuserdata"),
  GET_DATA_URL: apiUrl("/api/astro/getdata"),
  CALL_DATA_URL: apiUrl("/api/astro/call-data"),
  PANDIT_ALL_URL: apiUrl("/api/astro/pandit/all"),
  /** GET ?mobile= — single Pandit Ji profile for pandit dashboard */
  PANDIT_BY_MOBILE_URL: apiUrl("/api/astro/pandit"),
  /** GET ?mobile=&status=AVAILABLE|BUSY|BREAK */
  PANDIT_STATUS_URL: apiUrl("/api/astro/pandit/status"),
  /** GET ?agent=&customer= — leave queue before call joins */
  QUEUE_CANCEL_URL: apiUrl("/api/astro/queue/cancel"),
} as const;

/** Knowlarity bridge call — agent = Pandit Ji phone, customer = user mobile. */
export const KNOWLARITY_CONFIG = {
  MAKE_CALL_URL: apiUrl("/api/knowlarity/make-call"),
  CONFIG_ID: Number(import.meta.env.VITE_KNOWLARITY_CONFIG_ID || 1),
} as const;

/** STOMP over SockJS — Spring `/api/ws` with `.withSockJS()` */
export const PANDIT_WS_CONFIG = {
  SOCKJS_URL: apiUrl("/api/ws"),
  STATUS_TOPIC: "/topic/pandit/status",
  /** Backend: messagingTemplate.convertAndSend("/topic/call/status", { mobile, status }) */
  CALL_STATUS_TOPIC: "/topic/call/status",
  RECONNECT_MS: 8_000,
} as const;

function resolveOpenAIProxyUrl(): string {
  const fromEnv = import.meta.env.VITE_OPENAI_PROXY_URL?.trim();
  if (fromEnv) return fromEnv;

  if (import.meta.env.DEV) return "/openai-proxy.php";

  // Vercel serverless (api/openai/chat-completions.ts) or nginx proxy on same host
  return "/api/openai/chat-completions";
}

export const OPENAI_CONFIG = {
  get PROXY_URL() {
    return resolveOpenAIProxyUrl();
  },
  MODEL: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "myastrosutra_token",
  REFRESH_TOKEN: "myastrosutra_refresh_token",
  USER_DATA: "myastrosutra_user",
  SETTINGS: "myastrosutra_settings",
  SUBSCRIPTION: "myastrosutra_subscription",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup/",
    LOGIN: "/auth/login/",
    LOGOUT: "/auth/logout/",
    REFRESH: "/auth/refresh/",
    ME: "/auth/me/",
    CHANGE_PASSWORD: "/auth/password/change/",
    RESET_PASSWORD: "/auth/password/reset/",
    DASHBOARD: "/auth/dashboard/",
  },
  READINGS: {
    LIST: "/readings/list/",
    CREATE: "/readings/",
    DETAIL: (id: string) => `/readings/${id}/`,
    PALM_UPLOAD: "/readings/palm/upload/",
    PALM_ANALYZE: "/readings/palm/analyze/",
    PALM_ANALYZE_NEW: "/palm-reading/analyze/",
    ASTROLOGY_CREATE: "/readings/astrology/",
    SAVE_UNIFIED: "/readings/save/",
  },
  PREDICTIONS: { GET: "/predictions/get/" },
  DASHBOARD: { REALTIME: "/auth/dashboard/realtime/" },
  PLANS: { UPGRADE: "/auth/upgrade-plan/" },
  ASTROLOGY: {
    BIRTH_CHART: "/astrology/birth-chart/",
    COMPATIBILITY: "/astrology/compatibility/",
    DAILY_HOROSCOPE: "/astrology/daily-horoscope/",
  },
  NUMEROLOGY: {
    CREATE: "/numerology",
    STATUS: (id: string) => `/numerology/${id}/status`,
    RESULT: (id: string) => `/numerology/${id}/result`,
  },
  SUBSCRIPTIONS: {
    PLANS: "/subscriptions/plans/",
    SUBSCRIBE: "/subscriptions/subscribe/",
    CANCEL: "/subscriptions/cancel/",
    PAYMENT_METHODS: "/subscriptions/payment-methods/",
  },
  ANALYTICS: {
    USER_STATS: "/analytics/user-stats/",
    READINGS_HISTORY: "/analytics/readings-history/",
  },
} as const;

export default API_CONFIG;
