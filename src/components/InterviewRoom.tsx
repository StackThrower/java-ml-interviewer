"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cat, { type CatState } from "./Cat";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import { TRACKS, type Level, type Track, type TranscriptEntry, type TurnResponse } from "@/lib/types";

type Status = "thinking" | "speaking" | "listening" | "ending";

interface Props {
  track: Track;
  level: Level;
  durationSec: number;
  autoSubmit: boolean;
  silenceMs: number;
  onFinish: (transcript: TranscriptEntry[], elapsedSec: number) => void;
}

const OUT_OF_TIME_LINE =
  "And that's time! Thank you so much for chatting with me. Give me a moment while I prepare your feedback.";

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function InterviewRoom({ track, level, durationSec, autoSubmit, silenceMs, onFinish }: Props) {
  const [status, setStatus] = useState<Status>("thinking");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [caption, setCaption] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [silenceLeft, setSilenceLeft] = useState<number | null>(null);

  const startedAt = useRef(0);
  const lastActivity = useRef(Date.now());
  const mouthPulse = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const finished = useRef(false);

  const tts = useSpeechSynthesis();
  const stt = useSpeechRecognition({
    onFinal: (text) => {
      if (!text) return;
      setDraft((d) => (d ? `${d} ${text}` : text));
    },
    onActivity: () => (lastActivity.current = Date.now()),
  });

  const { start: sttStart, stop: sttStop } = stt;
  const getElapsed = useCallback(() => (Date.now() - startedAt.current) / 1000, []);

  const finish = useCallback(
    (t: TranscriptEntry[]) => {
      if (finished.current) return;
      finished.current = true;
      setStatus("ending");
      sttStop();
      onFinish(t, Math.min(getElapsed(), durationSec));
    },
    [durationSec, getElapsed, onFinish, sttStop],
  );

  const say = useCallback(
    async (text: string) => {
      setCaption(text);
      setStatus("speaking");
      await tts.speak(text, () => (mouthPulse.current = 1));
    },
    [tts],
  );

  const startListening = useCallback(() => {
    setDraft("");
    lastActivity.current = Date.now();
    setStatus("listening");
    if (stt.supported) sttStart();
  }, [stt.supported, sttStart]);

  const runTurn = useCallback(
    async (t: TranscriptEntry[], timeUp = false) => {
      setError(null);
      setStatus("thinking");
      let turn: TurnResponse;
      try {
        const res = await fetch("/api/interview/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track, level, transcript: t, elapsedSec: getElapsed(), timeUp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        turn = data as TurnResponse;
      } catch (err) {
        setError({ message: err instanceof Error ? err.message : String(err), retry: () => runTurn(t, timeUp) });
        return;
      }
      if (finished.current) return;

      // Attach the interviewer's grade to the answer it just evaluated.
      const graded = t.map((e, i) =>
        i === t.length - 1 && e.role === "candidate" && turn.answer_grade ? { ...e, grade: turn.answer_grade } : e,
      );
      const next: TranscriptEntry[] = [
        ...graded,
        { role: "interviewer", text: turn.say, topic: turn.topic, kind: turn.kind },
      ];
      setTranscript(next);
      await say(turn.say);
      if (finished.current) return;

      if (turn.kind === "closing" || timeUp) return finish(next);
      if (getElapsed() >= durationSec) {
        await say(OUT_OF_TIME_LINE);
        return finish(next);
      }
      startListening();
    },
    [durationSec, finish, getElapsed, level, say, startListening, track],
  );

  const submitAnswer = useCallback(
    (timeUp = false) => {
      if (statusRef.current !== "listening") return;
      statusRef.current = "thinking"; // guard against double-submit before the re-render
      const pending = sttStop();
      const text = [draftRef.current, pending].filter(Boolean).join(" ").trim() || "(no answer given)";
      setDraft("");
      setSilenceLeft(null);
      const next: TranscriptEntry[] = [...transcriptRef.current, { role: "candidate", text }];
      setTranscript(next);
      void runTurn(next, timeUp);
    },
    [runTurn, sttStop],
  );

  // Kick off the interview once.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startedAt.current = Date.now();
    void runTurn([]);
  }, [runTurn]);

  // Clock + time-up + auto-submit on silence.
  useEffect(() => {
    const id = setInterval(() => {
      const e = getElapsed();
      setElapsed(e);
      if (statusRef.current !== "listening") return setSilenceLeft(null);

      if (e >= durationSec) return submitAnswer(true);

      const hasSpeech = draftRef.current.trim().length > 0;
      if (autoSubmit && hasSpeech && stt.listening) {
        const quiet = Date.now() - lastActivity.current;
        if (quiet >= silenceMs) return submitAnswer();
        setSilenceLeft(quiet > 1500 ? Math.ceil((silenceMs - quiet) / 1000) : null);
      } else {
        setSilenceLeft(null);
      }
    }, 250);
    return () => clearInterval(id);
  }, [autoSubmit, durationSec, getElapsed, silenceMs, stt.listening, submitAnswer]);

  // Space = submit answer (when not typing in the textarea).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "TEXTAREA" && statusRef.current === "listening") {
        e.preventDefault();
        submitAnswer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitAnswer]);

  // Cleanup on unmount. Depend on the stable `cancel` only — this must not run on re-renders,
  // or it silences speech every clock tick.
  const { cancel: ttsCancel } = tts;
  useEffect(() => () => ttsCancel(), [ttsCancel]);

  const endEarly = () => {
    tts.cancel();
    finish(transcriptRef.current);
  };

  const remaining = durationSec - elapsed;
  const catState: CatState =
    status === "speaking" ? "speaking" : status === "listening" ? "listening" : status === "thinking" ? "thinking" : "idle";
  const topicsCovered = new Set(transcript.filter((e) => e.role === "interviewer" && e.topic).map((e) => e.topic)).size;

  return (
    <div className="room">
      <header className="room__bar">
        <div className="room__role">
          <strong>{TRACKS[track]}</strong> · <span className="cap">{level}</span>
        </div>
        <div className={`timer ${remaining <= 60 ? "timer--warn" : ""}`} aria-label="time remaining">
          <svg viewBox="0 0 36 36" className="timer__ring">
            <circle cx="18" cy="18" r="16" className="timer__track" />
            <circle
              cx="18"
              cy="18"
              r="16"
              className="timer__progress"
              strokeDasharray={`${Math.max(0, (remaining / durationSec) * 100.5)} 100.5`}
            />
          </svg>
          <span>{fmt(remaining)}</span>
        </div>
        <button className="btn btn--ghost" onClick={endEarly} disabled={status === "ending"}>
          End interview
        </button>
      </header>

      <main className="room__stage">
        <Cat state={catState} mouthPulse={mouthPulse} />
        <div className="status-pill" data-status={status}>
          {status === "thinking" && "Whiskers is thinking…"}
          {status === "speaking" && "Whiskers is speaking"}
          {status === "listening" && (stt.supported ? "Listening — answer out loud" : "Type your answer")}
          {status === "ending" && "Preparing your feedback…"}
        </div>
        <p className="caption" aria-live="polite">
          {caption}
        </p>
      </main>

      <section className={`answer ${status === "listening" ? "" : "answer--disabled"}`}>
        {error && (
          <div className="alert">
            <span>{error.message}</span>
            <button className="btn btn--small" onClick={error.retry}>
              Retry
            </button>
          </div>
        )}
        {stt.error && <div className="alert alert--soft">{stt.error}</div>}

        <div className="answer__box">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              lastActivity.current = Date.now();
            }}
            placeholder={
              status === "listening"
                ? stt.supported
                  ? "Speak — your words appear here. You can also type or fix the text."
                  : "Speech recognition isn't supported in this browser — type your answer."
                : ""
            }
            disabled={status !== "listening"}
            rows={3}
          />
          {stt.interim && <div className="answer__interim">{stt.interim}</div>}
        </div>

        <div className="answer__actions">
          <span className="hint">
            {silenceLeft !== null
              ? `Auto-sending in ${silenceLeft}s…`
              : status === "listening"
                ? "Press Space or click Send when you're done."
                : `${topicsCovered} topic${topicsCovered === 1 ? "" : "s"} covered`}
          </span>
          {stt.supported && status === "listening" && (
            <button className="btn btn--ghost btn--small" onClick={() => {
                if (!stt.listening) return sttStart();
                const pending = sttStop();
                if (pending) setDraft((d) => (d ? `${d} ${pending}` : pending));
              }}>
              {stt.listening ? "Mute mic" : "Unmute mic"}
            </button>
          )}
          <button className="btn" onClick={() => submitAnswer()} disabled={status !== "listening"}>
            Send answer
          </button>
        </div>
      </section>
    </div>
  );
}
