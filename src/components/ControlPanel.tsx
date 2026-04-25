/**
 * @fileoverview Control panel for setting parameters and generating shares
 */
"use client";
import React from "react";

export type OperationMode = "sum" | "multiply" | "both";

interface ControlPanelProps {
  p: string;
  setP: (val: string) => void;
  n: number;
  setN: (val: number) => void;
  t: number;
  setT: (val: number) => void;
  a: string;
  setA: (val: string) => void;
  b: string;
  setB: (val: string) => void;
  seed?: number;
  setSeed?: (val: number | undefined) => void;
  operationMode: OperationMode;
  setOperationMode: (mode: OperationMode) => void;
  onGenerate: () => void;
}

export default function ControlPanel({
  p,
  setP,
  n,
  setN,
  t,
  setT,
  a,
  setA,
  b,
  setB,
  seed,
  setSeed,
  operationMode,
  setOperationMode,
  onGenerate,
}: ControlPanelProps) {
  const showB = operationMode === "multiply" || operationMode === "both";

  return (
    <div className="bg-linear-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
        Control Panel
      </h2>

      <div className="space-y-4">
        {/* Operation Mode Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Operation Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setOperationMode("sum")}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                operationMode === "sum"
                  ? "bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Sum Only
            </button>
            <button
              onClick={() => setOperationMode("multiply")}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                operationMode === "multiply"
                  ? "bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Multiply Only
            </button>
            <button
              onClick={() => setOperationMode("both")}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                operationMode === "both"
                  ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Both
            </button>
          </div>
        </div>

        {/* Prime p */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prime (p)
          </label>
          <input
            type="text"
            value={p}
            onChange={(e) => setP(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="11"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be a prime number</p>
        </div>

        {/* Number of players n */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Players (n)
          </label>
          <input
            type="number"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        {/* Threshold t */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Threshold (t)
          </label>
          <input
            type="number"
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            min={1}
            max={n}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Need {2 * t - 1}+ players for multiplication
          </p>
        </div>

        {/* Secret a */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Secret a {operationMode === "sum" && "(value to sum)"}
            {operationMode === "multiply" && "(value to multiply)"}
          </label>
          <input
            type="text"
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="4"
          />
        </div>

        {/* Secret b - conditionally shown */}
        {showB && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret b {operationMode === "multiply" ? "(multiplier)" : "(second value)"}
            </label>
            <input
              type="text"
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="2"
            />
          </div>
        )}

        {/* Optional seed */}
        {setSeed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              RNG Seed (optional)
            </label>
            <input
              type="number"
              value={seed ?? ""}
              onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Leave empty for secure random"
            />
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={onGenerate}
          className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          🚀 Generate & Run
        </button>
      </div>
    </div>
  );
}
