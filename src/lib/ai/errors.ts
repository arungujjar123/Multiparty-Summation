/**
 * @fileoverview Maps LLM provider failures to user-facing messages and HTTP statuses
 * Raw provider errors (which can include request details) are logged, never returned.
 */

import { APICallError, RetryError } from "ai";
import { AttemptTimeoutError } from "./fallback";

export interface AiErrorInfo {
  status: number;
  message: string;
}

/**
 * The fallback chain already moves to another model on 429/5xx/timeouts.
 * SDK-level retries would replay the whole chain and burn free-tier quota.
 */
export const AI_MAX_RETRIES = 0;

export function describeAiError(err: unknown): AiErrorInfo | null {
  const cause = RetryError.isInstance(err) ? err.lastError : err;
  if (cause instanceof AttemptTimeoutError) {
    return { status: 504, message: "The AI models took too long to respond. Please try again." };
  }
  if (!APICallError.isInstance(cause)) return null;

  switch (cause.statusCode) {
    case 429:
      return {
        status: 429,
        message:
          "Every configured AI model's quota is used up for now (free tier: a few requests per minute and per day). Wait a minute and try again, or try again tomorrow.",
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        status: 503,
        message: "The AI model is overloaded right now. Please try again in a moment.",
      };
    case 400:
    case 401:
    case 403:
      return {
        status: 502,
        message: "The AI provider rejected the request. Check GEMINI_API_KEY and AI_MODELS.",
      };
    default:
      return { status: 502, message: "The AI provider request failed. Please try again." };
  }
}
