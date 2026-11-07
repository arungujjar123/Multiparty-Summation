/**
 * @fileoverview Single place to configure the LLM used by AI features
 * Server-only: reads the API key from the environment
 */

import { createGoogle } from "@ai-sdk/google";
import { createFallbackModel } from "./fallback";

/**
 * Tried in order. On the Gemini free tier each model has its own quota,
 * so falling back to a lite model keeps the app working when the main one runs out.
 */
export const DEFAULT_MODEL_IDS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
];

/** AI_MODELS="a,b,c" sets the chain; AI_MODEL alone sets a single model */
export function getModelIds(): string[] {
  const list = (process.env.AI_MODELS ?? process.env.AI_MODEL ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_MODEL_IDS;
}

export function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const google = createGoogle({ apiKey });
  const timeout = Number(process.env.AI_ATTEMPT_TIMEOUT_MS);

  return createFallbackModel(
    getModelIds().map((id) => google(id)),
    {
      attemptTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : undefined,
      onFallback: ({ from, to, error }) => {
        const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
        console.warn(`[ai] ${from} failed (${reason.slice(0, 120)}); falling back to ${to}`);
      },
    }
  );
}
