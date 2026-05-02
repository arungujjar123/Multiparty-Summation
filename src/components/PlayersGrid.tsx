/**
 * @fileoverview Grid displaying all player cards with their shares
 */
"use client";
import React from "react";

export interface PlayerData {
  x: bigint | number;
  secretShares: string[];
  f: string;
  g: string;
  hSum: string;
  hProd: string;
  T: string;
}

interface PlayersGridProps {
  players: PlayerData[];
  highlightedPlayers?: Set<number>;
  currentStep?: string;
}

export default function PlayersGrid({
  players,
  highlightedPlayers,
  currentStep,
}: PlayersGridProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No shares generated yet.</p>
        <p className="text-sm mt-2">Use the control panel to generate shares</p>
      </div>
    );
  }

  const getVisibleFields = (step?: string): Set<string> => {
    const visible = new Set<string>(["x", "f", "g"]);

    if (!step) return new Set(["x", "f", "g", "hSum", "hProd", "T"]);

    if (
      step === "compute-shares" ||
      step === "compute-local-sum" ||
      step === "compute-local-prod" ||
      step === "reshare-send" ||
      step === "reshare-aggregate" ||
      step === "reconstruct"
    ) {
      visible.add("hSum");
    }

    if (
      step === "compute-local-prod" ||
      step === "reshare-send" ||
      step === "reshare-aggregate" ||
      step === "reconstruct"
    ) {
      visible.add("hProd");
    }

    if (step === "reshare-aggregate" || step === "reconstruct") {
      visible.add("T");
    }

    return visible;
  };

  const visibleFields = getVisibleFields(currentStep);

  const getSecretLabel = (index: number) => {
    if (index < 26) {
      return String.fromCharCode(97 + index);
    }
    return `s${index + 1}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {players.map((player, idx) => {
        const isHighlighted = highlightedPlayers?.has(idx);
        const playerId = typeof player.x === "bigint" ? Number(player.x) : player.x;

        return (
          <div
            key={idx}
            className={`rounded-lg p-4 border-2 transition-all duration-300 ${
              isHighlighted
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            }`}
          >
            <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-100">
              Player {playerId}
            </h3>

            <div className="space-y-2 text-sm">
              {visibleFields.has("f") &&
                player.secretShares.map((share, secretIndex) => (
                  <div className="flex justify-between" key={secretIndex}>
                    <span className="text-gray-600 dark:text-gray-400">
                      {getSecretLabel(secretIndex)}({playerId}):
                    </span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">{share}</span>
                  </div>
                ))}

              {visibleFields.has("hSum") && (
                <div className="flex justify-between border-t pt-2 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">h_sum:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    {player.hSum}
                  </span>
                </div>
              )}

              {visibleFields.has("hProd") && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">h_prod:</span>
                  <span className="font-mono text-orange-600 dark:text-orange-400">
                    {player.hProd}
                  </span>
                </div>
              )}

              {visibleFields.has("T") && (
                <div className="flex justify-between border-t pt-2 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">T({playerId}):</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{player.T}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
