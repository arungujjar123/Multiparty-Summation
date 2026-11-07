/**
 * @fileoverview Fixed-point encoding of real numbers into a prime field
 *
 * Shamir secret sharing works over integers mod p, but model updates are floats.
 * Encoding: x -> round(x * scale) mod p, so negative values map to p - |v|.
 * Decoding: values above p/2 are interpreted as negative.
 *
 * Summing K encoded values is correct as long as |sum * scale| < p/2,
 * which is why a large prime (2^61 - 1) is used.
 */

import { mod } from "@/lib/math/shamir";

/** Mersenne prime 2^61 - 1: large enough that sums of scaled updates never wrap */
export const FL_PRIME = 2n ** 61n - 1n;

/** 16 fractional bits: precision of about 1.5e-5 per coordinate */
export const DEFAULT_SCALE = 2 ** 16;

/**
 * Largest absolute value that can be encoded so that the sum of `count`
 * encoded values still decodes correctly.
 */
export function maxEncodableMagnitude(p: bigint, scale: number, count: number): number {
  const half = p / 2n;
  return Number(half / BigInt(Math.max(1, count))) / scale;
}

export function encodeFixed(
  x: number,
  p: bigint = FL_PRIME,
  scale: number = DEFAULT_SCALE
): bigint {
  if (!Number.isFinite(x)) throw new Error(`Cannot encode non-finite value ${x}`);
  const scaled = BigInt(Math.round(x * scale));
  const absScaled = scaled < 0n ? -scaled : scaled;
  if (absScaled >= p / 2n) {
    throw new Error(`Value ${x} is too large to encode with scale ${scale} in field ${p}`);
  }
  return mod(scaled, p);
}

export function decodeFixed(
  v: bigint,
  p: bigint = FL_PRIME,
  scale: number = DEFAULT_SCALE
): number {
  const reduced = mod(v, p);
  const signed = reduced > p / 2n ? reduced - p : reduced;
  return Number(signed) / scale;
}

export function encodeVector(xs: number[], p: bigint = FL_PRIME, scale = DEFAULT_SCALE): bigint[] {
  return xs.map((x) => encodeFixed(x, p, scale));
}

export function decodeVector(vs: bigint[], p: bigint = FL_PRIME, scale = DEFAULT_SCALE): number[] {
  return vs.map((v) => decodeFixed(v, p, scale));
}
