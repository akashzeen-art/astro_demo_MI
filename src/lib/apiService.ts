import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS, FEATURES } from "./config";
import { getStoredReadings, saveStoredReading } from "./localStore";
import {
  analyzePalmWithOpenAI,
  generateAstrologyWithOpenAI,
  generateNumerologyWithOpenAI,
  isOpenAIConfigured,
} from "./openaiService";

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  phone_number?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  gender?: string;
  timezone: string;
  current_plan: string;
  subscription_status: string;
  subscription_start?: string;
  subscription_end?: string;
  total_readings: number;
  accuracy_score: number;
  favorite_reading_type?: string;
  member_since: string;
  email_notifications: boolean;
  daily_horoscope: boolean;
  marketing_emails: boolean;
  profile_visibility: string;
  is_premium: boolean;
  readings_this_month: number;
  date_joined: string;
  last_login?: string;
}

export interface Reading {
  id: string;
  user: string;
  type: "palm_analysis" | "astrology_reading" | "numerology";
  status: "pending" | "analyzing" | "completed" | "failed";
  accuracy: number;
  created_at: string;
  updated_at: string;
  results?: any;
}

export interface PalmAnalysisLine {
  quality: string;
  score: number; // 0–100
  meaning: string;
  details: string;
}

export interface PalmAnalysisTrait {
  name: string;
  score: number; // 0–100
  description: string;
}

export interface PalmAnalysisPrediction {
  area: string;
  timeframe: string;
  prediction: string;
  confidence: number; // 0–100
  advice?: string;
}

export type PalmAnalysisImpactLevel = "High" | "Medium" | "Low";

export interface PalmAnalysisSpecialMark {
  name: string;
  location?: string;
  meaning: string;
  significance: PalmAnalysisImpactLevel;
}

export interface PalmAnalysisCompatibility {
  type: string;
  match: number; // 0–100
  description: string;
}

export interface PalmAnalysisAccuracy {
  lineDetection: number;
  patternAnalysis: number;
  interpretation: number;
  overall: number;
}

export interface PalmAnalysisResult {
  overallScore: number;
  lines: {
    lifeLine: PalmAnalysisLine;
    heartLine: PalmAnalysisLine;
    headLine: PalmAnalysisLine;
    fateLine: PalmAnalysisLine;
  };
  personality: {
    traits: PalmAnalysisTrait[];
    dominantHand: string;
    palmShape: string;
    fingerLength: string;
    handType: string;
    thumbShape?: string;
    mounts?: {
      venus?: { development: string; meaning: string };
      jupiter?: { development: string; meaning: string };
      saturn?: { development: string; meaning: string };
      sun?: { development: string; meaning: string };
      mercury?: { development: string; meaning: string };
      mars?: { development: string; meaning: string };
      moon?: { development: string; meaning: string };
    };
    handTypeAnalysis?: string;
  };
  predictions: PalmAnalysisPrediction[];
  specialMarks: PalmAnalysisSpecialMark[];
  compatibility: PalmAnalysisCompatibility[];
  accuracy: PalmAnalysisAccuracy;
  summary: string;
  modelVersion: string;
}

export interface PalmReading extends Reading {
  type: "palm_analysis";
  image_url?: string;
  upload_id?: string;
  results?: PalmAnalysisResult;
}

export interface AstrologyReading extends Reading {
  type: "astrology_reading";
  birth_data: {
    date: string;
    time: string;
    place: string;
    timezone: string;
  };
  birth_chart?: any;
}

export interface NumerologyApiResult {
  lifePathNumber: number;
  destinyNumber: number;
  soulNumber: number;
  personalityNumber: number;
  luckyNumbers?: number[];
  interpretation?: string;
  personality?: string;
  strengths?: string[];
  challenges?: string[];
  compatibility?: string[];
  yearPrediction?: string;
  monthPrediction?: string;
  title?: string;
  career_path?: string;
  love_insights?: string;
  lucky_color?: string;
  element?: string;
  traits?: string[];
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_CONFIG.BASE_URL.replace(/\/$/, "");
  if (base.startsWith("http")) {
    const origin = new URL(base).origin;
    return `${origin}${path}`;
  }
  return path;
}

export interface DashboardPrediction {
  area: string;
  timeframe: string;
  prediction: string;
  confidence: number;
}

export interface DashboardData {
  recent_readings: Reading[];
  weekly_activity: Array<{
    day: string;
    readings: number;
    accuracy: number;
  }>;
  spiritual_progress: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  user_stats: {
    total_readings: number;
    readings_this_month: number;
    readings_this_week: number;
    average_accuracy: number;
    favorite_reading_type: string;
    member_since: string;
    subscription_days_left: number;
    last_reading_date: string;
    total_insights_generated: number;
  };
  upcoming_predictions?: DashboardPrediction[];
}

