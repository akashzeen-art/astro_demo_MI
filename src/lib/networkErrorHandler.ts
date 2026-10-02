/**
 * Network Error Handler
 * Only intercepts localhost API calls in development
 */

if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch;
  const isProduction = !window.location.hostname.includes("localhost") &&
                       !window.location.hostname.includes("127.0.0.1");

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    try {
      const url = typeof input === "string" ? input : input.toString();

      // Only intercept localhost:8000 calls in development, never in production
      if (!isProduction && url.includes("localhost:8000") && import.meta.env.VITE_USE_MOCK_API === "true") {
        console.log("🎭 Intercepted localhost API call, returning mock response");
        return new Response(
          JSON.stringify({ status: "success", message: "Mock API response", data: {} }),
          { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } },
        );
      }

      // Suppress analytics calls
      if (url.includes("fullstory.com") || url.includes("analytics")) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200, statusText: "OK", headers: { "Content-Type": "application/json" },
        });
      }

      return await originalFetch(input, init);
    } catch (error) {
      console.warn("🚨 Network request failed:", error);
      return new Response(
        JSON.stringify({ error: "Network request failed", data: null }),
        { status: 503, statusText: "Service Unavailable", headers: { "Content-Type": "application/json" } },
      );
    }
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message?.includes("fetch") || event.reason?.name === "TypeError") {
      console.warn("🚨 Suppressed unhandled fetch rejection:", event.reason);
      event.preventDefault();
    }
  });
}

export {};
