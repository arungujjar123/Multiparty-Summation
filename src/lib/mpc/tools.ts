/**
 * @fileoverview Deterministic Shamir/MPC tools
 *
 * These are pure functions meant to be exposed to an LLM agent through function calling.
 * All math happens here, never in the model: the agent only decides which tool to call
 * and explains the result. Inputs accept numbers or decimal strings, and outputs are
 * JSON-safe (BigInts are returned as strings).
 */

import { createShares, isPrime, mod, toBig } from "@/lib/math/shamir";
import { computeLambdas, lagrangeAt, lagrangeAtZero, type Point } from "@/lib/math/lagrange";

export type IntLike = number | string | bigint;
export type MpcOperation = "share" | "sum" | "product";

export interface ShareInput {
  x: IntLike;
  y: IntLike;
}

export interface ShareOutput {
  x: string;
  y: string;
}

// Fixed seed for Miller-Rabin witnesses so results are reproducible
const PRIMALITY_SEED = 1;
const MAX_DIAGNOSE_SHARES = 16;

function parseInteger(value: IntLike, name: string): bigint {
  try {
    if (typeof value === "number" && !Number.isInteger(value)) throw new Error();
    return toBig(typeof value === "string" ? value.trim() : value);
  } catch {
    throw new Error(`${name} must be an integer, got "${String(value)}"`);
  }
}

function toPoints(shares: ShareInput[]): Point[] {
  return shares.map((s, i) => ({
    x: parseInteger(s.x, `shares[${i}].x`),
    y: parseInteger(s.y, `shares[${i}].y`),
  }));
}

