/**
 * @fileoverview Deterministic checks used by the Cryptography Copilot.
 *
 * The LLM never does modular arithmetic itself: it calls these functions as
 * tools and explains their output. Everything here is pure and unit-tested.
 *
 * Convention (same as createShares): t = number of shares needed to
 * reconstruct, so the sharing polynomial has degree t - 1.
 */

import { isPrime, mod, modInverse } from "./shamir";
import { lagrangeAtZero, type Point } from "./lagrange";

export type Severity = "error" | "warning" | "info";

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
}

const MAX_SUBSETS_TO_SEARCH = 5000;

function parseBigInt(value: string | number | bigint, label: string): bigint {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") {
      if (!Number.isSafeInteger(value)) throw new Error();
      return BigInt(value);
    }
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) throw new Error();
    return BigInt(trimmed);
  } catch {
    throw new Error(`${label} must be an integer (got "${String(value)}")`);
  }
}

// ---------------------------------------------------------------------------
// (t, n) parameter verification
// ---------------------------------------------------------------------------

export interface ThresholdInput {
  p: string | number | bigint;
  n: number;
  t: number;
  /** Optional secrets that will be shared (e.g. a and b in the visualizer). */
  secrets?: Array<string | number | bigint>;
}

export interface ThresholdReport {
  valid: boolean;
  findings: Finding[];
  properties: {
    sharesNeededToReconstruct: number;
    maxCollidingPartiesWithZeroKnowledge: number;
    polynomialDegree: number;
    sharesThatCanBeLostSafely: number;
    supportsMultiplicationWithResharing: boolean;
    minPlayersForMultiplication: number;
  } | null;
}

export function verifyThresholdParams(input: ThresholdInput): ThresholdReport {
  const findings: Finding[] = [];
  const { n, t } = input;

  let p: bigint;
  try {
    p = parseBigInt(input.p, "p");
  } catch (e) {
    return {
      valid: false,
      findings: [{ code: "P_NOT_INTEGER", severity: "error", message: (e as Error).message }],
      properties: null,
    };
  }

  if (!Number.isInteger(n) || n < 1) {
    findings.push({
      code: "N_INVALID",
      severity: "error",
      message: `n must be an integer ≥ 1 (got ${n}).`,
    });
  }
  if (!Number.isInteger(t) || t < 1) {
    findings.push({
      code: "T_INVALID",
      severity: "error",
      message: `t must be an integer ≥ 1 (got ${t}).`,
    });
  }

  if (p < 2n || !isPrime(p)) {
    findings.push({
      code: "P_NOT_PRIME",
      severity: "error",
      message: `p = ${p} is not prime, so Z_p is not a field: some denominators in Lagrange interpolation have no inverse and reconstruction can fail.`,
    });
  }

  if (Number.isInteger(n) && Number.isInteger(t) && t > n) {
    findings.push({
      code: "T_GREATER_THAN_N",
      severity: "error",
      message: `t = ${t} > n = ${n}: there are fewer shares than needed, so the secret can never be reconstructed.`,
    });
  }

  if (Number.isInteger(n) && p <= BigInt(n)) {
    findings.push({
      code: "P_TOO_SMALL_FOR_N",
      severity: "error",
      message: `p = ${p} must be greater than n = ${n}: each player needs a distinct non-zero x in Z_p (x = 1..n).`,
    });
  }

  if (t === 1) {
    findings.push({
      code: "T_IS_ONE",
      severity: "error",
      message:
        "t = 1 means the polynomial is constant: every single share equals the secret. There is no privacy.",
    });
  }

  if (Number.isInteger(n) && Number.isInteger(t) && t === n && n > 1) {
    findings.push({
      code: "NO_FAULT_TOLERANCE",
      severity: "warning",
      message: `t = n = ${n}: losing or corrupting even one share makes the secret unrecoverable.`,
    });
  }

  const multiplicationOk = Number.isInteger(t) && Number.isInteger(n) && n >= 2 * t - 1;
  if (Number.isInteger(t) && t >= 1 && !multiplicationOk) {
    findings.push({
      code: "MULTIPLICATION_NOT_SUPPORTED",
      severity: "warning",
      message: `Multiplication with resharing needs n ≥ 2t − 1 = ${2 * t - 1} (have n = ${n}): the product polynomial has degree 2(t − 1), so fewer points cannot interpolate it. Summation still works.`,
    });
  }

  const secrets: bigint[] = [];
  (input.secrets ?? []).forEach((raw, i) => {
    try {
      const s = parseBigInt(raw, `secret[${i}]`);
      secrets.push(s);
      if (s < 0n || s >= p) {
        findings.push({
          code: "SECRET_OUT_OF_RANGE",
          severity: "error",
          message: `Secret ${s} is outside [0, p − 1] = [0, ${p - 1n}]. It will be reduced mod p and reconstruct as ${mod(s, p)}.`,
        });
      }
    } catch (e) {
      findings.push({
        code: "SECRET_NOT_INTEGER",
        severity: "error",
        message: (e as Error).message,
      });
    }
  });

  if (secrets.length >= 2 && secrets.every((s) => s >= 0n && s < p)) {
    const sum = secrets.reduce((acc, s) => acc + s, 0n);
    if (sum >= p) {
      findings.push({
        code: "SUM_WRAPS",
        severity: "warning",
        message: `The true sum ${sum} is ≥ p, so the protocol will output ${mod(sum, p)} (sum mod p). Choose p > ${sum} if you need the exact integer sum.`,
      });
    }
    const product = secrets.reduce((acc, s) => acc * s, 1n);
    if (product >= p) {
      findings.push({
        code: "PRODUCT_WRAPS",
        severity: "info",
        message: `The true product ${product} is ≥ p, so multiplication will output ${mod(product, p)} (product mod p).`,
      });
    }
  }

  findings.push({
    code: "SECRECY_MODEL",
    severity: "info",
    message:
      "Shamir secrecy is information-theoretic: any t − 1 shares reveal nothing about the secret regardless of the size of p. p only bounds the range of secrets and results.",
  });

  const valid = !findings.some((f) => f.severity === "error");

  return {
    valid,
    findings,
    properties:
      Number.isInteger(n) && Number.isInteger(t) && t >= 1 && n >= 1
        ? {
            sharesNeededToReconstruct: t,
            maxCollidingPartiesWithZeroKnowledge: Math.max(t - 1, 0),
            polynomialDegree: t - 1,
            sharesThatCanBeLostSafely: Math.max(n - t, 0),
            supportsMultiplicationWithResharing: multiplicationOk,
            minPlayersForMultiplication: 2 * t - 1,
          }
        : null,
  };
}

