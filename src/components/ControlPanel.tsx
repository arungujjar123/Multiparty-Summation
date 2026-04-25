/**
 * @fileoverview Control panel for setting parameters and generating shares
 */
"use client";
import React from "react";

export type OperationMode = "shamir" | "sum" | "multiply" | "both";

interface ControlPanelProps {
  p: string;
  setP: (val: string) => void;
  n: number;
  setN: (val: number) => void;
  t: number;
  setT: (val: number) => void;
  secretCount: number;
  setSecretCount: (val: number) => void;
  secrets: string[];
  setSecretAt: (index: number, val: string) => void;
  useManualCoefficients: boolean;
  setUseManualCoefficients: (val: boolean) => void;
  manualCoefficients: string[][];
  setCoefficientAt: (secretIndex: number, coeffIndex: number, val: string) => void;
  useManualReshareCoefficients: boolean;
  setUseManualReshareCoefficients: (val: boolean) => void;
  manualReshareCoefficients: string[][];
  setReshareCoefficientAt: (playerIndex: number, coeffIndex: number, val: string) => void;
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
  secretCount,
  setSecretCount,
  secrets,
  setSecretAt,
  useManualCoefficients,
  setUseManualCoefficients,
  manualCoefficients,
  setCoefficientAt,
  useManualReshareCoefficients,
  setUseManualReshareCoefficients,
  manualReshareCoefficients,
  setReshareCoefficientAt,
  seed,
  setSeed,
  operationMode,
  setOperationMode,
  onGenerate,
}: ControlPanelProps) {
  const minSecrets = operationMode === "sum" || operationMode === "shamir" ? 1 : 2;
  const maxSecrets = operationMode === "shamir" ? 1 : 12;

  const getSecretLabel = (index: number) => {
    if (index < 26) {
      return String.fromCharCode(97 + index);
    }
    return `s${index + 1}`;
  };

  return (
    <div className="bg-linear-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Control Panel</h2>

      <div className="space-y-4">
        {/* Operation Mode Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Operation Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOperationMode("shamir")}
              className={`min-h-11 py-2 px-2 rounded-lg text-sm font-medium leading-tight whitespace-normal break-words transition-all ${
                operationMode === "shamir"
                  ? "bg-linear-to-r from-cyan-500 to-sky-500 text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Shamir Only
            </button>
            <button
              onClick={() => setOperationMode("sum")}
              className={`min-h-11 py-2 px-2 rounded-lg text-sm font-medium leading-tight whitespace-normal break-words transition-all ${
                operationMode === "sum"
                  ? "bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Summation
            </button>
            <button
              onClick={() => setOperationMode("multiply")}
              className={`min-h-11 py-2 px-2 rounded-lg text-sm font-medium leading-tight whitespace-normal break-words transition-all ${
                operationMode === "multiply"
                  ? "bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Multiplication
            </button>
            <button
              onClick={() => setOperationMode("both")}
              className={`min-h-11 py-2 px-2 rounded-lg text-sm font-medium leading-tight whitespace-normal break-words transition-all ${
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
          {(operationMode === "multiply" || operationMode === "both") ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Need {2 * t - 1}+ players for multiplication
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Any {t} shares can reconstruct the secret.
            </p>
          )}
        </div>

        {/* Number of secrets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total Secrets
          </label>
          <input
            type="number"
            value={secretCount}
            onChange={(e) => setSecretCount(Number(e.target.value))}
            min={minSecrets}
            max={maxSecrets}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          {operationMode === "shamir" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Shamir mode uses a single secret and reconstructs it from threshold shares.
            </p>
          )}
          {(operationMode === "multiply" || operationMode === "both") && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sum and multiplication both use all entered secrets.
            </p>
          )}
        </div>

        {/* Dynamic secret inputs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Secret Values
          </label>
          <div className="space-y-2">
            {Array.from({ length: secretCount }).map((_, index) => (
              <div key={index}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Secret {getSecretLabel(index)}
                </label>
                <input
                  type="text"
                  value={secrets[index] ?? ""}
                  onChange={(e) => setSecretAt(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder={index === 0 ? "4" : index === 1 ? "2" : "0"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Manual polynomial coefficients */}
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
            <input
              type="checkbox"
              checked={useManualCoefficients}
              onChange={(e) => setUseManualCoefficients(e.target.checked)}
              className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            Enter Polynomial Coefficients Manually
          </label>

          <p className="text-xs text-amber-800 dark:text-amber-300">
            If enabled, enter {Math.max(t - 1, 0)} coefficient(s) for each secret polynomial: a1..a{Math.max(t - 1, 0)}
          </p>

          {useManualCoefficients && (
            <div className="space-y-3">
              {t <= 1 ? (
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Threshold t=1 has no random coefficients; polynomial is constant only.
                </p>
              ) : (
                Array.from({ length: secretCount }).map((_, secretIndex) => (
                  <div key={`coeff-${secretIndex}`} className="space-y-1">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Secret {getSecretLabel(secretIndex)} coefficients
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: t - 1 }).map((__, coeffIndex) => (
                        <input
                          key={`coeff-${secretIndex}-${coeffIndex}`}
                          type="text"
                          value={manualCoefficients[secretIndex]?.[coeffIndex] ?? ""}
                          onChange={(e) => setCoefficientAt(secretIndex, coeffIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder={`a${coeffIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {(operationMode === "multiply" || operationMode === "both") && (
          <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-900/20 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-purple-900 dark:text-purple-200">
              <input
                type="checkbox"
                checked={useManualReshareCoefficients}
                onChange={(e) => setUseManualReshareCoefficients(e.target.checked)}
                className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
              />
              Enter Resharing Coefficients Manually (per player)
            </label>

            <p className="text-xs text-purple-800 dark:text-purple-300">
              For multiplication degree-reduction, set z_i(x) coefficients a1..a{Math.max(t - 1, 0)} for each player. Constant term is derived by protocol.
            </p>

            {useManualReshareCoefficients && (
              <div className="space-y-3">
                {t <= 1 ? (
                  <p className="text-xs text-purple-800 dark:text-purple-300">
                    Threshold t=1 has no additional coefficients; z_i(x) is constant only.
                  </p>
                ) : (
                  Array.from({ length: n }).map((_, playerIndex) => (
                    <div key={`reshare-coeff-${playerIndex}`} className="space-y-1">
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                        Player P{playerIndex + 1} coefficients
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: t - 1 }).map((__, coeffIndex) => (
                          <input
                            key={`reshare-coeff-${playerIndex}-${coeffIndex}`}
                            type="text"
                            value={manualReshareCoefficients[playerIndex]?.[coeffIndex] ?? ""}
                            onChange={(e) =>
                              setReshareCoefficientAt(playerIndex, coeffIndex, e.target.value)
                            }
                            className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
                            placeholder={`a${coeffIndex + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {operationMode === "multiply" && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Product is computed as a × b × c × ... for all secrets.
            </p>
          </div>
        )}

        {operationMode === "both" && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sum uses all secrets; product is also across all secrets.
            </p>
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
              disabled={useManualCoefficients}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder={useManualCoefficients ? "Disabled in manual coefficient mode" : "Leave empty for secure random"}
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
