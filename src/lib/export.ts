/**
 * @fileoverview Export utilities for saving simulation data
 */

import type { PlayerData } from "@/components/PlayersGrid";

export interface RunData {
  parameters: {
    p: string;
    n: number;
    t: number;
    a: string;
    b: string;
    seed?: number;
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
  const rows = [
    ["Parameter", "Value"],
    ["Prime (p)", data.parameters.p],
    ["Players (n)", data.parameters.n.toString()],
    ["Threshold (t)", data.parameters.t.toString()],
    ["Secret a", data.parameters.a],
    ["Secret b", data.parameters.b],
    ["Seed", data.parameters.seed?.toString() || "random"],
    [""],
    ["Results"],
    ["Reconstructed Sum (a+b)", data.results.reconSum],
    ["Reconstructed Product (a*b)", data.results.reconMul],
    [""],
    ["Player", "x", "f(x)", "g(x)", "h_sum", "h_prod", "T(x)"],
    ...data.players.map((p) => [`Player ${p.x}`, p.x.toString(), p.f, p.g, p.hSum, p.hProd, p.T]),
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
