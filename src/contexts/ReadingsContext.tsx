import React, { createContext, useContext, useState, useCallback } from "react";
import { apiService } from "@/lib/apiService";
import type {
  PalmReading,
  AstrologyReading,
  Reading as BaseReading,
} from "@/lib/apiService";
import { STORAGE_KEYS } from "@/lib/config";

// Support all reading types including numerology
type Reading = PalmReading | AstrologyReading | BaseReading;

interface ReadingsContextType {
  readings: Reading[];
  currentReading: Reading | null;
  isAnalyzing: boolean;
  progress: number;
  setCurrentReading: (reading: Reading | null) => void;
  addReading: (reading: Reading) => void;
  updateReading: (id: string, updates: Partial<Reading>) => void;
  deleteReading: (id: string) => void;
  loadReadings: () => Promise<void>;
  startPalmAnalysis: (file: File) => Promise<PalmReading>;
  startAstrologyReading: (birthData: any) => Promise<AstrologyReading>;
}

const ReadingsContext = createContext<ReadingsContextType | undefined>(
  undefined,
);

export const useReadings = (): ReadingsContextType => {
  const context = useContext(ReadingsContext);
  if (!context) {
    throw new Error("useReadings must be used within a ReadingsProvider");
  }
  return context;
};

interface ReadingsProviderProps {
  children: React.ReactNode;
}

export const ReadingsProvider: React.FC<ReadingsProviderProps> = ({
  children,
}) => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [currentReading, setCurrentReading] = useState<Reading | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const addReading = useCallback((reading: Reading) => {
    setReadings((prev) => [reading, ...prev]);
  }, []);

  const updateReading = useCallback(
    (id: string, updates: Partial<Reading>) => {
      setReadings((prev) =>
        prev.map((reading) =>
          reading.id === id ? { ...reading, ...updates } as Reading : reading,
        ),
      );

      if (currentReading?.id === id) {
        setCurrentReading((prev) => (prev ? { ...prev, ...updates } as Reading : null));
      }
    },
    [currentReading],
  );

  const deleteReading = useCallback(
    (id: string) => {
      setReadings((prev) => prev.filter((reading) => reading.id !== id));
      if (currentReading?.id === id) {
        setCurrentReading(null);
      }
    },
    [currentReading],
  );

  const loadReadings = useCallback(async () => {
    try {
      const response = await apiService.getReadings(20);
      // getReadings now returns { count, next, previous, results }
      const readingHistory = response.results || [];
      // Convert BaseReading[] to Reading[] (PalmReading | AstrologyReading | BaseReading)
      setReadings(readingHistory as Reading[]);
    } catch (error) {
      console.error("Failed to load readings:", error);
    }
  }, []);

  const startPalmAnalysis = useCallback(
    async (file: File): Promise<PalmReading> => {
      setIsAnalyzing(true);
      setProgress(0);

      try {
        // Use new direct analysis endpoint (matches specification)
        setProgress(20);

        // Progress simulation while waiting for AI analysis
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = Math.min(prev + 10, 90);
            return newProgress;
          });
        }, 300);

        const analysisResult = await apiService.analyzePalmImage(file);
        clearInterval(progressInterval);

        setProgress(100);

        // Transform result to PalmReading format
        const reading: PalmReading = {
          id: analysisResult.reading_id,
          user: "",
          type: "palm_analysis",
          status: "completed",
          accuracy: analysisResult.result?.overallScore || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          results: analysisResult.result,
        };

        addReading(reading);
        setCurrentReading(reading);

        // Automatically save reading to Dashboard (only if user is authenticated)
        if (reading.results) {
          try {
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (token) {
            await apiService.saveReading({
              reading_type: "palm_analysis",
              result: reading.results,
              accuracy: reading.accuracy,
              source_id: reading.id,
              // Palm readings don't reference other palm readings
            });
            console.log("✅ Palm reading saved to Dashboard");
            // Trigger Dashboard refresh event
            window.dispatchEvent(new CustomEvent("reading-saved", { 
              detail: { reading_type: "palm_analysis" } 
            }));
            } else {
              console.log("ℹ️ User not logged in - reading available locally only");
            }
          } catch (error: any) {
            // Only log if it's not an authentication error (which is expected for non-logged-in users)
            if (error?.message?.includes("Not authenticated")) {
              console.log("ℹ️ Please log in to save readings to your Dashboard");
            } else {
              console.warn("⚠️ Failed to save palm reading to Dashboard:", error);
            }
            // Don't throw - reading is still available locally
          }
        }

        return reading;
      } catch (error: any) {
        console.error("Palm analysis failed:", error);
        setProgress(0);
        // Re-throw with user-friendly message
        const errorMessage = error?.message || "Palm analysis failed. Please try again with a clear image.";
        throw new Error(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [addReading],
  );

  const startAstrologyReading = useCallback(
    async (birthData: {
      name: string;
      birth_date: string;
      birth_time: string;
      birth_place: string;
      gender: string;
    }): Promise<AstrologyReading> => {
      setIsAnalyzing(true);
      setProgress(0);

      try {
        // Simulate progress updates with different stages
        const stages = [
          "Mapping celestial coordinates...",
          "Calculating planetary aspects...",
          "Analyzing house positions...",
          "Generating personalized insights...",
        ];

        let currentStage = 0;
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + 8;

            // Update stage every 25%
            if (newProgress > (currentStage + 1) * 25 && currentStage < 3) {
              currentStage++;
            }

            if (newProgress >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return newProgress;
          });
        }, 300);

        const reading = await apiService.createAstrologyReading(birthData);
        clearInterval(progressInterval);

        setProgress(100);
        addReading(reading);
        setCurrentReading(reading);

        // Automatically save reading to Dashboard (only if user is authenticated)
        if (reading.results) {
          try {
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (token) {
              await apiService.saveReading({
                reading_type: "astrology_reading",
                result: reading.results,
                accuracy: reading.accuracy,
                source_id: reading.id,
              });
              console.log("✅ Astrology reading saved to Dashboard");
              // Trigger Dashboard refresh event
              window.dispatchEvent(new CustomEvent("reading-saved", { 
                detail: { reading_type: "astrology_reading" } 
              }));
            } else {
              console.log("ℹ️ User not logged in - reading available locally only");
            }
          } catch (error: any) {
            // Only log if it's not an authentication error (which is expected for non-logged-in users)
            if (error?.message?.includes("Not authenticated")) {
              console.log("ℹ️ Please log in to save readings to your Dashboard");
            } else {
              console.warn("⚠️ Failed to save astrology reading to Dashboard:", error);
            }
            // Don't throw - reading is still available locally
          }
        }

        return reading;
      } catch (error) {
        console.error("Astrology reading failed:", error);
        setProgress(0);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [addReading],
  );

  const value: ReadingsContextType = {
    readings,
    currentReading,
    isAnalyzing,
    progress,
    setCurrentReading,
    addReading,
    updateReading,
    deleteReading,
    loadReadings,
    startPalmAnalysis,
    startAstrologyReading,
  };

  return (
    <ReadingsContext.Provider value={value}>
      {children}
    </ReadingsContext.Provider>
  );
};

export default ReadingsProvider;
