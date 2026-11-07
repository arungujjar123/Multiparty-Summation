/**
 * @fileoverview Cryptography Copilot: an LLM agent that verifies Shamir/MPC parameters
 * and debugs failed reconstructions by calling deterministic math tools
 */
"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from "ai";
import { useAuth } from "@/contexts/AuthContext";
import SafeMarkdown from "@/components/SafeMarkdown";

const EXAMPLES = [
  "Is p=97, n=5, t=3 safe if the parties want to multiply two secrets up to 50?",
  "These shares don't reconstruct to 42: (1,54), (2,80), (3,23), (4,71), (5,48). p=97, t=3. What's wrong?",
  "I have 7 hospitals and want any 4 of them to be able to compute the total patient count (max 10,000 each). Pick p and check it.",
  "Why does multiplication need n ≥ 2t−1 parties?",
];

const TOOL_LABELS: Record<string, string> = {
  validateParams: "Validate parameters",
  nextPrime: "Find prime",
  generateShares: "Generate shares",
  reconstruct: "Reconstruct secret",
  diagnoseReconstruction: "Diagnose reconstruction",
};

type MessagePart = UIMessage["parts"][number];

function ToolCard({ part }: { part: MessagePart }) {
  if (!isToolUIPart(part)) return null;
  const name = getToolName(part);
  const output = part.state === "output-available" ? (part.output as { ok?: boolean }) : undefined;
  const failed = part.state === "output-error" || output?.ok === false;
  const running = part.state === "input-streaming" || part.state === "input-available";

  return (
    <details className="my-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 flex items-center gap-2">
        <span>{running ? "⏳" : failed ? "⚠️" : "🛠️"}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {TOOL_LABELS[name] ?? name}
        </span>
        <code className="text-xs text-gray-500 dark:text-gray-400">{name}()</code>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {running ? "running…" : failed ? "returned an error" : "done"}
        </span>
      </summary>
      <div className="px-3 pb-3 grid gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Input</p>
          <pre className="overflow-x-auto p-2 rounded bg-white dark:bg-gray-950 text-xs">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        </div>
        {part.state === "output-available" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Output</p>
            <pre className="overflow-x-auto p-2 rounded bg-white dark:bg-gray-950 text-xs">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}
        {part.state === "output-error" && (
          <p className="text-xs text-red-600 dark:text-red-400">{part.errorText}</p>
        )}
      </div>
    </details>
  );
}

function errorMessage(error: Error): string {
  // Route errors arrive as the JSON response body
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // not JSON
  }
  return error.message || "Something went wrong";
}

export default function CopilotPage() {
  const { user, isLoading } = useAuth();
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop, clearError, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/copilot" }),
  });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <header className="max-w-4xl mx-auto mb-6 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-sky-600 dark:from-cyan-300 dark:to-sky-400">
          Cryptography Copilot
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          An AI agent that checks (t, n) threshold parameters and debugs failed share
          reconstructions. Every number it gives comes from a deterministic math tool, and you can
          inspect each tool call.
        </p>
      </header>

      {!isLoading && !user ? (
        <div className="max-w-xl mx-auto p-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300">Sign in to use the Copilot.</p>
          <Link
            href="/login"
            className="inline-block mt-4 px-5 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-cyan-500 to-sky-600"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <section className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 sm:p-6 space-y-4 min-h-[360px] max-h-[65vh] overflow-y-auto">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Try one of these:</p>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => send(ex)}
                    className="block w-full text-left text-sm px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300 transition"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-linear-to-r from-cyan-500 to-sky-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return message.role === "user" ? (
                        <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
                          {part.text}
                        </p>
                      ) : (
                        <SafeMarkdown key={i} text={part.text} className="copilot-md text-sm" />
                      );
                    }
                    if (isToolUIPart(part)) return <ToolCard key={i} part={part} />;
                    return null;
                  })}
                </div>
              </div>
            ))}

            {status === "submitted" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Thinking…</p>
            )}
            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                {errorMessage(error)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about parameters, or paste shares that won't reconstruct…"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              disabled={!user}
            />
            {busy ? (
              <button
                type="button"
                onClick={stop}
                className="px-4 py-2 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !user}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-linear-to-r from-cyan-500 to-sky-600 disabled:opacity-50"
              >
                Send
              </button>
            )}
            {messages.length > 0 && !busy && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  clearError();
                }}
                className="px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </form>
        </section>
      )}
    </main>
  );
}
