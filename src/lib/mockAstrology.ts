/** Backend-shaped astrology result for standalone mock mode */
export function getMockAstrologyBackendResult(birthData?: {
  name?: string;
  birthDate?: string;
  birthPlace?: string;
}) {
  const name = birthData?.name?.trim() || "Seeker";
  return {
    sun_sign: "Leo",
    moon_sign: "Scorpio",
    rising_sign: "Gemini",
    model_version: "standalone-v1",
    overview: {
      summary: `${name}, your chart reveals a powerful blend of creative fire, emotional depth, and intellectual curiosity. The cosmos aligns to support growth in career, relationships, and spiritual awareness.`,
      key_themes: ["Leadership", "Transformation", "Communication", "Purpose"],
      confidence: 0.91,
    },
    personality: {
      summary:
        "You are a natural leader with deep emotional intelligence and excellent communication skills.",
      confidence: 0.89,
      traits: [
        "Detail-oriented",
        "Nurturing",
        "Diplomatic",
        "Intuitive",
        "Ambitious",
        "Creative",
      ],
    },
    strengths: {
      summary: "Your greatest strengths lie in leadership, empathy, and creative problem-solving.",
      confidence: 0.88,
      items: ["Leadership", "Emotional Intelligence", "Creativity", "Determination"],
    },
    challenges: {
      summary: "Growth areas include patience, delegation, and balancing ambition with rest.",
      confidence: 0.78,
      items: ["Impatience", "Overthinking", "Perfectionism"],
    },
    planetary_positions: [
      { planet: "Sun", sign: "Leo", house: "10th House", aspect: "Career visibility and recognition" },
      { planet: "Moon", sign: "Scorpio", house: "4th House", aspect: "Deep emotional roots" },
      { planet: "Mercury", sign: "Virgo", house: "11th House", aspect: "Analytical social connections" },
      { planet: "Venus", sign: "Cancer", house: "9th House", aspect: "Love of wisdom and travel" },
      { planet: "Mars", sign: "Aries", house: "6th House", aspect: "Energetic daily routines" },
      { planet: "Jupiter", sign: "Sagittarius", house: "2nd House", aspect: "Abundance through knowledge" },
    ],
    life_predictions: [
      {
        area: "Career",
        timeframe: "Next 6 months",
        prediction:
          "A significant opportunity for advancement or recognition is approaching. Your leadership qualities will be noticed.",
        confidence: 0.87,
      },
      {
        area: "Love & Relationships",
        timeframe: "Next 3 months",
        prediction:
          "Existing bonds deepen; singles may meet someone through social or professional circles.",
        confidence: 0.84,
      },
      {
        area: "Health & Wellness",
        timeframe: "Ongoing",
        prediction:
          "Focus on stress management and consistent routines for sustained vitality.",
        confidence: 0.9,
      },
      {
        area: "Finances",
        timeframe: "Next 12 months",
        prediction:
          "Steady growth through disciplined planning; avoid impulsive investments.",
        confidence: 0.82,
      },
    ],
    career_path: {
      text: "Success comes through leadership roles, creative pursuits, or communication-focused fields.",
      confidence: 0.86,
    },
    relationship_insights: {
      text: "You seek deep, transformative connections and are fiercely loyal to those you love.",
      confidence: 0.88,
    },
    spiritual_message: {
      text: "Your spiritual path involves creative self-expression and guiding others toward their potential.",
      confidence: 0.87,
    },
    birth_place: birthData?.birthPlace || "India",
    birth_date: birthData?.birthDate || "",
  };
}
