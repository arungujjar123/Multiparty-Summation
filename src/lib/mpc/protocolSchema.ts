/**
 * @fileoverview Schema for what the LLM extracts from a natural-language confidentiality requirement
 *
 * The LLM only reads facts out of the text into this shape. It never chooses p or t:
 * that is the deterministic compiler's job (see compiler.ts).
 */

import { z } from "zod";

export const protocolSpecSchema = z.object({
  goal: z
    .string()
    .describe("One sentence: what is jointly computed, e.g. 'total number of patients'"),
  parties: z
    .array(z.string())
    .describe("Names of the parties if the text names them, otherwise an empty array"),
  partyCount: z.number().int().describe("Number of parties holding a share / contributing input"),
  operation: z
    .enum(["sum", "product", "share"])
    .describe(
      "sum: parties add their private values. product: private values are multiplied. share: one secret (key, password) is split for safekeeping"
    ),
  inputCount: z
    .number()
    .int()
    .nullable()
    .describe(
      "How many private values are combined. For sum it is usually one per party; for product the number of factors; null if not stated"
    ),
  maxColluders: z
    .number()
    .int()
    .nullable()
    .describe(
      "Largest group of parties that must learn NOTHING even if they collude, e.g. 'no two of them together' -> 2. Null if not stated"
    ),
  reconstructionThreshold: z
    .number()
    .int()
    .nullable()
    .describe(
      "Number of parties that must be able to get the result together, e.g. 'any 3 can' -> 3. Null if not stated"
    ),
  maxOffline: z
    .number()
    .int()
    .nullable()
    .describe(
      "How many parties may be unavailable while the result must still be computable. Null if not stated"
    ),
  maxInputValue: z
    .string()
    .nullable()
    .describe(
      "Largest possible value of a single private input as a plain decimal integer string ('10k' -> '10000', '1 million' -> '1000000'). Null if not stated"
    ),
  assumptions: z
    .array(z.string())
    .describe("Anything you had to interpret or assume while reading the text"),
  ambiguities: z
    .array(z.string())
    .describe("Requirements that are unclear or missing and that the user should confirm"),
});

export type ProtocolSpec = z.infer<typeof protocolSpecSchema>;

export const NL_TO_MPC_SYSTEM_PROMPT = `You convert a business or legal confidentiality requirement into a structured specification for a Shamir secret sharing / MPC protocol.

Rules:
- Extract only what the text says. Do not compute a prime, threshold or any parameter yourself.
- Use null for numbers the text does not state. Record every interpretation in "assumptions" and every gap in "ambiguities".
- "No k parties together may learn X" means maxColluders = k. "No single party may see X" means maxColluders = 1.
- "Any k of them can compute/unlock X" means reconstructionThreshold = k.
- "Even if k are offline/unavailable/refuse" means maxOffline = k.
- Count the parties carefully. If parties are listed by name, partyCount must equal the length of that list.
- Normalise numbers to plain integers: "10k" -> "10000", "2.5 million" -> "2500000", "₹5 lakh" -> "500000".
- Money in decimals (e.g. 99.99) cannot be represented directly: assume the value is converted to the smallest unit (paise/cents) and say so in assumptions.`;
