/**
 * @fileoverview Unit tests for Shamir Secret Sharing math library
 */

import {
  mod,
  egcd,
  modInverse,
  isPrime,
  toBig,
  createShares,
  localSumShares,
} from "@/lib/math/shamir";
import { evalPoly, randomPolyWithConstant } from "@/lib/math/polynomial";
import { lagrangeAtZero, lagrangeWithDetails } from "@/lib/math/lagrange";
import { multiplicationReshare, reconstructFromTshares } from "@/lib/math/resharing";

describe("Modular Arithmetic", () => {
  test("mod handles negative numbers correctly", () => {
    expect(mod(-5n, 11n)).toBe(6n);
    expect(mod(-1n, 7n)).toBe(6n);
    expect(mod(15n, 11n)).toBe(4n);
  });

  test("egcd computes extended GCD correctly", () => {
    const [g, x, y] = egcd(35n, 15n);
    expect(g).toBe(5n);
    expect(35n * x + 15n * y).toBe(5n);
  });

  test("modInverse computes correct inverse", () => {
    expect(modInverse(3n, 11n)).toBe(4n);
    expect(mod(3n * modInverse(3n, 11n), 11n)).toBe(1n);
    expect(modInverse(5n, 11n)).toBe(9n);
    expect(mod(5n * 9n, 11n)).toBe(1n);
  });

  test("modInverse throws when inverse doesn't exist", () => {
    expect(() => modInverse(6n, 9n)).toThrow();
    expect(() => modInverse(0n, 11n)).toThrow();
  });
});

describe("Prime Testing", () => {
  test("isPrime correctly identifies primes", () => {
    expect(isPrime(2n, 12345)).toBe(true);
    expect(isPrime(3n, 12345)).toBe(true);
    expect(isPrime(11n, 12345)).toBe(true);
    expect(isPrime(97n, 12345)).toBe(true);
    expect(isPrime(1009n, 12345)).toBe(true);
  });

  test("isPrime correctly identifies non-primes", () => {
    expect(isPrime(0n, 12345)).toBe(false);
    expect(isPrime(1n, 12345)).toBe(false);
    expect(isPrime(4n, 12345)).toBe(false);
    expect(isPrime(100n, 12345)).toBe(false);
    expect(isPrime(1000n, 12345)).toBe(false);
  });
});

describe("Polynomial Operations", () => {
  test("evalPoly evaluates correctly", () => {
    const poly = [4n, 3n, 2n]; // 4 + 3x + 2x^2
    expect(evalPoly(poly, 0n, 11n)).toBe(4n);
    expect(evalPoly(poly, 1n, 11n)).toBe(9n); // 4 + 3 + 2 = 9
    expect(evalPoly(poly, 2n, 11n)).toBe(7n); // 4 + 6 + 8 = 18 mod 11 = 7
  });

  test("randomPolyWithConstant generates polynomial with correct constant", () => {
    const constant = 5n;
    const poly = randomPolyWithConstant(constant, 3, 11n, 12345);
    expect(poly[0]).toBe(constant);
    expect(poly.length).toBe(4); // degree 3 means 4 coefficients
  });

  test("randomPolyWithConstant is deterministic with seed", () => {
    const poly1 = randomPolyWithConstant(7n, 2, 11n, 999);
    const poly2 = randomPolyWithConstant(7n, 2, 11n, 999);
    expect(poly1).toEqual(poly2);
  });
});

describe("Shamir Secret Sharing", () => {
  test("createShares generates correct number of shares", () => {
    const result = createShares(4n, 7, 3, 11n, 12345);
    expect(result.shares.length).toBe(7);
    expect(result.polynomial[0]).toBe(4n);
  });

  test("createShares validates parameters", () => {
    expect(() => createShares(4n, 5, 6, 11n)).toThrow("Threshold t cannot exceed");
    expect(() => createShares(4n, 5, 0, 11n)).toThrow("Threshold t must be at least 1");
    expect(() => createShares(4n, 5, 3, 10n)).toThrow("is not prime");
  });

  test("shares evaluate to correct values", () => {
    const result = createShares(4n, 7, 3, 11n, 12345);
    result.shares.forEach((share) => {
      const y = evalPoly(result.polynomial, share.x, 11n);
      expect(share.y).toBe(y);
    });
  });
});

describe("Lagrange Interpolation", () => {
  test("lagrangeAtZero reconstructs secret from threshold shares", () => {
    const result = createShares(4n, 7, 3, 11n, 12345);
    const subset = result.shares.slice(0, 3); // Take first 3 shares
    const reconstructed = lagrangeAtZero(subset, 11n);
    expect(reconstructed).toBe(4n);
  });

  test("lagrangeAtZero works with any subset of t shares", () => {
    const result = createShares(7n, 5, 3, 11n, 54321);
    // Try different subsets
    const subset1 = [result.shares[0], result.shares[1], result.shares[2]];
    const subset2 = [result.shares[1], result.shares[3], result.shares[4]];
    const subset3 = [result.shares[0], result.shares[2], result.shares[4]];

    expect(lagrangeAtZero(subset1, 11n)).toBe(7n);
    expect(lagrangeAtZero(subset2, 11n)).toBe(7n);
    expect(lagrangeAtZero(subset3, 11n)).toBe(7n);
  });

  test("lagrangeWithDetails provides correct breakdown", () => {
    const result = createShares(5n, 4, 2, 11n, 111);
    const subset = result.shares.slice(0, 2);
    const details = lagrangeWithDetails(subset, 11n);

    expect(details.points).toEqual(subset);
    expect(details.lambdas.length).toBe(2);
    expect(details.terms.length).toBe(2);
    expect(details.result).toBe(5n);
  });
});

