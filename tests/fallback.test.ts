/**
 * @fileoverview Tests for the model fallback chain, using fake models
 */

import {
  AttemptTimeoutError,
  createFallbackModel,
  shouldFallback,
  type ChatModel,
} from "@/lib/ai/fallback";

class FakeApiError extends Error {
  name = "AI_APICallError";
  constructor(readonly statusCode?: number) {
    super(`HTTP ${statusCode}`);
  }
}

type Behaviour = "ok" | "hang" | number;

function fakeModel(modelId: string, behaviour: Behaviour, calls: string[]): ChatModel {
  const run = (signal?: AbortSignal) => {
    calls.push(modelId);
    if (behaviour === "ok") return Promise.resolve({ text: `answer from ${modelId}` });
    if (behaviour === "hang") {
      return new Promise((_, reject) =>
        signal?.addEventListener("abort", () => reject(signal.reason))
      );
    }
    return Promise.reject(new FakeApiError(behaviour));
  };
  return {
    specificationVersion: "v4",
    provider: "fake",
    modelId,
    supportedUrls: {},
    doGenerate: (o: { abortSignal?: AbortSignal }) => run(o.abortSignal),
    doStream: (o: { abortSignal?: AbortSignal }) => run(o.abortSignal),
  } as unknown as ChatModel;
}

const options = {} as Parameters<ChatModel["doGenerate"]>[0];

async function generate(model: ChatModel, opts = options) {
  return (await model.doGenerate(opts)) as unknown as { text: string };
}

describe("shouldFallback", () => {
  test("falls back on quota, retired model, overload, network and timeout", () => {
    for (const status of [429, 404, 500, 503])
      expect(shouldFallback(new FakeApiError(status))).toBe(true);
    expect(shouldFallback(new TypeError("fetch failed"))).toBe(true);
    expect(shouldFallback(new AttemptTimeoutError("m", 10))).toBe(true);
  });

  test("does not fall back on errors every model would hit", () => {
    for (const status of [400, 401, 403])
      expect(shouldFallback(new FakeApiError(status))).toBe(false);
    expect(shouldFallback(new Error("bug in our code"))).toBe(false);
  });
});

describe("createFallbackModel", () => {
  test("uses the first model when it works", async () => {
    const calls: string[] = [];
    const model = createFallbackModel([fakeModel("a", "ok", calls), fakeModel("b", "ok", calls)]);
    expect((await generate(model)).text).toBe("answer from a");
    expect(calls).toEqual(["a"]);
    expect(model.modelId).toBe("a > b");
  });

  test("falls back when the first model is out of quota", async () => {
    const calls: string[] = [];
    const events: string[] = [];
    const model = createFallbackModel(
      [fakeModel("a", 429, calls), fakeModel("b", 503, calls), fakeModel("c", "ok", calls)],
      { onFallback: ({ from, to }) => events.push(`${from}->${to}`) }
    );
    expect((await generate(model)).text).toBe("answer from c");
    expect(calls).toEqual(["a", "b", "c"]);
    expect(events).toEqual(["a->b", "b->c"]);
  });

  test("falls back when a model hangs past the timeout", async () => {
    const calls: string[] = [];
    const model = createFallbackModel(
      [fakeModel("slow", "hang", calls), fakeModel("b", "ok", calls)],
      {
        attemptTimeoutMs: 50,
      }
    );
    expect((await generate(model)).text).toBe("answer from b");
  });

  test("throws the last error when every model fails", async () => {
    const calls: string[] = [];
    const model = createFallbackModel([fakeModel("a", 429, calls), fakeModel("b", 429, calls)]);
    await expect(generate(model)).rejects.toMatchObject({ statusCode: 429 });
    expect(calls).toEqual(["a", "b"]);
  });

  test("does not try other models on an invalid API key", async () => {
    const calls: string[] = [];
    const model = createFallbackModel([fakeModel("a", 401, calls), fakeModel("b", "ok", calls)]);
    await expect(generate(model)).rejects.toMatchObject({ statusCode: 401 });
    expect(calls).toEqual(["a"]);
  });

  test("respects a user abort instead of falling back", async () => {
    const calls: string[] = [];
    const controller = new AbortController();
    const model = createFallbackModel([fakeModel("a", "hang", calls), fakeModel("b", "ok", calls)]);
    const pending = generate(model, { ...options, abortSignal: controller.signal });
    controller.abort(new Error("user stopped"));
    await expect(pending).rejects.toThrow("user stopped");
    expect(calls).toEqual(["a"]);
  });

  test("streaming falls back too", async () => {
    const calls: string[] = [];
    const model = createFallbackModel([fakeModel("a", 429, calls), fakeModel("b", "ok", calls)]);
    const result = (await model.doStream(options)) as unknown as { text: string };
    expect(result.text).toBe("answer from b");
  });

  test("a single model is returned unwrapped", () => {
    const m = fakeModel("only", "ok", []);
    expect(createFallbackModel([m])).toBe(m);
  });
});
