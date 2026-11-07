/**
 * @fileoverview Shamir-based secure aggregation of client model updates
 *
 * Protocol for K clients, threshold t, update vectors of dimension d:
 * 1. Share:     Client i encodes its update u_i into the field and, for every coordinate k,
 *               picks a random degree-(t-1) polynomial P_ik with P_ik(0) = enc(u_i[k]).
 *               It sends P_ik(j) to client j (client ids are the Shamir x-coordinates).
 * 2. Sum:       Client j adds up every share it received: S_j[k] = sum_i P_ik(j).
 *               S_j is a share of the polynomial sum_i P_ik, whose constant term is sum_i enc(u_i[k]).
 * 3. Unmask:    The server collects S_j from any t online clients and Lagrange-interpolates
 *               at x = 0 to get the encoded sum, then decodes it.
 *
 * The server only ever sees partial sums S_j, which are uniformly random on their own.
 * Any t-1 colluding parties learn nothing about an individual update, and up to K - t
 * clients may go offline after step 1 without breaking aggregation.
 */

import { evalPoly } from "@/lib/math/polynomial";
import { lagrangeAtZero } from "@/lib/math/lagrange";
import { mod } from "@/lib/math/shamir";
import { decodeVector, encodeVector, FL_PRIME, DEFAULT_SCALE } from "./fixedPoint";
import { secureFieldRng, type FieldRng } from "./random";

export interface ClientUpdate {
  clientId: number; // Must be a distinct positive integer below p
  values: number[];
}

export interface SecureAggregationConfig {
  threshold: number;
  p?: bigint;
  scale?: number;
  rng?: FieldRng;
  /** Clients that go offline after distributing shares and never report their partial sum */
  offlineClients?: number[];
}

export interface ShareMessage {
  from: number;
  to: number;
  values: bigint[]; // One share per coordinate
}

export interface PartialSum {
  holder: number;
  values: bigint[];
}

export interface SecureAggregationResult {
  /** Decoded sum of all client updates */
  sum: number[];
  encodedSum: bigint[];
  /** Every client-to-client share message from step 1 */
  messages: ShareMessage[];
  /** What the server received in step 3: the only data it ever sees */
  serverView: PartialSum[];
  /** Client ids whose partial sums were used for reconstruction */
  reconstructionHolders: number[];
  onlineHolders: number[];
}

export function secureAggregate(
  updates: ClientUpdate[],
  config: SecureAggregationConfig
): SecureAggregationResult {
  const p = config.p ?? FL_PRIME;
  const scale = config.scale ?? DEFAULT_SCALE;
  const rng = config.rng ?? secureFieldRng();
  const t = config.threshold;
  const n = updates.length;

  if (n === 0) throw new Error("Need at least one client update");
  if (!Number.isInteger(t) || t < 1) throw new Error("Threshold t must be a positive integer");
  if (t > n) throw new Error(`Threshold t=${t} cannot exceed number of clients ${n}`);

  const dim = updates[0].values.length;
  const ids = updates.map((u) => u.clientId);
  if (new Set(ids).size !== ids.length) throw new Error("Client ids must be distinct");
  for (const u of updates) {
    if (!Number.isInteger(u.clientId) || u.clientId < 1 || BigInt(u.clientId) >= p) {
      throw new Error(`Client id ${u.clientId} must be an integer in [1, p-1]`);
    }
    if (u.values.length !== dim) throw new Error("All client updates must have the same dimension");
  }

  // Step 1: each client secret-shares every coordinate of its encoded update
  const messages: ShareMessage[] = [];
  const received = new Map<number, bigint[]>(ids.map((id) => [id, new Array(dim).fill(0n)]));

  for (const update of updates) {
    const encoded = encodeVector(update.values, p, scale);
    const polys = encoded.map((secret) => {
      const poly = [secret];
      for (let c = 1; c < t; c++) poly.push(rng(p));
      return poly;
    });

    for (const holder of ids) {
      const x = BigInt(holder);
      const values = polys.map((poly) => evalPoly(poly, x, p));
      messages.push({ from: update.clientId, to: holder, values });

      // Step 2: holder accumulates the shares it receives
      const acc = received.get(holder)!;
      for (let k = 0; k < dim; k++) acc[k] = mod(acc[k] + values[k], p);
    }
  }

  // Step 3: online holders report partial sums; the server reconstructs from any t of them
  const offline = new Set(config.offlineClients ?? []);
  const onlineHolders = ids.filter((id) => !offline.has(id));
  if (onlineHolders.length < t) {
    throw new Error(
      `Only ${onlineHolders.length} clients online, need at least t=${t} to reconstruct the sum`
    );
  }

  const serverView: PartialSum[] = onlineHolders.map((holder) => ({
    holder,
    values: received.get(holder)!,
  }));
  const used = serverView.slice(0, t);

  const encodedSum = Array.from({ length: dim }, (_, k) =>
    lagrangeAtZero(
      used.map((ps) => ({ x: BigInt(ps.holder), y: ps.values[k] })),
      p
    )
  );

  return {
    sum: decodeVector(encodedSum, p, scale),
    encodedSum,
    messages,
    serverView,
    reconstructionHolders: used.map((ps) => ps.holder),
    onlineHolders,
  };
}

/** Insecure baseline: the server sees every update in the clear */
export function plaintextAggregate(updates: ClientUpdate[]): number[] {
  if (updates.length === 0) throw new Error("Need at least one client update");
  const dim = updates[0].values.length;
  const sum = new Array(dim).fill(0);
  for (const u of updates) for (let k = 0; k < dim; k++) sum[k] += u.values[k];
  return sum;
}
