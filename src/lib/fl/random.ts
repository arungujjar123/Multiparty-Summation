/**
 * @fileoverview Random sources for the federated learning simulation
 *
 * Two kinds of randomness are needed:
 * - Field elements in [0, p-1] for Shamir polynomial coefficients (must be secure in real use)
 * - Floats in [0, 1) for synthetic data generation and client sampling (seeded, reproducible)
 */

/** Returns a uniformly random field element in [0, p-1] */
export type FieldRng = (p: bigint) => bigint;

/**
 * Seeded 32-bit PRNG (mulberry32). Deterministic, NOT cryptographically secure.
 * Returns floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Cryptographically secure field RNG using Web Crypto (browser and Node.js 19+).
 * Uses rejection sampling so the result is exactly uniform in [0, p-1].
 */
export function secureFieldRng(): FieldRng {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.getRandomValues !== "function") {
    throw new Error("Secure random source unavailable");
  }

  return (p: bigint) => {
    const bits = (p - 1n).toString(2).length;
    const bytes = Math.ceil(bits / 8);
    const excessBits = BigInt(bytes * 8 - bits);
    const buf = new Uint8Array(bytes);

    for (;;) {
      webCrypto.getRandomValues(buf);
      let value = 0n;
      for (const b of buf) value = (value << 8n) | BigInt(b);
      value >>= excessBits;
      if (value < p) return value;
    }
  };
}

/**
 * Seeded field RNG for reproducible tests and demos. NOT secure.
 * Combines two 32-bit outputs into a 64-bit value, then reduces mod p.
 */
export function seededFieldRng(seed: number): FieldRng {
  const next = mulberry32(seed);
  return (p: bigint) => {
    const hi = BigInt(Math.floor(next() * 4294967296));
    const lo = BigInt(Math.floor(next() * 4294967296));
    return ((hi << 32n) | lo) % p;
  };
}