function* combinations(size: number, k: number): Generator<number[]> {
  const idx = Array.from({ length: k }, (_, i) => i);
  if (k > size) return;
  for (;;) {
    yield [...idx];
    let i = k - 1;
    while (i >= 0 && idx[i] === size - k + i) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

// ---------------------------------------------------------------------------
// validateParams
// ---------------------------------------------------------------------------

export interface ValidateParamsInput {
  p: IntLike;
  n: number;
  t: number;
  operation?: MpcOperation;
  /** Largest value any single secret may take */
  maxSecret?: IntLike;
  /** Number of secrets summed or multiplied together. Default 2 */
  numInputs?: number;
}

export interface ValidateParamsResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  securityNotes: string[];
  derived: {
    maxColluders: number;
    minPartiesToReconstruct: number;
    toleratedDropouts: number;
    minPartiesForProduct: number;
    largestSafeResult: string;
  };
}

export function validateParams(input: ValidateParamsInput): ValidateParamsResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const securityNotes: string[] = [];
  const operation = input.operation ?? "share";
  const { n, t } = input;
  const p = parseInteger(input.p, "p");

  if (!Number.isInteger(n) || n < 1) errors.push(`n must be a positive integer (got ${n})`);
  if (!Number.isInteger(t) || t < 1) errors.push(`t must be a positive integer (got ${t})`);
  if (Number.isInteger(n) && Number.isInteger(t) && t > n) {
    errors.push(`t=${t} exceeds n=${n}: the secret could never be reconstructed`);
  }

  if (p < 2n || !isPrime(p, PRIMALITY_SEED)) {
    errors.push(`p=${p} is not prime: Shamir needs a prime field so every x has an inverse`);
  } else if (Number.isInteger(n) && p <= BigInt(n)) {
    errors.push(`p=${p} must be greater than n=${n} so every party gets a distinct non-zero x`);
  }

  if (operation === "product" && Number.isInteger(n) && Number.isInteger(t) && n < 2 * t - 1) {
    errors.push(
      `Multiplication needs n ≥ 2t−1 = ${2 * t - 1} parties (have ${n}): the product polynomial has degree 2(t−1)`
    );
  }

  if (input.maxSecret !== undefined && p >= 2n) {
    const maxSecret = parseInteger(input.maxSecret, "maxSecret");
    const numInputs = BigInt(input.numInputs ?? 2);
    if (maxSecret >= p) {
      errors.push(`maxSecret=${maxSecret} must be smaller than p=${p}`);
    }
    if (operation === "sum" && maxSecret * numInputs >= p) {
      errors.push(
        `Sum of ${numInputs} secrets can reach ${maxSecret * numInputs} ≥ p=${p} and will wrap around mod p`
      );
    }
    const maxProduct = maxSecret ** numInputs;
    if (operation === "product" && maxProduct >= p) {
      errors.push(
        `Product of ${numInputs} secrets can reach ${maxProduct} ≥ p=${p} and will wrap around mod p`
      );
    }
  }

  if (errors.length === 0) {
    if (t === 1) {
      warnings.push("t=1 gives every party the secret itself: there is no secrecy");
    }
    if (t === n) {
      warnings.push(`t=n=${n}: a single unavailable party makes reconstruction impossible`);
    }
    if (p < 65536n) {
      warnings.push(
        `p=${p} is small: fine for teaching, but the secret space has only ${p} values and can be guessed`
      );
    }
    securityNotes.push(
      `Any ${t - 1} colluding parties learn nothing about the secret (information-theoretic security)`,
      `Any ${t} parties can reconstruct the secret`,
      `Up to ${n - t} parties may be unavailable`
    );
    if (operation === "product") {
      securityNotes.push(
        `Multiplication with resharing needs ${2 * t - 1} honest, online parties for degree reduction`
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    securityNotes,
    derived: {
      maxColluders: Math.max(0, t - 1),
      minPartiesToReconstruct: t,
      toleratedDropouts: Math.max(0, n - t),
      minPartiesForProduct: 2 * t - 1,
      largestSafeResult: (p > 0n ? p - 1n : 0n).toString(),
    },
  };
}

// ---------------------------------------------------------------------------
// generateShares
// ---------------------------------------------------------------------------

export interface GenerateSharesInput {
  secret: IntLike;
  p: IntLike;
  n: number;
  t: number;
  /** Deterministic coefficients for reproducible demos. Omit for secure randomness */
  seed?: number;
}

export interface GenerateSharesResult {
  polynomial: string[];
  shares: ShareOutput[];
}

export function generateShares(input: GenerateSharesInput): GenerateSharesResult {
  const secret = parseInteger(input.secret, "secret");
  const p = parseInteger(input.p, "p");
  const check = validateParams({ p, n: input.n, t: input.t, maxSecret: secret });
  if (!check.ok) throw new Error(check.errors.join("; "));
  if (secret < 0n) throw new Error("secret must be non-negative");

  const { polynomial, shares } = createShares(secret, input.n, input.t, p, input.seed);
  return {
    polynomial: polynomial.map(String),
    shares: shares.map((s) => ({ x: s.x.toString(), y: s.y.toString() })),
  };
}

// ---------------------------------------------------------------------------
// nextPrime
// ---------------------------------------------------------------------------

export interface NextPrimeResult {
  prime: string;
  bits: number;
}

/** Smallest prime strictly greater than `greaterThan` */
export function nextPrime(greaterThan: IntLike): NextPrimeResult {
  const start = parseInteger(greaterThan, "greaterThan");
  if (start < 2n) return { prime: "2", bits: 2 };
  if (start.toString(2).length > 256) throw new Error("Values above 2^256 are not supported");

  let candidate = start + 1n;
  if (candidate % 2n === 0n) candidate++;
  while (!isPrime(candidate, PRIMALITY_SEED)) candidate += 2n;
  return { prime: candidate.toString(), bits: candidate.toString(2).length };
}

// ---------------------------------------------------------------------------
// reconstruct
// ---------------------------------------------------------------------------

export interface ReconstructInput {
  shares: ShareInput[];
  p: IntLike;
}

export interface ReconstructResult {
  secret: string;
  lambdas: string[];
  sharesUsed: number;
}

export function reconstruct(input: ReconstructInput): ReconstructResult {
  const p = parseInteger(input.p, "p");
  if (p < 2n || !isPrime(p, PRIMALITY_SEED)) throw new Error(`p=${p} is not prime`);
  const points = toPoints(input.shares).map((pt) => ({ x: mod(pt.x, p), y: mod(pt.y, p) }));
  if (points.length === 0) throw new Error("Need at least one share");
  if (points.some((pt) => pt.x === 0n)) throw new Error("Share x-coordinates must be non-zero");
  if (new Set(points.map((pt) => pt.x.toString())).size !== points.length) {
    throw new Error("Share x-coordinates must be distinct");
  }

  return {
    secret: lagrangeAtZero(points, p).toString(),
    lambdas: computeLambdas(points, p).map(String),
    sharesUsed: points.length,
  };
}

// ---------------------------------------------------------------------------
// diagnoseReconstruction
// ---------------------------------------------------------------------------

export type DiagnosisCode =
  | "NOT_PRIME"
  | "INVALID_X_ZERO"
  | "OUT_OF_FIELD"
  | "DUPLICATE_SHARE"
  | "CONFLICTING_DUPLICATE"
  | "INSUFFICIENT_SHARES"
  | "CORRUPTED_SHARES"
  | "THRESHOLD_MISMATCH"
  | "UNDETECTABLE_WITH_T_SHARES"
  | "SECRET_EXCEEDS_PRIME"
  | "EXPECTED_MISMATCH"
  | "UNRESOLVABLE";

export interface DiagnosisCause {
  code: DiagnosisCode;
  message: string;
  shareIndices?: number[];
}

export interface DiagnoseInput {
  shares: ShareInput[];
  p: IntLike;
  t: number;
  expectedSecret?: IntLike;
}

export interface DiagnoseResult {
  status: "ok" | "repaired" | "failed";
  causes: DiagnosisCause[];
  /** Indices into the input array of shares judged faulty */
  badShareIndices: number[];
  /** Secret reconstructed from the largest consistent set of shares, if one was found */
  recoveredSecret: string | null;
  /** Indices of the shares that agree on one degree-(t-1) polynomial */
  consistentShareIndices: number[];
  fixes: string[];
}

export function diagnoseReconstruction(input: DiagnoseInput): DiagnoseResult {
  const { t } = input;
  const p = parseInteger(input.p, "p");
  const raw = toPoints(input.shares);
  const causes: DiagnosisCause[] = [];
  const fixes: string[] = [];
  const bad = new Set<number>();

  const fail = (): DiagnoseResult => ({
    status: "failed",
    causes,
    badShareIndices: [...bad].sort((a, b) => a - b),
    recoveredSecret: null,
    consistentShareIndices: [],
    fixes,
  });

  if (!Number.isInteger(t) || t < 1) throw new Error("t must be a positive integer");

  if (p < 2n || !isPrime(p, PRIMALITY_SEED)) {
    causes.push({
      code: "NOT_PRIME",
      message: `p=${p} is not prime, so Lagrange weights are undefined`,
    });
    fixes.push("Use the same prime p the dealer used to create the shares");
    return fail();
  }

  // Per-share sanity checks; collect the indices of usable shares
  const usable: number[] = [];
  const seenX = new Map<string, number>();
  raw.forEach((pt, i) => {
    if (pt.x < 0n || pt.x >= p || pt.y < 0n || pt.y >= p) {
      causes.push({
        code: "OUT_OF_FIELD",
        message: `Share #${i} (${pt.x}, ${pt.y}) lies outside [0, p−1] for p=${p}: it was probably created with a different prime`,
        shareIndices: [i],
      });
      bad.add(i);
      return;
    }
    if (pt.x === 0n) {
      causes.push({
        code: "INVALID_X_ZERO",
        message: `Share #${i} has x=0, which is the secret itself, not a valid share`,
        shareIndices: [i],
      });
      bad.add(i);
      return;
    }
    const key = pt.x.toString();
    const prev = seenX.get(key);
    if (prev !== undefined) {
      if (raw[prev].y === pt.y) {
        causes.push({
          code: "DUPLICATE_SHARE",
          message: `Share #${i} duplicates share #${prev} (x=${pt.x}) and adds no information`,
          shareIndices: [prev, i],
        });
      } else {
        causes.push({
          code: "CONFLICTING_DUPLICATE",
          message: `Shares #${prev} and #${i} both claim x=${pt.x} with different y values: at least one is corrupted`,
          shareIndices: [prev, i],
        });
        bad.add(i);
      }
      return;
    }
    seenX.set(key, i);
    usable.push(i);
  });

  if (usable.length < t) {
    causes.push({
      code: "INSUFFICIENT_SHARES",
      message: `Only ${usable.length} distinct valid shares, but threshold t=${t} requires ${t}`,
    });
    fixes.push(`Collect ${t - usable.length} more share(s) from other parties`);
    return fail();
  }

  if (usable.length > MAX_DIAGNOSE_SHARES) {
    throw new Error(`Diagnosis supports at most ${MAX_DIAGNOSE_SHARES} shares`);
  }

  const points = usable.map((i) => raw[i]);
  const m = points.length;
  let consistent: number[];

  if (m === t) {
    // Any t points define a polynomial, so corruption cannot be detected
    consistent = usable;
  } else {
    // Find the degree-(t-1) polynomial that agrees with the most shares
    let best: number[] = [];
    for (const subset of combinations(m, t)) {
      const basis = subset.map((k) => points[k]);
      const agreeing = points
        .map((pt, k) => (lagrangeAt(basis, pt.x, p) === pt.y ? k : -1))
        .filter((k) => k >= 0);
      if (agreeing.length > best.length) best = agreeing;
      if (best.length === m) break;
    }

    if (best.length === m) {
      consistent = usable;
    } else if (best.length > t) {
      // A polynomial through more than t points is overwhelmingly unlikely by chance
      const corrupted = usable.filter((_, k) => !best.includes(k));
      corrupted.forEach((i) => bad.add(i));
      causes.push({
        code: "CORRUPTED_SHARES",
        message: `${best.length} of ${m} shares lie on one degree-${t - 1} polynomial; share(s) ${corrupted
          .map((i) => `#${i}`)
          .join(", ")} do not and are corrupted or tampered with`,
        shareIndices: corrupted,
      });
      fixes.push(
        "Discard the corrupted share(s) and, if possible, request fresh copies from those parties"
      );
      consistent = best.map((k) => usable[k]);
    } else {
      // No polynomial of degree t-1 fits more than t points: maybe the threshold is wrong
      let fitted: number | null = null;
      for (let t2 = t + 1; t2 < m; t2++) {
        const basis = points.slice(0, t2);
        if (points.slice(t2).every((pt) => lagrangeAt(basis, pt.x, p) === pt.y)) {
          fitted = t2;
          break;
        }
      }
      if (fitted !== null) {
        causes.push({
          code: "THRESHOLD_MISMATCH",
          message: `All ${m} shares fit a degree-${fitted - 1} polynomial, not degree ${t - 1}: the dealer most likely used threshold t=${fitted}`,
        });
        fixes.push(`Reconstruct with t=${fitted}, using at least ${fitted} shares`);
        return {
          status: "repaired",
          causes,
          badShareIndices: [...bad].sort((a, b) => a - b),
          recoveredSecret: lagrangeAtZero(points, p).toString(),
          consistentShareIndices: usable,
          fixes,
        };
      }
      causes.push({
        code: "UNRESOLVABLE",
        message: `The shares are inconsistent: no degree-${t - 1} polynomial fits more than ${t} of the ${m} shares. With m shares, up to ⌊(m−t)/2⌋ = ${Math.floor(
          (m - t) / 2
        )} corrupted share(s) can be corrected`,
      });
      fixes.push("Check that p and t match the dealer's parameters, and gather more shares");
      return fail();
    }
  }

  const recovered = lagrangeAtZero(
    consistent.map((i) => raw[i]),
    p
  );

  if (m === t && input.expectedSecret === undefined) {
    causes.push({
      code: "UNDETECTABLE_WITH_T_SHARES",
      message: `Exactly t=${t} shares were given: any ${t} points fit some degree-${t - 1} polynomial, so a corrupted share cannot be detected`,
    });
    fixes.push(`Provide at least ${t + 1} shares to detect corruption, or ${t + 2} to locate it`);
  }

  if (input.expectedSecret !== undefined) {
    const expected = parseInteger(input.expectedSecret, "expectedSecret");
    if (expected !== recovered) {
      if (mod(expected, p) === recovered) {
        causes.push({
          code: "SECRET_EXCEEDS_PRIME",
          message: `Recovered ${recovered} = ${expected} mod ${p}: the secret is ≥ p and wrapped around`,
        });
        fixes.push(`Choose a prime larger than ${expected}`);
      } else if (m === t) {
        causes.push({
          code: "UNDETECTABLE_WITH_T_SHARES",
          message: `Recovered ${recovered}, expected ${expected}. With exactly t=${t} shares the faulty share cannot be located`,
        });
        fixes.push(`Provide at least ${t + 2} shares so the corrupted one can be located`);
      } else {
        causes.push({
          code: "EXPECTED_MISMATCH",
          message: `The consistent shares reconstruct ${recovered}, not ${expected}: the expected value, p, or the dealer's secret is different`,
        });
      }
      return {
        status: "failed",
        causes,
        badShareIndices: [...bad].sort((a, b) => a - b),
        recoveredSecret: recovered.toString(),
        consistentShareIndices: consistent,
        fixes,
      };
    }
  }

  const hardFault = causes.some((c) =>
    ["CORRUPTED_SHARES", "OUT_OF_FIELD", "INVALID_X_ZERO", "CONFLICTING_DUPLICATE"].includes(c.code)
  );

  return {
    status: hardFault ? "repaired" : "ok",
    causes,
    badShareIndices: [...bad].sort((a, b) => a - b),
    recoveredSecret: recovered.toString(),
    consistentShareIndices: consistent,
    fixes,
  };
}
