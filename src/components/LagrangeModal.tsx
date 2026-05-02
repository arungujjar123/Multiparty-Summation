/**
 * @fileoverview Modal displaying Lagrange interpolation details with KaTeX math rendering
 */
"use client";
import React, { useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { lagrangeWithDetails } from "@/lib/math/lagrange";
import { toBig } from "@/lib/math/shamir";

interface LagrangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shares: Array<{ x: number; y: string }>;
  p: string;
  threshold?: number;
  title?: string;
}

export default function LagrangeModal({
  isOpen,
  onClose,
  shares,
  p,
  threshold,
  title = "Lagrange Interpolation Details",
}: LagrangeModalProps) {
  const requiredShares = Math.max(1, threshold ?? shares.length);
  const [selectedXValues, setSelectedXValues] = React.useState<number[]>(() =>
    shares.slice(0, requiredShares).map((share) => share.x)
  );

  const selectedShares = React.useMemo(() => {
    const selectedSet = new Set(selectedXValues);
    return shares.filter((share) => selectedSet.has(share.x));
  }, [shares, selectedXValues]);

  const togglePlayer = (playerX: number) => {
    setSelectedXValues((prev) => {
      if (prev.includes(playerX)) {
        return prev;
      }

      if (prev.length >= requiredShares) {
        return [...prev.slice(1), playerX];
      }

      return [...prev, playerX];
    });
  };

  const isSelectionComplete = selectedShares.length === requiredShares;

  // Derive details from selected shares
  const details = React.useMemo(() => {
    if (isOpen && isSelectionComplete) {
      const points = selectedShares.map((s) => ({
        x: BigInt(s.x),
        y: toBig(s.y),
      }));
      const P = toBig(p);
      return lagrangeWithDetails(points, P);
    }
    return null;
  }, [isOpen, selectedShares, isSelectionComplete, p]);

  useEffect(() => {
    if (isOpen && details) {
      // Render all KaTeX elements
      document.querySelectorAll(".katex-formula").forEach((elem) => {
        const formula = elem.getAttribute("data-formula");
        if (formula) {
          try {
            katex.render(formula, elem as HTMLElement, {
              throwOnError: false,
              displayMode: true,
            });
          } catch {
            // KaTeX render error silently handled
          }
        }
      });
    }
  }, [isOpen, details]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!details ? (
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          ) : (
            <>
              {/* Formula explanation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Lagrange Interpolation Formula
                </h3>
                <div
                  className="katex-formula text-center"
                  data-formula={`f(0) = \\sum_{i=1}^{${requiredShares}} y_i \\cdot \\lambda_i`}
                ></div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                  Where λᵢ are computed from the x-coordinates of your selected players
                </p>
              </div>

              {/* Player selection */}
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Select Players for Reconstruction
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose any {requiredShares} player(s). Click a new player to replace the oldest selected one.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {shares.map((share) => {
                    const isSelected = selectedXValues.includes(share.x);
                    return (
                      <button
                        key={share.x}
                        type="button"
                        onClick={() => togglePlayer(share.x)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500"
                        }`}
                      >
                        P{share.x}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  Selected: {selectedXValues.map((x) => `P${x}`).join(", ") || "None"}
                </p>
              </div>

              {/* Shares used */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Points Used (x, y)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedShares.map((pt, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center font-mono"
                    >
                      ({pt.x}, {pt.y})
                    </div>
                  ))}
                </div>
              </div>

              {!isSelectionComplete && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                  Select exactly {requiredShares} player(s) to view lambda coefficients and reconstruction details.
                </div>
              )}

              {/* Lambda coefficients */}
              {details && (
                <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Lagrange Coefficients (λᵢ)
                </h3>
                <div className="space-y-3">
                  {details.points.map((pt, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          λ_{i + 1} for x = {pt.x.toString()}:
                        </span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 text-lg">
                          {details.lambdas[i].toString()}
                        </span>
                      </div>

                      {/* Formula for this lambda */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div
                          className="katex-formula"
                          data-formula={`\\lambda_{${i + 1}} = \\prod_{j \\neq ${i + 1}} \\frac{0 - x_j}{x_{${i + 1}} - x_j} \\pmod{${p}}`}
                        ></div>
                      </div>

                      {/* Detailed calculation */}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 font-mono">
                        {details.points
                          .filter((_, j) => j !== i)
                          .map((otherPt, j) => (
                            <div key={j}>
                              × (0 - {otherPt.x.toString()}) / ({pt.x.toString()} -{" "}
                              {otherPt.x.toString()})
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              )}

              {/* Individual terms */}
              {details && (
                <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Terms (yᵢ × λᵢ)</h3>
                <div className="space-y-2">
                  {details.terms.map((term, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {details.points[i].y.toString()} × {details.lambdas[i].toString()} =
                      </span>
                      <span className="font-mono font-bold text-green-600 dark:text-green-400">
                        {term.toString()}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              )}

              {/* Final sum */}
              {details && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-2 border-indigo-300 dark:border-indigo-700">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                  Final Result
                </h3>
                <div
                  className="katex-formula text-center mb-2"
                  data-formula={`f(0) = ${details.terms.map((t) => t.toString()).join(" + ")} \\pmod{${p}}`}
                ></div>
                <div className="text-center">
                  <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {details.result.toString()}
                  </span>
                </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
