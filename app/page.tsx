"use client";

import { useState } from "react";

type Scene = { telugu_line: string; english_meaning: string; overlay_items: string[]; gesture: string };
type Script = { title_telugu: string; title_english: string; hashtags: string[]; description_telugu: string; scenes: Scene[] };

export default function Home() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("remix");
  const [scenes, setScenes] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [script, setScript] = useState<Script | null>(null);
  const [model, setModel] = useState("");
  const [view, setView] = useState<"scenes" | "json">("scenes");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setScript(null);
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode, scenes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setScript(data.script);
      setModel(data.model);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const json = script ? JSON.stringify(script, null, 2) : "";

  function download() {
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "script.json";
    a.click();
  }

  return (
    <main>
      <h1>Telugu Shorts Generator</h1>
      <p className="sub">Step 1: paste a YouTube video or Short, and Gemini turns it into a Telugu script JSON for the avatar.</p>

      <form className="card" onSubmit={generate}>
        <label htmlFor="url">YouTube URL</label>
        <input id="url" placeholder="https://www.youtube.com/shorts/..." value={url} onChange={(e) => setUrl(e.target.value)} required />
        <div className="row">
          <div>
            <label htmlFor="mode">Mode</label>
            <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="remix">Remix: same tips, fresh Telugu wording</option>
              <option value="copy">Copy: keep original wording</option>
            </select>
          </div>
          <div>
            <label htmlFor="scenes">Scenes (~10s each)</label>
            <input id="scenes" type="number" min={2} max={10} value={scenes} onChange={(e) => setScenes(Number(e.target.value))} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Analyzing…" : "Generate"}
            </button>
          </div>
        </div>
        {loading && <p className="muted">Gemini is watching the video. This usually takes 20–60 seconds.</p>}
        {error && <p className="err">{error}</p>}
      </form>

      {script && (
        <section className="card">
          <div className="te" style={{ fontWeight: 600 }}>{script.title_telugu}</div>
          <div className="muted">{script.title_english}</div>
          <p className="te" style={{ fontSize: 15 }}>{script.description_telugu}</p>
          <div>{script.hashtags.map((h) => <span key={h} className="chip">{h}</span>)}</div>

          <div className="actions">
            <div className="tabs">
              <button type="button" className={view === "scenes" ? "" : "ghost"} onClick={() => setView("scenes")}>Scenes</button>
              <button type="button" className={view === "json" ? "" : "ghost"} onClick={() => setView("json")}>JSON</button>
            </div>
            <button type="button" className="ghost" onClick={() => navigator.clipboard.writeText(json)}>Copy JSON</button>
            <button type="button" className="ghost" onClick={download}>Download script.json</button>
            <span className="muted">model: {model}</span>
          </div>

          {view === "json" ? (
            <pre>{json}</pre>
          ) : (
            script.scenes.map((s, i) => (
              <div key={i} className="scene">
                <div className="muted">Scene {i + 1}</div>
                <div className="te">{s.telugu_line}</div>
                <div className="muted">{s.english_meaning}</div>
                <div>{s.overlay_items.map((o) => <span key={o} className="chip">{o}</span>)}</div>
                <div className="muted" style={{ marginTop: 6 }}>Gesture: {s.gesture}</div>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}