// Mock API Data - Always available as fallback
const MOCK_USER: User = {
  id: "user_123",
  email: "demo@palmastro.com",
  username: "demo_user",
  first_name: "Demo",
  last_name: "User",
  timezone: "UTC",
  current_plan: "stellar_seeker",
  subscription_status: "active",
  total_readings: 47,
  accuracy_score: 94.5,
  member_since: "2024-01-01T00:00:00Z",
  email_notifications: true,
  daily_horoscope: true,
  marketing_emails: false,
  profile_visibility: "private",
  is_premium: true,
  readings_this_month: 12,
  date_joined: "2024-01-01T00:00:00Z",
};

const MOCK_DASHBOARD_DATA: DashboardData = {
  recent_readings: [
    {
      id: "reading_1",
      user: "user_123",
      type: "palm_analysis",
      status: "completed",
      accuracy: 96,
      created_at: "2024-01-20T10:30:00Z",
      updated_at: "2024-01-20T10:35:00Z",
    },
    {
      id: "reading_2",
      user: "user_123",
      type: "astrology_reading",
      status: "completed",
      accuracy: 92,
      created_at: "2024-01-19T15:20:00Z",
      updated_at: "2024-01-19T15:25:00Z",
    },
  ],
  weekly_activity: [
    { day: "Mon", readings: 2, accuracy: 95 },
    { day: "Tue", readings: 1, accuracy: 98 },
    { day: "Wed", readings: 3, accuracy: 92 },
    { day: "Thu", readings: 1, accuracy: 89 },
    { day: "Fri", readings: 4, accuracy: 96 },
    { day: "Sat", readings: 2, accuracy: 94 },
    { day: "Sun", readings: 1, accuracy: 91 },
  ],
  spiritual_progress: [
    { name: "Self-Awareness", value: 85, color: "#8852E0" },
    { name: "Intuition", value: 78, color: "#7575F0" },
    { name: "Spiritual Growth", value: 92, color: "#D4AF37" },
    { name: "Inner Peace", value: 67, color: "#9F7AEA" },
  ],
  user_stats: {
    total_readings: 47,
    readings_this_month: 12,
    readings_this_week: 3,
    average_accuracy: 94.5,
    favorite_reading_type: "Palm Analysis",
    member_since: "2024-01-15T00:00:00Z",
    subscription_days_left: 25,
    last_reading_date: "2024-01-20T10:30:00Z",
    total_insights_generated: 376,
  },
};

