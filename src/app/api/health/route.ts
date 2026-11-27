import { NextResponse } from "next/server";
import { MODEL } from "@/lib/claude";
import { getPool } from "@/lib/db";
import { DURATION_SEC } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const anthropicKeyConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  try {
    const { rows } = await getPool().query<{ track: string; chunks: string }>(
      `SELECT track, COUNT(*)::text AS chunks FROM kb_chunks GROUP BY track ORDER BY track`,
    );
    return NextResponse.json({
      ok: true,
      model: MODEL,
      anthropicKeyConfigured,
      durationSec: DURATION_SEC,
      knowledgeBase: Object.fromEntries(rows.map((r) => [r.track, Number(r.chunks)])),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, model: MODEL, anthropicKeyConfigured, error: String(err) }, { status: 503 });
  }
}
