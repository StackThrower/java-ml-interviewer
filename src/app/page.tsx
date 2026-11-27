"use client";

import { useCallback, useState } from "react";
import FeedbackView from "@/components/FeedbackView";
import InterviewRoom from "@/components/InterviewRoom";
import Setup, { type SetupValues } from "@/components/Setup";
import type { Feedback, TranscriptEntry } from "@/lib/types";

type Phase =
  | { name: "setup" }
  | { name: "interview"; setup: SetupValues; durationSec: number }
  | {
      name: "feedback";
      setup: SetupValues;
      transcript: TranscriptEntry[];
      elapsedSec: number;
      feedback: Feedback | null;
      error: string | null;
    };

export default function Home() {
  const [phase, setPhase] = useState<Phase>({ name: "setup" });
  const [runId, setRunId] = useState(0);

  const requestFeedback = useCallback(
    async (setup: SetupValues, transcript: TranscriptEntry[], elapsedSec: number) => {
      setPhase({ name: "feedback", setup, transcript, elapsedSec, feedback: null, error: null });
      try {
        const res = await fetch("/api/interview/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track: setup.track, level: setup.level, transcript, elapsedSec }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        setPhase({ name: "feedback", setup, transcript, elapsedSec, feedback: data as Feedback, error: null });
      } catch (err) {
        setPhase({
          name: "feedback",
          setup,
          transcript,
          elapsedSec,
          feedback: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [],
  );

  return (
    <div className="page">
      {phase.name === "setup" && (
        <Setup
          onStart={(setup, durationSec) => {
            setRunId((n) => n + 1);
            setPhase({ name: "interview", setup, durationSec });
          }}
        />
      )}

      {phase.name === "interview" && (
        <InterviewRoom
          key={runId}
          track={phase.setup.track}
          level={phase.setup.level}
          durationSec={phase.durationSec}
          autoSubmit={phase.setup.autoSubmit}
          silenceMs={5000}
          onFinish={(transcript, elapsedSec) => void requestFeedback(phase.setup, transcript, elapsedSec)}
        />
      )}

      {phase.name === "feedback" && (
        <FeedbackView
          track={phase.setup.track}
          level={phase.setup.level}
          transcript={phase.transcript}
          feedback={phase.feedback}
          error={phase.error}
          onRetry={() => void requestFeedback(phase.setup, phase.transcript, phase.elapsedSec)}
          onRestart={() => setPhase({ name: "setup" })}
        />
      )}
    </div>
  );
}
