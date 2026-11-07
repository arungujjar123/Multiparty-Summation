/**
 * @fileoverview Privacy-preserving federated learning demo:
 * FedAvg where client updates are combined with Shamir secure aggregation
 */
"use client";
import React, { useState } from "react";
import LineChart from "@/components/LineChart";
import { runFederatedTraining, type FederatedResult } from "@/lib/fl/trainer";

const FEATURE_LABELS = ["Δw₁·n", "Δw₂·n", "Δb·n", "n"];

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      />
      {hint && <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function shortField(v: bigint): string {
  const s = v.toString();
  return s.length > 10 ? `${s.slice(0, 5)}…${s.slice(-4)}` : s;
}

export default function FederatedPage() {
  const [numClients, setNumClients] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [rounds, setRounds] = useState(30);
  const [learningRate, setLearningRate] = useState(0.5);
  const [localSteps, setLocalSteps] = useState(2);
  const [offlinePerRound, setOfflinePerRound] = useState(1);
  const [skew, setSkew] = useState(0.6);
  const [result, setResult] = useState<FederatedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const maxOffline = Math.max(0, numClients - threshold);

  const run = () => {
    setError(null);
    try {
      const start = performance.now();
      const r = runFederatedTraining({
        numClients,
        threshold,
        rounds,
        learningRate,
        localSteps,
        samplesPerClient: 60,
        offlinePerRound: Math.min(offlinePerRound, maxOffline),
        skew,
        dataSeed: 42,
      });
      setElapsedMs(performance.now() - start);
      setResult(r);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const history = result?.history ?? [];
  const last = history[history.length - 1];
  const maxAggError = history.length ? Math.max(...history.map((h) => h.aggregationError)) : 0;
  const totalMessages = history.reduce((s, h) => s + h.messages, 0);
  const lastRound = result?.lastRound;

  return (
    <main className="min-h-screen px-4 py-10">
      <header className="max-w-7xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-sky-600 dark:from-cyan-300 dark:to-sky-400">
          Privacy-Preserving Federated Learning
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Clients train a logistic regression model on their own data. Their model updates are
          combined with <strong>Shamir secure aggregation</strong>: the server learns only the sum,
          never an individual client&apos;s update or dataset size.
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 h-fit">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Parameters</h2>
          <NumberField
            label="Clients (n)"
            value={numClients}
            min={2}
            max={12}
            onChange={(v) => {
              setNumClients(v);
              if (threshold > v) setThreshold(v);
            }}
          />
          <NumberField
            label="Threshold (t)"
            value={threshold}
            min={1}
            max={numClients}
            onChange={setThreshold}
            hint={`Any ${threshold - 1} colluding parties learn nothing; ${threshold} needed to unmask the sum`}
          />
          <NumberField
            label="Offline clients per round"
            value={Math.min(offlinePerRound, maxOffline)}
            min={0}
            max={maxOffline}
            onChange={setOfflinePerRound}
            hint={`Up to n − t = ${maxOffline} clients can drop after sharing`}
          />
          <NumberField label="Rounds" value={rounds} min={1} max={200} onChange={setRounds} />
          <NumberField
            label="Learning rate"
            value={learningRate}
            min={0.01}
            max={5}
            step={0.05}
            onChange={setLearningRate}
          />
          <NumberField
            label="Local steps per round"
            value={localSteps}
            min={1}
            max={20}
            onChange={setLocalSteps}
          />
          <NumberField
            label="Non-IID skew"
            value={skew}
            min={0}
            max={1}
            step={0.1}
            onChange={setSkew}
            hint="0 = every client sees both classes equally, 1 = each client sees one class"
          />
          <button
            onClick={run}
            className="w-full py-3 rounded-xl font-semibold text-white bg-linear-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 shadow-md transition"
          >
            Run federated training
          </button>
          {error && (
            <p className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
        </section>

        <section className="lg:col-span-2 space-y-6">
          {!result && !error && (
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">How a round works</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>The server sends the global weights to every client.</li>
                <li>
                  Each client trains locally and encodes its update as field elements mod 2⁶¹−1.
                </li>
                <li>
                  Each client splits every coordinate into n Shamir shares (degree t−1) and sends
                  share j to client j.
                </li>
                <li>Each client adds up the shares it received and sends only that sum.</li>
                <li>
                  The server interpolates any t partial sums at x = 0 to get the total update, and
                  averages it.
                </li>
              </ol>
              <p className="mt-4 text-sm">
                A plaintext FedAvg run on the same data is trained alongside. If the protocol is
                correct, both curves overlap.
              </p>
            </div>
          )}

          {result && last && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat
                  label="Secure accuracy"
                  value={`${(last.secureAccuracy * 100).toFixed(1)}%`}
                  sub={`Plaintext: ${(last.plainAccuracy * 100).toFixed(1)}%`}
                />
                <Stat
                  label="Max aggregation error"
                  value={maxAggError.toExponential(1)}
                  sub="Fixed-point rounding only"
                />
                <Stat
                  label="Messages"
                  value={totalMessages.toLocaleString()}
                  sub={`${rounds} rounds`}
                />
                <Stat
                  label="Run time"
                  value={`${(elapsedMs ?? 0).toFixed(0)} ms`}
                  sub="In your browser"
                />
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                <LineChart
                  title="Test loss"
                  series={[
                    {
                      label: "Plaintext FedAvg",
                      color: "#f59e0b",
                      values: history.map((h) => h.plainLoss),
                    },
                    {
                      label: "Shamir secure FedAvg",
                      color: "#0ea5e9",
                      values: history.map((h) => h.secureLoss),
                      dashed: true,
                    },
                  ]}
                  yFormat={(v) => v.toFixed(3)}
                />
                <LineChart
                  title="Test accuracy"
                  series={[
                    {
                      label: "Plaintext FedAvg",
                      color: "#f59e0b",
                      values: history.map((h) => h.plainAccuracy),
                    },
                    {
                      label: "Shamir secure FedAvg",
                      color: "#0ea5e9",
                      values: history.map((h) => h.secureAccuracy),
                      dashed: true,
                    },
                  ]}
                  yFormat={(v) => `${(v * 100).toFixed(0)}%`}
                />
              </div>

              {lastRound && (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    What the server sees (final round)
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
                    Left: each client&apos;s real update, which a plaintext server would see. Right:
                    the partial share-sums the secure server actually receives. They look random,
                    yet any {threshold} of them reconstruct the exact total.
                  </p>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-x-auto">
                    <table className="text-sm w-full">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400">
                          <th className="py-1 pr-3">Client</th>
                          {FEATURE_LABELS.map((f) => (
                            <th key={f} className="py-1 pr-3">
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-mono text-gray-800 dark:text-gray-200">
                        {lastRound.clientUpdates.map((u) => (
                          <tr
                            key={u.clientId}
                            className="border-t border-gray-100 dark:border-gray-700"
                          >
                            <td className="py-1 pr-3">#{u.clientId}</td>
                            {u.values.map((v, k) => (
                              <td key={k} className="py-1 pr-3">
                                {v.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                          <td className="py-1 pr-3">Σ</td>
                          {lastRound.aggregation.sum.map((v, k) => (
                            <td
                              key={k}
                              className="py-1 pr-3 text-emerald-600 dark:text-emerald-400"
                            >
                              {v.toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    <table className="text-sm w-full">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400">
                          <th className="py-1 pr-3">Holder</th>
                          {FEATURE_LABELS.map((f) => (
                            <th key={f} className="py-1 pr-3">
                              share of {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-mono text-gray-800 dark:text-gray-200">
                        {lastRound.clientUpdates.map((u) => {
                          const ps = lastRound.aggregation.serverView.find(
                            (s) => s.holder === u.clientId
                          );
                          const used = lastRound.aggregation.reconstructionHolders.includes(
                            u.clientId
                          );
                          return (
                            <tr
                              key={u.clientId}
                              className={`border-t border-gray-100 dark:border-gray-700 ${
                                ps ? "" : "opacity-50"
                              }`}
                            >
                              <td className="py-1 pr-3">
                                #{u.clientId} {used ? "✓" : ""}
                              </td>
                              {ps ? (
                                ps.values.map((v, k) => (
                                  <td key={k} className="py-1 pr-3">
                                    {shortField(v)}
                                  </td>
                                ))
                              ) : (
                                <td colSpan={FEATURE_LABELS.length} className="py-1 pr-3 italic">
                                  offline after sharing
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    ✓ = partial sum used for Lagrange reconstruction. Offline this round:{" "}
                    {last.offlineClients.length
                      ? last.offlineClients.map((c) => `#${c}`).join(", ")
                      : "none"}
                    .
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
