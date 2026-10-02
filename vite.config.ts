import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { openaiDevProxy } from "./vite-openai-proxy";

export default defineConfig({
  plugins: [react(), openaiDevProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    global: "globalThis",
  },
  esbuild: {
    // Keep console for websocket / runtime diagnostics in production
    drop: process.env.NODE_ENV === "production" ? ["debugger"] : [],
  },
  server: {
    host: true,
    port: 3000,
    strictPort: false,
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false,
    },
    watch: {
      usePolling: false,
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("three") || id.includes("three-stdlib")) return "three";
          if (id.includes("@stomp") || id.includes("sockjs")) return "stomp";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("gsap")) return "gsap";
          if (id.includes("@radix-ui")) return "ui";
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "export-tools";
        },
      },
    },
  },
  optimizeDeps: {
    include: ["gsap", "gsap/ScrollTrigger"],
  },
  logLevel: "info", // Show all normal logs (fixes your issue)
  clearScreen: false, // Do not clear terminal on restart
});
