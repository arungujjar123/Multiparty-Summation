/**
 * @fileoverview Polynomial evaluation and generation
 */

import { mod, randomCoefficient } from "./shamir";

/**
 * Evaluate polynomial at x: poly[0] + poly[1]*x + poly[2]*x^2 + ...
 * All arithmetic mod p
 */
export function evalPoly(poly: bigint[], x: bigint, p: bigint): bigint {
  let result = 0n;
  let xPower = 1n;

  for (const coeff of poly) {
    result = mod(result + mod(coeff * xPower, p), p);
    xPower = mod(xPower * x, p);
  }

  return result;
}

/**
 * Generate random polynomial with given constant term
 * Returns [constant, c1, c2, ..., c_degree]
 * If seed provided, use seeded PRNG (for testing); otherwise use secure random
 */
export function randomPolyWithConstant(
  constant: bigint,
  degree: number,
  p: bigint,
  seed?: number
): bigint[] {
  const poly: bigint[] = [constant];

  if (seed !== undefined) {
    // Seeded random for reproducible testing
    let s = seed;
    for (let i = 0; i < degree; i++) {
      s = (s * 48271) % 2147483647; // LCG
      poly.push(BigInt(s) % p);
    }
  } else {
    // Secure random
    for (let i = 0; i < degree; i++) {
      poly.push(randomCoefficient(p));
    }
  }

  return poly;
}
