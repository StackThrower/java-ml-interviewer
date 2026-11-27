"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
 * Text-to-speech (browser speechSynthesis)
 * ------------------------------------------------------------------------- */

const PREFERRED_VOICES = [
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Samantha",
  "Karen",
  "Daniel",
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((x) => x.name === name);
    if (v) return v;
  }
  return (
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0]
  );
}

export function useSpeechSynthesis() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const load = () => (voicesRef.current = window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  /** Speaks text; resolves when finished. `onWord` fires on each word boundary (for lip-sync). */
  const speak = useCallback((text: string, onWord?: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
      const synth = window.speechSynthesis;
      // Chrome drops an utterance queued in the same tick as cancel(), so only cancel when needed.
      const hadQueue = synth.speaking || synth.pending;
      if (hadQueue) synth.cancel();
      if (!voicesRef.current.length) voicesRef.current = synth.getVoices();

      const u = new SpeechSynthesisUtterance(text);
      // Chrome garbage-collects unreferenced utterances mid-speech, so onend never fires.
      utteranceRef.current = u;
      const voice = pickVoice(voicesRef.current);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "en-US";
      u.rate = 1.02;
      u.pitch = 1.15;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(keepAlive);
        clearTimeout(safety);
        if (utteranceRef.current === u) utteranceRef.current = null;
        resolve();
      };
      u.onboundary = (e) => {
        if (!e.name || e.name === "word") onWord?.();
      };
      u.onend = finish;
      u.onerror = finish;

      // Chrome's network voices stop after ~15s unless nudged.
      const keepAlive = setInterval(() => {
        if (voice && !voice.localService && synth.speaking) {
          synth.pause();
          synth.resume();
        }
      }, 10_000);
      // Never hang the interview if the engine forgets to fire onend.
      const words = text.split(/\s+/).length;
      const safety = setTimeout(finish, Math.max(8_000, words * 650 + 4_000));

      if (hadQueue) setTimeout(() => synth.speak(u), 60);
      else synth.speak(u);
      // Chrome sometimes starts the engine paused after a cancel().
      if (synth.paused) synth.resume();
    });
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // Stable identity: consumers put this in effect deps (e.g. cancel-on-unmount).
  return useMemo(() => ({ speak, cancel, supported }), [speak, cancel, supported]);
}

/**
 * Call synchronously inside a click handler before the first `speak()`.
 * Safari (and Chrome without prior activation) only allow speech that was unlocked by a user gesture.
 */
export function primeSpeechSynthesis() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

/* ---------------------------------------------------------------------------
 * Speech-to-text (Web Speech API — Chrome / Edge / Safari)
 * ------------------------------------------------------------------------- */

interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SREvent {
  resultIndex: number;
  results: ArrayLike<SRResult>;
}
interface SRErrorEvent {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRConstructor = new () => SpeechRecognitionLike;

function getSRConstructor(): SRConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useSpeechRecognition(opts: {
  lang?: string;
  /** Called with each newly finalised phrase. */
  onFinal: (text: string) => void;
  /** Called on any speech activity (interim or final). */
  onActivity?: () => void;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);
  const cbRef = useRef(opts);
  cbRef.current = opts;
  const interimRef = useRef("");
  interimRef.current = interim;

  useEffect(() => setSupported(Boolean(getSRConstructor())), []);

  const start = useCallback(() => {
    const SR = getSRConstructor();
    if (!SR) return;
    setError(null);
    setInterim("");
    wantRef.current = true;

    const rec = new SR();
    rec.lang = cbRef.current.lang ?? "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (r.isFinal) cbRef.current.onFinal(t.trim());
        else interimText += t;
      }
      setInterim(interimText.trim());
      cbRef.current.onActivity?.();
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setError("Microphone access was denied. Allow it in the browser, or type your answers.");
      } else {
        setError(`Speech recognition error: ${e.error}`);
      }
    };
    rec.onend = () => {
      // Browsers end recognition after silence; restart while we still want to listen.
      if (wantRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  /** Stops listening; returns any interim (not yet finalised) text so it is not lost. */
  const stop = useCallback((): string => {
    wantRef.current = false;
    const pending = interimRef.current;
    recRef.current?.abort();
    recRef.current = null;
    setListening(false);
    setInterim("");
    return pending;
  }, []);

  useEffect(() => () => {
    wantRef.current = false;
    recRef.current?.abort();
  }, []);

  return { supported, listening, interim, error, start, stop };
}
