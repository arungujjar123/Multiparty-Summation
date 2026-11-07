/**
 * @fileoverview Logistic regression model used by each federated client
 */

import type { Sample } from "./dataset";

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function predictProbability(weights: number[], features: number[]): number {
  return sigmoid(dot(weights, features));
}

/** Mean gradient of binary cross-entropy loss over the samples */
export function gradient(weights: number[], samples: Sample[]): number[] {
  const grad = new Array(weights.length).fill(0);
  if (samples.length === 0) return grad;

  for (const { features, label } of samples) {
    const err = predictProbability(weights, features) - label;
    for (let k = 0; k < grad.length; k++) grad[k] += err * features[k];
  }
  return grad.map((g) => g / samples.length);
}

/** Mean binary cross-entropy loss */
export function loss(weights: number[], samples: Sample[]): number {
  if (samples.length === 0) return 0;
  const eps = 1e-12;
  let total = 0;
  for (const { features, label } of samples) {
    const prob = predictProbability(weights, features);
    total += -(label * Math.log(prob + eps) + (1 - label) * Math.log(1 - prob + eps));
  }
  return total / samples.length;
}

export function accuracy(weights: number[], samples: Sample[]): number {
  if (samples.length === 0) return 0;
  let correct = 0;
  for (const { features, label } of samples) {
    const predicted = predictProbability(weights, features) >= 0.5 ? 1 : 0;
    if (predicted === label) correct++;
  }
  return correct / samples.length;
}

/**
 * Local training on one client: `steps` full-batch gradient descent steps.
 * Returns the new local weights.
 */
export function localTrain(
  weights: number[],
  samples: Sample[],
  learningRate: number,
  steps: number
): number[] {
  let w = [...weights];
  for (let s = 0; s < steps; s++) {
    const g = gradient(w, samples);
    w = w.map((wk, k) => wk - learningRate * g[k]);
  }
  return w;
}
