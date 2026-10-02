import { OPENAI_API_KEY, OPENAI_CHAT_URL } from "../_openai-key";

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => {
    json: (body: unknown) => void;
    end: (body?: string) => void;
  };
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const openaiRes = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const data = await openaiRes.json().catch(() => ({}));
    return res.status(openaiRes.status).json(data);
  } catch {
    return res.status(500).json({
      error: { message: "OpenAI proxy request failed" },
    });
  }
}
