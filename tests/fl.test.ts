/**
 * @fileoverview Tests for federated learning with Shamir secure aggregation
 */

import {
  decodeFixed,
  encodeFixed,
  FL_PRIME,
  DEFAULT_SCALE,
  maxEncodableMagnitude,
} from "@/lib/fl/fixedPoint";
import { secureFieldRng, seededFieldRng } from "@/lib/fl/random";
import { plaintextAggregate, secureAggregate, type ClientUpdate } from "@/lib/fl/secureAggregation";
import { runFederatedTraining } from "@/lib/fl/trainer";
import { lagrangeAtZero } from "@/lib/math/lagrange";

const updates: ClientUpdate[] = [
  { clientId: 1, values: [0.5, -1.25, 3] },
  { clientId: 2, values: [-0.75, 2.5, -0.001] },
  { clientId: 3, values: [1.0, 0.0, 10] },
  { clientId: 4, values: [-2.0, -0.5, 0.25] },
  { clientId: 5, values: [0.125, 1.75, -7] },
];

describe("Fixed-point encoding", () => {
  test("round-trips positive, negative and zero values", () => {
    for (const x of [0, 1, -1, 3.14159, -2.71828, 1234.5678, -0.00002]) {
      expect(decodeFixed(encodeFixed(x))).toBeCloseTo(x, 4);
    }
  });

  test("negative values map to the top half of the field", () => {
    const enc = encodeFixed(-1);
    expect(enc).toBe(FL_PRIME - BigInt(DEFAULT_SCALE));
  });

  test("sum of encodings decodes to the sum of values", () => {
    const xs = [1.5, -2.25, 0.75, -10];
    const encSum = xs.map((x) => encodeFixed(x)).reduce((a, b) => (a + b) % FL_PRIME, 0n);
    expect(decodeFixed(encSum)).toBeCloseTo(-10, 4);
  });

  test("rejects values that would overflow the field", () => {
    expect(() => encodeFixed(Number.MAX_SAFE_INTEGER)).toThrow();
    expect(() => encodeFixed(NaN)).toThrow();
    expect(maxEncodableMagnitude(FL_PRIME, DEFAULT_SCALE, 10)).toBeGreaterThan(1e9);
  });
});

describe("Secure field RNG", () => {
  test("produces values in [0, p-1]", () => {
    const rng = secureFieldRng();
    for (let i = 0; i < 200; i++) {
      const v = rng(97n);
      expect(v >= 0n && v < 97n).toBe(true);
    }
  });

  test("seeded RNG is reproducible", () => {
    const a = seededFieldRng(7);
    const b = seededFieldRng(7);
    expect([a(FL_PRIME), a(FL_PRIME)]).toEqual([b(FL_PRIME), b(FL_PRIME)]);
  });
});

describe("Secure aggregation", () => {
  test("secure sum equals plaintext sum", () => {
    const result = secureAggregate(updates, { threshold: 3, rng: seededFieldRng(1) });
    const expected = plaintextAggregate(updates);
    result.sum.forEach((v, k) => expect(v).toBeCloseTo(expected[k], 4));
  });

  test("works with the default secure random source", () => {
    const result = secureAggregate(updates, { threshold: 3 });
    const expected = plaintextAggregate(updates);
    result.sum.forEach((v, k) => expect(v).toBeCloseTo(expected[k], 4));
  });

  test("every client sends one share to every client", () => {
    const result = secureAggregate(updates, { threshold: 3, rng: seededFieldRng(2) });
    expect(result.messages).toHaveLength(updates.length * updates.length);
  });

  test("tolerates clients going offline after sharing", () => {
    const result = secureAggregate(updates, {
      threshold: 3,
      rng: seededFieldRng(3),
      offlineClients: [2, 5],
    });
    expect(result.onlineHolders).toEqual([1, 3, 4]);
    expect(result.serverView.map((s) => s.holder)).not.toContain(2);
    const expected = plaintextAggregate(updates);
    result.sum.forEach((v, k) => expect(v).toBeCloseTo(expected[k], 4));
  });

  test("fails clearly when fewer than t clients are online", () => {
    expect(() =>
      secureAggregate(updates, { threshold: 4, rng: seededFieldRng(4), offlineClients: [1, 2] })
    ).toThrow(/need at least t=4/);
  });

  test("t-1 partial sums do not reveal the aggregate", () => {
    const result = secureAggregate(updates, { threshold: 3, rng: seededFieldRng(5) });
    const twoPoints = result.serverView.slice(0, 2);
    const guess = lagrangeAtZero(
      twoPoints.map((ps) => ({ x: BigInt(ps.holder), y: ps.values[0] })),
      FL_PRIME
    );
    expect(guess).not.toBe(result.encodedSum[0]);
  });

  test("server view does not contain any raw client update", () => {
    const result = secureAggregate(updates, { threshold: 3, rng: seededFieldRng(6) });
    const serverValues = new Set(result.serverView.flatMap((ps) => ps.values.map(String)));
    for (const u of updates) {
      for (const x of u.values) {
        expect(serverValues.has(String(encodeFixed(x)))).toBe(false);
      }
    }
  });

  test("validates inputs", () => {
    expect(() => secureAggregate(updates, { threshold: 6 })).toThrow();
    expect(() => secureAggregate(updates, { threshold: 0 })).toThrow();
    expect(() =>
      secureAggregate(
        [
          { clientId: 1, values: [1] },
          { clientId: 1, values: [2] },
        ],
        { threshold: 1 }
      )
    ).toThrow(/distinct/);
    expect(() =>
      secureAggregate(
        [
          { clientId: 1, values: [1] },
          { clientId: 2, values: [2, 3] },
        ],
        { threshold: 1 }
      )
    ).toThrow(/dimension/);
  });
});

describe("Federated training", () => {
  const config = {
    numClients: 5,
    threshold: 3,
    rounds: 25,
    learningRate: 0.5,
    localSteps: 2,
    samplesPerClient: 60,
    dataSeed: 11,
    shareSeed: 12,
  };

  test("secure FedAvg matches plaintext FedAvg", () => {
    const result = runFederatedTraining(config);
    result.secureWeights.forEach((w, k) => expect(w).toBeCloseTo(result.plainWeights[k], 3));
    for (const log of result.history) {
      expect(Math.abs(log.secureLoss - log.plainLoss)).toBeLessThan(1e-3);
      expect(log.aggregationError).toBeLessThan(1e-3);
    }
  });

  test("model actually learns", () => {
    const result = runFederatedTraining(config);
    const first = result.history[0];
    const last = result.history[result.history.length - 1];
    expect(last.secureLoss).toBeLessThan(first.secureLoss);
    expect(last.secureAccuracy).toBeGreaterThan(0.85);
  });

  test("keeps training with dropouts", () => {
    const result = runFederatedTraining({ ...config, offlinePerRound: 2 });
    for (const log of result.history) expect(log.offlineClients).toHaveLength(2);
    expect(result.history[result.history.length - 1].secureAccuracy).toBeGreaterThan(0.85);
  });

  test("offline count is clamped so aggregation never fails", () => {
    const result = runFederatedTraining({ ...config, offlinePerRound: 10 });
    for (const log of result.history) expect(log.offlineClients).toHaveLength(2);
  });
});
