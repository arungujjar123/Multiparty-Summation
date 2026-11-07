/**
 * @fileoverview Model fallback chain
 *
 * Wraps several language models into one. Each call tries the models in order and moves on
 * to the next when a model is rate-limited (429), retired (404), overloaded (5xx), unreachable,
 * or does not start answering within a timeout. Errors that would fail on every model
 * (bad request, invalid API key) are thrown immediately.
 *
 * For streaming, fallback happens only before the first chunk: once a model has started
 * answering, a mid-stream error is passed through rather than restarting the answer.
 */

import type { createGoogle } from "@ai-sdk/google";

export type ChatModel = ReturnType<ReturnType<typeof createGoogle>>;
type CallOptions = Parameters<ChatModel["doGenerate"]>[0];

export class AttemptTimeoutError extends Error {
  readonly modelId: string;
  readonly timeoutMs: number;

  constructor(modelId: string, timeoutMs: number) {
    super(`Model ${modelId} did not respond within ${timeoutMs} ms`);
    this.name = "AttemptTimeoutError";
    this.modelId = modelId;
    this.timeoutMs = timeoutMs;
  }
}

export interface FallbackEvent {
  from: string;
  to: string;
  error: unknown;
}

export interface FallbackOptions {
  /** Max time for a model to return (doGenerate) or start streaming (doStream). Default 30s */
  attemptTimeoutMs?: number;
  onFallback?: (event: FallbackEvent) => void;
}

const NON_RETRIABLE_STATUS = new Set([400, 401, 403, 413, 422]);

export function shouldFallback(error: unknown): boolean {
  if (error instanceof AttemptTimeoutError) return true;
  const status = (error as { statusCode?: unknown } | null)?.statusCode;
  if (typeof status !== "number") {
    // Network failures carry no status; anything else unknown is not worth retrying elsewhere
    const name = (error as Error | null)?.name ?? "";
    return error instanceof TypeError || name.includes("APICallError");
  }
  return !NON_RETRIABLE_STATUS.has(status);
}

async function withTimeout<T>(
  modelId: string,
  timeoutMs: number,
  outerSignal: AbortSignal | undefined,
  run: (signal: AbortSignal) => PromiseLike<T>
): Promise<T> {
  const controller = new AbortController();
  const abortFromOuter = () => controller.abort(outerSignal?.reason);
  outerSignal?.addEventListener("abort", abortFromOuter, { once: true });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new AttemptTimeoutError(modelId, timeoutMs);
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", abortFromOuter);
  }
}

export function createFallbackModel(models: ChatModel[], options: FallbackOptions = {}): ChatModel {
  if (models.length === 0) throw new Error("Need at least one model");
  if (models.length === 1) return models[0];
  const timeoutMs = options.attemptTimeoutMs ?? 30_000;

  async function attempt<T>(
    callOptions: CallOptions,
    call: (model: ChatModel, opts: CallOptions) => PromiseLike<T>
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        return await withTimeout(model.modelId, timeoutMs, callOptions.abortSignal, (signal) =>
          call(model, { ...callOptions, abortSignal: signal })
        );
      } catch (error) {
        lastError = error;
        const userAborted = callOptions.abortSignal?.aborted === true;
        const next = models[i + 1];
        if (userAborted || !next || !shouldFallback(error)) throw error;
        options.onFallback?.({ from: model.modelId, to: next.modelId, error });
      }
    }
    throw lastError;
  }

  return {
    specificationVersion: models[0].specificationVersion,
    provider: models[0].provider,
    modelId: models.map((m) => m.modelId).join(" > "),
    supportedUrls: models[0].supportedUrls,
    doGenerate: (callOptions) =>
      attempt(callOptions, async (m, o) => {
        const result = await m.doGenerate(o);
        // Report the model that actually answered, not the chain
        return { ...result, response: { ...result.response, modelId: m.modelId } };
      }),
    doStream: (callOptions) => attempt(callOptions, (m, o) => m.doStream(o)),
  };
}
