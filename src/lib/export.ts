/**
 * @fileoverview Export utilities for saving simulation data
 */

import type { PlayerData } from "@/components/PlayersGrid";
import type { OperationMode } from "@/components/ControlPanel";

export interface RunData {
  parameters: {
    p: string;
    n: number;
    t: number;
    operationMode: OperationMode;
    secretCount: number;
    secrets: string[];
    seed?: number;
    useManualCoefficients?: boolean;
    manualCoefficients?: string[][];
    useManualReshareCoefficients?: boolean;
    manualReshareCoefficients?: string[][];
  };
  players: PlayerData[];
  results: {
    reconSum: string;
    reconMul: string;
  };
  timestamp: string;
}

/**
 * Export run data as CSV
 */
export function exportToCSV(data: RunData): void {
  const secretRows = data.parameters.secrets.map((value, index) => [
    `Secret ${index < 26 ? String.fromCharCode(97 + index) : `s${index + 1}`}`,
    value,
  ]);
  const coefficientRows =
    data.parameters.useManualCoefficients && data.parameters.manualCoefficients
      ? data.parameters.manualCoefficients.map((coeffRow, secretIndex) => [
        `Coefficients ${secretIndex < 26 ? String.fromCharCode(97 + secretIndex) : `s${secretIndex + 1}`}`,
        coeffRow.join(" | "),
      ])
      : [];
  const reshareCoefficientRows =
    data.parameters.useManualReshareCoefficients && data.parameters.manualReshareCoefficients
      ? data.parameters.manualReshareCoefficients.map((coeffRow, playerIndex) => [
        `Reshare Coeff P${playerIndex + 1}`,
        coeffRow.join(" | "),
      ])
      : [];
  const shareHeaders = data.parameters.secrets.map((_, index) => {
    const symbol = index < 26 ? String.fromCharCode(97 + index) : `s${index + 1}`;
    return `${symbol}(x)`;
  });

  const rows = [
    ["Parameter", "Value"],
    ["Prime (p)", data.parameters.p],
    ["Players (n)", data.parameters.n.toString()],
    ["Threshold (t)", data.parameters.t.toString()],
    ["Operation Mode", data.parameters.operationMode],
    ["Total Secrets", data.parameters.secretCount.toString()],
    ...secretRows,
    ["Seed", data.parameters.seed?.toString() || "random"],
    ["Manual Coefficients", data.parameters.useManualCoefficients ? "enabled" : "disabled"],
    ...coefficientRows,
    [
      "Manual Reshare Coefficients",
      data.parameters.useManualReshareCoefficients ? "enabled" : "disabled",
    ],
    ...reshareCoefficientRows,
    [""],
    ["Results"],
    ["Reconstructed Sum", data.results.reconSum],
    ["Reconstructed Product (all secrets)", data.results.reconMul],
    [""],
    ["Player", "x", ...shareHeaders, "h_sum", "h_prod", "T(x)"],
    ...data.players.map((player) => [
      `Player ${player.x}`,
      player.x.toString(),
      ...player.secretShares,
      player.hSum,
      player.hProd,
      player.T,
    ]),
  ];

  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `shamir-run-${data.timestamp}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export run data as JSON
 */
export function exportToJSON(data: RunData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `shamir-run-${data.timestamp}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
