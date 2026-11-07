/**
 * @fileoverview Federated Averaging (FedAvg) with Shamir secure aggregation
 *
 * Each round:
 * 1. The server broadcasts global weights w.
 * 2. Every client trains locally and computes its update delta_k = w_k - w.
 * 3. Clients securely aggregate [n_k * delta_k, n_k] (sample-weighted update and sample count),
 *    so neither the update nor the client's dataset size is revealed.
 * 4. The server sets w <- w + sum(n_k * delta_k) / sum(n_k).
 *
 * A plaintext FedAvg run on the same data is trained alongside as a baseline:
 * both curves should match up to fixed-point rounding error.
 */

import { generateFederatedDataset, type FederatedDataset } from "./dataset";
import { accuracy, localTrain, loss } from "./model";
import { mulberry32, secureFieldRng, seededFieldRng } from "./random";
import {
  plaintextAggregate,
  secureAggregate,
  type ClientUpdate,
  type SecureAggregationResult,
} from "./secureAggregation";
import { DEFAULT_SCALE } from "./fixedPoint";

export interface FederatedConfig {
  numClients: number;
  threshold: number;
  rounds: number;
  learningRate: number;
  localSteps: number;
  samplesPerClient: number;
  /** Clients that go offline after sharing, each round (clamped to numClients - threshold) */
  offlinePerRound?: number;
  /** Seed for the dataset and dropout choice */
  dataSeed?: number;
  /** Seed for Shamir coefficients. Omit to use the secure random source */
  shareSeed?: number;
  skew?: number;
}

export interface RoundLog {
  round: number;
  plainLoss: number;
  secureLoss: number;
  plainAccuracy: number;
  secureAccuracy: number;
  /** Max |secure sum - plaintext sum| over coordinates for this round's updates */
  aggregationError: number;
  offlineClients: number[];
  messages: number;
}

export interface LastRoundDetail {
  /** Raw weighted updates per client: what a non-private server would see */
  clientUpdates: ClientUpdate[];
  aggregation: SecureAggregationResult;
}

export interface FederatedResult {
  dataset: FederatedDataset;
  history: RoundLog[];
  plainWeights: number[];
  secureWeights: number[];
  lastRound: LastRoundDetail | null;
}

const NUM_FEATURES = 3; // x1, x2, bias

export function runFederatedTraining(config: FederatedConfig): FederatedResult {
  const {
    numClients,
    threshold,
    rounds,
    learningRate,
    localSteps,
    samplesPerClient,
    dataSeed = 42,
  } = config;

  if (threshold > numClients) throw new Error("Threshold cannot exceed number of clients");

  const dataset = generateFederatedDataset({
    numClients,
    samplesPerClient,
    testSamples: 400,
    seed: dataSeed,
    skew: config.skew,
  });
  const dropoutRng = mulberry32(dataSeed + 1);
  const fieldRng =
    config.shareSeed !== undefined ? seededFieldRng(config.shareSeed) : secureFieldRng();
  const maxOffline = Math.max(0, Math.min(config.offlinePerRound ?? 0, numClients - threshold));

  let plainWeights = new Array(NUM_FEATURES).fill(0);
  let secureWeights = new Array(NUM_FEATURES).fill(0);
  const history: RoundLog[] = [];
  let lastRound: LastRoundDetail | null = null;

  const buildUpdates = (weights: number[]): ClientUpdate[] =>
    dataset.clients.map((client) => {
      const local = localTrain(weights, client.samples, learningRate, localSteps);
      const nk = client.samples.length;
      return {
        clientId: client.clientId,
        values: [...local.map((wk, k) => nk * (wk - weights[k])), nk],
      };
    });

  const applyAggregate = (weights: number[], sum: number[]): number[] => {
    const totalSamples = sum[NUM_FEATURES];
    return weights.map((wk, k) => wk + sum[k] / totalSamples);
  };

  for (let round = 1; round <= rounds; round++) {
    // Baseline: plaintext FedAvg
    plainWeights = applyAggregate(plainWeights, plaintextAggregate(buildUpdates(plainWeights)));

    // Private: Shamir secure aggregation
    const offlineClients = pickOffline(numClients, maxOffline, dropoutRng);
    const updates = buildUpdates(secureWeights);
    const aggregation = secureAggregate(updates, {
      threshold,
      rng: fieldRng,
      scale: DEFAULT_SCALE,
      offlineClients,
    });
    const reference = plaintextAggregate(updates);
    const aggregationError = Math.max(...aggregation.sum.map((v, k) => Math.abs(v - reference[k])));
    secureWeights = applyAggregate(secureWeights, aggregation.sum);

    history.push({
      round,
      plainLoss: loss(plainWeights, dataset.test),
      secureLoss: loss(secureWeights, dataset.test),
      plainAccuracy: accuracy(plainWeights, dataset.test),
      secureAccuracy: accuracy(secureWeights, dataset.test),
      aggregationError,
      offlineClients,
      messages: aggregation.messages.length + aggregation.serverView.length,
    });

    if (round === rounds) lastRound = { clientUpdates: updates, aggregation };
  }

  return { dataset, history, plainWeights, secureWeights, lastRound };
}

function pickOffline(numClients: number, count: number, rng: () => number): number[] {
  const ids = Array.from({ length: numClients }, (_, i) => i + 1);
  // Partial Fisher-Yates shuffle
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (ids.length - i));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count).sort((a, b) => a - b);
}
