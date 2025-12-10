/**
 * @fileoverview Lagrange interpolation for secret reconstruction
 */

import { mod, modInverse } from "./shamir";

export interface Point {
  x: bigint;
  y: bigint;
}

/**
 * Lagrange interpolation at x=0 to reconstruct secret
 * Takes a subset of points and returns f(0)
 *
 * Formula: f(0) = sum_i ( y_i * lambda_i )
 * where lambda_i = prod_{j != i} (0 - x_j) / (x_i - x_j)
 *                = prod_{j != i} (-x_j) / (x_i - x_j)  (mod p)
 */
export function lagrangeAtZero(points: Point[], p: bigint): bigint {
  if (points.length === 0) throw new Error("Need at least one point");

  let result = 0n;

  for (let i = 0; i < points.length; i++) {
    const { x: xi, y: yi } = points[i];
    let lambda = 1n;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const xj = points[j].x;

      // Numerator: -xj (mod p)
      const num = mod(-xj, p);
      // Denominator: xi - xj (mod p)
      const denom = mod(xi - xj, p);
      // lambda *= num / denom (mod p)
      lambda = mod(lambda * mod(num * modInverse(denom, p), p), p);
    }

    result = mod(result + mod(yi * lambda, p), p);
  }

  return result;
}

/**
 * Compute individual lambda_i for inspection/display
 */
export function computeLambdas(points: Point[], p: bigint): bigint[] {
  return points.map((_, i) => {
    let lambda = 1n;
    const xi = points[i].x;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const xj = points[j].x;
      const num = mod(-xj, p);
      const denom = mod(xi - xj, p);
      lambda = mod(lambda * mod(num * modInverse(denom, p), p), p);
    }

    return lambda;
  });
}

/**
 * Detailed Lagrange computation for educational display
 */
export interface LagrangeDetails {
  points: Point[];
  lambdas: bigint[];
  terms: bigint[];
  result: bigint;
}

export function lagrangeWithDetails(points: Point[], p: bigint): LagrangeDetails {
  const lambdas = computeLambdas(points, p);
  const terms = points.map((pt, i) => mod(pt.y * lambdas[i], p));
  const result = terms.reduce((sum, term) => mod(sum + term, p), 0n);

  return { points, lambdas, terms, result };
}
