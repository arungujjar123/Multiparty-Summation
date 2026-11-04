import { diagnoseReconstruction, lagrangeAt, verifyThresholdParams } from "@/lib/math/diagnostics";
import { createShares } from "@/lib/math/shamir";

const codes = (findings: { code: string }[]) => findings.map((f) => f.code);

describe("verifyThresholdParams", () => {
  test("accepts a standard configuration", () => {
    const r = verifyThresholdParams({ p: "101", n: 5, t: 3, secrets: ["10", "20"] });
    expect(r.valid).toBe(true);
    expect(r.properties).toMatchObject({
      sharesNeededToReconstruct: 3,
      maxCollidingPartiesWithZeroKnowledge: 2,
      polynomialDegree: 2,
      sharesThatCanBeLostSafely: 2,
      supportsMultiplicationWithResharing: true,
    });
  });

  test("rejects a composite modulus", () => {
    const r = verifyThresholdParams({ p: 100, n: 5, t: 3 });
    expect(r.valid).toBe(false);
    expect(codes(r.findings)).toContain("P_NOT_PRIME");
  });

  test("rejects t > n and p <= n", () => {
    const r = verifyThresholdParams({ p: 5, n: 7, t: 8 });
    expect(codes(r.findings)).toEqual(
      expect.arrayContaining(["T_GREATER_THAN_N", "P_TOO_SMALL_FOR_N"])
    );
  });

  test("flags t = 1 as no privacy and t = n as no fault tolerance", () => {
    expect(codes(verifyThresholdParams({ p: 11, n: 3, t: 1 }).findings)).toContain("T_IS_ONE");
    expect(codes(verifyThresholdParams({ p: 11, n: 3, t: 3 }).findings)).toContain(
      "NO_FAULT_TOLERANCE"
    );
  });

  test("warns when multiplication is impossible (n < 2t-1)", () => {
    const r = verifyThresholdParams({ p: 101, n: 4, t: 3 });
    expect(r.valid).toBe(true);
    expect(codes(r.findings)).toContain("MULTIPLICATION_NOT_SUPPORTED");
  });

  test("detects secrets out of range and wrap-around", () => {
    expect(codes(verifyThresholdParams({ p: 11, n: 3, t: 2, secrets: [12] }).findings)).toContain(
      "SECRET_OUT_OF_RANGE"
    );
    expect(codes(verifyThresholdParams({ p: 11, n: 3, t: 2, secrets: [7, 8] }).findings)).toContain(
      "SUM_WRAPS"
    );
  });
});

describe("diagnoseReconstruction", () => {
  const p = 101n;
  const { shares } = createShares(42n, 5, 3, p, undefined, [7n, 3n]);
  const asInput = shares.map((s) => ({ x: s.x.toString(), y: s.y.toString() }));

  test("lagrangeAt reproduces the polynomial", () => {
    expect(lagrangeAt(shares.slice(0, 3), 4n, p)).toBe(shares[3].y);
    expect(lagrangeAt(shares.slice(0, 3), 0n, p)).toBe(42n);
  });

  test("reconstructs and confirms consistent shares", () => {
    const r = diagnoseReconstruction({ p: "101", t: 3, shares: asInput, expectedSecret: "42" });
    expect(r.ok).toBe(true);
    expect(r.reconstructedSecret).toBe("42");
    expect(codes(r.findings)).toEqual(
      expect.arrayContaining(["SHARES_CONSISTENT", "SECRET_MATCH"])
    );
  });

  test("detects insufficient shares", () => {
    const r = diagnoseReconstruction({ p: "101", t: 3, shares: asInput.slice(0, 2) });
    expect(r.ok).toBe(false);
    expect(codes(r.findings)).toContain("INSUFFICIENT_SHARES");
  });

  test("identifies a corrupted share and still recovers the secret", () => {
    const tampered = asInput.map((s) =>
      s.x === "2" ? { ...s, y: ((BigInt(s.y) + 5n) % p).toString() } : s
    );
    const r = diagnoseReconstruction({ p: "101", t: 3, shares: tampered });
    expect(r.ok).toBe(false);
    expect(r.suspectedCorruptShares).toEqual(["2"]);
    expect(r.reconstructedSecret).toBe("42");
    expect(codes(r.findings)).toContain("CORRUPT_SHARES");
  });

  test("flags x = 0, duplicates and conflicting duplicates", () => {
    const r = diagnoseReconstruction({
      p: "101",
      t: 3,
      shares: [
        { x: "0", y: "42" },
        asInput[0],
        asInput[0],
        { x: asInput[1].x, y: "1" },
        asInput[1],
        asInput[2],
      ],
    });
    expect(codes(r.findings)).toEqual(
      expect.arrayContaining(["X_IS_ZERO", "DUPLICATE_SHARE", "CONFLICTING_DUPLICATE_X"])
    );
  });

  test("explains a mismatch with the expected secret", () => {
    const r = diagnoseReconstruction({ p: "101", t: 3, shares: asInput, expectedSecret: 43 });
    expect(codes(r.findings)).toContain("SECRET_MISMATCH");
  });

  test("rejects a non-prime p", () => {
    const r = diagnoseReconstruction({ p: "100", t: 3, shares: asInput });
    expect(codes(r.findings)).toContain("P_NOT_PRIME");
    expect(r.reconstructedSecret).toBeNull();
  });
});
