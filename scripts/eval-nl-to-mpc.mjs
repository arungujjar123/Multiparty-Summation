/**
 * Evaluates the NL-to-MPC pipeline (LLM extraction + deterministic compiler) end to end.
 *
 * Runs every case in nl-to-mpc-cases.json against a running app and compares the compiled
 * protocol (validity, n, t, operation and, where given, p) with the expected answer.
 *
 * Usage (app running on localhost:3000):
 *   node --env-file=.env scripts/eval-nl-to-mpc.mjs [--base http://localhost:3000] [--only id1,id2]
 *
 * Signs in with EVAL_EMAIL / EVAL_PASSWORD, falling back to DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD.
 * EVAL_DELAY_MS (default 13000) spaces requests to stay under the Gemini free tier's 5 requests/minute.
 * Stops early when the provider quota is exhausted. Results are written to scripts/eval-results.json.
 */

import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const BASE = argValue("--base") ?? "http://localhost:3000";
const only = argValue("--only")?.split(",");
const DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 13000);

const allCases = JSON.parse(
  await readFile(new URL("./nl-to-mpc-cases.json", import.meta.url), "utf8")
);
const cases = only ? allCases.filter((c) => only.includes(c.id)) : allCases;
const email = process.env.EVAL_EMAIL ?? process.env.DEFAULT_ADMIN_EMAIL;
const password = process.env.EVAL_PASSWORD ?? process.env.DEFAULT_ADMIN_PASSWORD;

const login = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.error(`Login failed (${login.status}). Set EVAL_EMAIL and EVAL_PASSWORD.`);
  process.exit(1);
}
const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];

const FIELDS = ["ok", "n", "t", "operation", "p"];
const rows = [];
let quotaHit = false;

try {
  for (const [i, c] of cases.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, DELAY_MS));

    const res = await fetch(`${BASE}/api/nl-to-mpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ requirement: c.requirement }),
    });
    const data = await res.json();
    if (res.status === 429) {
      quotaHit = true;
      console.log(`STOP  ${c.id}: ${data.error}`);
      break;
    }
    if (!res.ok) {
      const row = { id: c.id, pass: false, mismatches: [`HTTP ${res.status}: ${data.error}`] };
      rows.push(row);
      console.log(`FAIL  ${c.id}\n        ${row.mismatches[0]}`);
      continue;
    }

    // Failing protocols report n/t/p through decisions, not params
    const decided = Object.fromEntries(data.compiled.decisions.map((d) => [d.param, d.value]));
    const actual = {
      ok: data.compiled.ok,
      n: data.compiled.params?.n ?? Number(decided.n),
      t: data.compiled.params?.t ?? Number(decided.t),
      operation: data.spec.operation,
      p: data.compiled.params?.p ?? decided.p,
    };
    const mismatches = FIELDS.filter((f) => f in c.expect && c.expect[f] !== actual[f]).map(
      (f) => `${f}: expected ${c.expect[f]}, got ${actual[f]}`
    );
    const row = {
      id: c.id,
      pass: mismatches.length === 0,
      mismatches,
      ms: data.meta.latencyMs,
      actual,
      spec: data.spec,
    };
    rows.push(row);
    console.log(`${row.pass ? "PASS" : "FAIL"}  ${c.id} (${(row.ms / 1000).toFixed(1)}s)`);
    for (const m of mismatches) console.log(`        ${m}`);
  }
} finally {
  await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { cookie } });
}

const passed = rows.filter((r) => r.pass).length;
const latencies = rows
  .map((r) => r.ms)
  .filter(Boolean)
  .sort((a, b) => a - b);
const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : 0;
const summary = `${passed}/${rows.length} evaluated cases correct${
  rows.length ? ` (${((passed / rows.length) * 100).toFixed(0)}%)` : ""
}, ${cases.length - rows.length} not run, median extraction latency ${(median / 1000).toFixed(1)}s`;
console.log(`\n${summary}`);

await writeFile(
  new URL("./eval-results.json", import.meta.url),
  JSON.stringify({ date: new Date().toISOString(), summary, rows }, null, 2)
);

process.exit(quotaHit ? 2 : passed === rows.length ? 0 : 1);
