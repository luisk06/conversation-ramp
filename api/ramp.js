import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { answers = [], context = "new_friend", language = "en" } = req.body || {};

    const instructions = `
You generate conversation starters based on simple preference signals.
Do NOT claim psychological traits or profiles.
Do NOT mention psychology, dopamine, or manipulation.
Keep language natural, warm, and short.

Return ONLY valid JSON with:
openers (3 strings)
followups (3 strings)
handoff (1 string)
`;

    const input = {
      answers,
      context,
      language,
      goal: "help someone start a conversation smoothly and take control quickly"
    };

    const response = await client.responses.create({
      model: "gpt-5",
      instructions,
      input: JSON.stringify(input),
      text: { format: { type: "json_object" } }
    });

    const raw = response.output_text || "{}";
    let data;
    try { data = JSON.parse(raw); }
    catch { data = {}; }

    if (!data.openers || !data.followups || !data.handoff) {
      return res.json({
        openers:[
          "Hey — no rush, but I wanted to say hi.",
          "Quick hello 🙂 How’s your day going?",
          "Random question: what’s something you’ve been enjoying lately?"
        ],
        followups:[
          "What’s been on your mind lately?",
          "Any small win recently?",
          "What’s your current vibe today?"
        ],
        handoff:"Your turn whenever — even a short reply is perfect."
      });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}