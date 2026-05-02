/**
 * @fileoverview Main page for Shamir MPC Visualizer
 */
"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ControlPanel, { type OperationMode } from "@/components/ControlPanel";
import PlayersGrid, { type PlayerData } from "@/components/PlayersGrid";
import Stepper, { type StepperHandle } from "@/components/Stepper";
import NetworkMatrix from "@/components/NetworkMatrix";
import LagrangeModal from "@/components/LagrangeModal";
import { createSharesFromPoly, localSumShares, toBig, isPrime, mod } from "@/lib/math/shamir";
import { multiplicationReshare, type ReshareMessage } from "@/lib/math/resharing";
import { lagrangeAtZero } from "@/lib/math/lagrange";
import { exportToCSV, exportToJSON, type RunData } from "@/lib/export";
import { evalPoly } from "@/lib/math/polynomial";

export default function HomePage() {
  const [operationMode, setOperationMode] = useState<OperationMode>("both");
  const [p, setP] = useState("11");
  const [n, setN] = useState(7);
  const [t, setT] = useState(3);
  const [a, setA] = useState("4");
  const [b, setB] = useState("2");
  const [seed, setSeed] = useState<number | undefined>(undefined);

  // Manual polynomial coefficients
  const [fCoeffs, setFCoeffs] = useState<string[]>(["4", "1", "1"]);
  const [gCoeffs, setGCoeffs] = useState<string[]>(["2", "1", "1"]);
  // Per-player zi coefficients (higher-degree only, constant = h_i)
  const [ziCoeffs, setZiCoeffs] = useState<string[][]>(() =>
    Array.from({ length: 7 }, () => ["1", "2"])
  );
  // Player selection for reconstruction
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set([1, 2, 3]));

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

  const generateInitial = () => {
    try {
      setError(null);
      const P = toBig(p);

      if (!isPrime(P)) throw new Error(`p=${p} is not prime`);
      if (t > n) throw new Error(`Threshold t=${t} cannot exceed n=${n}`);
      if (operationMode !== "sum" && n < 2 * t - 1)
        throw new Error(`Need at least ${2 * t - 1} players for multiplication (have ${n})`);

      // Build f(x) polynomial from manual coefficients
      const fPoly = fCoeffs.slice(0, t).map((c) => {
        try { return toBig(c || "0"); } catch { return 0n; }
      });
      while (fPoly.length < t) fPoly.push(0n);

      // Build g(x) polynomial from manual coefficients
      const gPoly = gCoeffs.slice(0, t).map((c) => {
        try { return toBig(c || "0"); } catch { return 0n; }
      });
      while (gPoly.length < t) gPoly.push(0n);

      // Validate secrets in range
      const A = mod(fPoly[0], P);
      fPoly[0] = A;
      if (operationMode !== "sum") {
        const B = mod(gPoly[0], P);
        gPoly[0] = B;
      }

      const f = createSharesFromPoly(fPoly, n, P);
      const g = operationMode !== "sum"
        ? createSharesFromPoly(gPoly, n, P)
        : createSharesFromPoly(gPoly, n, P);

      const fShares = f.shares.map((s) => s.y);
      const gShares = g.shares.map((s) => s.y);

      const hSum = operationMode !== "multiply"
        ? localSumShares(fShares, gShares, P)
        : fShares.map(() => 0n);

      // Build custom zi coefficients for resharing
      const customZi: bigint[][] | undefined =
        operationMode !== "sum"
          ? Array.from({ length: n }, (_, i) => {
              const playerZi = ziCoeffs[i] || [];
              // [h_i (placeholder, will be set in resharing), a1, a2, ...]
              const coeffs: bigint[] = [0n]; // constant overridden in resharing
              for (let k = 0; k < t - 1; k++) {
                try { coeffs.push(toBig(playerZi[k] || "0")); } catch { coeffs.push(0n); }
              }
              return coeffs;
            })
          : undefined;

      const resharingResult =
        operationMode !== "sum"
          ? multiplicationReshare(fShares, gShares, t, P, seed ? seed + 2000 : undefined, customZi)
          : { h: fShares.map(() => 0n), product: 0n, zPolys: [] as bigint[][], Tshares: fShares.map(() => 0n), messages: [] };

      // Build player data with zi polynomial info
      const players: PlayerData[] = f.shares.map((fs, idx) => {
        const ziPoly = resharingResult.zPolys[idx]
          ? resharingResult.zPolys[idx].map((c) => c.toString())
          : undefined;
        const ziShares = resharingResult.zPolys[idx]
          ? Array.from({ length: n }, (_, j) =>
              evalPoly(resharingResult.zPolys[idx], BigInt(j + 1), P).toString()
            )
          : undefined;

        return {
          x: fs.x,
          f: fs.y.toString(),
          g: g.shares[idx].y.toString(),
          hSum: hSum[idx].toString(),
          hProd: resharingResult.h[idx].toString(),
          T: resharingResult.Tshares[idx].toString(),
          ziPoly,
          ziShares,
        };
      });

      setPlayersData(players);
      setReshareMessages(resharingResult.messages);

      // Reconstruct using selected players
      const selectedArr = Array.from(selectedPlayers).sort((a, b) => a - b);

      if (selectedArr.length >= t) {
        // Sum reconstruction
        if (operationMode !== "multiply") {
          const sumPoints = selectedArr.slice(0, Math.max(t, selectedArr.length)).map((pNum) => ({
            x: BigInt(pNum),
            y: toBig(players[pNum - 1].hSum),
          }));
          setReconSum(lagrangeAtZero(sumPoints, P).toString());
        } else {
          setReconSum(null);
        }

        // Multiplication reconstruction
        if (operationMode !== "sum") {
          const tPoints = selectedArr.slice(0, Math.max(t, selectedArr.length)).map((pNum) => ({
            x: BigInt(pNum),
            y: toBig(players[pNum - 1].T),
          }));
          setReconMul(lagrangeAtZero(tPoints, P).toString());
        } else {
          setReconMul(null);
        }
      } else {
        setReconSum(null);
        setReconMul(null);
        if (selectedArr.length > 0) {
          setError(`Need at least ${t} players for reconstruction, but only ${selectedArr.length} selected`);
        }
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
    if (playersData.length === 0) return;
    const runData: RunData = {
      parameters: { p, n, t, a, b, seed },
      players: playersData,
      results: { reconSum: reconSum || "N/A", reconMul: reconMul || "N/A" },
      timestamp: new Date().toISOString(),
    };
    if (format === "csv") exportToCSV(runData);
    else exportToJSON(runData);
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
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">✨ Educational</span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">🎯 Step-by-Step</span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">🔒 Secure</span>
          </div>
        </div>
      </header>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50, scale: 0.9 }} transition={{ duration: 0.5, type: "spring" }} className="max-w-7xl mx-auto mb-6">
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
          <p className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2"><span className="text-xl">⚠️</span> Error</p>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ControlPanel
            p={p} setP={setP} n={n} setN={setN} t={t} setT={setT}
            a={a} setA={setA} b={b} setB={setB}
            seed={seed} setSeed={setSeed}
            operationMode={operationMode} setOperationMode={setOperationMode}
            onGenerate={generateInitial}
            fCoeffs={fCoeffs} setFCoeffs={setFCoeffs}
            gCoeffs={gCoeffs} setGCoeffs={setGCoeffs}
            ziCoeffs={ziCoeffs} setZiCoeffs={setZiCoeffs}
            selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
            hasData={playersData.length > 0}
          />

          <Stepper
            ref={stepRef}
            steps={
              operationMode === "sum"
                ? ["generate-polynomials", "compute-shares", "compute-local-sum", "reconstruct"]
                : operationMode === "multiply"
                  ? ["generate-polynomials", "compute-shares", "compute-local-prod", "reshare-send", "reshare-aggregate", "reconstruct"]
                  : ["generate-polynomials", "compute-shares", "compute-local-sum", "compute-local-prod", "reshare-send", "reshare-aggregate", "reconstruct"]
            }
            onRunStep={handleStepChange}
            intervalMs={1500}
          />
        </div>

        <div className="lg:col-span-2">
          {playersData.length > 0 && (
            <>
              {/* Polynomial Display */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className="bg-linear-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  📐 Polynomials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">f(x) = {fCoeffs.map((c, i) => i === 0 ? c : i === 1 ? `${c}x` : `${c}x^${i}`).join(" + ")}</p>
                  </div>
                  {(operationMode !== "sum") && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-200 dark:border-pink-700">
                      <p className="text-sm font-semibold text-pink-800 dark:text-pink-200">g(x) = {gCoeffs.map((c, i) => i === 0 ? c : i === 1 ? `${c}x` : `${c}x^${i}`).join(" + ")}</p>
                    </div>
                  )}
                </div>
                {(operationMode !== "sum") && playersData[0]?.ziPoly && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Resharing Polynomials zᵢ(x):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {playersData.map((pd, idx) => pd.ziPoly && (
                        <div key={idx} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-indigo-100 dark:border-indigo-800">
                          <span className="font-semibold text-indigo-700 dark:text-indigo-300">z{idx + 1}(x) = </span>
                          {pd.ziPoly.map((c, i) => i === 0 ? c : i === 1 ? `${c}x` : `${c}x^${i}`).join(" + ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Reconstruction Results */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-linear-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Reconstruction Results
                  </h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Using: {Array.from(selectedPlayers).sort((a,b)=>a-b).map(p=>`P${p}`).join(", ")}
                  </div>
                  {isComplete && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                      className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
                      <span className="text-2xl">✅</span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">Complete</span>
                    </motion.div>
                  )}
                </div>

                <div className={`grid grid-cols-1 ${operationMode === "both" ? "md:grid-cols-2" : ""} gap-4`}>
                  {operationMode !== "multiply" && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                      className={`p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md transition-all duration-300 ${isComplete ? "shadow-2xl shadow-green-500/50 scale-105" : ""}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">➕</span>
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">Summation (a + b)</p>
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{reconSum ?? "—"}</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                        Expected: {(() => { try { return ((toBig(fCoeffs[0]||"0") + toBig(gCoeffs[0]||"0")) % toBig(p)).toString(); } catch { return "?"; } })()}
                      </p>
                      <button onClick={() => { setModalType("sum"); setShowLagrangeModal(true); }}
                        className="w-full text-sm bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md">
                        📊 View Lagrange Details
                      </button>
                    </motion.div>
                  )}

                  {operationMode !== "sum" && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                      className={`p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-md transition-all duration-300 ${isComplete ? "shadow-2xl shadow-purple-500/50 scale-105" : ""}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">✖️</span>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">Multiplication (a × b)</p>
                      </div>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{reconMul ?? "—"}</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                        Expected: {(() => { try { return ((toBig(fCoeffs[0]||"0") * toBig(gCoeffs[0]||"0")) % toBig(p)).toString(); } catch { return "?"; } })()}
                      </p>
                      <button onClick={() => { setModalType("mul"); setShowLagrangeModal(true); }}
                        className="w-full text-sm bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md">
                        📊 View Lagrange Details
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button onClick={() => handleExport("csv")} className="flex-1 bg-linear-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm py-3 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md">📄 Export CSV</button>
                  <button onClick={() => handleExport("json")} className="flex-1 bg-linear-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm py-3 px-4 rounded-lg transition-all transform hover:scale-105 font-medium shadow-md">📦 Export JSON</button>
                </div>
              </motion.div>
            </>
          )}

          {/* Network matrix during resharing */}
          {operationMode !== "sum" && (currentStep === "reshare-send" || currentStep === "reshare-aggregate") && reshareMessages.length > 0 && (
            <div className="mb-6">
              <NetworkMatrix messages={reshareMessages} n={n} isAnimating={currentStep === "reshare-send"} speed={3} />
            </div>
          )}

          <div className="bg-linear-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              👥 Players & Shares
            </h2>
            <PlayersGrid players={playersData} currentStep={currentStep} selectedPlayers={selectedPlayers} />
          </div>
        </div>
      </div>

      {/* Lagrange Modal */}
      {playersData.length > 0 && (
        <LagrangeModal
          isOpen={showLagrangeModal}
          onClose={() => setShowLagrangeModal(false)}
          shares={
            (() => {
              const selectedArr = Array.from(selectedPlayers).sort((a, b) => a - b);
              const usePlayers = selectedArr.length >= t ? selectedArr : Array.from({ length: t }, (_, i) => i + 1);
              return usePlayers.map((pNum) => ({
                x: Number(playersData[pNum - 1].x),
                y: modalType === "sum" ? playersData[pNum - 1].hSum : playersData[pNum - 1].T,
              }));
            })()
          }
          p={p}
          title={modalType === "sum" ? "Summation Lagrange Details" : "Multiplication Lagrange Details"}
        />
      )}
    </div>
  );
}
