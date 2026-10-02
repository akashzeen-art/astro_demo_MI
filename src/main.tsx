import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Filter out recharts defaultProps warnings in development
if (process.env.NODE_ENV === "development") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Support for defaultProps will be removed") &&
      (args[0].includes("XAxis") || args[0].includes("YAxis"))
    ) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };

  // Suppress fetch errors since we're using mock API
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.includes("fetch") ||
      event.reason?.name === "TypeError"
    ) {
      console.warn(
        "🔇 Suppressed fetch error (using mock API):",
        event.reason.message,
      );
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
