/**
 * @fileoverview Central place for AI model configuration (Google Gemini).
 *
 * Env vars:
 *   GOOGLE_GENERATIVE_AI_API_KEY  required – key from https://aistudio.google.com/apikey
 *   GEMINI_CHAT_MODEL             optional – default "gemini-2.5-flash"
 *   GEMINI_EMBEDDING_MODEL        optional – default "gemini-embedding-001"
 */
import { google } from "@ai-sdk/google";

export const CHAT_MODEL_ID = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
export const EMBEDDING_MODEL_ID = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Output size of the embedding vectors. Must match `numDimensions` of the
 * Atlas vector index; changing it requires a full re-index.
 */
export const EMBEDDING_DIMENSIONS = 768;

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function getChatModel() {
  return google(CHAT_MODEL_ID);
}

export function getEmbeddingModel() {
  return google.embedding(EMBEDDING_MODEL_ID);
}

export function embeddingProviderOptions(taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") {
  return {
    google: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType,
    },
  };
}