// ---------------------------------------------------------------------------
// Failed reconstruction diagnosis
// ---------------------------------------------------------------------------

export interface ShareInput {
  x: string | number | bigint;
  y: string | number | bigint;
}

export interface ReconstructionInput {
  p: string | number | bigint;
  t: number;
  shares: ShareInput[];
  /** What the user expected to get back (optional). */
  expectedSecret?: string | number | bigint;
}

export interface ReconstructionReport {
  ok: boolean;
  reconstructedSecret: string | null;
  findings: Finding[];
  /** x-coordinates of shares that do not lie on the majority polynomial. */
  suspectedCorruptShares: string[];
  sharesUsed: string[];
}

/** Evaluate the unique polynomial through `points` at `x` (mod p). */
export function lagrangeAt(points: Point[], x: bigint, p: bigint): bigint {
  let result = 0n;
  for (let i = 0; i < points.length; i++) {
    let num = 1n;
    let den = 1n;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      num = mod(num * (x - points[j].x), p);
      den = mod(den * (points[i].x - points[j].x), p);
    }
    result = mod(result + points[i].y * num * modInverse(den, p), p);
  }
  return result;
}

function* combinations<T>(items: T[], k: number): Generator<T[]> {
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.map((i) => items[i]);
    let i = k - 1;
    while (i >= 0 && idx[i] === items.length - k + i) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

function binomial(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) {
    r = (r * (n - k + i)) / i;
    if (r > Number.MAX_SAFE_INTEGER) return Infinity;
  }
  return Math.round(r);
}

