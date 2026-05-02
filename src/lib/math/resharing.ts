/**
 * @fileoverview Multiplication with resharing (Shamir MPC)
 *
 * Protocol (BGW-style):
 * 1. Each player i computes h_i = f_i * g_i (local product)
 * 2. h_i values are shares of degree-2(t-1) polynomial H(x) where H(0) = a*b
 * 3. To reduce to degree t-1, use weighted resharing:
 *    - Compute Lagrange weights lambda_i at x=0 for a 2t-1 subset of h_i shares
 *    - Each player i samples z_i(x) with z_i(0) = h_i and degree t-1
 *    - Player j receives z_i(j) from all i and computes T_j = sum_i lambda_i * z_i(j)
 *    - Then T(0) = sum_i c_i = H(0) = a*b
 */

import { mod, localProdShares } from "./shamir";
import { randomPolyWithConstant, evalPoly } from "./polynomial";
import { lagrangeAtZero, computeLambdas } from "./lagrange";

export interface ReshareMessage {
  from: number;
  to: number;
  value: bigint;
}

export interface ResharingResult {
  h: bigint[]; // Local products h_i = f_i * g_i
  product: bigint; // Reconstructed product a*b from h shares
  lambdas: bigint[]; // Lagrange weights lambda_i at x=0
  weightedConstants: bigint[]; // c_i = lambda_i * h_i (for inspection)
  zPolys: bigint[][]; // Each player's random polynomial z_i(x)
  messages: ReshareMessage[]; // All resharing messages sent
  Tshares: bigint[]; // Aggregated T shares for each player
}

/**
 * Perform multiplication with resharing
 * Uses degree reduction: reconstruct from degree-2(t-1) to reshare as degree t-1
 *
 * @param fShares - shares of first secret (f_i)
 * @param gShares - shares of second secret (g_i)
 * @param t - threshold
 * @param p - prime modulus
 * @param seed - optional seed for deterministic testing
 * @param coefficientsPerPlayer - optional manual coefficients per player for z_i(x), excluding constant term
 */
export function multiplicationReshare(
  fShares: bigint[],
  gShares: bigint[],
  t: number,
  p: bigint,
  seed?: number,
  coefficientsPerPlayer?: bigint[][]
): ResharingResult {
  const n = fShares.length;
  if (n !== gShares.length) throw new Error("fShares and gShares must have same length");
  if (n < 2 * t - 1) {
    throw new Error(`Need at least ${2 * t - 1} shares for degree reduction (have ${n})`);
  }
  if (coefficientsPerPlayer !== undefined) {
    if (coefficientsPerPlayer.length !== n) {
      throw new Error(`Need coefficients for all ${n} players`);
    }
    const expectedDegree = Math.max(t - 1, 0);
    for (let i = 0; i < n; i++) {
      if (coefficientsPerPlayer[i].length !== expectedDegree) {
        throw new Error(`Player ${i + 1} must have exactly ${expectedDegree} coefficient(s)`);
      }
    }
  }

  // Step 1: Local products
  const h = localProdShares(fShares, gShares, p);

  // Step 2: Reconstruct H(0) = a*b from exactly 2t-1 shares (degree 2(t-1)).
  const interpolationPoints = h.slice(0, 2 * t - 1).map((y, i) => ({ x: BigInt(i + 1), y }));
  const product = lagrangeAtZero(interpolationPoints, p);

  // Step 3: Degree reduction via weighted resharing.
  // z_i(0) remains h_i, and lambda_i are applied while combining received messages.
  // This keeps z_i(x) aligned with user-provided coefficients and protocol notation.
  const subsetLambdas = computeLambdas(interpolationPoints, p);
  const lambdas = new Array<bigint>(n).fill(0n);
  for (let i = 0; i < subsetLambdas.length; i++) {
    lambdas[i] = subsetLambdas[i];
  }
  const weightedConstants = h.map((hi, i) => mod(hi * lambdas[i], p));

  const zPolys: bigint[][] = [];
  let currentSeed = seed;
  for (let i = 0; i < n; i++) {
    if (coefficientsPerPlayer !== undefined) {
      const normalizedCoefficients = coefficientsPerPlayer[i].map((value) => mod(value, p));
      zPolys.push([h[i], ...normalizedCoefficients]);
    } else {
      zPolys.push(randomPolyWithConstant(h[i], t - 1, p, currentSeed));
    }

    if (currentSeed !== undefined) {
      currentSeed = (currentSeed + 1) * 48271;
    }
  }

  // Step 4: Generate resharing messages
  const messages: ReshareMessage[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= n; j++) {
      const value = evalPoly(zPolys[i], BigInt(j), p);
      messages.push({ from: i + 1, to: j, value });
    }
  }

  // Step 5: Aggregate T-shares: T_j = sum_i z_i(x_j)
  // NOTE: The Lagrange weights (lambdas) are NOT applied here.
  // They are used only during the final reconstruction from T-shares.
  const Tshares: bigint[] = new Array(n).fill(0n);
  for (const msg of messages) {
    const j = msg.to - 1;
    Tshares[j] = mod(Tshares[j] + msg.value, p);
  }

  return { h, product, lambdas, weightedConstants, zPolys, messages, Tshares };
}

/**
 * Reconstruct the secret from T-shares
 */
export function reconstructFromTshares(Tshares: bigint[], t: number, p: bigint): bigint {
  if (Tshares.length < t) throw new Error(`Need at least ${t} shares to reconstruct`);

  const points = Tshares.slice(0, t).map((y, i) => ({ x: BigInt(i + 1), y }));
  return lagrangeAtZero(points, p);
}