describe("Summation Protocol", () => {
  test("localSumShares computes correct local sums", () => {
    const f = createShares(4n, 5, 3, 11n, 100);
    const g = createShares(2n, 5, 3, 11n, 200);
    const fShares = f.shares.map((s) => s.y);
    const gShares = g.shares.map((s) => s.y);

    const hSum = localSumShares(fShares, gShares, 11n);

    // Reconstruct from local sums
    const points = hSum.slice(0, 3).map((y, i) => ({ x: BigInt(i + 1), y }));
    const reconstructed = lagrangeAtZero(points, 11n);

    expect(reconstructed).toBe(mod(4n + 2n, 11n));
  });

  test("localSumShares validates input lengths", () => {
    expect(() => localSumShares([1n, 2n], [3n], 11n)).toThrow("same length");
  });
});

describe("Multiplication with Resharing", () => {
  test("multiplicationReshare computes correct product", () => {
    const p = 11n;
    const n = 7;
    const t = 3;
    const a = 4n;
    const b = 2n;

    const f = createShares(a, n, t, p, 500);
    const g = createShares(b, n, t, p, 600);
    const fShares = f.shares.map((s) => s.y);
    const gShares = g.shares.map((s) => s.y);

    const result = multiplicationReshare(fShares, gShares, t, p, 700);

    // Check that h = f * g locally
    expect(result.h.length).toBe(n);
    result.h.forEach((hi, i) => {
      expect(hi).toBe(mod(fShares[i] * gShares[i], p));
    });

    // Check that we have T-shares
    expect(result.Tshares.length).toBe(n);

    // Reconstruct from T-shares
    const reconstructed = reconstructFromTshares(result.Tshares, t, p);
    expect(reconstructed).toBe(mod(a * b, p));
  });

  test("multiplicationReshare with different values", () => {
    const p = 17n;
    const n = 5;
    const t = 3;
    const a = 7n;
    const b = 3n;

    const f = createShares(a, n, t, p, 1000);
    const g = createShares(b, n, t, p, 2000);
    const fShares = f.shares.map((s) => s.y);
    const gShares = g.shares.map((s) => s.y);

    const result = multiplicationReshare(fShares, gShares, t, p, 3000);
    const reconstructed = reconstructFromTshares(result.Tshares, t, p);

    expect(reconstructed).toBe(mod(7n * 3n, 17n)); // 21 mod 17 = 4
    expect(reconstructed).toBe(4n);
  });

  test("resharing messages are generated correctly", () => {
    const p = 11n;
    const n = 4;
    const t = 2;
    const fShares = [1n, 2n, 3n, 4n];
    const gShares = [5n, 6n, 7n, 8n];

    const result = multiplicationReshare(fShares, gShares, t, p, 800);

    // Should have n * n messages (each player sends to all players)
    expect(result.messages.length).toBe(n * n);

    // Check message structure
    result.messages.forEach((msg) => {
      expect(msg.from).toBeGreaterThanOrEqual(1);
      expect(msg.from).toBeLessThanOrEqual(n);
      expect(msg.to).toBeGreaterThanOrEqual(1);
      expect(msg.to).toBeLessThanOrEqual(n);
      expect(typeof msg.value).toBe("bigint");
    });
  });

  test("reconstructFromTshares validates threshold", () => {
    expect(() => reconstructFromTshares([1n, 2n], 3, 11n)).toThrow("Need at least 3 shares");
  });
});

describe("Edge Cases", () => {
  test("secret of 0 is handled correctly", () => {
    const result = createShares(0n, 5, 2, 11n, 333);
    const reconstructed = lagrangeAtZero(result.shares.slice(0, 2), 11n);
    expect(reconstructed).toBe(0n);
  });

  test("secret equal to p-1 is handled correctly", () => {
    const p = 11n;
    const secret = p - 1n;
    const result = createShares(secret, 5, 3, p, 444);
    const reconstructed = lagrangeAtZero(result.shares.slice(0, 3), p);
    expect(reconstructed).toBe(secret);
  });

  test("threshold t=n works correctly", () => {
    const result = createShares(5n, 5, 5, 11n, 555);
    // Need all shares
    const reconstructed = lagrangeAtZero(result.shares, 11n);
    expect(reconstructed).toBe(5n);
  });

  test("threshold t=1 works correctly (no threshold)", () => {
    const result = createShares(8n, 5, 1, 11n, 666);
    // Need only 1 share (constant polynomial)
    const reconstructed = lagrangeAtZero([result.shares[0]], 11n);
    expect(reconstructed).toBe(8n);
  });
});

describe("Type Conversions", () => {
  test("toBig converts various types correctly", () => {
    expect(toBig(5)).toBe(5n);
    expect(toBig("10")).toBe(10n);
    expect(toBig(7n)).toBe(7n);
  });
});