class PalmAstroAPIService {
  private get baseURL(): string {
    return API_CONFIG.BASE_URL;
  }
  private timeout: number;
  private retryAttempts: number;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
  }
  
  /**
   * Handle 401 errors globally - clear auth state if refresh fails
   */
  private handleAuthError(error: Error): void {
    console.error("🚨 Authentication error:", error);
    // Clear auth state on persistent auth failures
    if (error.message.includes("Not authenticated") || error.message.includes("401")) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      // Dispatch event to trigger login modal
      window.dispatchEvent(new CustomEvent("auth-expired"));
    }
  }

  /**
   * Make an authenticated request with automatic token refresh on 401
   */
  private async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const getAuthHeaders = (token: string | null, isFormData: boolean = false): HeadersInit => {
      const headers: HeadersInit = {};
      // Don't set Content-Type for FormData - browser will set it with boundary
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }
      // Merge any existing headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return headers;
    };

    const isFormData = options.body instanceof FormData;
    let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    // If no token at all, don't make the request - user needs to log in
    if (!token) {
      console.warn("⚠️ No access token found - user needs to log in");
      this.handleAuthError(new Error("Not authenticated. Please log in."));
      throw new Error("Not authenticated. Please log in.");
    }
    
    try {
      const headers = getAuthHeaders(token, isFormData);
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // If unauthorized, try to refresh the access token once
      if (response.status === 401) {
        try {
          token = await this.refreshAccessToken();
          response = await fetch(url, {
            ...options,
            headers: getAuthHeaders(token, isFormData),
            credentials: "include",
          });
          
          // If still 401 after refresh, user needs to log in again
          if (response.status === 401) {
            this.handleAuthError(new Error("Not authenticated. Please log in again."));
            throw new Error("Not authenticated. Please log in again.");
          }
        } catch (refreshError) {
          console.warn("🚨 Token refresh failed:", refreshError);
          this.handleAuthError(refreshError as Error);
          throw new Error("Not authenticated. Please log in again.");
        }
      }

      return response;
    } catch (fetchError: any) {
      // Handle network errors (CORS, connection refused, etc.)
      console.error("🚨 Network error in makeAuthenticatedRequest:", fetchError);
      if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
        const errorMessage = `Network error: Unable to connect to server. Please check if the backend is running at ${this.baseURL}. Error: ${fetchError.message}`;
        throw new Error(errorMessage);
      }
      throw fetchError;
    }
  }

  // Always use mock API if enabled, skip network calls entirely
  private shouldUseMockAPI(): boolean {
    return FEATURES.MOCK_API;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async simulateNetworkDelay(): Promise<void> {
    // Simulate realistic API response time
    await this.delay(Math.random() * 1000 + 500);
  }

  // Mock API implementations
  private async mockLogin(
    email: string,
    password: string,
  ): Promise<{ user: User; tokens: { access: string; refresh: string } }> {
    await this.simulateNetworkDelay();

    // Store tokens in localStorage
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "mock_access_token");
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, "mock_refresh_token");
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(MOCK_USER));

    return {
      user: MOCK_USER,
      tokens: {
        access: "mock_access_token",
        refresh: "mock_refresh_token",
      },
    };
  }

  private async mockGetProfile(): Promise<User> {
    await this.simulateNetworkDelay();
    return MOCK_USER;
  }

  private async mockGetDashboard(): Promise<DashboardData> {
    await this.simulateNetworkDelay();
    const readings = getStoredReadings();
    return {
      ...MOCK_DASHBOARD_DATA,
      recent_readings: readings.slice(0, 5),
      user_stats: {
        ...MOCK_DASHBOARD_DATA.user_stats,
        total_readings: readings.length,
        readings_this_month: readings.length,
      },
    };
  }

  private buildDashboardFromReadings(readings: Reading[]): DashboardData {
    return {
      recent_readings: readings.slice(0, 5),
      weekly_activity: MOCK_DASHBOARD_DATA.weekly_activity,
      spiritual_progress: MOCK_DASHBOARD_DATA.spiritual_progress,
      user_stats: {
        ...MOCK_DASHBOARD_DATA.user_stats,
        total_readings: readings.length,
        readings_this_month: readings.length,
      },
      upcoming_predictions: MOCK_DASHBOARD_DATA.upcoming_predictions,
    };
  }

  private async mockUploadPalmImage(
    file: File,
  ): Promise<{ upload_id: string; image_url: string }> {
    await this.simulateNetworkDelay();
    return {
      upload_id: `upload_${Date.now()}`,
      image_url: URL.createObjectURL(file),
    };
  }

  // Mock palm analysis result (reusable)
  private getMockPalmAnalysisResult(): PalmAnalysisResult {
    return {
      overallScore: 94,
      lines: {
        lifeLine: {
          quality: "Strong",
          score: 92,
          meaning: "Excellent vitality and long life",
          details:
            "Your life line is deep and well-formed, indicating robust health and strong life force.",
        },
        heartLine: {
          quality: "Curved",
          score: 88,
          meaning: "Emotional and expressive in love",
          details:
            "Your heart line curves upward, showing you're a romantic at heart.",
        },
        headLine: {
          quality: "Clear",
          score: 96,
          meaning: "Sharp intellect and analytical mind",
          details:
            "A clear, straight head line indicates logical thinking and excellent problem-solving abilities.",
        },
        fateLine: {
          quality: "Present",
          score: 85,
          meaning: "Strong sense of purpose and direction",
          details:
            "Your fate line suggests you have a clear life direction and will achieve your goals.",
        },
      },
      personality: {
        traits: [
          {
            name: "Leadership",
            score: 93,
            description: "Natural ability to guide and inspire others",
          },
          {
            name: "Creativity",
            score: 87,
            description: "Strong artistic and innovative tendencies",
          },
          {
            name: "Intuition",
            score: 91,
            description: "Excellent instincts and gut feelings",
          },
          {
            name: "Communication",
            score: 84,
            description: "Good at expressing ideas and connecting with people",
          },
          {
            name: "Determination",
            score: 96,
            description: "Persistent and goal-oriented nature",
          },
        ],
        dominantHand: "Right",
        palmShape: "Square",
        fingerLength: "Balanced",
        handType: "Earth",
      },
      predictions: [
        {
          area: "Career",
          timeframe: "Next 6 months",
          prediction:
            "Significant professional advancement on the horizon. Your leadership qualities will be recognized.",
          confidence: 89,
          advice:
            "Take on challenging projects and showcase your problem-solving skills.",
        },
        {
          area: "Relationships",
          timeframe: "Next 3 months",
          prediction:
            "A meaningful connection will enter your life. Existing relationships will deepen.",
          confidence: 82,
          advice:
            "Be open to new social situations and express your emotions honestly.",
        },
        {
          area: "Health",
          timeframe: "Ongoing",
          prediction:
            "Overall excellent health with strong vitality. Minor stress-related concerns possible.",
          confidence: 94,
          advice:
            "Maintain regular exercise and consider meditation for stress management.",
        },
        {
          area: "Finances",
          timeframe: "Next year",
          prediction:
            "Financial growth through career advancement. Investment opportunities will arise.",
          confidence: 78,
          advice:
            "Focus on long-term planning and avoid impulsive financial decisions.",
        },
      ],
      specialMarks: [
        {
          name: "Star on Mount of Apollo",
          meaning: "Creative success and recognition",
          significance: "High",
        },
        {
          name: "Triangle on Mount of Jupiter",
          meaning: "Leadership abilities and wisdom",
          significance: "Medium",
        },
        {
          name: "Cross on Mount of Mercury",
          meaning: "Communication challenges to overcome",
          significance: "Low",
        },
      ],
      compatibility: [
        {
          type: "Earth Hands",
          match: 94,
          description: "Practical and grounded individuals",
        },
        {
          type: "Fire Hands",
          match: 87,
          description: "Energetic and passionate personalities",
        },
        {
          type: "Water Hands",
          match: 76,
          description: "Emotional and intuitive types",
        },
        {
          type: "Air Hands",
          match: 82,
          description: "Intellectual and communicative people",
        },
      ],
      accuracy: {
        lineDetection: 0.98,
        patternAnalysis: 0.96,
        interpretation: 0.94,
        overall: 0.96,
      },
      summary:
        "Your palm indicates strong vitality, sharp intellect, emotional depth, and a purposeful life path with high potential for creative and professional success.",
      modelVersion: "palm-ai-v1-mock",
    };
  }

  private async mockAnalyzePalm(uploadId: string): Promise<PalmReading> {
    // Simulate analysis time
    await this.delay(3000);

    const now = new Date().toISOString();
    const results = this.getMockPalmAnalysisResult();

    return {
      id: `reading_${Date.now()}`,
      user: "user_123",
      type: "palm_analysis",
      status: "completed",
      accuracy: Math.round(results.accuracy.overall * 100),
      created_at: now,
      updated_at: now,
      upload_id: uploadId,
      results,
    };
  }

  private async mockAstrologyReading(
    birthData: any,
  ): Promise<AstrologyReading> {
    // Simulate analysis time
    await this.delay(4000);

    return {
      id: `astro_${Date.now()}`,
      user: "user_123",
      type: "astrology_reading",
      status: "completed",
      accuracy: 91,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      birth_data: birthData,
      results: {
        sun_sign: "Leo",
        moon_sign: "Scorpio",
        rising_sign: "Gemini",
        personality_summary:
          "You are a natural leader with deep emotional intelligence and excellent communication skills.",
        life_path:
          "Your path involves creative self-expression and helping others realize their potential.",
        relationships:
          "You seek deep, transformative connections and are fiercely loyal to those you love.",
        career:
          "Success comes through leadership roles, creative pursuits, or fields involving communication.",
      },
    };
  }

  // Public API methods

  async signup(payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    accepted_terms: boolean;
    subscribe_newsletter?: boolean;
  }): Promise<{ user: User; accessToken: string }> {
    if (this.shouldUseMockAPI()) {
      await this.simulateNetworkDelay();
      const user: User = {
        ...MOCK_USER,
        email: payload.email,
        first_name: payload.full_name.split(" ")[0] || payload.full_name,
        last_name: payload.full_name.split(" ").slice(1).join(" ") || "",
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "mock_access_token");
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      return { user, accessToken: "mock_access_token" };
    }

    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.AUTH.SIGNUP}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include", // so refresh cookie is stored
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        // Extract detailed error messages from DRF validation errors
        let errorMessage = data?.message || response.statusText || "Signup failed";
        
        // Check for detailed validation errors in data.errors (from our custom response)
        if (data?.errors && typeof data.errors === 'object') {
          const fieldErrors: string[] = [];
          for (const [field, errors] of Object.entries(data.errors)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              fieldErrors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errors}`);
            } else if (Array.isArray(errors) && errors.length > 0) {
              // Handle nested error objects
              const errorStrings = errors.map((e: any) => 
                typeof e === 'string' ? e : e?.message || JSON.stringify(e)
              );
              fieldErrors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errorStrings.join(', ')}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('. ');
          }
        } else if (data?.detail) {
          // DRF standard error format
          errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data && typeof data === 'object') {
          // Field-specific errors in root level (e.g., { email: ["This field is required."] })
          const fieldErrors: string[] = [];
          for (const [field, errors] of Object.entries(data)) {
            if (field !== 'message' && field !== 'success' && field !== 'errors' && Array.isArray(errors)) {
              fieldErrors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errors.join(', ')}`);
            } else if (field !== 'message' && field !== 'success' && field !== 'errors' && typeof errors === 'string') {
              fieldErrors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errors}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('. ');
          }
        }
        
        throw new Error(errorMessage);
      }

      const user: User = data.data.user;
      const accessToken: string = data.data.access_token;

      // Persist for now so dashboard etc. keep working
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return { user, accessToken };
    } catch (error) {
      console.error("🚨 Signup API call failed:", error);
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string }> {
    if (this.shouldUseMockAPI()) {
      const { user, tokens } = await this.mockLogin(email, password);
      return { user, accessToken: tokens.access };
    }

    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include", // for refresh cookie
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = data?.message || response.statusText || "Login failed";
        throw new Error(msg);
      }

      const user: User = data.data.user;
      const accessToken: string = data.data.access_token;

      // Persist for now so existing code keeps working
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return { user, accessToken };
    } catch (error) {
      console.error("🚨 Login API call failed:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const makeRequest = async (accessToken: string | null) => {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.ME}`, {
          method: "GET",
          headers,
          credentials: "include",
        });
      };

      let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // If no token at all, don't make the request - user is not logged in
      if (!token) {
        throw new Error("Not authenticated. Please log in.");
      }
      
      let response = await makeRequest(token);

      // If unauthorized, try to refresh the access token once
      if (response.status === 401) {
        try {
          token = await this.refreshAccessToken();
          if (token) {
            response = await makeRequest(token);
          } else {
            // Refresh failed - no valid refresh token
            throw new Error("Not authenticated. Please log in again.");
          }
          
          // If still 401 after refresh, user needs to log in again
          if (response.status === 401) {
            this.handleAuthError(new Error("Not authenticated. Please log in again."));
            throw new Error("Not authenticated. Please log in again.");
          }
        } catch (refreshError) {
          // Handle refresh failures - clear auth state
          this.handleAuthError(refreshError as Error);
          throw new Error("Not authenticated. Please log in again.");
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || data?.detail || `Get profile failed: ${response.statusText}`;
        if (response.status === 401) {
          this.handleAuthError(new Error(errorMsg));
        }
        throw new Error(errorMsg);
      }

      // Handle both response formats
      if (data?.success && data?.data?.user) {
        return data.data.user;
      } else if (data?.user) {
        return data.user;
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("🚨 Get profile API call failed:", error);
      this.handleAuthError(error as Error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log("🔄 Attempting to refresh access token...");
        const response = await fetch(
          `${this.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errorMsg = data?.message || `Refresh failed: ${response.statusText}`;
          console.error("🚨 Token refresh failed:", errorMsg);
          // Clear auth state on refresh failure
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          throw new Error(errorMsg);
        }

        const accessToken: string = data.data?.access_token || data.access_token;
        if (!accessToken) {
          throw new Error("No access token in refresh response");
        }

        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
        console.log("✅ Token refreshed successfully");
        return accessToken;
      } catch (error) {
        console.error("🚨 Refresh token API call failed:", error);
        this.handleAuthError(error as Error);
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async getDashboardData(): Promise<DashboardData> {
    if (this.shouldUseMockAPI()) {
      return this.mockGetDashboard();
    }

    try {
      // Authentication removed - make simple fetch request without auth headers
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.AUTH.DASHBOARD}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || data?.detail || `Get dashboard failed: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return data as DashboardData;
    } catch (error: any) {
      console.error("🚨 Get dashboard API call failed:", error);
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const errorMessage = `Network error: Unable to connect to server. Please check if the backend is running at ${this.baseURL}. Error: ${error.message}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async uploadPalmImage(
    file: File,
  ): Promise<{ upload_id: string; image_url?: string }> {
    if (this.shouldUseMockAPI()) {
      console.log("🎭 Using Mock API: uploadPalmImage");
      return this.mockUploadPalmImage(file);
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/readings/`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message || `Upload failed: ${response.status} ${response.statusText}`;
        throw new Error(message);
      }

      // Map backend job_id to upload_id for compatibility with existing flow
      return {
        upload_id: data.job_id,
        image_url: undefined,
      };
    } catch (error) {
      console.warn("🚨 Palm image upload failed:", error);
      throw error;
    }
  }

  /**
   * Analyze palm image using the new /api/palm-reading/analyze endpoint
   * This is the preferred method matching the specification
   */
  async analyzePalmImage(file: File): Promise<{ success: boolean; reading_id: string; result: PalmAnalysisResult }> {
    if (isOpenAIConfigured()) {
      try {
        console.log("🤖 Using OpenAI for palm analysis");
        const result = await analyzePalmWithOpenAI(file);
        if (result?.lines) {
          return {
            success: true,
            reading_id: `reading_${Date.now()}`,
            result,
          };
        }
      } catch (error) {
        console.warn("OpenAI palm analysis unavailable, using fallback:", error);
      }
    }

    if (this.shouldUseMockAPI()) {
      console.log("🎭 Using Mock API: analyzePalmImage");
      await this.simulateNetworkDelay();
      return {
        success: true,
        reading_id: `reading_${Date.now()}`,
        result: this.getMockPalmAnalysisResult(),
      };
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: HeadersInit = {};
      if (token) {
        // Palm analysis endpoint is public, but we still send the token when present
        headers["Authorization"] = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - browser will set it with boundary

      const endpoint = `${this.baseURL}${API_ENDPOINTS.READINGS.PALM_ANALYZE_NEW}`;
      console.log("🔍 Calling palm analysis endpoint (no login required):", endpoint);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), this.timeout);

      // IMPORTANT: Use plain fetch so this endpoint works even when the user is not logged in.
      // We intentionally DO NOT use makeAuthenticatedRequest here because that would
      // throw "Not authenticated" if there is no token, which we don't want for palm reading.
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers,
          credentials: "include",
          signal: controller.signal,
        });
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          throw new Error("Analysis timed out. Please try again on a stronger connection.");
        }
        const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (/load failed|failed to fetch|network/i.test(msg)) {
          throw new Error(
            "Unable to reach the server. Check your internet connection and try again.",
          );
        }
        throw fetchError;
      } finally {
        window.clearTimeout(timeoutId);
      }

      const errorData = (!response.ok && (await response.json().catch(() => ({})))) || null;

      if (!response.ok) {
        // Use message field if available, otherwise error field, otherwise default
        const message =
          (errorData as any)?.message ||
          (errorData as any)?.error ||
          `Analysis failed: ${response.status} ${response.statusText}`;

        // For 400 errors (bad request), provide more helpful message
        if (response.status === 400) {
          throw new Error(
            message ||
              "Please ensure you're uploading a clear, well-lit image of a human palm with fingers spread."
          );
        }

        throw new Error(message);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Palm analysis error:", error);
      throw error;
    }
  }

  async analyzePalm(uploadId: string): Promise<PalmReading> {
    if (this.shouldUseMockAPI()) {
      console.log("🎭 Using Mock API: analyzePalm");
      return this.mockAnalyzePalm(uploadId);
    }

    try {
      const statusUrl = `${this.baseURL}/readings/${uploadId}/status/`;
      const resultUrl = `${this.baseURL}/readings/${uploadId}/result/`;

      // Poll status until DONE or FAILED
      let attempts = 0;
      const maxAttempts = this.retryAttempts;

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(statusUrl);
        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.statusText}`);
        }
        const statusData = await statusResponse.json();

        if (statusData.status === "DONE") {
          break;
        }

        if (statusData.status === "FAILED") {
          throw new Error(statusData.error_message || "Analysis failed");
        }

        attempts += 1;
        await this.delay(1500);
      }

      const resultResponse = await fetch(resultUrl);
      if (!resultResponse.ok) {
        throw new Error(`Result fetch failed: ${resultResponse.statusText}`);
      }
      const data = await resultResponse.json();

      const result: PalmAnalysisResult | undefined = data.result;

      const palmReading: PalmReading = {
        id: data.id,
        user: "",
        type: "palm_analysis",
        status:
          data.status === "DONE"
            ? "completed"
            : data.status === "FAILED"
              ? "failed"
              : "analyzing",
        accuracy: result?.accuracy?.overall
          ? Math.round(result.accuracy.overall * 100)
          : 0,
        created_at: data.created_at,
        updated_at: data.created_at,
        results: result,
      };

      return palmReading;
    } catch (error) {
      console.warn("🚨 Palm analysis failed:", error);
      throw error;
    }
  }

  async createNumerologyReading(
    fullName: string,
    birthDate: string,
  ): Promise<NumerologyApiResult> {
    if (isOpenAIConfigured()) {
      const result = await generateNumerologyWithOpenAI(fullName, birthDate);
      return result as unknown as NumerologyApiResult;
    }

    if (this.shouldUseMockAPI()) {
      await this.simulateNetworkDelay();
      return {
        lifePathNumber: 7,
        destinyNumber: 5,
        soulNumber: 3,
        personalityNumber: 2,
        luckyNumbers: [7, 5, 3],
        interpretation: "Mock numerology reading for development.",
        strengths: ["Intuition", "Analysis", "Wisdom"],
        challenges: ["Overthinking", "Isolation"],
        compatibility: ["Pisces", "Cancer", "Scorpio"],
        yearPrediction: "A year of spiritual growth and inner discovery.",
        monthPrediction: "Focus on meaningful connections this month.",
      };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.NUMEROLOGY.CREATE}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            birth_date: birthDate,
            consent_to_store: true,
          }),
          credentials: "include",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string; error?: string }).message ||
            (err as { error?: string }).error ||
            `Numerology reading failed: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const statusUrl = resolveApiUrl(data.status_url as string);
      const resultUrl = resolveApiUrl(data.result_url as string);

      if (data.status === "FAILED") {
        throw new Error("Numerology reading failed. Please try again.");
      }

      if (data.status !== "COMPLETED") {
        const maxAttempts = 60;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const statusResp = await fetch(statusUrl, { credentials: "include" });
          const statusData = await statusResp.json();
          if (statusData.status === "COMPLETED") break;
          if (statusData.status === "FAILED") {
            throw new Error("Numerology reading failed. Please try again.");
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      const resultResp = await fetch(resultUrl, { credentials: "include" });
      if (!resultResp.ok) {
        throw new Error("Could not fetch numerology result.");
      }
      const resultData = await resultResp.json();
      if (!resultData.result) {
        throw new Error("Numerology result is empty. Please try again.");
      }
      return resultData.result as NumerologyApiResult;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Numerology reading timed out. Please try again.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async createAstrologyReading(birthData: any): Promise<AstrologyReading> {
    if (isOpenAIConfigured()) {
      const raw = await generateAstrologyWithOpenAI(birthData);
      return {
        id: `astro_${Date.now()}`,
        user: "local_user",
        type: "astrology_reading",
        status: "completed",
        accuracy: Math.round(((raw.overview as { confidence?: number })?.confidence ?? 0.88) * 100),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        birth_data: birthData,
        results: raw,
      };
    }

    if (this.shouldUseMockAPI()) {
      console.log("🎭 Using Mock API: createAstrologyReading");
      return this.mockAstrologyReading(birthData);
    }

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.READINGS.ASTROLOGY_CREATE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birth_data: birthData }),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Astrology reading failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getReadings(limit: number = 20, offset: number = 0): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Reading[];
  }> {
    if (this.shouldUseMockAPI()) {
      await this.simulateNetworkDelay();
      const all = getStoredReadings();
      const results = all.slice(offset, offset + limit);
      return {
        count: all.length,
        next: offset + limit < all.length ? "mock-next" : null,
        previous: offset > 0 ? "mock-prev" : null,
        results,
      };
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.READINGS.LIST}?limit=${limit}&offset=${offset}`,
        { method: "GET", headers, credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Get readings failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        count: data.count || 0,
        next: data.next || null,
        previous: data.previous || null,
        results: data.results || [],
      };
    } catch (error) {
      console.warn("Get readings API unavailable — using local storage:", error);
      const all = getStoredReadings();
      const results = all.slice(offset, offset + limit);
      return {
        count: all.length,
        next: offset + limit < all.length ? "local-next" : null,
        previous: offset > 0 ? "local-prev" : null,
        results,
      };
    }
  }

  /**
   * Save a reading to the Dashboard (unified endpoint for all reading types)
   * This automatically persists AI results to the user's Dashboard in real-time.
   */
  /**
   * Get user's latest palm reading ID for integration
   */
  async getLatestPalmReadingId(): Promise<string | null> {
    try {
      const readings = await this.getReadings(1, 0);
      const palmReading = readings.results.find(
        (r) => r.type === "palm_analysis" && r.status === "completed"
      );
      return palmReading?.id || null;
    } catch (error) {
      console.warn("Failed to get latest palm reading:", error);
      return null;
    }
  }

  async saveReading(data: {
    reading_type: "palm_analysis" | "numerology" | "astrology_reading";
    result: any;
    accuracy?: number;
    source_id?: string;
    palm_reference_id?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    if (this.shouldUseMockAPI()) {
      await this.simulateNetworkDelay();
      const now = new Date().toISOString();
      const reading: Reading = {
        id: `reading_${Date.now()}`,
        user: "local_user",
        type: data.reading_type,
        status: "completed",
        accuracy: data.accuracy ?? 90,
        created_at: now,
        updated_at: now,
        results: data.result,
      };
      saveStoredReading(reading as Reading);
      return {
        success: true,
        message: "Reading saved locally",
        data: reading,
      };
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.READINGS.SAVE_UNIFIED}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          reading_type: data.reading_type,
          result: data.result,
          accuracy: data.accuracy,
          source_id: data.source_id,
          palm_reference_id: data.palm_reference_id,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const message = responseData?.message || responseData?.detail || `Save reading failed: ${response.statusText}`;
        throw new Error(message);
      }

      console.log("✅ Reading saved to Dashboard:", responseData);
      return responseData;
    } catch (error) {
      console.warn("Save reading API unavailable — saving locally:", error);
      const now = new Date().toISOString();
      const reading: Reading = {
        id: `reading_${Date.now()}`,
        user: "local_user",
        type: data.reading_type,
        status: "completed",
        accuracy: data.accuracy ?? 90,
        created_at: now,
        updated_at: now,
        results: data.result,
      };
      saveStoredReading(reading as Reading);
      return {
        success: true,
        message: "Reading saved locally",
        data: reading,
      };
    }
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    console.log("🚪 User logged out");
  }

  /**
   * Get all predictions from user's readings
   * GET /api/v1/predictions/get/
   */
  async getPredictions(): Promise<{ count: number; results: DashboardPrediction[] }> {
    if (this.shouldUseMockAPI()) {
      await this.simulateNetworkDelay();
      return {
        count: MOCK_DASHBOARD_DATA.upcoming_predictions?.length ?? 0,
        results: MOCK_DASHBOARD_DATA.upcoming_predictions ?? [],
      };
    }

    try {
      const makeRequest = async (accessToken: string | null) => {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return fetch(`${this.baseURL}${API_ENDPOINTS.PREDICTIONS.GET}`, {
          method: "GET",
          headers,
          credentials: "include",
        });
      };

      let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      let response = await makeRequest(token);

      if (response.status === 401) {
        try {
          token = await this.refreshAccessToken();
          response = await makeRequest(token);
        } catch (refreshError) {
          console.warn("🚨 Predictions token refresh failed:", refreshError);
          throw new Error("Not authenticated. Please log in again.");
        }
      }

      if (!response.ok) {
        throw new Error(`Get predictions failed: ${response.statusText}`);
      }

      return (await response.json()) as { count: number; results: DashboardPrediction[] };
    } catch (error) {
      console.error("🚨 Get predictions API call failed:", error);
      throw error;
    }
  }

  /**
   * Get real-time dashboard update information
   * GET /api/v1/auth/dashboard/realtime/
   */
  async getDashboardRealtime(): Promise<{
    last_update: string;
    has_updates: boolean;
    readings_count: number;
    timestamp: string;
  }> {
    if (this.shouldUseMockAPI()) {
      const readings = getStoredReadings();
      return {
        last_update: new Date().toISOString(),
        has_updates: readings.length > 0,
        readings_count: readings.length,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const makeRequest = async (accessToken: string | null) => {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return fetch(`${this.baseURL}${API_ENDPOINTS.DASHBOARD.REALTIME}`, {
          method: "GET",
          headers,
          credentials: "include",
        });
      };

      let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      let response = await makeRequest(token);

      if (response.status === 401) {
        try {
          token = await this.refreshAccessToken();
          response = await makeRequest(token);
        } catch (refreshError) {
          console.warn("🚨 Realtime token refresh failed:", refreshError);
          throw new Error("Not authenticated. Please log in again.");
        }
      }

      if (!response.ok) {
        throw new Error(`Get realtime failed: ${response.statusText}`);
      }

      return (await response.json()) as {
        last_update: string;
        has_updates: boolean;
        readings_count: number;
        timestamp: string;
      };
    } catch (error) {
      console.error("🚨 Get realtime API call failed:", error);
      throw error;
    }
  }

  /**
   * Upgrade user's membership plan
   * POST /api/v1/auth/upgrade-plan/
   */
  async upgradePlan(planName: string): Promise<{
    success: boolean;
    message: string;
    plan: {
      name: string;
      display_name: string;
      features: string[];
    };
  }> {
    try {
      const makeRequest = async (accessToken: string | null) => {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return fetch(`${this.baseURL}${API_ENDPOINTS.PLANS.UPGRADE}`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ plan_name: planName }),
        });
      };

      let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      let response = await makeRequest(token);

      if (response.status === 401) {
        try {
          token = await this.refreshAccessToken();
          response = await makeRequest(token);
        } catch (refreshError) {
          console.warn("🚨 Upgrade plan token refresh failed:", refreshError);
          throw new Error("Not authenticated. Please log in again.");
        }
      }

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          responseData?.error || responseData?.message || `Upgrade plan failed: ${response.statusText}`;
        throw new Error(message);
      }

      console.log("✅ Plan upgraded successfully:", responseData);
      return responseData;
    } catch (error) {
      console.error("🚨 Upgrade plan API call failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new PalmAstroAPIService();
export default apiService;
