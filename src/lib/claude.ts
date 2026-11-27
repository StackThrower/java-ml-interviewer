import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-5-5";

export class ClaudeError extends Error {}

const globalForClient = globalThis as unknown as { __anthropic?: Anthropic };
function client(): Anthropic {
  // Reads ANTHROPIC_API_KEY from the environment.
  globalForClient.__anthropic ??= new Anthropic();
  return globalForClient.__anthropic;
}

interface ParseOptions<T extends z.ZodType> {
  system: string;
  messages: Anthropic.MessageParam[];
  schema: T;
  /** Haiku 5.5 defaults to "medium"; "low" keeps voice turns fast. */
  effort: "low" | "medium" | "high";
  maxTokens: number;
}

/**
 * One Claude call with structured output (JSON schema from zod, validated by the SDK).
 * Note: Claude Haiku 5.5 rejects non-default temperature/top_p/top_k and has no
 * server-side refusal fallback, so neither is sent; refusals are surfaced as errors.
 */
export async function parseJSON<T extends z.ZodType>(opts: ParseOptions<T>): Promise<z.infer<T>> {
  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens, // includes adaptive-thinking tokens
    output_config: { effort: opts.effort, format: zodOutputFormat(opts.schema) },
    cache_control: { type: "ephemeral" },
    system: opts.system,
    messages: opts.messages,
  });

  if (response.stop_reason === "refusal") {
    throw new ClaudeError("Claude declined this request. Try rephrasing your answer.");
  }
  if (response.parsed_output == null) {
    throw new ClaudeError(`Could not parse Claude's response (stop reason: ${response.stop_reason}).`);
  }
  return response.parsed_output as z.infer<T>;
}
