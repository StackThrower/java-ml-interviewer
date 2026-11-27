import { NextResponse } from "next/server";
import { errorResponse, parseInterviewBody } from "@/lib/http";
import { generateFeedback } from "@/lib/interviewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: Request) {
  const parsed = parseInterviewBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const { track, level, transcript, elapsedSec } = parsed;
    return NextResponse.json(await generateFeedback({ track, level, transcript, elapsedSec }));
  } catch (err) {
    return errorResponse(err);
  }
}
