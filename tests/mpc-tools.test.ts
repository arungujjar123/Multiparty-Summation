/**
 * @fileoverview Tests for the deterministic MPC tools exposed to the copilot agent
 */

import {
  diagnoseReconstruction,
  generateShares,
  reconstruct,
  validateParams,
  type ShareOutput,
} from "@/lib/mpc/tools";
import { evalPoly } from "@/lib/math/polynomial";

const P = 97n;

// f(x) = 42 + 5x + 7x^2 mod 97, so t = 3
const poly = [42n, 5n, 7n];
const shareAt = (x: number) => ({ x: String(x), y: evalPoly(poly, BigInt(x), P).toString() });
const fiveShares = [1, 2, 3, 4, 5].map(shareAt);

function corrupt(shares: ShareOutput[], index: number): ShareOutput[] {
  return shares.map((s, i) => (i === index ? { ...s, y: String((Number(s.y) + 1) % 97) } : s));
}

describe("validateParams", () => {
  test("accepts sound parameters and derives security properties", () => {
    const r = validateParams({ p: 97, n: 5, t: 3, operation: "sum", maxSecret: 40, numInputs: 2 });
    expect(r.ok).toBe(true);
    expect(r.derived).toMatchObject({
      maxColluders: 2,
      toleratedDropouts: 2,
      minPartiesForProduct: 5,
    });
    expect(r.securityNotes.join(" ")).toMatch(/Any 2 colluding parties learn nothing/);
  });

  test("accepts string inputs for large primes", () => {
    expect(validateParams({ p: "2305843009213693951", n: 10, t: 4 }).ok).toBe(true);
  });

  test("rejects a composite modulus", () => {
    const r = validateParams({ p: 91, n: 5, t: 3 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/not prime/);
  });

  test("rejects t > n and p <= n", () => {
    expect(validateParams({ p: 97, n: 3, t: 4 }).errors.join()).toMatch(/exceeds n/);
    expect(validateParams({ p: 5, n: 5, t: 3 }).errors.join()).toMatch(/greater than n/);
  });

  test("multiplication requires n >= 2t-1", () => {
    const r = validateParams({ p: 97, n: 4, t: 3, operation: "product" });
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/2t−1 = 5/);
  });

  test("detects results that would wrap around mod p", () => {
    expect(validateParams({ p: 97, n: 5, t: 3, operation: "sum", maxSecret: 60 }).ok).toBe(false);
    expect(validateParams({ p: 97, n: 5, t: 3, operation: "product", maxSecret: 10 }).ok).toBe(
      false
    );
    expect(validateParams({ p: 97, n: 5, t: 3, operation: "product", maxSecret: 9 }).ok).toBe(true);
  });

  test("warns about degenerate thresholds", () => {
    expect(validateParams({ p: 97, n: 5, t: 1 }).warnings.join()).toMatch(/no secrecy/);
    expect(validateParams({ p: 97, n: 5, t: 5 }).warnings.join()).toMatch(/single unavailable/);
  });
});

describe("generateShares and reconstruct", () => {
  test("round-trips a secret", () => {
    const { shares, polynomial } = generateShares({ secret: 42, p: 97, n: 5, t: 3, seed: 7 });
    expect(polynomial[0]).toBe("42");
    expect(shares).toHaveLength(5);
    expect(reconstruct({ shares: shares.slice(1, 4), p: 97 }).secret).toBe("42");
  });

  test("works with secure randomness on the server", () => {
    const { shares } = generateShares({
      secret: "123456789",
      p: "2305843009213693951",
      n: 4,
      t: 2,
    });
    expect(reconstruct({ shares: shares.slice(2), p: "2305843009213693951" }).secret).toBe(
      "123456789"
    );
  });

  test("rejects invalid parameters", () => {
    expect(() => generateShares({ secret: 100, p: 97, n: 5, t: 3 })).toThrow(/smaller than p/);
    expect(() => reconstruct({ shares: [shareAt(1), shareAt(1)], p: 97 })).toThrow(/distinct/);
    expect(() => reconstruct({ shares: [{ x: "0", y: "42" }], p: 97 })).toThrow(/non-zero/);
  });
});

