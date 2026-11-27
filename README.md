# 🐱 Whiskers — AI Voice Interviewer

A Next.js app that runs a **10-minute voice technical interview** for **Java developers** or **ML engineers**.
An animated cat asks questions out loud (its mouth moves in sync with the speech), listens to your spoken answers,
asks **follow-up questions** based on what you said, and at the end shows **scored feedback**.

- **LLM:** Claude Haiku 5.5 (`claude-haiku-5-5`) via the official `@anthropic-ai/sdk`, with structured JSON outputs
- **Topics:** a fixed list of 6 topics per track in `src/lib/topics.ts`. Claude writes the questions itself.
- **Voice:** browser Web Speech API (speech recognition + speech synthesis), so you don't need another API key for voice
- **Deploy:** `docker compose up`

## Quick start (Docker)

```bash
cp .env.example .env          # then put your key in ANTHROPIC_API_KEY
docker compose up --build
```

Open **http://localhost:3001** in **Chrome or Edge** (they support speech recognition), allow the microphone, choose a role and level, and click **Start interview**.

## Local development

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev                            # http://localhost:3000
```

## How it works

```
Browser                                Next.js API                          Claude Haiku 5.5
───────                                ───────────                          ────────────────
🎙 SpeechRecognition ─ answer ─►  POST /api/interview/turn
                                   ├─ covered topics + suggested next topic
                                   └─ transcript + time ────────── JSON schema ──►  {answer_grade, say, kind, topic}
🔊 speechSynthesis ◄── say ───────┘
🐱 mouth animates on word boundaries

⏱ 10:00 / closing  ───────────►  POST /api/interview/feedback
                                   ├─ scores + recommendation computed from the per-answer grades
                                   └─ graded Q&A pairs ─────────── JSON schema ──►  summary, strengths,
📊 Feedback screen ◄──────────────┘                                                improvements, study plan
```

- **Structured outputs:** every call uses `output_config.format` with a zod schema, so replies are always valid JSON in the right shape.
- **Rules enforced by the schema:** when time is up, `kind` can only be `"closing"`. After 2 follow-ups, the current topic is removed from the allowed topics. `topic` must always be one of the track's topics.
- **Grading during the interview:** each turn first grades the previous answer (`strong` / `good` / `partial` / `weak` / `no_answer`), then responds.
- **Scores computed in code:** topic scores, overall score, recommendation and level come from the grades. Claude writes the narrative (summary, strengths, improvements, study plan), so the feedback can't contradict the evidence.
- **Speed:** interview turns use `effort: "low"` so voice replies come back fast, and feedback uses `effort: "high"`. History is append-only, with prompt caching on.
- **Timing:** the client runs the 10-minute clock. Under 90 s Whiskers asks a final question, and at 0 it closes. If time runs out while you're answering, your answer is sent and Whiskers closes the interview.
- **Answers:** you speak, and the text appears in an editable box (fix transcription errors or type instead). It's sent after a 5-second pause (can be turned off), or when you press **Space** / **Send answer**.

## Customising topics

Edit the topic lists in `src/lib/topics.ts`.
To add a new track (e.g. `frontend`), extend `Track` / `TRACKS` in `src/lib/types.ts` and add its topics to `TOPICS`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Claude API key |
| `CLAUDE_MODEL` | `claude-haiku-5-5` | Model for turns and feedback |
| `INTERVIEW_DURATION_SEC` | `600` | Interview length |

Haiku 5.5 doesn't accept `temperature`, and it has no server-side refusal fallback. If Claude declines a turn, the UI shows the error with a **Retry** button.

## Project layout

```
src/app/page.tsx                    setup → interview → feedback flow
src/components/Cat.tsx              animated SVG cat (lip-sync, blinking, eyes follow cursor)
src/components/InterviewRoom.tsx    voice loop, timer, auto-submit
src/components/FeedbackView.tsx     scores, strengths, study plan, transcript
src/hooks/useSpeech.ts              speechSynthesis + SpeechRecognition wrappers
src/app/api/interview/turn          next interviewer turn (Claude)
src/app/api/interview/feedback      final evaluation (grades → scores, Claude narrative)
src/app/api/health                  model / API key status
src/lib/claude.ts                   Claude client (structured outputs)
src/lib/interviewer.ts, prompts.ts  turn + feedback logic
src/lib/topics.ts                   topic lists per track + turn context
```

## Notes

- Speech recognition needs a secure context. `localhost` counts as one, but for access from another machine, put the app behind HTTPS.
- Firefox has no Web Speech recognition, so you type your answers there. The cat still speaks.
- Use headphones so the microphone doesn't pick up the cat's voice.
