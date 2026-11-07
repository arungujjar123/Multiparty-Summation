/**
 * @fileoverview NL-to-MPC: compile a plain-English confidentiality requirement
 * into Shamir secret sharing parameters and protocol steps
 */
"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { compileProtocol } from "@/lib/mpc/compiler";
import type { ProtocolSpec } from "@/lib/mpc/protocolSchema";

const EXAMPLES = [
  "Seven hospitals want to know the total number of ICU patients. Each has at most 10,000. No three hospitals together should be able to see another hospital's count.",
  "Five banks want the product of their two risk scores (each up to 50) computed jointly, and no two banks may collude to learn a score.",
  "Split our vault's 6-digit PIN among 5 directors so that any 3 of them can open it.",
  "Our 4 branch offices (Delhi, Mumbai, Pune, Chennai) want total quarterly revenue in rupees (max 5 lakh each), and it must still work if one office is offline.",
];

interface ApiResponse {
  spec: ProtocolSpec;
  meta: { model: string; latencyMs: number };
}

type NullableIntKey = "maxColluders" | "reconstructionThreshold" | "maxOffline" | "inputCount";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function NullableIntField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? ""}
        placeholder="not stated"
        onChange={(e) => {
          const raw = e.target.value;
          const v = Number(raw);
          onChange(raw === "" ? null : Number.isInteger(v) && v >= 0 ? v : value);
        }}
        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
      />
    </label>
  );
}

function List({ items, tone }: { items: string[]; tone: "error" | "warn" | "info" | "ok" }) {
  if (items.length === 0) return null;
  const styles = {
    error: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    warn: "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
    info: "bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200",
    ok: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  }[tone];
  return (
    <ul className={`p-3 rounded-lg text-sm space-y-1 list-disc list-inside ${styles}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function NlToMpcPage() {
  const { user, isLoading } = useAuth();
  const [requirement, setRequirement] = useState("");
  const [spec, setSpec] = useState<ProtocolSpec | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [edited, setEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The compiler is deterministic and runs in the browser, so edits recompile instantly
  const compiled = useMemo(() => (spec ? compileProtocol(spec) : null), [spec]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setRequirement(trimmed);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nl-to-mpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setSpec((data as ApiResponse).spec);
      setMeta((data as ApiResponse).meta);
      setEdited(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const update = (patch: Partial<ProtocolSpec>) => {
    setSpec((prev) => (prev ? { ...prev, ...patch } : prev));
    setEdited(true);
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <header className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-sky-600 dark:from-cyan-300 dark:to-sky-400">
          Natural Language → MPC Protocol
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Describe a confidentiality requirement in plain English. The AI only extracts the facts; a
          deterministic compiler then chooses the threshold t and prime p, validates them and writes
          out the protocol.
        </p>
      </header>

      {!isLoading && !user ? (
        <div className="max-w-xl mx-auto p-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300">Sign in to use NL-to-MPC.</p>
          <Link
            href="/login"
            className="inline-block mt-4 px-5 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-cyan-500 to-sky-600"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          <Card title="Requirement">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(requirement);
              }}
            >
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="e.g. Five hospitals want the total patient count; no two may learn another's count."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !requirement.trim()}
                  className="px-5 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-cyan-500 to-sky-600 disabled:opacity-50"
                >
                  {loading ? "Compiling…" : "Compile protocol"}
                </button>
                {meta && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Extracted by {meta.model} in {(meta.latencyMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </form>
            {!spec && (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => submit(ex)}
                    disabled={loading}
                    className="text-left text-sm px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300 transition"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
            {error && (
              <div className="mt-3">
                <List items={[error]} tone="error" />
              </div>
            )}
          </Card>

          {spec && compiled && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <Card title={`1. Extracted spec${edited ? " (edited)" : ""}`}>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{spec.goal}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block col-span-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Operation
                      </span>
                      <select
                        value={spec.operation}
                        onChange={(e) =>
                          update({ operation: e.target.value as ProtocolSpec["operation"] })
                        }
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="sum">sum</option>
                        <option value="product">product</option>
                        <option value="share">share a secret</option>
                      </select>
                    </label>
                    <NullableIntField
                      label="Parties"
                      value={spec.partyCount}
                      onChange={(v) => update({ partyCount: v ?? 0 })}
                    />
                    {(
                      [
                        ["inputCount", "Inputs combined"],
                        ["maxColluders", "Max colluders"],
                        ["reconstructionThreshold", "Any k can reconstruct"],
                        ["maxOffline", "Max offline"],
                      ] as [NullableIntKey, string][]
                    ).map(([key, label]) => (
                      <NullableIntField
                        key={key}
                        label={label}
                        value={spec[key]}
                        onChange={(v) => update({ [key]: v } as Partial<ProtocolSpec>)}
                      />
                    ))}
                    <label className="block col-span-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Max value of one input
                      </span>
                      <input
                        value={spec.maxInputValue ?? ""}
                        placeholder="not stated"
                        onChange={(e) => update({ maxInputValue: e.target.value.trim() || null })}
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-mono"
                      />
                    </label>
                  </div>
                  {spec.parties.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Parties: {spec.parties.join(", ")}
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    <List items={spec.assumptions.map((a) => `Assumed: ${a}`)} tone="info" />
                    <List items={spec.ambiguities.map((a) => `Unclear: ${a}`)} tone="warn" />
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card title="2. Compiled parameters">
                  {compiled.params && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        ["p", compiled.params.p],
                        ["n", String(compiled.params.n)],
                        ["t", String(compiled.params.t)],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 text-center"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400">{k}</p>
                          <p className="text-xl font-bold font-mono text-gray-900 dark:text-gray-100 break-all">
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <tbody>
                      {compiled.decisions.map((d) => (
                        <tr key={d.param} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="py-2 pr-3 font-mono font-bold text-gray-900 dark:text-gray-100 align-top">
                            {d.param}
                          </td>
                          <td className="py-2 text-gray-700 dark:text-gray-300">{d.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 space-y-2">
                    <List items={compiled.errors} tone="error" />
                    <List items={compiled.warnings} tone="warn" />
                    <List items={compiled.securityNotes} tone="ok" />
                  </div>
                </Card>

                {compiled.steps.length > 0 && (
                  <Card title="3. Protocol">
                    <ol className="space-y-3">
                      {compiled.steps.map((s, i) => (
                        <li key={s.title} className="flex gap-3">
                          <span className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-cyan-500 to-sky-600 text-white text-sm font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {s.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{s.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {compiled.visualizerUrl && (
                      <Link
                        href={compiled.visualizerUrl}
                        className="inline-block mt-5 px-5 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-600"
                      >
                        Run in Visualizer with example inputs →
                      </Link>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
