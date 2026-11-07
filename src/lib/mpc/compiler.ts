/**
 * @fileoverview Deterministic compiler: ProtocolSpec -> executable Shamir/MPC protocol
 *
 * Pipeline: natural language -> (LLM) ProtocolSpec -> (this file) parameters + steps -> validateParams.
 * Every parameter decision is made here, by rules, and recorded with its reason.
 */

import type { ProtocolSpec } from "./protocolSchema";
import { nextPrime, validateParams, type ValidateParamsResult } from "./tools";

export const DEFAULT_MAX_INPUT = 1000n;
const VISUALIZER_MAX_PARTIES = 50;
const VISUALIZER_MAX_SECRETS = 12;

export interface ParameterDecision {
  param: string;
  value: string;
  reason: string;
}

export interface ProtocolStep {
  title: string;
  detail: string;
}

export interface CompiledParams {
  p: string;
  n: number;
  t: number;
  operation: ProtocolSpec["operation"];
  inputCount: number;
  maxInputValue: string;
  maxResult: string;
}

export interface CompiledProtocol {
  ok: boolean;
  params: CompiledParams | null;
  partyNames: string[];
  decisions: ParameterDecision[];
  errors: string[];
  warnings: string[];
  securityNotes: string[];
  steps: ProtocolStep[];
  visualizerUrl: string | null;
  validation: ValidateParamsResult | null;
}

