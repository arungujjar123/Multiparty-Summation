/**
 * @fileoverview Function-calling tools for the Cryptography Copilot agent
 *
 * Each tool wraps a deterministic function from `@/lib/mpc/tools`. Errors are returned
 * as `{ ok: false, error }` instead of thrown, so the agent can read them and explain
 * what went wrong rather than the whole request failing.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  diagnoseReconstruction,
  generateShares,
  nextPrime,
  reconstruct,
  validateParams,
} from "@/lib/mpc/tools";

// Large integers travel as decimal strings: JSON numbers lose precision above 2^53
const bigInt = (what: string) =>
  z
    .string()
    .regex(/^\d+$/, "must be a non-negative decimal integer")
    .describe(`${what}, as a decimal string`);

const share = z.object({
  x: bigInt("Share x-coordinate (the party index)"),
  y: bigInt("Share value y = f(x) mod p"),
});

export type ToolOutcome<T> = { ok: true; result: T } | { ok: false; error: string };

function safely<T>(fn: () => T): ToolOutcome<T> {
  try {
    return { ok: true, result: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export const copilotTools = {
  validateParams: tool({
    description:
      "Verify (t, n) threshold parameters for Shamir secret sharing / MPC: primality of p, t ≤ n, p > n, n ≥ 2t−1 for multiplication, and whether results would wrap mod p. Returns errors, warnings and security properties (collusion and dropout tolerance).",
    inputSchema: z.object({
      p: bigInt("Prime modulus p"),
      n: z.number().int().min(1).describe("Number of parties"),
      t: z.number().int().min(1).describe("Threshold: shares needed to reconstruct"),
      operation: z
        .enum(["share", "sum", "product"])
        .optional()
        .describe("What the parties will compute. Default: share"),
      maxSecret: bigInt("Largest possible value of a single secret").optional(),
      numInputs: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("How many secrets are summed or multiplied together. Default 2"),
    }),
    execute: async (input) => safely(() => validateParams(input)),
  }),

  nextPrime: tool({
    description:
      "Find the smallest prime strictly greater than a value. Use it to recommend a modulus p that is larger than n and than the largest possible result.",
    inputSchema: z.object({ greaterThan: bigInt("Lower bound") }),
    execute: async ({ greaterThan }) => safely(() => nextPrime(greaterThan)),
  }),

  generateShares: tool({
    description:
      "Split a secret into n Shamir shares with threshold t over prime p. Returns the polynomial coefficients (constant term = secret) and the shares.",
    inputSchema: z.object({
      secret: bigInt("Secret to share, must be < p"),
      p: bigInt("Prime modulus p"),
      n: z.number().int().min(1).max(50).describe("Number of parties"),
      t: z.number().int().min(1).describe("Threshold"),
      seed: z
        .number()
        .int()
        .optional()
        .describe("Only for reproducible demos; omit for secure randomness"),
    }),
    execute: async (input) => safely(() => generateShares(input)),
  }),

  reconstruct: tool({
    description:
      "Reconstruct the secret f(0) from shares using Lagrange interpolation mod p. Does not check consistency: use diagnoseReconstruction when a result looks wrong.",
    inputSchema: z.object({
      p: bigInt("Prime modulus p"),
      shares: z.array(share).min(1).max(50),
    }),
    execute: async (input) => safely(() => reconstruct(input)),
  }),

  diagnoseReconstruction: tool({
    description:
      "Root-cause a failed or suspicious share reconstruction. Detects too few shares, duplicate or conflicting x values, x = 0, shares outside the field (wrong prime), corrupted shares (located when at least t+2 shares are given), a threshold mismatch, and secrets that wrapped around p. Returns causes, faulty share indices, the recovered secret and fixes.",
    inputSchema: z.object({
      p: bigInt("Prime modulus p"),
      t: z.number().int().min(1).describe("Threshold the user believes was used"),
      shares: z.array(share).min(1).max(16),
      expectedSecret: bigInt("Value the user expected to recover, if known").optional(),
    }),
    execute: async (input) => safely(() => diagnoseReconstruction(input)),
  }),
};

export type CopilotToolName = keyof typeof copilotTools;

export const COPILOT_SYSTEM_PROMPT = `You are the Cryptography Copilot for a Shamir Secret Sharing and secure multi-party computation (MPC) learning platform.

Rules:
- Never compute modular arithmetic, primality, interpolation or share values yourself. Every number you state must come from a tool result in this conversation.
- To judge whether parameters are safe, call validateParams. To suggest a prime, call nextPrime and then validateParams on the suggestion.
- When reconstruction failed or a result looks wrong, call diagnoseReconstruction before answering.
- Shares are referred to by their 0-based position in the list the user gave ("share #2" is the third one).
- If a tool returns ok: false, explain the error in plain words and say what input is needed.
- If required inputs (p, n, t or the shares) are missing, ask for them instead of guessing.
- Answer concisely: verdict first, then the reasons from the tool output, then the fix. Mention which tools you used.
- You may explain concepts (why t−1 parties learn nothing, why multiplication needs 2t−1 parties) without tools, but not specific numbers.
- Stay on the topic of secret sharing, MPC and related cryptography. Politely decline anything else.`;
