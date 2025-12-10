/**
 * @fileoverview Main page for Shamir MPC Visualizer
 */
"use client";
import React, { useState, useRef } from "react";
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
  const [a, setA] = useState("4");
  const [b, setB] = useState("2");
  const [seed, setSeed] = useState<number | undefined>(undefined);

  const [playersData, setPlayersData] = useState<PlayerData[]>([]);
  const [reshareMessages, setReshareMessages] = useState<ReshareMessage[]>([]);
  const [reconSum, setReconSum] = useState<string | null>(null);
  const [reconMul, setReconMul] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showLagrangeModal, setShowLagrangeModal] = useState(false);
  const [modalType, setModalType] = useState<"sum" | "mul">("sum");

  const stepRef = useRef<StepperHandle | null>(null);

  const generateInitial = () => {
    try {
      setError(null);

      const P = toBig(p);
      const A = toBig(a);
      const B = toBig(b);

      if (!isPrime(P)) {
        throw new Error(`p=${p} is not prime`);
      }
      if (t > n) {
        throw new Error(`Threshold t=${t} cannot exceed number of players n=${n}`);
      }
      if (operationMode !== "sum" && n < 2 * t - 1) {
        throw new Error(`Need at least ${2 * t - 1} players for multiplication (have ${n})`);
      }
      if (A < 0n || A >= P) {
        throw new Error(`Secret a must be in range [0, ${P - 1n}]`);
      }
      if (operationMode !== "sum") {
        if (B < 0n || B >= P) {
          throw new Error(`Secret b must be in range [0, ${P - 1n}]`);
        }
      }

      const f = createShares(A, n, t, P, seed);
      const g = operationMode !== "sum" 
        ? createShares(B, n, t, P, seed ? seed + 1000 : undefined)
        : createShares(0n, n, t, P, seed ? seed + 1000 : undefined); // Dummy for sum-only
      const fShares = f.shares.map((s) => s.y);
      const gShares = g.shares.map((s) => s.y);

      const hSum = operationMode !== "multiply" ? localSumShares(fShares, gShares, P) : fShares.map(() => 0n);

      const resharingResult = operationMode !== "sum"
        ? multiplicationReshare(
            fShares,
            gShares,
            t,
            P,
            seed ? seed + 2000 : undefined
          )
        : { h: fShares.map(() => 0n), Tshares: fShares.map(() => 0n), messages: [] };

      const players: PlayerData[] = f.shares.map((fs, idx) => ({
        x: fs.x,
        f: fs.y.toString(),
        g: g.shares[idx].y.toString(),
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

      const tPoints = resharingResult.Tshares.slice(0, t).map((y: bigint, i: number) => ({
        x: BigInt(i + 1),
        y,
      }));
      const mulRecon = lagrangeAtZero(tPoints, P);
      setReconMul(mulRecon.toString());

      stepRef.current?.reset();
      setCurrentStep("generate-polynomials");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Generation failed");
      setPlayersData([]);
      setReshareMessages([]);
      setReconSum(null);
      setReconMul(null);
    }
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  const handleExport = (format: "csv" | "json") => {
    if (playersData.length === 0 || !reconSum || !reconMul) return;

    const runData: RunData = {
      parameters: { p, n, t, a, b, seed },
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
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
            a={a}
            setA={setA}
            b={b}
            setB={setB}
            seed={seed}
            setSeed={setSeed}
            operationMode={operationMode}
            setOperationMode={setOperationMode}
            onGenerate={generateInitial}
          />

          <Stepper
            ref={stepRef}
            steps={
              operationMode === "sum"
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
            <div className="bg-linear-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Reconstruction Results
              </h2>

              <div className={`grid grid-cols-1 ${operationMode === "both" ? "md:grid-cols-2" : ""} gap-4`}>
                {operationMode !== "multiply" && (
                  <div className="p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">➕</span>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        Summation (a + b)
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {reconSum ?? "-"}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                      Expected: {((toBig(a) + toBig(b)) % toBig(p)).toString()}
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
                  </div>
                )}

                {operationMode !== "sum" && (
                  <div className="p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✖️</span>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        Multiplication (a × b)
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {reconMul ?? "-"}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                      Expected: {((toBig(a) * toBig(b)) % toBig(p)).toString()}
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
                  </div>
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
            </div>
          )}

          {/* Show network matrix during resharing steps */}
          {operationMode !== "sum" && 
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
          isOpen={showLagrangeModal}
          onClose={() => setShowLagrangeModal(false)}
          shares={
            modalType === "sum"
              ? playersData.slice(0, t).map((p) => ({
                  x: Number(p.x),
                  y: p.hSum,
                }))
              : playersData.slice(0, t).map((p) => ({
                  x: Number(p.x),
                  y: p.T,
                }))
          }
          p={p}
          title={
            modalType === "sum" ? "Summation Lagrange Details" : "Multiplication Lagrange Details"
          }
        />
      )}
    </div>
  );
}
