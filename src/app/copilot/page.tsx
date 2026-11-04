/**
 * @fileoverview Cryptography Copilot – chat over the docs/PDFs with
 * deterministic Shamir verification tools.
 */
"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import { useAuth } from "@/contexts/AuthContext";
import type { CopilotTools } from "@/lib/server/copilot";
import type { Finding } from "@/lib/math/diagnostics";

type CopilotMessage = UIMessage<unknown, UIDataTypes, InferUITools<CopilotTools>>;
type Part = CopilotMessage["parts"][number];

const SUGGESTIONS = [
  "What is the threshold property of Shamir's Secret Sharing?",
  "Is p = 97, n = 5, t = 3 safe? Can I also do multiplication?",
  "p = 11, t = 2, shares (1, 5), (2, 7), (3, 10), (4, 0). Reconstruction looks wrong — why?",
  "Summation protocol mein players ko communicate karna padta hai kya?",
];

const severityStyle: Record<Finding["severity"], string> = {
  error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

const severityIcon: Record<Finding["severity"], string> = {
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

function Findings({ findings }: { findings: Finding[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {findings.map((f, i) => (
        <li
          key={`${f.code}-${i}`}
          className={`rounded-md border px-2.5 py-1.5 text-xs ${severityStyle[f.severity]}`}
        >
          <span className="mr-1">{severityIcon[f.severity]}</span>
          {f.message}
        </li>
      ))}
    </ul>
  );
}

function ToolCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-2 rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{title}</div>
      {children}
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <div className="my-2 flex items-center gap-2 text-xs text-slate-400">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      {label}
    </div>
  );
}

function renderPart(part: Part, key: string) {
  switch (part.type) {
    case "text":
      return (
        <div key={key} className="whitespace-pre-wrap leading-relaxed">
          {part.text}
        </div>
      );

    case "tool-searchDocs": {
      if (part.state === "output-error") {
        return (
          <ToolCard key={key} title="🔎 Document search failed">
            <p className="mt-1 text-xs text-rose-300">{part.errorText}</p>
          </ToolCard>
        );
      }
      if (part.state !== "output-available") {
        return <Pending key={key} label="Searching the documentation…" />;
      }
      const seen = new Set<string>();
      const sources = part.output.results.filter((r) => {
        const id = `${r.sourceName}#${r.page ?? ""}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      return (
        <ToolCard key={key} title={`🔎 Searched docs: “${part.input.query}”`}>
          {sources.length === 0 ? (
            <p className="mt-1 text-xs text-slate-400">
              No indexed documents yet. Ask an admin to run “Index for Copilot”.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sources.map((s) => {
                const label = `📄 ${s.sourceName}${s.page ? ` · p.${s.page}` : ""}`;
                const cls =
                  "rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300";
                return s.url ? (
                  <a
                    key={`${s.sourceName}${s.page}`}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`${cls} hover:border-cyan-500 hover:text-cyan-200`}
                  >
                    {label}
                  </a>
                ) : (
                  <span key={`${s.sourceName}${s.page}`} className={cls}>
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </ToolCard>
      );
    }

    case "tool-verifyThreshold": {
      if (part.state === "output-error") {
        return (
          <ToolCard key={key} title="🧮 Parameter check failed">
            <p className="mt-1 text-xs text-rose-300">{part.errorText}</p>
          </ToolCard>
        );
      }
      if (part.state !== "output-available") {
        return <Pending key={key} label="Verifying (t, n) parameters…" />;
      }
      const { input, output } = part;
      return (
        <ToolCard
          key={key}
          title={`🧮 verifyThreshold · p=${input.p}, n=${input.n}, t=${input.t} · ${output.valid ? "✅ valid" : "❌ invalid"}`}
        >
          {output.properties && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300 sm:grid-cols-3">
              <span>Shares needed: {output.properties.sharesNeededToReconstruct}</span>
              <span>
                Safe vs colluders: {output.properties.maxCollidingPartiesWithZeroKnowledge}
              </span>
              <span>Polynomial degree: {output.properties.polynomialDegree}</span>
              <span>Shares that can be lost: {output.properties.sharesThatCanBeLostSafely}</span>
              <span>
                Multiplication:{" "}
                {output.properties.supportsMultiplicationWithResharing ? "yes" : "no"}
              </span>
            </div>
          )}
          <Findings findings={output.findings} />
        </ToolCard>
      );
    }

    case "tool-diagnoseReconstruction": {
      if (part.state === "output-error") {
        return (
          <ToolCard key={key} title="🩺 Diagnosis failed">
            <p className="mt-1 text-xs text-rose-300">{part.errorText}</p>
          </ToolCard>
        );
      }
      if (part.state !== "output-available") {
        return <Pending key={key} label="Diagnosing the reconstruction…" />;
      }
      const { output } = part;
      return (
        <ToolCard
          key={key}
          title={`🩺 diagnoseReconstruction · ${output.ok ? "✅ ok" : "❌ problem found"}`}
        >
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-300">
            <span>
              Reconstructed secret:{" "}
              <b className="text-cyan-200">{output.reconstructedSecret ?? "—"}</b>
            </span>
            {output.sharesUsed.length > 0 && <span>Using x = {output.sharesUsed.join(", ")}</span>}
            {output.suspectedCorruptShares.length > 0 && (
              <span className="text-rose-300">
                Suspected corrupt: x = {output.suspectedCorruptShares.join(", ")}
              </span>
            )}
          </div>
          <Findings findings={output.findings} />
        </ToolCard>
      );
    }

    default:
      return null;
  }
}

export default function CopilotPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } = useChat<CopilotMessage>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-cyan-400" />
      </div>
    );
  }

  const busy = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="bg-linear-to-r from-cyan-300 to-sky-300 bg-clip-text text-3xl font-bold text-transparent">
          🤖 Cryptography Copilot
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ask questions about the course material, verify (t, n) parameters, or debug a failed
          reconstruction. All arithmetic is done by verified code, not by the AI.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="mb-4 text-slate-400">Try one of these:</p>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-left text-sm text-slate-200 transition hover:border-cyan-500 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-linear-to-r from-cyan-500 to-sky-500 text-slate-950"
                  : "border border-slate-800 bg-slate-950/70 text-slate-100"
              }`}
            >
              {m.parts.map((part, i) => renderPart(part, `${m.id}-${i}`))}
            </div>
          </div>
        ))}

        {status === "submitted" && <Pending label="Thinking…" />}

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error.message || "Something went wrong."}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Shamir, MPC, or paste your shares…"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="rounded-xl bg-rose-500/90 px-5 py-3 text-sm font-bold text-white hover:bg-rose-500"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-linear-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
          >
            Send
          </button>
        )}
      </form>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Answers about documents can be wrong — check the cited sources.{" "}
        <Link href="/docs" className="underline hover:text-slate-300">
          Open docs
        </Link>
      </p>
    </div>
  );
}
