import { GoogleGenAI, Type, ApiError } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODELS = (process.env.SCRIPT_MODELS ?? "gemini-3.5-flash,gemini-flash-latest,gemini-3-flash-preview").split(",");

const AVATAR_DESC =
  "a young Indian man in his late 20s with short black hair, a light beard, black rectangular glasses, a red crew-neck t-shirt under a black blazer";

const MODE_RULES: Record<string, string> = {
  copy: "Stay faithful to the original wording and order.",
  remix:
    "Keep the same topic, facts and structure, but REWRITE everything in fresh original words (do not copy the original sentences); make the hook even stronger.",
};

const schema = {
  type: Type.OBJECT,
  properties: {
    title_telugu: { type: Type.STRING },
    title_english: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    description_telugu: { type: Type.STRING },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          telugu_line: { type: Type.STRING },
          english_meaning: { type: Type.STRING },
          overlay_items: { type: Type.ARRAY, items: { type: Type.STRING } },
          gesture: { type: Type.STRING },
        },
        required: ["telugu_line", "english_meaning", "overlay_items", "gesture"],
        propertyOrdering: ["telugu_line", "english_meaning", "overlay_items", "gesture"],
      },
    },
  },
  required: ["title_telugu", "title_english", "hashtags", "description_telugu", "scenes"],
  propertyOrdering: ["title_telugu", "title_english", "hashtags", "description_telugu", "scenes"],
};

function prompt(scenes: number, mode: string) {
  return `Watch this short video carefully (visuals AND audio) and convert it into a Short script JSON
so it can be re-created with our own presenter avatar (${AVATAR_DESC}).

- Split the video into scenes of roughly 7-10 seconds, following the video's own beats/cuts. Use about ${scenes} scenes
  unless the video's length clearly needs more or fewer.
- telugu_line: what is spoken in that scene, in natural spoken Telugu (Telugu script). If the video is in another
  language, translate it into casual Telugu. If it has no speech, write a short Telugu narration of what is shown.
  ${MODE_RULES[mode] ?? MODE_RULES.remix}
  Keep each line speakable in 7-8 seconds (max ~18 words).
- english_meaning: English translation of telugu_line.
- overlay_items: the key objects/ingredients/props shown in that scene (English), to display as picture cards.
- gesture: the presenter's body language and camera framing for that scene (English). If the video has no presenter,
  describe how our presenter should act while explaining that scene.
- title_telugu / title_english / description_telugu / hashtags: catchy YouTube Shorts metadata for the re-created video.`;
}

const YT = /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)[\w-]{6,}/;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const url = String(body.url ?? "").trim();
  const mode = body.mode === "copy" ? "copy" : "remix";
  const scenes = Math.min(Math.max(Number(body.scenes) || 4, 2), 10);
  if (!YT.test(url)) return Response.json({ error: "Enter a valid public YouTube or Shorts URL." }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey });
  let lastErr = "";
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ fileData: { fileUri: url, mimeType: "video/*" } }, { text: prompt(scenes, mode) }] }],
        config: { responseMimeType: "application/json", responseSchema: schema, temperature: mode === "copy" ? 0.4 : 0.9 },
      });
      const script = JSON.parse(res.text ?? "{}");
      return Response.json({ script, model });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      lastErr = e instanceof Error ? e.message : String(e);
      if (![404, 429, 500, 503].includes(status)) break;
    }
  }
  return Response.json({ error: `Gemini failed: ${lastErr.slice(0, 500)}` }, { status: 502 });
}
