"use client";

import { TRACKS, type Feedback, type Level, type Track, type TranscriptEntry } from "@/lib/types";

const REC_LABEL: Record<Feedback["recommendation"], string> = {
  strong_hire: "Strong hire",
  hire: "Hire",
  lean_hire: "Lean hire",
  lean_no_hire: "Lean no hire",
  no_hire: "No hire",
};

function scoreClass(n: number) {
  return n >= 7 ? "good" : n >= 5 ? "ok" : "low";
}

interface Props {
  track: Track;
  level: Level;
  transcript: TranscriptEntry[];
  feedback: Feedback | null;
  error: string | null;
  onRetry: () => void;
  onRestart: () => void;
}

export default function FeedbackView({ track, level, transcript, feedback, error, onRetry, onRestart }: Props) {
  if (error) {
    return (
      <div className="card center">
        <h2>Couldn&apos;t generate feedback</h2>
        <p className="muted">{error}</p>
        <div className="row">
          <button className="btn" onClick={onRetry}>
            Try again
          </button>
          <button className="btn btn--ghost" onClick={onRestart}>
            New interview
          </button>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="card center">
        <div className="spinner" />
        <h2>Whiskers is reviewing your interview…</h2>
        <p className="muted">Scoring each topic against the rubric. This takes a few seconds.</p>
      </div>
    );
  }

  const pct = feedback.overall_score * 10;

  return (
    <div className="feedback">
      <div className="card feedback__hero">
        <div className={`score score--${scoreClass(feedback.overall_score)}`} style={{ ["--pct" as string]: pct }}>
          <span>{feedback.overall_score}</span>
          <small>/10</small>
        </div>
        <div>
          <p className="muted small">
            {TRACKS[track]} · <span className="cap">{level}</span>
          </p>
          <h1>
            <span className={`rec rec--${feedback.recommendation}`}>{REC_LABEL[feedback.recommendation]}</span>
          </h1>
          <p className="muted">Estimated level: {feedback.estimated_level}</p>
        </div>
      </div>

      <div className="card">
        <h2>Summary</h2>
        <p>{feedback.summary}</p>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>✅ Strengths</h2>
          <ul>
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>🎯 To improve</h2>
          <ul>
            {feedback.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {feedback.topics.length > 0 && (
        <div className="card">
          <h2>Topics</h2>
          <div className="topics">
            {feedback.topics.map((t) => (
              <div key={t.topic} className="topic">
                <div className="topic__head">
                  <strong>{t.topic}</strong>
                  <span className={`badge badge--${scoreClass(t.score)}`}>{t.score}/10</span>
                </div>
                <div className="bar">
                  <div className={`bar__fill bar__fill--${scoreClass(t.score)}`} style={{ width: `${t.score * 10}%` }} />
                </div>
                <p className="muted small">{t.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>📚 Study plan</h2>
        <ol>
          {feedback.study_plan.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <details className="card">
        <summary>Full transcript ({transcript.length} turns)</summary>
        <div className="transcript">
          {transcript.map((e, i) => (
            <p key={i} className={`line line--${e.role}`}>
              <b>{e.role === "interviewer" ? "🐱 Whiskers" : "🧑 You"}:</b> {e.text}
            </p>
          ))}
        </div>
      </details>

      <div className="row center">
        <button className="btn btn--big" onClick={onRestart}>
          Start a new interview
        </button>
      </div>
    </div>
  );
}
