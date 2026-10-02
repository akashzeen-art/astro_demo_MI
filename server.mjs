/**
 * Production server: serves dist/ + OpenAI proxy.
 * Use when Node is available: npm run build && npm start
 *
 * On nginx-only hosts, deploy public/openai-proxy.php instead
 * (see nginx-openai-proxy.conf).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OPENAI_API_KEY =
  "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";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);
const PROXY_PATHS = new Set([
  "/openai-proxy",
  "/openai-proxy.php",
  "/api/openai/chat-completions",
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".php": "text/plain",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function proxyOpenAI(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "Method not allowed" } }));
    return;
  }

  try {
    const body = await readBody(req);
    const openaiRes = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body,
    });
    const text = await openaiRes.text();
    res.writeHead(openaiRes.status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(text);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: { message: err instanceof Error ? err.message : "Proxy failed" },
      }),
    );
  }
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(DIST, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  const index = path.join(DIST, "index.html");
  if (fs.existsSync(index)) {
    sendFile(res, index);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  if (PROXY_PATHS.has(urlPath)) {
    await proxyOpenAI(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`My Astro Sutra listening on http://localhost:${PORT}`);
});
