import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/lib/apiService";
import { FEATURES, API_CONFIG } from "@/lib/config";
import { CheckCircle, XCircle, Clock, Wifi, Database } from "lucide-react";

const StatusCheck = () => {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [mockApiEnabled, setMockApiEnabled] = useState(FEATURES.MOCK_API);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Try to hit a simple health endpoint
        const response = await fetch(`${API_CONFIG.BASE_URL}/health/`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setApiStatus("online");
          setMockApiEnabled(false);
        } else {
          setApiStatus("offline");
          setMockApiEnabled(true);
        }
      } catch (error) {
        setApiStatus("offline");
        setMockApiEnabled(true);
        console.log("Backend not available, using mock API:", error.message);
      }
    };

    // Only check API status in development or if explicitly enabled
    if (import.meta.env.DEV || !FEATURES.MOCK_API) {
      checkApiStatus();
    } else {
      // In production with mock API enabled, just set offline status
      setApiStatus("offline");
      setMockApiEnabled(true);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      case "checking":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4" />;
      case "offline":
        return <XCircle className="h-4 w-4" />;
      case "checking":
        return <Clock className="h-4 w-4 animate-spin" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Only show in development mode
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="glass-card border-cosmic/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <Wifi className="h-4 w-4 text-cosmic" />
            <span className="font-medium">API Status:</span>
            <div
              className={`flex items-center gap-1 ${getStatusColor(apiStatus)}`}
            >
              {getStatusIcon(apiStatus)}
              <span className="capitalize">{apiStatus}</span>
            </div>
          </div>

          {mockApiEnabled && (
            <div className="mt-2">
              <Badge
                variant="outline"
                className="border-yellow-500/50 text-yellow-600 bg-yellow-500/10"
              >
                Mock API Active
              </Badge>
            </div>
          )}

          <div className="mt-2 text-xs text-muted-foreground">
            {apiStatus === "online"
              ? "Backend connected"
              : mockApiEnabled
                ? "Using mock data"
                : "Backend offline"}
          </div>

          <div className="mt-1 text-xs text-muted-foreground opacity-70">
            {API_CONFIG.BASE_URL}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusCheck;
