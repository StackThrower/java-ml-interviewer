import { NextResponse } from "next/server";
import { MODEL } from "@/lib/claude";
import { DURATION_SEC } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    model: MODEL,
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    durationSec: DURATION_SEC,
  });
}
