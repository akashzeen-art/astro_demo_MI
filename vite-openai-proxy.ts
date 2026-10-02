import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OPENAI_API_KEY as FALLBACK_KEY, OPENAI_CHAT_URL } from "./api/_openai-key";

const PROXY_PATHS = new Set([
  "/openai-proxy.php",
  "/openai-proxy",
  "/api/openai/chat-completions",
]);

const KEY_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "api/_openai-key.ts",
);

function readApiKey(): string {
  try {
    const text = fs.readFileSync(KEY_FILE, "utf8");
    const match = text.match(/OPENAI_API_KEY\s*=\s*"([^"]+)"/);
    if (match?.[1]) return match[1];
  } catch {
    // fall through
  }
  return FALLBACK_KEY;
}

export function openaiDevProxy(): Plugin {
  return {
    name: "openai-dev-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!url || !PROXY_PATHS.has(url) || (req.method !== "POST" && req.method !== "OPTIONS")) {
          return next();
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.end();
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", async () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            const openaiRes = await fetch(OPENAI_CHAT_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${readApiKey()}`,
                "Content-Type": "application/json",
              },
              body,
            });

            const text = await openaiRes.text();
            res.statusCode = openaiRes.status;
            res.setHeader("Content-Type", "application/json");
            res.end(text);
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: { message: "OpenAI proxy request failed" } }),
            );
          }
        });
      });
    },
  };
}
