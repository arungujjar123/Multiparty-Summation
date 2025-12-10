/**
 * @fileoverview Core Shamir Secret Sharing implementation
 * All arithmetic is done modulo prime p using BigInt
 */

import { randomPolyWithConstant, evalPoly } from "./polynomial";

export { randomPolyWithConstant, evalPoly };

/**
 * Convert number or string to BigInt
 */
export function toBig(val: number | string | bigint): bigint {
  return typeof val === "bigint" ? val : BigInt(val);
}

/**
 * Modular arithmetic: ((a % p) + p) % p
 */
export function mod(a: bigint, p: bigint): bigint {
  return ((a % p) + p) % p;
}

/**
 * Extended Euclidean Algorithm
 * Returns [gcd, x, y] such that gcd = a*x + b*y
 */
export function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = egcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

/**
 * Modular multiplicative inverse
 * Returns x such that (a * x) % p === 1
 * Throws if inverse doesn't exist (gcd(a,p) !== 1)
 */
export function modInverse(a: bigint, p: bigint): bigint {
  const [g, x] = egcd(mod(a, p), p);
  if (g !== 1n) {
    throw new Error(`Modular inverse does not exist for ${a} mod ${p}`);
  }
  return mod(x, p);
}

/**
 * Basic primality test (trial division for small primes, then Miller-Rabin)
 */
export function isPrime(n: bigint, seed?: number): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // Trial division up to 1000
  for (let i = 3n; i < 1000n && i * i <= n; i += 2n) {
    if (n % i === 0n) return false;
  }

  // Miller-Rabin test with a few rounds
  return millerRabin(n, 5, seed);
}

/**
 * Miller-Rabin primality test
 */
function millerRabin(n: bigint, k: number, seed?: number): boolean {
  // Write n-1 as 2^r * d
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }

  // Witness loop
  witnessLoop: for (let i = 0; i < k; i++) {
    const a = randomBigInt(2n, n - 2n, seed ? seed + i : undefined);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    for (let j = 0n; j < r - 1n; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) continue witnessLoop;
    }
    return false;
  }
  return true;
}

/**
 * Modular exponentiation: (base^exp) % mod
 */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * Simple seeded PRNG for testing (LCG algorithm)
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

/**
 * Generate random BigInt in range [min, max] inclusive using crypto
 */
function randomBigInt(min: bigint, max: bigint, seed?: number): bigint {
  if (seed !== undefined) {
    // Deterministic PRNG for testing
    const rng = seededRandom(seed);
    const range = max - min + 1n;
    const random = BigInt(Math.floor(rng() * Number(range)));
    return min + random;
  }

  const range = max - min + 1n;
  const bits = range.toString(2).length;
  const bytes = Math.ceil(bits / 8);

  let result: bigint;
  do {
    const randomBytes = new Uint8Array(bytes);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(randomBytes);
    } else {
      // Node.js environment - use dynamic import alternative
      throw new Error(
        "Server-side random generation not implemented. Use seed parameter for testing."
      );
    }
    result = BigInt(
      "0x" + Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("")
    );
  } while (result >= range);

  return min + result;
}

/**
 * Secure random coefficient in [0, p-1]
 */
export function randomCoefficient(p: bigint): bigint {
  return randomBigInt(0n, p - 1n);
}

/**
 * Create Shamir shares for secret s with threshold t among n players
 * Returns polynomial coefficients and shares [{x, y}]
 */
export interface Share {
  x: bigint;
  y: bigint;
}

export interface SharesResult {
  polynomial: bigint[];
  shares: Share[];
}

export function createShares(
  secret: bigint,
  n: number,
  t: number,
  p: bigint,
  seed?: number
): SharesResult {
  if (t > n) throw new Error("Threshold t cannot exceed number of players n");
  if (t < 1) throw new Error("Threshold t must be at least 1");
  if (n < 1) throw new Error("Number of players n must be at least 1");
  if (!isPrime(p, seed)) throw new Error(`p=${p} is not prime`);

  const polynomial = randomPolyWithConstant(secret, t - 1, p, seed);
  const shares: Share[] = [];

  for (let i = 1; i <= n; i++) {
    const x = BigInt(i);
    const y = evalPoly(polynomial, x, p);
    shares.push({ x, y });
  }

  return { polynomial, shares };
}

/**
 * Local sum of shares: h_i = f_i + g_i (mod p)
 */
export function localSumShares(fShares: bigint[], gShares: bigint[], p: bigint): bigint[] {
  if (fShares.length !== gShares.length) {
    throw new Error("Share arrays must have same length");
  }
  return fShares.map((f, i) => mod(f + gShares[i], p));
}

/**
 * Local product of shares: h_i = f_i * g_i (mod p)
 */
export function localProdShares(fShares: bigint[], gShares: bigint[], p: bigint): bigint[] {
  if (fShares.length !== gShares.length) {
    throw new Error("Share arrays must have same length");
  }
  return fShares.map((f, i) => mod(f * gShares[i], p));
}
