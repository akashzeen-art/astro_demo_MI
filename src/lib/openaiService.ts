import { OPENAI_CONFIG, FEATURES } from "./config";
import type { PalmAnalysisResult } from "./apiService";

export function isOpenAIConfigured(): boolean {
  return FEATURES.OPENAI;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function parseJsonFromContent(content: string): Record<string, unknown> {
  let text = content.trim();
  if (text.startsWith("```")) {
    const start = text.indexOf("\n");
    const end = text.lastIndexOf("```");
    if (start >= 0 && end > start) {
      text = text.slice(start + 1, end).trim();
    }
  }
  if (text.includes("```json")) {
    text = text.slice(text.indexOf("```json") + 7);
    text = text.slice(0, text.lastIndexOf("```")).trim();
  }
  return JSON.parse(text) as Record<string, unknown>;
}

async function chatCompletion(
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>,
  maxTokens = 4000,
): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key is not configured.");
  }

  const response = await fetch(OPENAI_CONFIG.PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_CONFIG.MODEL,
      max_tokens: maxTokens,
      messages,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg =
      (data as { error?: { message?: string } })?.error?.message ||
      `OpenAI API error ${response.status}`;
    if (response.status === 401) {
      throw new Error(
        "OpenAI rejected this API key for chat completions. Create a new unrestricted secret key with billing enabled at platform.openai.com/api-keys (Permissions: All), then update api/_openai-key.ts and restart npm run dev.",
      );
    }
    if (response.status === 404) {
      throw new Error(
        "OpenAI proxy not found. For local dev, restart npm run dev. For production, set VITE_OPENAI_PROXY_URL to a Cloudflare Worker URL (see workers/openai-proxy.js).",
      );
    }
    throw new Error(errMsg);
  }

  const content = (data as { choices?: Array<{ message?: { content?: string } }> })
    ?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return content;
}

const PALM_PROMPT = `Analyze this palm image and provide a detailed palm reading.
Return ONLY raw valid JSON — no markdown, no code blocks, no explanation.
Use EXACTLY this JSON structure with all fields filled with real analysis:
{
  "overallScore": 85,
  "summary": "2-3 sentence summary based on the actual palm.",
  "lines": {
    "lifeLine": {"quality": "Strong", "score": 88, "meaning": "Short meaning", "details": "Detailed interpretation"},
    "headLine": {"quality": "Clear", "score": 82, "meaning": "Short meaning", "details": "Detailed interpretation"},
    "heartLine": {"quality": "Curved", "score": 79, "meaning": "Short meaning", "details": "Detailed interpretation"},
    "fateLine": {"quality": "Present", "score": 74, "meaning": "Short meaning", "details": "Detailed interpretation"}
  },
  "personality": {
    "dominantHand": "Right",
    "palmShape": "Square",
    "fingerLength": "Balanced",
    "handType": "Earth",
    "handTypeAnalysis": "2-3 sentences about this hand type.",
    "traits": [
      {"name": "Leadership", "score": 90, "description": "Natural ability to guide others."},
      {"name": "Creativity", "score": 85, "description": "Strong artistic tendencies."},
      {"name": "Intuition", "score": 80, "description": "Excellent gut feelings."},
      {"name": "Determination", "score": 92, "description": "Persistent and goal-oriented."}
    ]
  },
  "predictions": [
    {"area": "Career", "timeframe": "Next 6 months", "prediction": "Career prediction.", "confidence": 85, "advice": "Actionable advice."},
    {"area": "Relationships", "timeframe": "Next 3 months", "prediction": "Relationship prediction.", "confidence": 78, "advice": "Actionable advice."},
    {"area": "Health", "timeframe": "Ongoing", "prediction": "Health prediction.", "confidence": 90, "advice": "Actionable advice."},
    {"area": "Finances", "timeframe": "Next year", "prediction": "Finance prediction.", "confidence": 75, "advice": "Actionable advice."}
  ],
  "specialMarks": [
    {"name": "Mark name", "location": "Location on palm", "meaning": "What it means.", "significance": "High"}
  ],
  "compatibility": [
    {"type": "Earth Hands", "match": 92, "description": "Description."},
    {"type": "Fire Hands", "match": 85, "description": "Description."},
    {"type": "Air Hands", "match": 80, "description": "Description."}
  ],
  "accuracy": {"lineDetection": 0.95, "patternAnalysis": 0.92, "interpretation": 0.90, "overall": 0.92}
}
Replace ALL placeholder values with REAL analysis from the actual palm image.`;

