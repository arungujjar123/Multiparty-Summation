/**
 * @fileoverview Admin panel to (re)index docs and PDFs for the Copilot.
 */
"use client";
import React, { useCallback, useEffect, useState } from "react";

interface Stats {
  aiConfigured: boolean;
  chatModel: string;
  embeddingModel: string;
  sectionIds: string[];
  totalChunks: number;
  sources: Array<{ sectionId: string; sourceName: string; chunks: number }>;
}

interface SourceReport {
  sectionId: string;
  sourceName: string;
  status: "indexed" | "unchanged" | "skipped" | "failed";
  chunks?: number;
  message?: string;
}

const statusIcon: Record<SourceReport["status"], string> = {
  indexed: "✅",
  unchanged: "➖",
  skipped: "⚠️",
  failed: "❌",
};

export default function CopilotIndexPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [reports, setReports] = useState<SourceReport[]>([]);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rag", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load index status");
      setStats(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const post = async (body: object) => {
    const res = await fetch("/api/admin/rag", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  const runIndex = async () => {
    if (!stats) return;
    setRunning(true);
    setError("");
    setReports([]);
    try {
      setProgress("Preparing vector index…");
      const { indexStatus } = await post({});
      const collected: SourceReport[] = [];
      for (const [i, sectionId] of stats.sectionIds.entries()) {
        setProgress(`Indexing section ${i + 1}/${stats.sectionIds.length}: ${sectionId}`);
        try {
          const { reports: r } = await post({ sectionId });
          collected.push(...r);
        } catch (e) {
          collected.push({
            sectionId,
            sourceName: "(section)",
            status: "failed",
            message: (e as Error).message,
          });
        }
        setReports([...collected]);
      }
      setProgress(indexStatus);
      await loadStats();
    } catch (e) {
      setError((e as Error).message);
      setProgress("");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            🤖 Copilot knowledge base
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats
              ? stats.aiConfigured
                ? `${stats.totalChunks} chunks indexed from ${stats.sources.length} sources · ${stats.embeddingModel} · ${stats.chatModel}`
                : "GOOGLE_GENERATIVE_AI_API_KEY is not set on the server."
              : "Loading…"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Saving a section or uploading a PDF re-indexes that section automatically. Use this
            button for the first run or after changing models.
          </p>
        </div>
        <button
          onClick={runIndex}
          disabled={running || !stats?.aiConfigured}
          className="rounded-xl bg-linear-to-r from-cyan-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          {running ? "Indexing…" : "Index for Copilot"}
        </button>
      </div>

      {progress && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{progress}</p>}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {reports.length > 0 && (
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto text-xs text-gray-700 dark:text-gray-300">
          {reports.map((r, i) => (
            <li key={`${r.sectionId}-${r.sourceName}-${i}`}>
              {statusIcon[r.status]} <b>{r.sectionId}</b> · {r.sourceName} · {r.status}
              {r.chunks ? ` (${r.chunks} chunks)` : ""}
              {r.message ? ` — ${r.message}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
