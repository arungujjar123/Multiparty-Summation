/**
 * @fileoverview Multiplication with resharing (Shamir MPC)
 *
 * Protocol (BGW-style):
 * 1. Each player i computes h_i = f_i * g_i (local product)
 * 2. h_i values are shares of degree-2(t-1) polynomial H(x) where H(0) = a*b
 * 3. To reduce to degree t-1, use resharing with degree reduction:
 *    - Reconstruct H(0) from h_i values (needs 2t-1 shares)
 *    - Then reshare this value as new degree t-1 secret
 *
 * Simplified approach used here:
 *    - Each player i reshares h_i using polynomial z_i(x) with z_i(0) = h_i
 *    - Player j receives all z_i(j) and computes T_j = sum_i z_i(j)
 *    - The T_j values are shares of a NEW polynomial T(x) where T(0) = sum_i h_i
 *    - But we need T(0) = H(0) = a*b, not sum_i h_i
 *    - So instead, we first reconstruct H(0) from the h shares, then reshare that
 */

import { mod, localProdShares } from "./shamir";
import { randomPolyWithConstant, evalPoly } from "./polynomial";
import { lagrangeAtZero } from "./lagrange";

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
 * Perform multiplication with resharing
 * Uses degree reduction: reconstruct from degree-2(t-1) to reshare as degree t-1
 *
 * @param fShares - shares of first secret (f_i)
 * @param gShares - shares of second secret (g_i)
 * @param t - threshold
 * @param p - prime modulus
 * @param seed - optional seed for deterministic testing
 */
export function multiplicationReshare(
  fShares: bigint[],
  gShares: bigint[],
  t: number,
  p: bigint,
  seed?: number
): ResharingResult {
  const n = fShares.length;
  if (n !== gShares.length) throw new Error("fShares and gShares must have same length");
  if (n < 2 * t - 1) {
    throw new Error(`Need at least ${2 * t - 1} shares for degree reduction (have ${n})`);
  }

  // Step 1: Local products
  const h = localProdShares(fShares, gShares, p);

  // Step 2: Reconstruct H(0) = a*b from the h shares (degree 2(t-1) polynomial)
  // Need 2t-1 points to interpolate degree 2(t-1) polynomial
  const hPoints = h.slice(0, 2 * t - 1).map((y, i) => ({ x: BigInt(i + 1), y }));
  const product = lagrangeAtZero(hPoints, p);

  // Step 3: Reshare the product as a new degree t-1 secret
  // Each player creates a polynomial with constant = product (simulating distributed resharing)
  // In real MPC, each player would only know a share, but for simulation we do centralized reshare
  const zPolys: bigint[][] = [];
  let currentSeed = seed;

  // Generate a single master polynomial for the reshared secret
  const masterPoly = randomPolyWithConstant(product, t - 1, p, currentSeed);

  // Each player's z polynomial is the master polynomial (in reality each would have different random polys)
  // But for correct reconstruction, we need the sum of z_i(j) to equal the new share
  // Better approach: each player contributes to the new sharing
  for (let i = 0; i < n; i++) {
    // For simplicity: player 0 creates the full polynomial, others contribute 0
    // This is not secure MPC but demonstrates the concept
    if (i === 0) {
      zPolys.push(masterPoly);
    } else {
      const zeroPoly = new Array(t).fill(0n);
      zPolys.push(zeroPoly);
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

  // Step 5: Aggregate T-shares
  const Tshares: bigint[] = new Array(n).fill(0n);
  for (const msg of messages) {
    const j = msg.to - 1;
    Tshares[j] = mod(Tshares[j] + msg.value, p);
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
