/**
 * @fileoverview Synthetic binary classification dataset split across federated clients
 *
 * Two Gaussian blobs in 2D. Each sample's feature vector is [x1, x2, 1]
 * (the trailing 1 is the bias term). Clients receive a non-IID split:
 * each client is skewed towards one class, as in real federated settings
 * where different hospitals or banks see different populations.
 */

import { mulberry32 } from "./random";

export interface Sample {
  features: number[];
  label: 0 | 1;
}

export interface ClientDataset {
  clientId: number; // 1-based, also used as the Shamir x-coordinate
  samples: Sample[];
}

export interface FederatedDataset {
  clients: ClientDataset[];
  test: Sample[];
}

export interface DatasetConfig {
  numClients: number;
  samplesPerClient: number;
  testSamples: number;
  seed: number;
  /** 0 = IID, 1 = each client sees mostly one class. Default 0.6 */
  skew?: number;
}

const CLASS_CENTERS: Record<0 | 1, [number, number]> = {
  0: [-1.2, -0.8],
  1: [1.0, 1.3],
};

function gaussian(rng: () => number): number {
  // Box-Muller transform
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeSample(label: 0 | 1, rng: () => number): Sample {
  const [cx, cy] = CLASS_CENTERS[label];
  return { features: [cx + gaussian(rng), cy + gaussian(rng), 1], label };
}

export function generateFederatedDataset(config: DatasetConfig): FederatedDataset {
  const { numClients, samplesPerClient, testSamples, seed } = config;
  const skew = Math.min(1, Math.max(0, config.skew ?? 0.6));
  if (numClients < 1) throw new Error("Need at least one client");

  const rng = mulberry32(seed);

  const clients: ClientDataset[] = Array.from({ length: numClients }, (_, i) => {
    // Alternate the dominant class; P(label = dominant) = 0.5 + skew / 2
    const dominant: 0 | 1 = i % 2 === 0 ? 0 : 1;
    const pDominant = 0.5 + skew / 2;
    const samples = Array.from({ length: samplesPerClient }, () => {
      const label: 0 | 1 = rng() < pDominant ? dominant : dominant === 0 ? 1 : 0;
      return makeSample(label, rng);
    });
    return { clientId: i + 1, samples };
  });

  const test = Array.from({ length: testSamples }, () => makeSample(rng() < 0.5 ? 0 : 1, rng));

  return { clients, test };
}
