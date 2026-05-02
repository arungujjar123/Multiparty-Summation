/**
 * @fileoverview Control panel for setting parameters and generating shares
 * Supports manual polynomial coefficient entry and player selection for reconstruction
 */
"use client";
import React, { useEffect, type SetStateAction } from "react";

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
  // Manual polynomial coefficients for f(x): [a0, a1, a2, ..., a_{t-1}]
  fCoeffs: string[];
  setFCoeffs: (val: SetStateAction<string[]>) => void;
  // Manual polynomial coefficients for g(x): [b0, b1, b2, ..., b_{t-1}]
  gCoeffs: string[];
  setGCoeffs: (val: SetStateAction<string[]>) => void;
  // Per-player zi polynomial coefficients (only higher-degree terms, constant is h_i)
  // ziCoeffs[playerIdx] = [a1, a2, ..., a_{t-1}]
  ziCoeffs: string[][];
  setZiCoeffs: (val: SetStateAction<string[][]>) => void;
  // Player selection for reconstruction
  selectedPlayers: Set<number>;
  setSelectedPlayers: (val: SetStateAction<Set<number>>) => void;
  // Whether data has been generated
  hasData: boolean;
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
  fCoeffs,
  setFCoeffs,
  gCoeffs,
  setGCoeffs,
  ziCoeffs,
  setZiCoeffs,
  selectedPlayers,
  setSelectedPlayers,
  hasData,
}: ControlPanelProps) {
  const showB = operationMode === "multiply" || operationMode === "both";
  const degree = t; // polynomial has t coefficients (degree t-1)

  // Update coefficient arrays when t changes
  useEffect(() => {
    setFCoeffs((prev: string[]) => {
      const newCoeffs = [...prev];
      while (newCoeffs.length < degree) newCoeffs.push("0");
      return newCoeffs.slice(0, degree);
    });
    setGCoeffs((prev: string[]) => {
      const newCoeffs = [...prev];
      while (newCoeffs.length < degree) newCoeffs.push("0");
      return newCoeffs.slice(0, degree);
    });
    // Update zi coefficients (only higher-degree terms, so t-1 coefficients)
    setZiCoeffs((prev: string[][]) => {
      const newZi: string[][] = [];
      for (let i = 0; i < n; i++) {
        const existing = prev[i] || [];
        const newPlayerCoeffs = [...existing];
        while (newPlayerCoeffs.length < degree - 1) newPlayerCoeffs.push("0");
        newZi.push(newPlayerCoeffs.slice(0, degree - 1));
      }
      return newZi;
    });
  }, [t, n, degree, setFCoeffs, setGCoeffs, setZiCoeffs]);

  // Update selected players when n changes
  useEffect(() => {
    setSelectedPlayers((prev: Set<number>) => {
      const newSet = new Set<number>();
      prev.forEach((p) => {
        if (p <= n) newSet.add(p);
      });
      // Default: select first t players if none selected
      if (newSet.size === 0) {
        for (let i = 1; i <= Math.min(t, n); i++) {
          newSet.add(i);
        }
      }
      return newSet;
    });
  }, [n, t, setSelectedPlayers]);

  const updateFCoeff = (idx: number, val: string) => {
    const newCoeffs = [...fCoeffs];
    newCoeffs[idx] = val;
    setFCoeffs(newCoeffs);
    // Keep a in sync with a0
    if (idx === 0) setA(val);
  };

  const updateGCoeff = (idx: number, val: string) => {
    const newCoeffs = [...gCoeffs];
    newCoeffs[idx] = val;
    setGCoeffs(newCoeffs);
    // Keep b in sync with b0
    if (idx === 0) setB(val);
  };

  const updateZiCoeff = (playerIdx: number, coeffIdx: number, val: string) => {
    const newZi = ziCoeffs.map((arr) => [...arr]);
    if (!newZi[playerIdx]) {
      newZi[playerIdx] = new Array(degree - 1).fill("0");
    }
    newZi[playerIdx][coeffIdx] = val;
    setZiCoeffs(newZi);
  };

  const togglePlayer = (playerNum: number) => {
    const newSet = new Set(selectedPlayers);
    if (newSet.has(playerNum)) {
      newSet.delete(playerNum);
    } else {
      newSet.add(playerNum);
    }
    setSelectedPlayers(newSet);
  };

  const selectAllPlayers = () => {
    const newSet = new Set<number>();
    for (let i = 1; i <= n; i++) newSet.add(i);
    setSelectedPlayers(newSet);
  };

  const selectFirstT = () => {
    const newSet = new Set<number>();
    for (let i = 1; i <= Math.min(t, n); i++) newSet.add(i);
    setSelectedPlayers(newSet);
  };

  const formatPolynomial = (coeffs: string[], varName: string): string => {
    const parts: string[] = [];
    coeffs.forEach((c, i) => {
      const val = c || "0";
      if (i === 0) {
        parts.push(val);
      } else if (i === 1) {
        parts.push(`${val}${varName}`);
      } else {
        parts.push(`${val}${varName}²`.replace("²", i === 2 ? "²" : `^${i}`));
      }
    });
    return parts.join(" + ");
  };

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
            Polynomial degree = {t - 1}, Need {2 * t - 1}+ players for multiplication
          </p>
        </div>

        {/* f(x) Polynomial Coefficients */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <label className="block text-sm font-bold text-purple-800 dark:text-purple-200 mb-2">
            📐 f(x) Polynomial Coefficients
          </label>
          <p className="text-xs text-purple-600 dark:text-purple-300 mb-3">
            f(x) = {formatPolynomial(fCoeffs, "x")} mod {p}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: degree }, (_, i) => (
              <div key={`f-${i}`}>
                <label className="block text-xs text-purple-700 dark:text-purple-300 mb-1">
                  a{i} {i === 0 ? "(secret A)" : `(x${i > 1 ? `^${i}` : ""} coeff)`}
                </label>
                <input
                  type="text"
                  value={fCoeffs[i] || "0"}
                  onChange={(e) => updateFCoeff(i, e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-purple-300 dark:border-purple-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* g(x) Polynomial Coefficients */}
        {showB && (
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-700">
            <label className="block text-sm font-bold text-pink-800 dark:text-pink-200 mb-2">
              📐 g(x) Polynomial Coefficients
            </label>
            <p className="text-xs text-pink-600 dark:text-pink-300 mb-3">
              g(x) = {formatPolynomial(gCoeffs, "x")} mod {p}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: degree }, (_, i) => (
                <div key={`g-${i}`}>
                  <label className="block text-xs text-pink-700 dark:text-pink-300 mb-1">
                    b{i} {i === 0 ? "(secret B)" : `(x${i > 1 ? `^${i}` : ""} coeff)`}
                  </label>
                  <input
                    type="text"
                    value={gCoeffs[i] || "0"}
                    onChange={(e) => updateGCoeff(i, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-pink-300 dark:border-pink-600 rounded-md focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* zi(x) Per-Player Polynomial Coefficients (for multiplication) */}
        {(operationMode === "multiply" || operationMode === "both") && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <label className="block text-sm font-bold text-indigo-800 dark:text-indigo-200 mb-2">
              🔄 zᵢ(x) Resharing Polynomial Coefficients
            </label>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-3">
              Each player&apos;s zᵢ(x) has constant term = hᵢ (auto-computed). Set higher-degree coefficients below.
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {Array.from({ length: n }, (_, playerIdx) => (
                <div
                  key={`zi-${playerIdx}`}
                  className="bg-white dark:bg-gray-800 p-3 rounded-md border border-indigo-100 dark:border-indigo-800"
                >
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                    z{playerIdx + 1}(x): hᵢ + {
                      (ziCoeffs[playerIdx] || []).map((c, k) => {
                        const exp = k + 1;
                        return `${c || '0'}x${exp > 1 ? `^${exp}` : ''}`;
                      }).join(' + ')
                    }
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: degree - 1 }, (_, coeffIdx) => (
                      <div key={`zi-${playerIdx}-${coeffIdx}`}>
                        <label className="block text-xs text-indigo-600 dark:text-indigo-400">
                          a{coeffIdx + 1} (x{coeffIdx + 1 > 1 ? `^${coeffIdx + 1}` : ""})
                        </label>
                        <input
                          type="text"
                          value={(ziCoeffs[playerIdx] && ziCoeffs[playerIdx][coeffIdx]) || "0"}
                          onChange={(e) =>
                            updateZiCoeff(playerIdx, coeffIdx, e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs border border-indigo-200 dark:border-indigo-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

        {/* Player Selection for Reconstruction */}
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-700">
          <label className="block text-sm font-bold text-teal-800 dark:text-teal-200 mb-2">
            🎯 Player Selection for Reconstruction
          </label>
          <p className="text-xs text-teal-600 dark:text-teal-300 mb-3">
            Select which players to use for Lagrange reconstruction (need ≥ {t} players).
            Currently selected: {selectedPlayers.size} player{selectedPlayers.size !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2 mb-3">
            <button
              onClick={selectAllPlayers}
              className="text-xs px-3 py-1 bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 rounded-md hover:bg-teal-300 dark:hover:bg-teal-700 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={selectFirstT}
              className="text-xs px-3 py-1 bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 rounded-md hover:bg-teal-300 dark:hover:bg-teal-700 transition-colors"
            >
              Select First {t}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: n }, (_, i) => {
              const playerNum = i + 1;
              const isSelected = selectedPlayers.has(playerNum);
              return (
                <button
                  key={playerNum}
                  onClick={() => togglePlayer(playerNum)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-md scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  P{playerNum}
                </button>
              );
            })}
          </div>
          {selectedPlayers.size > 0 && selectedPlayers.size < t && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ Need at least {t} players for reconstruction. Selected: {selectedPlayers.size}
            </p>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={onGenerate}
          className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          🚀 Generate & Run
        </button>

        {/* Reconstruct with selected players button */}
        {hasData && (
          <button
            onClick={onGenerate}
            className="w-full bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            🔄 Re-run with Selected Players
          </button>
        )}
      </div>
    </div>
  );
}
