"use client";

import { useEffect, useState } from "react";
import { primeSpeechSynthesis } from "@/hooks/useSpeech";
import { LEVELS, TRACKS, type Level, type Track } from "@/lib/types";

export interface SetupValues {
  track: Track;
  level: Level;
  autoSubmit: boolean;
}

interface Health {
  ok: boolean;
  anthropicKeyConfigured?: boolean;
  model?: string;
  durationSec?: number;
  error?: string;
}

const TRACK_BLURB: Record<Track, string> = {
  java: "Core Java, collections, concurrency, JVM, Spring, modern Java",
  ml: "Fundamentals, metrics, classical ML, deep learning, LLMs & RAG, MLOps",
};

export default function Setup({ onStart }: { onStart: (v: SetupValues, durationSec: number) => void }) {
  const [track, setTrack] = useState<Track>("java");
  const [level, setLevel] = useState<Level>("middle");
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [health, setHealth] = useState<Health | null>(null);
  const [voiceOk, setVoiceOk] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setHealth({ ok: false, error: String(e) }));
    const w = window as unknown as Record<string, unknown>;
    setVoiceOk(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition) && "speechSynthesis" in window);
  }, []);

  const durationSec = health?.durationSec ?? 600;
  const warnings: string[] = [];
  if (health && !health.ok) warnings.push(`Backend not ready: ${health.error ?? "unavailable"}`);
  if (health && health.anthropicKeyConfigured === false) warnings.push("ANTHROPIC_API_KEY is not set on the server.");
  if (!voiceOk) warnings.push("This browser lacks speech recognition — use Chrome or Edge for voice, or type answers.");

  const start = async () => {
    // Unlock speech synthesis while we still hold the click's user activation.
    primeSpeechSynthesis();
    // Ask for the mic up front so the first answer isn't interrupted by a permission prompt.
    try {
      const s = await navigator.mediaDevices?.getUserMedia({ audio: true });
      s?.getTracks().forEach((t) => t.stop());
    } catch {
      /* user can still type */
    }
    onStart({ track, level, autoSubmit }, durationSec);
  };

  return (
    <div className="setup card">
      <h1>
        Meet <span className="accent">Whiskers</span>, your AI interviewer
      </h1>
      <p className="muted">
        A {Math.round(durationSec / 60)}-minute voice interview with follow-up questions, then detailed feedback.
        {health?.model && (
          <>
            <br />
            <span className="small">
              Powered by <code>{health.model}</code>
            </span>
          </>
        )}
      </p>

      <h2>Role</h2>
      <div className="tracks">
        {(Object.keys(TRACKS) as Track[]).map((t) => (
          <button key={t} className={`track ${track === t ? "track--active" : ""}`} onClick={() => setTrack(t)}>
            <span className="track__icon">{t === "java" ? "☕" : "🧠"}</span>
            <strong>{TRACKS[t]}</strong>
            <small>{TRACK_BLURB[t]}</small>
          </button>
        ))}
      </div>

      <h2>Level</h2>
      <div className="segmented">
        {LEVELS.map((l) => (
          <button key={l} className={level === l ? "active" : ""} onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
      </div>

      <label className="toggle">
        <input type="checkbox" checked={autoSubmit} onChange={(e) => setAutoSubmit(e.target.checked)} />
        <span>Send my answer automatically after a 5-second pause</span>
      </label>

      {warnings.length > 0 && (
        <ul className="warnings">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <button className="btn btn--big" onClick={start} disabled={health === null}>
        Start interview
      </button>
      <p className="muted small">Tip: use headphones so Whiskers doesn&apos;t hear itself.</p>
    </div>
  );
}
