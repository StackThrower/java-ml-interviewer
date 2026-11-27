import { NextResponse } from "next/server";
import { nextInterviewerTurn } from "@/lib/interviewer";
import { DURATION_SEC, errorResponse, parseInterviewBody } from "@/lib/http";
import { buildTurnContext } from "@/lib/rag";
import type { TurnResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = parseInterviewBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const { track, level, transcript, elapsedSec, timeUp } = parsed;
    const ctx = await buildTurnContext(track, level, transcript);
    const turn = await nextInterviewerTurn({
      track,
      level,
      transcript,
      elapsedSec,
      durationSec: DURATION_SEC,
      timeUp,
      ctx,
    });
    return NextResponse.json(turn satisfies TurnResponse);
  } catch (err) {
    return errorResponse(err);
  }
}
