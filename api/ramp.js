import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing",
        details: "Add it in Vercel → Project Settings → Environment Variables, then redeploy."
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { answers = [], context = "new_friend", language = "en" } = req.body || {};

    const instructions = `
IMPORTANT: Respond with JSON only.

You generate conversation starters based on simple preference signals.
Do NOT claim psychological traits or profiles.
Do NOT mention psychology, dopamine, or manipulation.
Keep language natural, warm, and short.

Return a JSON object with exactly these keys:
- "openers": array of 3 strings
- "followups": array of 3 strings
- "handoff": string
`;

    const input = {
      answers,
      context,
      language,
      output_format: "JSON",
      goal: "help someone start a conversation smoothly and take control quickly",
      constraints: { max_chars_per_line: 140 }
    };

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions,
      input: JSON.stringify(input),
      text: { format: { type: "json_object" } }
    });

    const raw = response.output_text || "{}";

    let data = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    const openers = Array.isArray(data.openers) ? data.openers.slice(0, 3) : null;
    const followups = Array.isArray(data.followups) ? data.followups.slice(0, 3) : null;
    const handoff = typeof data.handoff === "string" ? data.handoff : null;

    if (!openers || openers.length !== 3 || !followups || followups.length !== 3 || !handoff) {
      return res.status(200).json({
        openers: [
          "Hey — no rush, but I wanted to say hi.",
          "Quick hello 🙂 How’s your day going?",
          "Random question: what’s something you’ve been enjoying lately?"
        ],
        followups: [
          "What’s been on your mind lately?",
          "Any small win recently?",
          "What’s your current vibe today?"
        ],
        handoff: "Your turn whenever — even a short reply is perfect."
      });
    }

    return res.status(200).json({ openers, followups, handoff });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: String(err?.message || err)
    });
  }
}