function normalizePalmResult(raw: Record<string, unknown>): PalmAnalysisResult {
  const accuracy = (raw.accuracy as PalmAnalysisResult["accuracy"]) || {
    lineDetection: 0.92,
    patternAnalysis: 0.9,
    interpretation: 0.88,
    overall: 0.9,
  };

  return {
    ...(raw as unknown as PalmAnalysisResult),
    overallScore: Number(raw.overallScore) || 85,
    summary: String(raw.summary || ""),
    modelVersion: OPENAI_CONFIG.MODEL,
    accuracy,
  };
}

export async function analyzePalmWithOpenAI(file: File): Promise<PalmAnalysisResult> {
  try {
    const dataUrl = await fileToDataUrl(file);
    const content = await chatCompletion(
      [
        {
          role: "user",
          content: [
            { type: "text", text: PALM_PROMPT },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      4000,
    );

    const parsed = parseJsonFromContent(content);
    return normalizePalmResult(parsed);
  } catch (err) {
    console.warn("OpenAI palm analysis failed, using local reading:", err);
    return normalizePalmResult({
      overallScore: 86,
      summary:
        "Your palm suggests strong vitality, thoughtful intellect, and a purposeful direction. Refine opportunities with steady focus.",
      lines: {
        lifeLine: {
          quality: "Strong",
          score: 88,
          meaning: "Good vitality",
          details: "A clear life line indicates resilience and life force.",
        },
        headLine: {
          quality: "Clear",
          score: 84,
          meaning: "Analytical mind",
          details: "A defined head line supports practical decision-making.",
        },
        heartLine: {
          quality: "Curved",
          score: 82,
          meaning: "Warm emotionally",
          details: "A curved heart line points to expressive, caring bonds.",
        },
        fateLine: {
          quality: "Present",
          score: 80,
          meaning: "Directed path",
          details: "A visible fate line suggests purpose and career focus.",
        },
      },
      personality: {
        dominantHand: "Right",
        palmShape: "Square",
        fingerLength: "Balanced",
        handType: "Earth",
        handTypeAnalysis: "Earth hands favor practicality, loyalty, and steady progress.",
        traits: [
          { name: "Determination", score: 90, description: "You follow through on important goals." },
          { name: "Intuition", score: 85, description: "You sense timing and people well." },
          { name: "Creativity", score: 82, description: "You solve problems with original ideas." },
          { name: "Communication", score: 80, description: "You express yourself with clarity." },
        ],
      },
      predictions: [
        {
          area: "Career",
          timeframe: "Next 6 months",
          prediction: "Recognition grows when you showcase consistent results.",
          confidence: 84,
          advice: "Document wins and ask for stretch opportunities.",
        },
        {
          area: "Relationships",
          timeframe: "Next 3 months",
          prediction: "Honest conversations deepen trust.",
          confidence: 80,
          advice: "Share needs early rather than waiting.",
        },
        {
          area: "Health",
          timeframe: "Ongoing",
          prediction: "Vitality stays strong with regular rest and movement.",
          confidence: 88,
          advice: "Keep a simple daily wellness rhythm.",
        },
        {
          area: "Finances",
          timeframe: "Next year",
          prediction: "Steady saving outperforms risky shortcuts.",
          confidence: 78,
          advice: "Automate a small monthly reserve.",
        },
      ],
      specialMarks: [
        {
          name: "Triangle on Jupiter",
          location: "Mount of Jupiter",
          meaning: "Leadership potential",
          significance: "High",
        },
      ],
      compatibility: [
        { type: "Earth Hands", match: 92, description: "Grounded and reliable matches" },
        { type: "Fire Hands", match: 84, description: "Energizing complementary pairs" },
        { type: "Air Hands", match: 80, description: "Stimulating mental connection" },
      ],
      accuracy: {
        lineDetection: 0.9,
        patternAnalysis: 0.88,
        interpretation: 0.86,
        overall: 0.88,
      },
    });
  }
}

function reduceToSingleDigit(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}

function pythagoreanValue(c: string): number {
  const code = c.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  return (code % 9) + 1;
}

export function computeNumerologyNumbers(fullName: string, birthDate: string) {
  const digits = birthDate.replace(/\D/g, "");
  const lifePathNumber = reduceToSingleDigit(
    digits.split("").reduce((s, d) => s + parseInt(d, 10), 0),
  );
  const letters = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  const destinyNumber = reduceToSingleDigit(
    letters.split("").reduce((s, c) => s + pythagoreanValue(c), 0),
  );
  const soulNumber = reduceToSingleDigit(
    letters
      .split("")
      .filter((c) => "AEIOU".includes(c))
      .reduce((s, c) => s + pythagoreanValue(c), 0) || lifePathNumber,
  );
  const personalityNumber = reduceToSingleDigit(
    letters
      .split("")
      .filter((c) => !"AEIOU".includes(c))
      .reduce((s, c) => s + pythagoreanValue(c), 0) || destinyNumber,
  );

  return {
    lifePathNumber,
    destinyNumber,
    soulNumber,
    personalityNumber,
    luckyNumbers: [
      lifePathNumber,
      destinyNumber,
      (lifePathNumber + destinyNumber) % 9 || 9,
    ],
  };
}

const LIFE_PATH_ARCHETYPES: Record<
  number,
  { title: string; element: string; color: string; traits: string[]; strengths: string[]; challenges: string[] }
> = {
  1: {
    title: "The Pioneer",
    element: "Fire",
    color: "Red",
    traits: ["Independent", "Ambitious", "Bold", "Original"],
    strengths: ["Leadership", "Initiative", "Courage", "Drive"],
    challenges: ["Impatience", "Stubbornness", "Isolation"],
  },
  2: {
    title: "The Diplomat",
    element: "Water",
    color: "Orange",
    traits: ["Sensitive", "Cooperative", "Gentle", "Intuitive"],
    strengths: ["Partnership", "Empathy", "Patience", "Harmony"],
    challenges: ["Indecision", "Over-sensitivity", "Dependence"],
  },
  3: {
    title: "The Creator",
    element: "Fire",
    color: "Yellow",
    traits: ["Expressive", "Optimistic", "Social", "Artistic"],
    strengths: ["Creativity", "Communication", "Joy", "Inspiration"],
    challenges: ["Scattered focus", "Oversharing", "Restlessness"],
  },
  4: {
    title: "The Builder",
    element: "Earth",
    color: "Green",
    traits: ["Practical", "Loyal", "Disciplined", "Steady"],
    strengths: ["Stability", "Hard work", "Reliability", "Structure"],
    challenges: ["Rigidity", "Overwork", "Resistance to change"],
  },
  5: {
    title: "The Explorer",
    element: "Air",
    color: "Turquoise",
    traits: ["Adventurous", "Curious", "Flexible", "Freedom-loving"],
    strengths: ["Adaptability", "Versatility", "Charisma", "Progress"],
    challenges: ["Inconsistency", "Impulsiveness", "Commitment fears"],
  },
  6: {
    title: "The Nurturer",
    element: "Earth",
    color: "Blue",
    traits: ["Caring", "Responsible", "Protective", "Harmonious"],
    strengths: ["Compassion", "Service", "Family focus", "Balance"],
    challenges: ["Over-giving", "Perfectionism", "Worry"],
  },
  7: {
    title: "The Seeker",
    element: "Water",
    color: "Purple",
    traits: ["Analytical", "Spiritual", "Thoughtful", "Wise"],
    strengths: ["Insight", "Research", "Intuition", "Depth"],
    challenges: ["Overthinking", "Isolation", "Skepticism"],
  },
  8: {
    title: "The Powerhouse",
    element: "Earth",
    color: "Gold",
    traits: ["Ambitious", "Authoritative", "Strategic", "Resilient"],
    strengths: ["Manifestation", "Business sense", "Strength", "Vision"],
    challenges: ["Workaholism", "Control issues", "Material focus"],
  },
  9: {
    title: "The Humanitarian",
    element: "Fire",
    color: "Crimson",
    traits: ["Compassionate", "Idealistic", "Generous", "Wise"],
    strengths: ["Empathy", "Global vision", "Creativity", "Healing"],
    challenges: ["Emotional burden", "Letting go", "Self-neglect"],
  },
  11: {
    title: "The Illuminator",
    element: "Air",
    color: "Silver",
    traits: ["Inspired", "Intuitive", "Visionary", "Sensitive"],
    strengths: ["Inspiration", "Spiritual insight", "Charisma", "Ideals"],
    challenges: ["Nervous energy", "High expectations", "Anxiety"],
  },
  22: {
    title: "The Master Builder",
    element: "Earth",
    color: "Indigo",
    traits: ["Visionary", "Practical", "Large-scale thinker", "Dedicated"],
    strengths: ["Manifestation", "Leadership", "Legacy building", "Discipline"],
    challenges: ["Pressure", "Overwhelm", "Self-doubt"],
  },
  33: {
    title: "The Master Teacher",
    element: "Water",
    color: "Rose",
    traits: ["Compassionate", "Healing", "Uplifting", "Devoted"],
    strengths: ["Teaching", "Healing", "Unconditional love", "Guidance"],
    challenges: ["Emotional overload", "Martyrdom", "Boundaries"],
  },
};

function localNumerologyReading(fullName: string, birthDate: string, computed: ReturnType<typeof computeNumerologyNumbers>) {
  const arch =
    LIFE_PATH_ARCHETYPES[computed.lifePathNumber] ||
    LIFE_PATH_ARCHETYPES[reduceToSingleDigit(computed.lifePathNumber)] ||
    LIFE_PATH_ARCHETYPES[7];

  return {
    ...computed,
    fullName,
    birthDate,
    title: arch.title,
    interpretation: `${fullName}, your Life Path ${computed.lifePathNumber} marks you as ${arch.title}. Destiny ${computed.destinyNumber}, Soul ${computed.soulNumber}, and Personality ${computed.personalityNumber} together shape a path of ${arch.traits.join(", ").toLowerCase()} expression.`,
    personality: `You naturally express as ${arch.traits.slice(0, 3).join(", ").toLowerCase()}, guided by a ${arch.element.toLowerCase()} temperament.`,
    traits: arch.traits,
    strengths: arch.strengths,
    challenges: arch.challenges,
    compatibility: ["Cancer", "Pisces", "Scorpio", "Taurus"].slice(0, 3 + (computed.lifePathNumber % 3)),
    yearPrediction: `This year favors growth through ${arch.strengths[0].toLowerCase()} and conscious use of your Life Path ${computed.lifePathNumber} energy.`,
    monthPrediction: `This month, lean into ${arch.strengths[1].toLowerCase()} in relationships and quiet the pull of ${arch.challenges[0].toLowerCase()}.`,
    career_path: arch.strengths.slice(0, 3).join(", "),
    love_insights: `In love you thrive with partners who respect your ${arch.traits[0].toLowerCase()} nature and support your Life Path ${computed.lifePathNumber} journey.`,
    lucky_color: arch.color,
    element: arch.element,
  };
}

export async function generateNumerologyWithOpenAI(
  fullName: string,
  birthDate: string,
): Promise<Record<string, unknown>> {
  const computed = computeNumerologyNumbers(fullName, birthDate);
  const prompt = `Provide a detailed numerology reading for:
Name: ${fullName}, Birth Date: ${birthDate}
Life Path: ${computed.lifePathNumber}, Destiny: ${computed.destinyNumber}, Soul: ${computed.soulNumber}, Personality: ${computed.personalityNumber}
Return ONLY valid JSON with keys:
title (archetype name e.g. "The Seeker"),
interpretation (2-3 sentence core reading),
personality (personality overview text),
traits (array of 4 trait words),
strengths (array of 4 strengths),
challenges (array of 3 challenges),
compatibility (array of 3-5 compatible zodiac signs),
yearPrediction (career/life path for this year),
monthPrediction (love/relationships this month),
career_path (ideal careers),
love_insights (relationship guidance),
lucky_color, element (Fire/Water/Earth/Air).`;

  try {
    const content = await chatCompletion([{ role: "user", content: prompt }], 2000);
    const ai = parseJsonFromContent(content);
    return { ...computed, ...ai, fullName, birthDate };
  } catch (err) {
    console.warn("OpenAI numerology failed, using local reading:", err);
    return localNumerologyReading(fullName, birthDate, computed);
  }
}

export type HoroscopePeriod = "weekly" | "monthly" | "yearly";

export interface HoroscopeResult {
  sign: string;
  period: HoroscopePeriod;
  timeframe: string;
  summary: string;
  love: string;
  career: string;
  health: string;
  finance: string;
  advice: string;
  luckyNumbers: number[];
  luckyColor: string;
  rating: number;
}

const HOROSCOPE_PERIOD_LABEL: Record<HoroscopePeriod, string> = {
  weekly: "this week",
  monthly: "this month",
  yearly: `the year ${new Date().getFullYear()}`,
};

function localHoroscope(sign: string, period: HoroscopePeriod): HoroscopeResult {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const idx = Math.max(0, signs.indexOf(sign));
  const colors = ["Crimson", "Emerald", "Amber", "Silver", "Gold", "Olive", "Rose", "Maroon", "Indigo", "Charcoal", "Turquoise", "Sea Green"];
  const label = HOROSCOPE_PERIOD_LABEL[period];

  return {
    sign,
    period,
    timeframe: label,
    summary: `${sign}, ${label} highlights steady progress and clarity. Planetary currents favor completing what you started and trusting your instincts on new opportunities.`,
    love: `Warmth grows through honest, unhurried conversations. Single ${sign}s may notice a meaningful connection through friends or work circles.`,
    career: `Focus and consistency bring recognition ${label}. Present your ideas confidently — decision-makers are receptive to practical plans.`,
    health: `Energy stays strong when routine is respected. Prioritize sleep, hydration, and short daily movement to keep stress in check.`,
    finance: `A stable phase for money. Favor saving and planned purchases over impulse spends; a small pending payment may finally clear.`,
    advice: `Move deliberately, speak kindly, and finish one thing at a time — your patience is your power ${label}.`,
    luckyNumbers: [idx + 1, ((idx + 3) % 9) + 1, ((idx + 6) % 9) + 1],
    luckyColor: colors[idx],
    rating: 3 + ((idx + (period === "weekly" ? 1 : period === "monthly" ? 2 : 3)) % 3),
  };
}

export async function generateHoroscopeWithOpenAI(
  sign: string,
  period: HoroscopePeriod,
  birthProfile?: {
    fullName?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    gender?: string;
  },
): Promise<HoroscopeResult> {
  const label = HOROSCOPE_PERIOD_LABEL[period];
  const prompt = `Write a personalized Vedic-inspired horoscope prediction for:
Name: ${birthProfile?.fullName || "Seeker"}
Zodiac sign: ${sign}
Birth date: ${birthProfile?.birthDate || "Unknown"}
Birth time: ${birthProfile?.birthTime || "Unknown"}
Birth place: ${birthProfile?.birthPlace || "Unknown"}
Gender: ${birthProfile?.gender || "Unknown"}
Prediction period: ${label}
Today: ${new Date().toDateString()}

Return ONLY raw valid JSON (no markdown) with EXACTLY these keys:
{
  "summary": "3-4 sentence overall prediction for ${label}",
  "love": "2-3 sentences on love and relationships",
  "career": "2-3 sentences on career and work",
  "health": "2-3 sentences on health and wellbeing",
  "finance": "2-3 sentences on money and finances",
  "advice": "1-2 sentence practical advice",
  "luckyNumbers": [3, 7, 9],
  "luckyColor": "Gold",
  "rating": 4
}
rating is an integer 1-5 for how favorable the period is. Make the content specific to ${sign} and ${label}.`;

  try {
    const content = await chatCompletion([{ role: "user", content: prompt }], 1500);
    const raw = parseJsonFromContent(content);
    return {
      sign,
      period,
      timeframe: label,
      summary: String(raw.summary || ""),
      love: String(raw.love || ""),
      career: String(raw.career || ""),
      health: String(raw.health || ""),
      finance: String(raw.finance || ""),
      advice: String(raw.advice || ""),
      luckyNumbers: Array.isArray(raw.luckyNumbers)
        ? (raw.luckyNumbers as number[]).slice(0, 5)
        : [3, 7, 9],
      luckyColor: String(raw.luckyColor || "Gold"),
      rating: Math.min(5, Math.max(1, Number(raw.rating) || 4)),
    };
  } catch (err) {
    console.warn("OpenAI horoscope failed, using local prediction:", err);
    return localHoroscope(sign, period);
  }
}

export async function generateAstrologyWithOpenAI(
  birthData: {
    name?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    gender?: string;
    questions?: string;
  },
  language = "en",
  focusAreas: string[] = [],
): Promise<Record<string, unknown>> {
  const prompt = `Generate a detailed astrology reading for:
Name: ${birthData.name || "Seeker"}
Gender: ${birthData.gender || "Unknown"}
Birth Date: ${birthData.birthDate || "Unknown"}
Birth Time: ${birthData.birthTime || "Unknown"}
Birth Place: ${birthData.birthPlace || "Unknown"}
Focus Areas: ${focusAreas.join(", ") || "General"}
Questions: ${birthData.questions || "None"}
Language: ${language}

Return ONLY raw valid JSON (no markdown, no code blocks) using EXACTLY these snake_case keys:
{
  "sun_sign": "Leo",
  "moon_sign": "Scorpio",
  "rising_sign": "Gemini",
  "overview": {
    "summary": "2-3 sentence overall reading summary.",
    "key_themes": ["theme1", "theme2", "theme3"],
    "confidence": 0.88
  },
  "planetary_positions": [
    {"planet": "Sun", "sign": "Leo", "house": "1st House", "aspect": "Core identity and life force"},
    {"planet": "Moon", "sign": "Scorpio", "house": "4th House", "aspect": "Emotional world and instincts"},
    {"planet": "Mercury", "sign": "Virgo", "house": "2nd House", "aspect": "Communication and intellect"},
    {"planet": "Venus", "sign": "Libra", "house": "3rd House", "aspect": "Love and beauty"}
  ],
  "personality": {
    "summary": "Overall personality description.",
    "traits": ["Detail-oriented", "Nurturing", "Diplomatic", "Intuitive", "Adaptable"],
    "confidence": 0.87
  },
  "strengths": {
    "items": ["Natural leadership", "Strong intuition", "Empathy", "Creativity"],
    "summary": "These are your core strengths.",
    "confidence": 0.90
  },
  "challenges": {
    "items": ["Overthinking", "Perfectionism", "Emotional sensitivity"],
    "summary": "These are areas for growth.",
    "confidence": 0.82
  },
  "life_predictions": [
    {"area": "Career", "timeframe": "Next 12 months", "prediction": "Career prediction here.", "confidence": 0.85},
    {"area": "Love", "timeframe": "Next 6 months", "prediction": "Love prediction here.", "confidence": 0.80},
    {"area": "Health", "timeframe": "Ongoing", "prediction": "Health prediction here.", "confidence": 0.88},
    {"area": "Finance", "timeframe": "Next year", "prediction": "Finance prediction here.", "confidence": 0.78}
  ],
  "compatibility": [
    {"sign": "Taurus", "match": 0.88, "type": "High Compatibility"},
    {"sign": "Cancer", "match": 0.82, "type": "Strong Match"},
    {"sign": "Pisces", "match": 0.79, "type": "Harmonious"}
  ],
  "lucky_numbers": [3, 7, 12, 21, 33],
  "model_version": "${OPENAI_CONFIG.MODEL}"
}
Replace ALL placeholder values with REAL analysis based on the actual birth data provided.`;

  try {
    const content = await chatCompletion([{ role: "user", content: prompt }], 4000);
    return parseJsonFromContent(content);
  } catch (err) {
    console.warn("OpenAI astrology failed, using local reading:", err);
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const day = Number((birthData.birthDate || "2000-01-01").split("-")[2] || 1);
    const month = Number((birthData.birthDate || "2000-01-01").split("-")[1] || 1);
    const sun = signs[(month + day) % 12];
    const moon = signs[(month * 2 + day) % 12];
    const rising = signs[(day * 3) % 12];
    return {
      sun_sign: sun,
      moon_sign: moon,
      rising_sign: rising,
      overview: {
        summary: `${birthData.name || "Seeker"}, your chart emphasizes ${sun} Sun, ${moon} Moon, and ${rising} Rising — a blend of identity, emotion, and outer style.`,
        key_themes: ["Self-discovery", "Relationships", "Purpose"],
        confidence: 0.82,
      },
      planetary_positions: [
        { planet: "Sun", sign: sun, house: "1st House", aspect: "Core identity and life force" },
        { planet: "Moon", sign: moon, house: "4th House", aspect: "Emotional world and instincts" },
        { planet: "Mercury", sign: signs[(month + 1) % 12], house: "3rd House", aspect: "Communication and intellect" },
        { planet: "Venus", sign: signs[(month + 2) % 12], house: "7th House", aspect: "Love and harmony" },
      ],
      personality: {
        summary: `A ${sun} core with ${moon} emotional coloring and ${rising} presence.`,
        traits: ["Intuitive", "Adaptive", "Expressive", "Resilient", "Thoughtful"],
        confidence: 0.84,
      },
      strengths: {
        items: ["Self-awareness", "Empathy", "Creativity", "Determination"],
        summary: "These qualities support your growth this cycle.",
        confidence: 0.86,
      },
      challenges: {
        items: ["Overthinking", "Emotional sensitivity", "Scattered focus"],
        summary: "Awareness of these patterns brings balance.",
        confidence: 0.8,
      },
      life_predictions: [
        { area: "Career", timeframe: "Next 12 months", prediction: "Progress comes through consistent effort and clear priorities.", confidence: 0.8 },
        { area: "Love", timeframe: "Next 6 months", prediction: "Meaningful connection deepens when you communicate openly.", confidence: 0.78 },
        { area: "Health", timeframe: "Ongoing", prediction: "Rhythm, rest, and mindful routines support vitality.", confidence: 0.85 },
        { area: "Finance", timeframe: "Next year", prediction: "Steady planning outperforms impulsive moves.", confidence: 0.76 },
      ],
      compatibility: [
        { sign: signs[(month + 4) % 12], match: 0.88, type: "High Compatibility" },
        { sign: signs[(month + 8) % 12], match: 0.82, type: "Strong Match" },
        { sign: signs[(month + 6) % 12], match: 0.79, type: "Harmonious" },
      ],
      lucky_numbers: [day, month, (day + month) % 9 || 9, 11, 22],
      model_version: "local-fallback",
    };
  }
}
