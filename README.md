# Telugu Shorts Generator

Step 1 of the avatar Shorts pipeline: paste a YouTube video or Shorts URL and Gemini watches it (visuals and audio) and returns a Telugu `script.json`:

```json
{
  "title_telugu": "...", "title_english": "...", "hashtags": ["..."], "description_telugu": "...",
  "scenes": [{ "telugu_line": "...", "english_meaning": "...", "overlay_items": ["..."], "gesture": "..." }]
}
```

- **Remix** (default): same topic and tips, fresh Telugu wording.
- **Copy**: keeps the original wording and order.

The video is passed to Gemini by URL, so nothing is downloaded on the server. The video must be public.

## Run locally

```bash
cp .env.example .env.local   # set GEMINI_API_KEY
npm install
npm run dev
```

## Deploy

Set `GEMINI_API_KEY` (and optionally `SCRIPT_MODELS`, a comma-separated fallback list) in the Vercel project environment variables.
