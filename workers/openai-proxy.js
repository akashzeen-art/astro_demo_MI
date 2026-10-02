/**
 * Cloudflare Worker — OpenAI proxy (no nginx / no VPS changes).
 *
 * Setup (2 minutes):
 * 1. https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file as the worker code
 * 3. Deploy → copy the workers.dev URL
 * 4. Put that URL in src/lib/config.ts → OPENAI_CONFIG.PROXY_URL
 *
 * Example PROXY_URL: "https://myastrosutra-openai.your-subdomain.workers.dev"
 */
const OPENAI_API_KEY =
  "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";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: { message: "Method not allowed" } },
        { status: 405, headers: corsHeaders },
      );
    }

    try {
      const body = await request.text();
      const openaiRes = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body,
      });

      const text = await openaiRes.text();
      return new Response(text, {
        status: openaiRes.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      return Response.json(
        { error: { message: err?.message || "Proxy failed" } },
        { status: 500, headers: corsHeaders },
      );
    }
  },
};