export function diagnoseReconstruction(input: ReconstructionInput): ReconstructionReport {
  const findings: Finding[] = [];
  const fail = (): ReconstructionReport => ({
    ok: false,
    reconstructedSecret: null,
    findings,
    suspectedCorruptShares: [],
    sharesUsed: [],
  });

  let p: bigint;
  try {
    p = parseBigInt(input.p, "p");
  } catch (e) {
    findings.push({ code: "P_NOT_INTEGER", severity: "error", message: (e as Error).message });
    return fail();
  }
  if (p < 2n || !isPrime(p)) {
    findings.push({
      code: "P_NOT_PRIME",
      severity: "error",
      message: `p = ${p} is not prime. Lagrange coefficients need inverses of (x_i − x_j) mod p, which may not exist. Use the same prime that was used to create the shares.`,
    });
    return fail();
  }

  const { t } = input;
  if (!Number.isInteger(t) || t < 1) {
    findings.push({
      code: "T_INVALID",
      severity: "error",
      message: `t must be an integer ≥ 1 (got ${t}).`,
    });
    return fail();
  }

  // Parse and normalise shares.
  const byX = new Map<bigint, bigint>();
  for (const [i, raw] of input.shares.entries()) {
    let x: bigint;
    let y: bigint;
    try {
      x = parseBigInt(raw.x, `share[${i}].x`);
      y = parseBigInt(raw.y, `share[${i}].y`);
    } catch (e) {
      findings.push({
        code: "SHARE_NOT_INTEGER",
        severity: "error",
        message: (e as Error).message,
      });
      return fail();
    }

    const xr = mod(x, p);
    const yr = mod(y, p);
    if (xr !== x) {
      findings.push({
        code: "X_OUT_OF_RANGE",
        severity: "warning",
        message: `Share x = ${x} is outside [0, p − 1]; it was reduced to ${xr}. This usually means the wrong p is being used.`,
      });
    }
    if (yr !== y) {
      findings.push({
        code: "Y_OUT_OF_RANGE",
        severity: "warning",
        message: `Share (x = ${x}) has y = ${y} outside [0, p − 1]; it was reduced to ${yr}. Valid shares are always < p, so check p.`,
      });
    }
    if (xr === 0n) {
      findings.push({
        code: "X_IS_ZERO",
        severity: "error",
        message:
          "A share has x = 0 (mod p). f(0) is the secret itself, so x = 0 must never be handed out as a share.",
      });
      continue;
    }

    const prev = byX.get(xr);
    if (prev !== undefined) {
      if (prev === yr) {
        findings.push({
          code: "DUPLICATE_SHARE",
          severity: "warning",
          message: `Share x = ${xr} was given twice. Duplicates count once, so it does not help reach the threshold.`,
        });
      } else {
        findings.push({
          code: "CONFLICTING_DUPLICATE_X",
          severity: "error",
          message: `Two different y values (${prev} and ${yr}) were given for x = ${xr}. At most one of them is genuine.`,
        });
      }
      continue;
    }
    byX.set(xr, yr);
  }

  const points: Point[] = [...byX.entries()].map(([x, y]) => ({ x, y }));

  if (points.length < t) {
    findings.push({
      code: "INSUFFICIENT_SHARES",
      severity: "error",
      message: `Only ${points.length} distinct valid share(s), but t = ${t} are needed. With fewer than t shares every secret in Z_p is equally likely, so any value you computed is meaningless.`,
    });
    return fail();
  }

  // Find the polynomial (degree t-1) that agrees with the most shares.
  let best = { subset: points.slice(0, t), agreeing: [] as Point[] };
  const subsetCount = binomial(points.length, t);
  const search = points.length > t && subsetCount <= MAX_SUBSETS_TO_SEARCH;

  const agreeingWith = (subset: Point[]) =>
    points.filter((pt) => lagrangeAt(subset, pt.x, p) === pt.y);

  if (search) {
    for (const subset of combinations(points, t)) {
      const agreeing = agreeingWith(subset);
      if (agreeing.length > best.agreeing.length) best = { subset, agreeing };
      if (agreeing.length === points.length) break;
    }
  } else {
    best.agreeing = agreeingWith(best.subset);
  }

  const secret = lagrangeAtZero(best.subset, p);
  const corrupt = points.filter((pt) => !best.agreeing.includes(pt));

  if (points.length === t) {
    findings.push({
      code: "NO_REDUNDANCY",
      severity: "info",
      message: `Exactly t = ${t} shares were given. Any ${t} points fit some degree-${t - 1} polynomial, so a corrupted share cannot be detected. Provide at least ${t + 1} shares to verify consistency.`,
    });
  } else if (corrupt.length === 0) {
    findings.push({
      code: "SHARES_CONSISTENT",
      severity: "info",
      message: `All ${points.length} shares lie on the same degree-${t - 1} polynomial.`,
    });
  } else if (best.agreeing.length > t) {
    findings.push({
      code: "CORRUPT_SHARES",
      severity: "error",
      message: `${corrupt.length} share(s) (x = ${corrupt.map((c) => c.x).join(", ")}) do not lie on the polynomial that ${best.agreeing.length} other shares agree on. They are likely corrupted, mistyped or from a different sharing. Reconstructing with them gives a wrong secret.`,
    });
  } else {
    findings.push({
      code: "NO_CONSISTENT_POLYNOMIAL",
      severity: "error",
      message: `No degree-${t - 1} polynomial agrees with more than ${t} of the ${points.length} shares. Check that t and p are correct and that all shares come from the same sharing.`,
    });
  }

  if (points.length > t && !search) {
    findings.push({
      code: "SEARCH_SKIPPED",
      severity: "info",
      message: `Too many share combinations (${subsetCount}) to search for corrupted shares; only the first ${t} shares were used as reference.`,
    });
  }

  if (input.expectedSecret !== undefined) {
    let expected: bigint | null = null;
    try {
      expected = mod(parseBigInt(input.expectedSecret, "expectedSecret"), p);
    } catch (e) {
      findings.push({
        code: "EXPECTED_NOT_INTEGER",
        severity: "warning",
        message: (e as Error).message,
      });
    }
    if (expected !== null && expected !== secret) {
      findings.push({
        code: "SECRET_MISMATCH",
        severity: "error",
        message: `Reconstructed ${secret} but expected ${expected}. Common causes: wrong p, wrong t (shares from a higher-degree polynomial), a corrupted share, or the expected value was ≥ p and wrapped around.`,
      });
    } else if (expected !== null) {
      findings.push({
        code: "SECRET_MATCH",
        severity: "info",
        message: `Reconstructed secret matches the expected value ${expected}.`,
      });
    }
  }

  return {
    ok: !findings.some((f) => f.severity === "error"),
    reconstructedSecret: secret.toString(),
    findings,
    suspectedCorruptShares: corrupt.map((c) => c.x.toString()),
    sharesUsed: best.subset.map((s) => s.x.toString()),
  };
}
