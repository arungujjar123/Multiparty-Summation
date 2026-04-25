/**
 * @fileoverview Main page for Shamir MPC Visualizer
 */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ControlPanel, { type OperationMode } from "@/components/ControlPanel";
import PlayersGrid, { type PlayerData } from "@/components/PlayersGrid";
import Stepper, { type StepperHandle } from "@/components/Stepper";
import NetworkMatrix from "@/components/NetworkMatrix";
import LagrangeModal from "@/components/LagrangeModal";
import { createShares, localSumShares, toBig, isPrime } from "@/lib/math/shamir";
import { multiplicationReshare, type ReshareMessage } from "@/lib/math/resharing";
import { lagrangeAtZero } from "@/lib/math/lagrange";
import { exportToCSV, exportToJSON, type RunData } from "@/lib/export";

export default function HomePage() {
  const [operationMode, setOperationMode] = useState<OperationMode>("both");
  const [p, setP] = useState("11");
  const [n, setN] = useState(7);
  const [t, setT] = useState(3);
  const [secretCount, setSecretCountState] = useState(2);
  const [secrets, setSecrets] = useState<string[]>(["4", "2"]);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [useManualCoefficients, setUseManualCoefficients] = useState(false);
  const [manualCoefficients, setManualCoefficients] = useState<string[][]>([
    ["1", "1"],
    ["1", "1"],
  ]);
  const [useManualReshareCoefficients, setUseManualReshareCoefficients] = useState(false);
  const [manualReshareCoefficients, setManualReshareCoefficients] = useState<string[][]>([]);

  const [playersData, setPlayersData] = useState<PlayerData[]>([]);
  const [reshareMessages, setReshareMessages] = useState<ReshareMessage[]>([]);
  const [reconSum, setReconSum] = useState<string | null>(null);
  const [reconMul, setReconMul] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showLagrangeModal, setShowLagrangeModal] = useState(false);
  const [modalType, setModalType] = useState<"sum" | "mul">("sum");
  const [isComplete, setIsComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const stepRef = useRef<StepperHandle | null>(null);

  const resizeCoefficientMatrix = (matrix: string[][], secretsLen: number, degree: number) => {
    return Array.from({ length: secretsLen }, (_, secretIndex) => {
      const existingRow = matrix[secretIndex] ?? [];
      const normalizedRow = Array.from({ length: degree }, (_, coeffIndex) =>
        existingRow[coeffIndex] ?? "0"
      );
      return normalizedRow;
    });
  };

  const resizePerPlayerCoefficientMatrix = (
    matrix: string[][],
    playersLen: number,
    degree: number
  ) => {
    return Array.from({ length: playersLen }, (_, playerIndex) => {
      const existingRow = matrix[playerIndex] ?? [];
      const normalizedRow = Array.from({ length: degree }, (_, coeffIndex) =>
        existingRow[coeffIndex] ?? "0"
      );
      return normalizedRow;
    });
  };

  const setSecretCount = (next: number) => {
    const normalized = Number.isFinite(next) ? Math.max(1, Math.min(12, Math.floor(next))) : 1;
    setSecretCountState(normalized);
    setSecrets((prev) => {
      const resized = [...prev];
      while (resized.length < normalized) {
        resized.push("0");
      }
      return resized.slice(0, normalized);
    });
  };

  const setSecretAt = (index: number, value: string) => {
    setSecrets((prev) => {
      const next = [...prev];
      while (next.length < secretCount) {
        next.push("0");
      }
      next[index] = value;
      return next;
    });
  };

  const setCoefficientAt = (secretIndex: number, coeffIndex: number, value: string) => {
    setManualCoefficients((prev) => {
      const resized = resizeCoefficientMatrix(prev, secretCount, Math.max(t - 1, 0));
      resized[secretIndex][coeffIndex] = value;
      return resized;
    });
  };

  const setReshareCoefficientAt = (playerIndex: number, coeffIndex: number, value: string) => {
    setManualReshareCoefficients((prev) => {
      const resized = resizePerPlayerCoefficientMatrix(prev, n, Math.max(t - 1, 0));
      resized[playerIndex][coeffIndex] = value;
      return resized;
    });
  };

  useEffect(() => {
    const minSecrets = operationMode === "sum" || operationMode === "shamir" ? 1 : 2;
    if (secretCount < minSecrets) {
      setSecretCount(minSecrets);
    }
  }, [operationMode, secretCount]);

  useEffect(() => {
    if (operationMode === "shamir" && secretCount !== 1) {
      setSecretCount(1);
    }
  }, [operationMode, secretCount]);

  useEffect(() => {
    setManualCoefficients((prev) => resizeCoefficientMatrix(prev, secretCount, Math.max(t - 1, 0)));
  }, [secretCount, t]);

  useEffect(() => {
    setManualReshareCoefficients((prev) =>
      resizePerPlayerCoefficientMatrix(prev, n, Math.max(t - 1, 0))
    );
  }, [n, t]);

  const getExpectedSumText = () => {
    try {
      const P = toBig(p);
      const values = secrets.slice(0, secretCount).map((v) => toBig(v || "0"));
      const sum = values.reduce((acc, cur) => (acc + cur) % P, 0n);
      return sum.toString();
    } catch {
      return "-";
    }
  };

  const getExpectedMulText = () => {
    try {
      if (secretCount < 2) return "-";
      const P = toBig(p);
      const values = secrets.slice(0, secretCount).map((v) => toBig(v || "0"));
      const product = values.reduce((acc, cur) => (acc * cur) % P, 1n);
      return product.toString();
    } catch {
      return "-";
    }
  };

  const generateInitial = () => {
    try {
      setError(null);

      const P = toBig(p);
      const minSecrets = operationMode === "sum" || operationMode === "shamir" ? 1 : 2;
      if (secretCount < minSecrets) {
        throw new Error(`Need at least ${minSecrets} secret(s) for current mode`);
      }

      const effectiveSecretCount = operationMode === "shamir" ? 1 : secretCount;
      const inputSecrets = secrets.slice(0, effectiveSecretCount);
      const parsedSecrets = inputSecrets.map((value, index) => {
        try {
          return toBig(value);
        } catch {
          const symbol = index < 26 ? String.fromCharCode(97 + index) : `s${index + 1}`;
          throw new Error(`Secret ${symbol} must be a valid integer`);
        }
      });

      if (!isPrime(P)) {
        throw new Error(`p=${p} is not prime`);
      }
      if (t > n) {
        throw new Error(`Threshold t=${t} cannot exceed number of players n=${n}`);
      }
      if ((operationMode === "multiply" || operationMode === "both") && n < 2 * t - 1) {
        throw new Error(`Need at least ${2 * t - 1} players for multiplication (have ${n})`);
      }

      for (let index = 0; index < parsedSecrets.length; index++) {
        const secretValue = parsedSecrets[index];
        if (secretValue < 0n || secretValue >= P) {
          const symbol = index < 26 ? String.fromCharCode(97 + index) : `s${index + 1}`;
          throw new Error(`Secret ${symbol} must be in range [0, ${P - 1n}]`);
        }
      }

      const manualCoefficientValues: bigint[][] | undefined = useManualCoefficients
        ? parsedSecrets.map((_, secretIndex) => {
            const degree = Math.max(t - 1, 0);
            const row = manualCoefficients[secretIndex] ?? [];
            if (row.length !== degree) {
              const symbol = secretIndex < 26 ? String.fromCharCode(97 + secretIndex) : `s${secretIndex + 1}`;
              throw new Error(`Secret ${symbol} needs exactly ${degree} coefficient(s)`);
            }

            return row.map((coefficientValue, coeffIndex) => {
              let parsed: bigint;
              try {
                parsed = toBig(coefficientValue || "0");
              } catch {
                const symbol = secretIndex < 26 ? String.fromCharCode(97 + secretIndex) : `s${secretIndex + 1}`;
                throw new Error(`Coefficient a${coeffIndex + 1} for secret ${symbol} must be a valid integer`);
              }

              if (parsed < 0n || parsed >= P) {
                const symbol = secretIndex < 26 ? String.fromCharCode(97 + secretIndex) : `s${secretIndex + 1}`;
                throw new Error(`Coefficient a${coeffIndex + 1} for secret ${symbol} must be in range [0, ${P - 1n}]`);
              }

              return parsed;
            });
          })
        : undefined;

      const manualReshareCoefficientValues: bigint[][] | undefined = useManualReshareCoefficients
        ? Array.from({ length: n }, (_, playerIndex) => {
            const degree = Math.max(t - 1, 0);
            const row = manualReshareCoefficients[playerIndex] ?? [];
            if (row.length !== degree) {
              throw new Error(
                `Player P${playerIndex + 1} needs exactly ${degree} resharing coefficient(s)`
              );
            }

            return row.map((coefficientValue, coeffIndex) => {
              let parsed: bigint;
              try {
                parsed = toBig(coefficientValue || "0");
              } catch {
                throw new Error(
                  `Resharing coefficient a${coeffIndex + 1} for player P${playerIndex + 1} must be a valid integer`
                );
              }

              if (parsed < 0n || parsed >= P) {
                throw new Error(
                  `Resharing coefficient a${coeffIndex + 1} for player P${playerIndex + 1} must be in range [0, ${P - 1n}]`
                );
              }

              return parsed;
            });
          })
        : undefined;

      const shareGroups = parsedSecrets.map((secretValue, index) =>
        createShares(
          secretValue,
          n,
          t,
          P,
          seed !== undefined ? seed + index * 1000 : undefined,
          manualCoefficientValues?.[index]
        )
      );
      const secretShares = shareGroups.map((group) => group.shares.map((share) => share.y));

      const fShares = secretShares[0] ?? new Array(n).fill(0n);
      const gShares = secretShares[1] ?? new Array(n).fill(0n);

      let hSum = new Array(n).fill(0n) as bigint[];
      if (operationMode !== "multiply") {
        for (const shareList of secretShares) {
          hSum = localSumShares(hSum, shareList, P);
        }
      }

      const resharingResult = (() => {
        if (operationMode === "sum" || operationMode === "shamir") {
          return { h: fShares.map(() => 0n), Tshares: fShares.map(() => 0n), messages: [] };
        }

        let currentShares = secretShares[0];
        let latestRound = {
          h: fShares.map(() => 0n),
          Tshares: currentShares,
          messages: [] as ReshareMessage[],
        };
        const allMessages: ReshareMessage[] = [];

        for (let index = 1; index < secretShares.length; index++) {
          const round = multiplicationReshare(
            currentShares,
            secretShares[index],
            t,
            P,
            seed !== undefined ? seed + 2000 + index * 1000 : undefined,
            manualReshareCoefficientValues
          );
          currentShares = round.Tshares;
          latestRound = {
            h: round.h,
            Tshares: round.Tshares,
            messages: round.messages,
          };
          allMessages.push(...round.messages);
        }

        return {
          h: latestRound.h,
          Tshares: latestRound.Tshares,
          messages: allMessages,
        };
      })();

      const players: PlayerData[] = Array.from({ length: n }, (_, idx) => ({
        x: BigInt(idx + 1),
        secretShares: secretShares.map((shares) => shares[idx].toString()),
        f: fShares[idx].toString(),
        g: gShares[idx].toString(),
        hSum: hSum[idx].toString(),
        hProd: resharingResult.h[idx].toString(),
        T: resharingResult.Tshares[idx].toString(),
      }));

      setPlayersData(players);
      setReshareMessages(resharingResult.messages);

      const sumPoints = players.slice(0, t).map((p) => ({
        x: BigInt(p.x.toString()),
        y: toBig(p.hSum),
      }));
      const sumRecon = lagrangeAtZero(sumPoints, P);
      setReconSum(sumRecon.toString());

      if (operationMode === "multiply" || operationMode === "both") {
        const tPoints = resharingResult.Tshares.slice(0, t).map((y: bigint, i: number) => ({
          x: BigInt(i + 1),
          y,
        }));
        const mulRecon = lagrangeAtZero(tPoints, P);
        setReconMul(mulRecon.toString());
      } else {
        setReconMul("N/A");
      }

      stepRef.current?.reset();
      setCurrentStep("generate-polynomials");
      setIsComplete(false);
      setShowSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setPlayersData([]);
      setReshareMessages([]);
      setReconSum(null);
      setReconMul(null);
    }
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
    if (step === "reconstruct") {
      setIsComplete(true);
      setTimeout(() => setShowSuccess(true), 500);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    if (playersData.length === 0 || !reconSum || !reconMul) return;

    const runData: RunData = {
      parameters: {
        p,
        n,
        t,
        operationMode,
        secretCount,
        secrets: secrets.slice(0, secretCount),
        seed,
        useManualCoefficients,
        manualCoefficients: useManualCoefficients
          ? manualCoefficients.slice(0, secretCount).map((row) => row.slice(0, Math.max(t - 1, 0)))
          : undefined,
        useManualReshareCoefficients,
        manualReshareCoefficients: useManualReshareCoefficients
          ? manualReshareCoefficients
              .slice(0, n)
              .map((row) => row.slice(0, Math.max(t - 1, 0)))
          : undefined,
      },
      players: playersData,
      results: { reconSum, reconMul },
      timestamp: new Date().toISOString(),
    };

    if (format === "csv") {
      exportToCSV(runData);
    } else {
      exportToJSON(runData);
    }
  };

  return (
    <div className="min-h-screen hero-surface hero-grid p-6">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              Shamir MPC Visualizer
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            🔐 Interactive visualization of Shamir secret sharing with summation and multiplication protocols
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              ✨ Educational
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              🎯 Step-by-Step
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              🔒 Secure
            </span>
          </div>
        </div>
      </header>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-7xl mx-auto mb-6"
          >
            <div className="p-6 bg-linear-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl border-4 border-white dark:border-gray-700">
              <div className="flex items-center justify-center gap-4">
                <span className="text-6xl animate-bounce">🎉</span>
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-white drop-shadow-lg">Protocol Complete!</p>
                  <p className="text-white/90 text-lg mt-1">Secrets successfully reconstructed</p>
                </div>
                <span className="text-6xl animate-bounce" style={{ animationDelay: "0.1s" }}>✨</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-linear-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-md">
          <p className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
            <span className="text-xl">⚠️</span> Error
          </p>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ControlPanel
            p={p}
            setP={setP}
            n={n}
            setN={setN}
            t={t}
            setT={setT}
            secretCount={secretCount}
            setSecretCount={setSecretCount}
            secrets={secrets}
            setSecretAt={setSecretAt}
            useManualCoefficients={useManualCoefficients}
            setUseManualCoefficients={setUseManualCoefficients}
            manualCoefficients={manualCoefficients}
            setCoefficientAt={setCoefficientAt}
            useManualReshareCoefficients={useManualReshareCoefficients}
            setUseManualReshareCoefficients={setUseManualReshareCoefficients}
            manualReshareCoefficients={manualReshareCoefficients}
            setReshareCoefficientAt={setReshareCoefficientAt}
            seed={seed}
            setSeed={setSeed}
            operationMode={operationMode}
            setOperationMode={setOperationMode}
            onGenerate={generateInitial}
          />

          <Stepper
            ref={stepRef}
            steps={
              operationMode === "shamir"
                ? ["generate-polynomials", "compute-shares", "reconstruct"]
                : operationMode === "sum"
                ? ["generate-polynomials", "compute-shares", "compute-local-sum", "reconstruct"]
                : operationMode === "multiply"
                  ? [
                      "generate-polynomials",
                      "compute-shares",
                      "compute-local-prod",
                      "reshare-send",
                      "reshare-aggregate",
                      "reconstruct",
                    ]
                  : [
                      "generate-polynomials",
                      "compute-shares",
                      "compute-local-sum",
                      "compute-local-prod",
                      "reshare-send",
                      "reshare-aggregate",
                      "reconstruct",
                    ]
            }
            onRunStep={handleStepChange}
            intervalMs={1500}
          />
        </div>

        <div className="lg:col-span-2">
          {playersData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-linear-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Reconstruction Results
                </h2>
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full"
                  >
                    <span className="text-2xl">✅</span>
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">Complete</span>
                  </motion.div>
                )}
              </div>

              <div className={`grid grid-cols-1 ${operationMode === "both" ? "md:grid-cols-2" : ""} gap-4`}>
                {(operationMode === "shamir" || operationMode === "sum" || operationMode === "both") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md transition-all duration-300 ${
                      isComplete ? "shadow-2xl shadow-green-500/50 scale-105" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{operationMode === "shamir" ? "🔐" : "➕"}</span>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        {operationMode === "shamir"
                          ? "Shamir Secret Reconstruction"
                          : "Summation (all secrets)"}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {reconSum ?? "-"}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                      Expected: {operationMode === "shamir" ? secrets[0] ?? "-" : getExpectedSumText()}
                    </p>
                    <button
                      onClick={() => {
                        setModalType("sum");
                        setShowLagrangeModal(true);
                      }}
                      className="w-full text-sm bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md"
                    >
                      📊 View Lagrange Details
                    </button>
                  </motion.div>
                )}

                {(operationMode === "multiply" || operationMode === "both") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-md transition-all duration-300 ${
                      isComplete ? "shadow-2xl shadow-purple-500/50 scale-105" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✖️</span>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        Multiplication (all secrets)
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {reconMul ?? "-"}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                      Expected: {getExpectedMulText()}
                    </p>
                    <button
                      onClick={() => {
                        setModalType("mul");
                        setShowLagrangeModal(true);
                      }}
                      className="w-full text-sm bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md"
                    >
                      📊 View Lagrange Details
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Export buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex-1 bg-linear-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm py-3 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md"
                >
                  📄 Export CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="flex-1 bg-linear-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm py-3 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md"
                >
                  📦 Export JSON
                </button>
              </div>
            </motion.div>
          )}

          {/* Show network matrix during resharing steps */}
          {(operationMode === "multiply" || operationMode === "both") &&
            (currentStep === "reshare-send" || currentStep === "reshare-aggregate") &&
            reshareMessages.length > 0 && (
              <div className="mb-6">
                <NetworkMatrix
                  messages={reshareMessages}
                  n={n}
                  isAnimating={currentStep === "reshare-send"}
                  speed={3}
                />
              </div>
            )}

          <div className="bg-linear-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              👥 Players & Shares
            </h2>
            <PlayersGrid players={playersData} currentStep={currentStep} />
          </div>
        </div>
      </div>

      {/* Lagrange Modal */}
      {playersData.length > 0 && (
        <LagrangeModal
          key={`${modalType}-${showLagrangeModal ? "open" : "closed"}-${t}-${playersData.length}`}
          isOpen={showLagrangeModal}
          onClose={() => setShowLagrangeModal(false)}
          shares={
            modalType === "sum"
              ? playersData.map((p) => ({
                  x: Number(p.x),
                  y: p.hSum,
                }))
              : playersData.map((p) => ({
                  x: Number(p.x),
                  y: p.T,
                }))
          }
          threshold={t}
          p={p}
          title={
            modalType === "sum"
              ? operationMode === "shamir"
                ? "Shamir Reconstruction Details"
                : "Summation Lagrange Details"
              : "Multiplication Lagrange Details"
          }
        />
      )}
    </div>
  );
}