export function compileProtocol(spec: ProtocolSpec): CompiledProtocol {
  const decisions: ParameterDecision[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const fail = (): CompiledProtocol => ({
    ok: false,
    params: null,
    partyNames: [],
    decisions,
    errors,
    warnings,
    securityNotes: [],
    steps: [],
    visualizerUrl: null,
    validation: null,
  });

  // --- Parties -------------------------------------------------------------
  const n = spec.partyCount;
  if (!Number.isInteger(n) || n < 2) {
    errors.push(`Secret sharing needs at least 2 parties (got ${n})`);
    return fail();
  }
  if (spec.parties.length > 0 && spec.parties.length !== n) {
    warnings.push(
      `${spec.parties.length} party names were listed but partyCount is ${n}; using n=${n}`
    );
  }
  const partyNames = Array.from({ length: n }, (_, i) => spec.parties[i] || `Party ${i + 1}`);
  decisions.push({ param: "n", value: String(n), reason: "Number of parties in the requirement" });

  // --- Inputs --------------------------------------------------------------
  const { operation } = spec;
  const inputCount = operation === "share" ? 1 : (spec.inputCount ?? (operation === "sum" ? n : 2));
  if (inputCount < 1) {
    errors.push(`inputCount must be at least 1 (got ${inputCount})`);
    return fail();
  }

  // --- Threshold t ---------------------------------------------------------
  const c = spec.maxColluders;
  const r = spec.reconstructionThreshold;
  const offline = spec.maxOffline;
  let t: number;

  if (c !== null && c >= n) {
    errors.push(
      `Cannot hide the result from ${c} colluding parties when there are only ${n}: all parties together can always compute it`
    );
    return fail();
  }

  if (r !== null) {
    t = r;
    decisions.push({
      param: "t",
      value: String(t),
      reason: `"Any ${r} parties can get the result" sets the reconstruction threshold directly`,
    });
    if (c !== null && r < c + 1) {
      errors.push(
        `Conflicting requirements: any ${r} parties can reconstruct, so a coalition of ${c} ≥ ${r} would also learn the secret. Either raise the threshold to ${c + 1} or allow fewer colluders`
      );
    } else if (c !== null && r > c + 1) {
      warnings.push(
        `Threshold ${r} is stricter than needed: it already protects against ${r - 1} colluders (asked for ${c})`
      );
    }
  } else if (c !== null) {
    t = c + 1;
    decisions.push({
      param: "t",
      value: String(t),
      reason: `"No ${c} parties together may learn anything" requires t = ${c} + 1, since any t−1 shares reveal nothing`,
    });
  } else if (offline !== null) {
    t = n - offline;
    decisions.push({
      param: "t",
      value: String(t),
      reason: `"Works with ${offline} parties offline" allows at most t = n − ${offline}; no collusion limit was given, so the largest such t is chosen for the most privacy`,
    });
  } else {
    t = Math.floor(n / 2) + 1;
    decisions.push({
      param: "t",
      value: String(t),
      reason: `No threshold, collusion limit or availability requirement was given: defaulting to an honest-majority threshold ⌊n/2⌋ + 1`,
    });
    warnings.push(`Threshold t=${t} is a default. Confirm how many parties may collude.`);
  }

  if (t < 1 || t > n) {
    errors.push(`Threshold t=${t} must be between 1 and n=${n}`);
    return fail();
  }

  if (offline !== null && n - t < offline) {
    errors.push(
      `With t=${t}, only n − t = ${n - t} parties may be offline, but the requirement allows ${offline}. Add parties or accept a lower collusion tolerance`
    );
  }

  if (operation === "product" && n < 2 * t - 1) {
    const maxC = Math.floor((n - 1) / 2);
    errors.push(
      `Multiplication needs n ≥ 2t − 1 = ${2 * t - 1} parties for degree reduction (have ${n}). Either add ${2 * t - 1 - n} part${2 * t - 1 - n === 1 ? "y" : "ies"} or tolerate at most ${maxC} colluder${maxC === 1 ? "" : "s"} (t=${maxC + 1})`
    );
  }

  // --- Prime p -------------------------------------------------------------
  let maxInput = DEFAULT_MAX_INPUT;
  if (spec.maxInputValue !== null) {
    const cleaned = spec.maxInputValue.replace(/[,_\s]/g, "");
    if (!/^\d+$/.test(cleaned)) {
      errors.push(
        `Maximum input "${spec.maxInputValue}" is not a whole number. Convert it to the smallest unit (e.g. cents)`
      );
      return fail();
    }
    maxInput = BigInt(cleaned);
  } else {
    warnings.push(
      `No input range was given: assuming each input is at most ${DEFAULT_MAX_INPUT}. Confirm the real maximum`
    );
  }

  const count = BigInt(inputCount);
  const maxResult =
    operation === "sum" ? maxInput * count : operation === "product" ? maxInput ** count : maxInput;

  let p: string;
  try {
    const lowerBound = maxResult > BigInt(n) ? maxResult : BigInt(n);
    p = nextPrime(lowerBound).prime;
  } catch (e) {
    errors.push(`Cannot choose a prime: ${e instanceof Error ? e.message : String(e)}`);
    return fail();
  }
  decisions.push({
    param: "p",
    value: p,
    reason:
      operation === "share"
        ? `Smallest prime larger than the secret's maximum (${maxInput}) and n`
        : `Smallest prime larger than the largest possible result (${operation === "sum" ? `${inputCount} × ${maxInput}` : `${maxInput}^${inputCount}`} = ${maxResult}), so the result never wraps around mod p`,
  });

  if (errors.length > 0) return fail();

  // --- Validate with the same checker the Copilot uses ---------------------
  const validation = validateParams({
    p,
    n,
    t,
    operation,
    maxSecret: maxInput.toString(),
    numInputs: inputCount,
  });
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  const params: CompiledParams = {
    p,
    n,
    t,
    operation,
    inputCount,
    maxInputValue: maxInput.toString(),
    maxResult: maxResult.toString(),
  };

  return {
    ok: errors.length === 0,
    params,
    partyNames,
    decisions,
    errors,
    warnings,
    securityNotes: validation.securityNotes,
    steps: validation.ok ? buildSteps(params, partyNames) : [],
    visualizerUrl: validation.ok ? buildVisualizerUrl(params, warnings) : null,
    validation,
  };
}

function buildSteps(params: CompiledParams, parties: string[]): ProtocolStep[] {
  const { p, n, t, operation, inputCount } = params;
  const deg = t - 1;
  const xs = parties.map((name, i) => `${name} → x=${i + 1}`).join(", ");
  const steps: ProtocolStep[] = [
    {
      title: "Public setup",
      detail: `Agree on prime p=${p}, n=${n} parties and threshold t=${t}. Assign evaluation points: ${xs}.`,
    },
  ];

  if (operation === "share") {
    steps.push(
      {
        title: "Dealer shares the secret",
        detail: `The dealer picks a random polynomial f of degree ${deg} with f(0) = secret and gives f(i) mod ${p} to party i over a private channel.`,
      },
      {
        title: "Reconstruct",
        detail: `Any ${t} parties combine their shares with Lagrange interpolation at x=0 to recover the secret. Any ${deg} learn nothing.`,
      }
    );
    return steps;
  }

  const inputOwners =
    operation === "sum" && inputCount === n
      ? "Each party"
      : `Each of the ${inputCount} input holders`;
  steps.push({
    title: "Share inputs",
    detail: `${inputOwners} picks a random polynomial of degree ${deg} whose constant term is its private input, and sends its evaluation at x=j (mod ${p}) to party j.`,
  });

  if (operation === "sum") {
    steps.push({
      title: "Add locally",
      detail: `Every party adds up the ${inputCount} shares it received, mod ${p}. No communication is needed: these sums are shares of the total.`,
    });
  } else {
    steps.push(
      {
        title: "Multiply locally",
        detail: `Every party multiplies two shares mod ${p}. The result is a share of a degree-${2 * deg} polynomial whose constant term is the product.`,
      },
      {
        title: "Reshare (degree reduction)",
        detail: `Each party re-shares its local product with a fresh degree-${deg} polynomial; parties combine what they receive with Lagrange weights for x=0 using ${2 * t - 1} parties. Repeat for each further factor (${inputCount - 1} multiplication${inputCount - 1 === 1 ? "" : "s"} in total).`,
      }
    );
  }

  steps.push({
    title: "Reveal only the result",
    detail: `Any ${t} parties publish their result shares and interpolate at x=0 to get the ${operation === "sum" ? "total" : "product"}. Individual inputs stay hidden from any ${deg} colluding parties.`,
  });
  return steps;
}

function buildVisualizerUrl(params: CompiledParams, warnings: string[]): string | null {
  const { p, n, t, operation, inputCount } = params;
  if (n > VISUALIZER_MAX_PARTIES || inputCount > VISUALIZER_MAX_SECRETS) {
    warnings.push(
      `The visualizer supports at most ${VISUALIZER_MAX_PARTIES} parties and ${VISUALIZER_MAX_SECRETS} inputs, so this protocol cannot be simulated there`
    );
    return null;
  }

  // Deterministic example inputs within the allowed range
  const max = BigInt(params.maxInputValue);
  const secrets = Array.from({ length: inputCount }, (_, k) =>
    ((BigInt(k) * 7919n + 13n) % (max + 1n)).toString()
  );

  const op = operation === "sum" ? "sum" : operation === "product" ? "multiply" : "shamir";
  const query = new URLSearchParams({
    p,
    n: String(n),
    t: String(t),
    op,
    secrets: secrets.join(","),
  });
  return `/visualizer?${query.toString()}`;
}
