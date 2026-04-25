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
  title?: string;
}

export default function LagrangeModal({
  isOpen,
  onClose,
  shares,
  p,
  title = "Lagrange Interpolation Details",
}: LagrangeModalProps) {
  // Derive details from props directly
  const details = React.useMemo(() => {
    if (isOpen && shares.length > 0) {
      const points = shares.map((s) => ({
        x: BigInt(s.x),
        y: toBig(s.y),
      }));
      const P = toBig(p);
      return lagrangeWithDetails(points, P);
    }
    return null;
  }, [isOpen, shares, p]);

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
                  data-formula="f(0) = \sum_{i=1}^{t} y_i \cdot \lambda_i"
                ></div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                  Where λᵢ are the Lagrange coefficients computed from the x-coordinates
                </p>
              </div>

              {/* Shares used */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Points Used (x, y)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {details.points.map((pt, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center font-mono"
                    >
                      ({pt.x.toString()}, {pt.y.toString()})
                    </div>
                  ))}
                </div>
              </div>

              {/* Lambda coefficients */}
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

              {/* Individual terms */}
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

              {/* Final sum */}
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