describe("diagnoseReconstruction", () => {
  test("healthy shares", () => {
    const r = diagnoseReconstruction({ shares: fiveShares, p: 97, t: 3 });
    expect(r.status).toBe("ok");
    expect(r.recoveredSecret).toBe("42");
    expect(r.badShareIndices).toEqual([]);
  });

  test("locates a corrupted share and still recovers the secret", () => {
    const r = diagnoseReconstruction({ shares: corrupt(fiveShares, 2), p: 97, t: 3 });
    expect(r.status).toBe("repaired");
    expect(r.badShareIndices).toEqual([2]);
    expect(r.recoveredSecret).toBe("42");
    expect(r.causes.map((c) => c.code)).toContain("CORRUPTED_SHARES");
  });

  test("detects but cannot locate corruption with t+1 shares", () => {
    const r = diagnoseReconstruction({ shares: corrupt(fiveShares.slice(0, 4), 0), p: 97, t: 3 });
    expect(r.status).toBe("failed");
    expect(r.causes.map((c) => c.code)).toContain("UNRESOLVABLE");
  });

  test("insufficient shares", () => {
    const r = diagnoseReconstruction({ shares: fiveShares.slice(0, 2), p: 97, t: 3 });
    expect(r.status).toBe("failed");
    expect(r.causes[0].code).toBe("INSUFFICIENT_SHARES");
    expect(r.fixes[0]).toMatch(/1 more share/);
  });

  test("threshold mismatch: shares came from a higher-degree polynomial", () => {
    // Degree-3 polynomial (dealer used t = 4), diagnosed with t = 3
    const poly4 = [42n, 5n, 7n, 11n];
    const shares = [1, 2, 3, 4, 5, 6].map((x) => ({
      x: String(x),
      y: evalPoly(poly4, BigInt(x), P).toString(),
    }));
    const r = diagnoseReconstruction({ shares, p: 97, t: 3 });
    expect(r.causes[0].code).toBe("THRESHOLD_MISMATCH");
    expect(r.causes[0].message).toMatch(/t=4/);
    expect(r.recoveredSecret).toBe("42");
  });

  test("not prime", () => {
    const r = diagnoseReconstruction({ shares: fiveShares, p: 96, t: 3 });
    expect(r.causes[0].code).toBe("NOT_PRIME");
  });

  test("shares outside the field and x = 0", () => {
    const shares = [...fiveShares, { x: "150", y: "3" }, { x: "0", y: "42" }];
    const r = diagnoseReconstruction({ shares, p: 97, t: 3 });
    const codes = r.causes.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(["OUT_OF_FIELD", "INVALID_X_ZERO"]));
    expect(r.badShareIndices).toEqual([5, 6]);
    expect(r.recoveredSecret).toBe("42");
  });

  test("duplicate and conflicting x-coordinates", () => {
    const shares = [...fiveShares, fiveShares[0], { x: "2", y: "0" }];
    const codes = diagnoseReconstruction({ shares, p: 97, t: 3 }).causes.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(["DUPLICATE_SHARE", "CONFLICTING_DUPLICATE"]));
  });

  test("exactly t shares: warns that corruption is undetectable", () => {
    const r = diagnoseReconstruction({ shares: fiveShares.slice(0, 3), p: 97, t: 3 });
    expect(r.status).toBe("ok");
    expect(r.causes[0].code).toBe("UNDETECTABLE_WITH_T_SHARES");
  });

  test("exactly t shares with an expected secret that does not match", () => {
    const r = diagnoseReconstruction({
      shares: corrupt(fiveShares.slice(0, 3), 1),
      p: 97,
      t: 3,
      expectedSecret: 42,
    });
    expect(r.status).toBe("failed");
    expect(r.causes[0].code).toBe("UNDETECTABLE_WITH_T_SHARES");
  });

  test("secret larger than the prime", () => {
    // Dealer shared 139 = 42 + 97 with p = 97
    const r = diagnoseReconstruction({ shares: fiveShares, p: 97, t: 3, expectedSecret: 139 });
    expect(r.causes[0].code).toBe("SECRET_EXCEEDS_PRIME");
  });
});
