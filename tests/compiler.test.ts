/**
 * @fileoverview Tests for the deterministic NL-to-MPC protocol compiler (no LLM involved)
 */

import { compileProtocol } from "@/lib/mpc/compiler";
import type { ProtocolSpec } from "@/lib/mpc/protocolSchema";
import { isPrime } from "@/lib/math/shamir";

function spec(overrides: Partial<ProtocolSpec>): ProtocolSpec {
  return {
    goal: "test",
    parties: [],
    partyCount: 5,
    operation: "sum",
    inputCount: null,
    maxColluders: null,
    reconstructionThreshold: null,
    maxOffline: null,
    maxInputValue: "10000",
    assumptions: [],
    ambiguities: [],
    ...overrides,
  };
}

describe("compileProtocol", () => {
  test("hospital sum: collusion limit sets t, result range sets p", () => {
    const r = compileProtocol(spec({ partyCount: 7, maxColluders: 3, maxInputValue: "10000" }));
    expect(r.ok).toBe(true);
    expect(r.params).toMatchObject({ n: 7, t: 4, operation: "sum", inputCount: 7 });
    // 7 inputs × 10000 = 70000 -> smallest prime above it
    expect(r.params!.maxResult).toBe("70000");
    expect(r.params!.p).toBe("70001");
    expect(isPrime(BigInt(r.params!.p), 1)).toBe(true);
    expect(r.decisions.find((d) => d.param === "t")!.reason).toMatch(/3 \+ 1/);
    expect(r.visualizerUrl).toMatch(/^\/visualizer\?p=70001&n=7&t=4&op=sum&secrets=/);
  });

  test("reconstruction threshold is used directly", () => {
    const r = compileProtocol(spec({ reconstructionThreshold: 3 }));
    expect(r.params!.t).toBe(3);
  });

  test("availability requirement sets the largest t that still tolerates dropouts", () => {
    const r = compileProtocol(spec({ partyCount: 6, maxOffline: 2 }));
    expect(r.params!.t).toBe(4);
  });

  test("defaults to honest majority and warns", () => {
    const r = compileProtocol(spec({ partyCount: 5 }));
    expect(r.params!.t).toBe(3);
    expect(r.warnings.join()).toMatch(/default/);
  });

  test("conflicting collusion and threshold requirements fail", () => {
    const r = compileProtocol(spec({ maxColluders: 3, reconstructionThreshold: 2 }));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/Conflicting/);
  });

  test("availability that the threshold cannot meet fails", () => {
    const r = compileProtocol(spec({ partyCount: 5, maxColluders: 3, maxOffline: 2 }));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/only n − t = 1/);
  });

  test("multiplication with too few parties fails with a concrete fix", () => {
    const r = compileProtocol(spec({ operation: "product", partyCount: 4, maxColluders: 2 }));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/2t − 1 = 5/);
    expect(r.errors[0]).toMatch(/add 1 party/);
  });

  test("multiplication picks p above maxInput^inputCount", () => {
    const r = compileProtocol(
      spec({ operation: "product", partyCount: 5, maxColluders: 2, maxInputValue: "50" })
    );
    expect(r.ok).toBe(true);
    expect(r.params!.maxResult).toBe("2500");
    expect(r.params!.p).toBe("2503");
    expect(r.visualizerUrl).toContain("op=multiply");
    expect(r.steps.map((s) => s.title)).toContain("Reshare (degree reduction)");
  });

  test("key sharing uses a single secret", () => {
    const r = compileProtocol(
      spec({ operation: "share", partyCount: 5, reconstructionThreshold: 3, maxInputValue: "255" })
    );
    expect(r.ok).toBe(true);
    expect(r.params).toMatchObject({ inputCount: 1, p: "257" });
    expect(r.visualizerUrl).toContain("op=shamir");
  });

  test("assumes a default input range when none is given", () => {
    const r = compileProtocol(spec({ maxInputValue: null }));
    expect(r.ok).toBe(true);
    expect(r.warnings.join()).toMatch(/assuming each input is at most 1000/);
  });

  test("accepts thousands separators and rejects decimals", () => {
    expect(compileProtocol(spec({ maxInputValue: "10,000" })).params!.maxInputValue).toBe("10000");
    expect(compileProtocol(spec({ maxInputValue: "99.99" })).errors[0]).toMatch(/whole number/);
  });

  test("rejects impossible party setups", () => {
    expect(compileProtocol(spec({ partyCount: 1 })).ok).toBe(false);
    expect(compileProtocol(spec({ partyCount: 3, maxColluders: 3 })).errors[0]).toMatch(
      /all parties together/
    );
  });

  test("names parties and warns on count mismatch", () => {
    const r = compileProtocol(spec({ partyCount: 3, parties: ["A", "B"] }));
    expect(r.partyNames).toEqual(["A", "B", "Party 3"]);
    expect(r.warnings[0]).toMatch(/2 party names/);
  });

  test("no visualizer link beyond its limits", () => {
    const r = compileProtocol(spec({ partyCount: 20, maxColluders: 5 }));
    expect(r.ok).toBe(true);
    expect(r.visualizerUrl).toBeNull();
  });
});
