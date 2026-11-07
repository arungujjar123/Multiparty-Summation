/**
 * @fileoverview Tests for the Copilot's function-calling tool wrappers (no LLM involved)
 */

// The AI SDK is ESM-only; `tool()` is an identity helper, so a stand-in is enough here
jest.mock("ai", () => ({ tool: <T>(definition: T) => definition }));

import { copilotTools, type ToolOutcome } from "@/lib/ai/copilotTools";
import { nextPrime, type DiagnoseResult, type ValidateParamsResult } from "@/lib/mpc/tools";

type Executable = { execute?: (input: never, options: never) => unknown };

async function run<T>(name: keyof typeof copilotTools, input: unknown): Promise<ToolOutcome<T>> {
  const t = copilotTools[name] as unknown as Executable;
  return (await t.execute!(
    input as never,
    { toolCallId: "test", messages: [] } as never
  )) as ToolOutcome<T>;
}

describe("nextPrime", () => {
  test("finds the next prime", () => {
    expect(nextPrime(1).prime).toBe("2");
    expect(nextPrime(2).prime).toBe("3");
    expect(nextPrime(90).prime).toBe("97");
    expect(nextPrime(97).prime).toBe("101");
    expect(nextPrime("70000").prime).toBe("70001");
  });
});

describe("Copilot tools", () => {
  test("every tool has a description and input schema", () => {
    for (const t of Object.values(copilotTools)) {
      expect(t.description?.length).toBeGreaterThan(20);
      expect(t.inputSchema).toBeDefined();
    }
  });

  test("validateParams wraps results", async () => {
    const r = await run<ValidateParamsResult>("validateParams", {
      p: "97",
      n: 4,
      t: 3,
      operation: "product",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result.ok).toBe(false);
  });

  test("errors are returned, not thrown", async () => {
    const r = await run("generateShares", { secret: "500", p: "97", n: 5, t: 3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/smaller than p/);
  });

  test("the corrupted-share example on the Copilot page diagnoses as intended", async () => {
    const r = await run<DiagnoseResult>("diagnoseReconstruction", {
      p: "97",
      t: 3,
      expectedSecret: "42",
      shares: [
        { x: "1", y: "54" },
        { x: "2", y: "80" },
        { x: "3", y: "23" },
        { x: "4", y: "71" },
        { x: "5", y: "48" },
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.status).toBe("repaired");
      expect(r.result.badShareIndices).toEqual([3]);
      expect(r.result.recoveredSecret).toBe("42");
    }
  });
});
