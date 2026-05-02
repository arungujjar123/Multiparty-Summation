/**
 * @fileoverview Multiplication with resharing (Shamir MPC)
 *
 * Protocol (BGW-style degree reduction):
 * 1. Each player i computes h_i = f_i * g_i (local product)
 * 2. The h values lie on a degree-2(t-1) polynomial H(x) with H(0) = a*b
 * 3. To reduce degree: each player i creates a random polynomial z_i(x) of degree t-1
 *    with z_i(0) = h_i, and sends z_i(j) to player j
 * 4. Player j computes T_j = Σ λ_i · z_i(j), where λ_i are Lagrange coefficients
 *    for the set of 2t-1 players used, evaluated at 0
 * 5. The T values are shares of a degree t-1 polynomial with T(0) = a*b
 */

import { mod, localProdShares } from "./shamir";
import { randomPolyWithConstant, evalPoly, polyFromCoeffs } from "./polynomial";
import { lagrangeAtZero, computeLambdas } from "./lagrange";

export interface ReshareMessage {
  from: number;
  to: number;
  value: bigint;
}

export interface ResharingResult {
  h: bigint[]; // Local products h_i = f_i * g_i
  product: bigint; // Reconstructed product a*b from h shares
  zPolys: bigint[][]; // Each player's random polynomial z_i(x)
  messages: ReshareMessage[]; // All resharing messages sent
  Tshares: bigint[]; // Aggregated T shares for each player
}

/**
 * Perform multiplication with resharing using BGW degree reduction
 *
 * @param fShares - shares of first secret (f_i values)
 * @param gShares - shares of second secret (g_i values)
 * @param t - threshold
 * @param p - prime modulus
 * @param seed - optional seed for deterministic testing
 * @param customZiCoeffs - optional custom zi polynomial coefficients per player
 *   customZiCoeffs[i] = [placeholder, a1, a2, ...] for player i
 *   The constant term (index 0) is OVERRIDDEN with h_i
 */
export function multiplicationReshare(
  fShares: bigint[],
  gShares: bigint[],
  t: number,
  p: bigint,
  seed?: number,
  customZiCoeffs?: bigint[][]
): ResharingResult {
  const n = fShares.length;
  if (n !== gShares.length) throw new Error("fShares and gShares must have same length");
  if (n < 2 * t - 1) {
    throw new Error(`Need at least ${2 * t - 1} shares for degree reduction (have ${n})`);
  }

  // Step 1: Local products h_i = f_i * g_i
  const h = localProdShares(fShares, gShares, p);

  // Step 2: Reconstruct H(0) = a*b from h shares (for verification)
  const numSharesNeeded = 2 * t - 1;
  const hPoints = h.slice(0, numSharesNeeded).map((y, i) => ({ x: BigInt(i + 1), y }));
  const product = lagrangeAtZero(hPoints, p);

  // Step 3: Each player i creates z_i(x) with z_i(0) = h_i (degree t-1)
  const zPolys: bigint[][] = [];
  let currentSeed = seed;

  for (let i = 0; i < n; i++) {
    if (customZiCoeffs && customZiCoeffs[i]) {
      // Use custom coefficients: constant term = h_i, higher terms from user
      const userCoeffs = customZiCoeffs[i];
      const poly: bigint[] = [h[i]]; // z_i(0) = h_i
      for (let k = 1; k < t; k++) {
        poly.push(k < userCoeffs.length ? mod(userCoeffs[k], p) : 0n);
      }
      zPolys.push(polyFromCoeffs(poly, p));
    } else {
      zPolys.push(randomPolyWithConstant(h[i], t - 1, p, currentSeed));
    }
    if (currentSeed !== undefined) {
      currentSeed = (currentSeed + 1) * 48271;
    }
  }

  // Step 4: Generate resharing messages z_i(j) for all i,j
  const messages: ReshareMessage[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= n; j++) {
      const value = evalPoly(zPolys[i], BigInt(j), p);
      messages.push({ from: i + 1, to: j, value });
    }
  }

  // Step 5: Compute Lagrange coefficients λ_i for the first 2t-1 points
  // These are the recombination vectors: λ_i such that Σ λ_i · h_i = a*b
  const recombPoints = hPoints; // Points (1, h_1), (2, h_2), ..., (2t-1, h_{2t-1})
  const lambdas = computeLambdas(recombPoints, p);

  // Step 6: Compute T_j = Σ_{i=1}^{2t-1} λ_i · z_i(j) for each player j
  // This ensures T(0) = Σ λ_i · z_i(0) = Σ λ_i · h_i = a*b
  const Tshares: bigint[] = new Array(n).fill(0n);
  for (let j = 0; j < n; j++) {
    let sum = 0n;
    for (let i = 0; i < numSharesNeeded; i++) {
      const zi_at_j = evalPoly(zPolys[i], BigInt(j + 1), p);
      sum = mod(sum + mod(lambdas[i] * zi_at_j, p), p);
    }
    Tshares[j] = sum;
  }

  return { h, product, zPolys, messages, Tshares };
}

/**
 * Reconstruct the secret from T-shares
 */
export function reconstructFromTshares(Tshares: bigint[], t: number, p: bigint): bigint {
  if (Tshares.length < t) throw new Error(`Need at least ${t} shares to reconstruct`);

  const points = Tshares.slice(0, t).map((y, i) => ({ x: BigInt(i + 1), y }));
  return lagrangeAtZero(points, p);
}
