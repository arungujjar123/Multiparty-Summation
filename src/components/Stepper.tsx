/**
 * @fileoverview Stepper component for protocol visualization
 */
"use client";
import React, { forwardRef, useImperativeHandle, useEffect, useState } from "react";

type Props = {
  steps: string[];
  onRunStep?: (step: string) => void;
  intervalMs?: number;
};

export type StepperHandle = {
  runStep: (step: string) => void;
  getCurrentStep: () => string;
  reset: () => void;
};

const Stepper = forwardRef<StepperHandle, Props>(({ steps, onRunStep, intervalMs = 1200 }, ref) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useImperativeHandle(ref, () => ({
    runStep(step: string) {
      const i = steps.indexOf(step);
      if (i >= 0) {
        setIdx(i);
        onRunStep?.(step);
      }
    },
    getCurrentStep() {
      return steps[idx] || "";
    },
    reset() {
      setIdx(0);
      setPlaying(false);
    },
  }));

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (playing) {
      timer = setInterval(() => {
        setIdx((s) => {
          const next = s + 1 >= steps.length ? 0 : s + 1;
          onRunStep?.(steps[next]);
          if (next === 0) setPlaying(false);
          return next;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [playing, steps, intervalMs, onRunStep]);

  const prev = () => {
    const p = idx - 1 < 0 ? steps.length - 1 : idx - 1;
    setIdx(p);
    onRunStep?.(steps[p]);
  };

  const next = () => {
    const n = idx + 1 >= steps.length ? 0 : idx + 1;
    setIdx(n);
    onRunStep?.(steps[n]);
  };

  const togglePlay = () => setPlaying((p) => !p);

  const stepLabels: Record<string, string> = {
    "generate-polynomials": "1. Generate Polynomials",
    "compute-shares": "2. Compute Shares",
    "compute-local-sum": "3. Local Sum",
    "compute-local-prod": "4. Local Product",
    "reshare-send": "5. Reshare (Send)",
    "reshare-aggregate": "6. Aggregate T-shares",
    reconstruct: "7. Reconstruct",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mt-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Protocol Stepper</h2>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          {stepLabels[steps[idx]] || steps[idx]}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={prev}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          disabled={playing}
        >
          ← Prev
        </button>
        <button
          onClick={togglePlay}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={next}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          disabled={playing}
        >
          Next →
        </button>
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              i === idx
                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-semibold"
                : i < idx
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500"
            }`}
          >
            {stepLabels[step] || step}
          </div>
        ))}
      </div>
    </div>
  );
});

Stepper.displayName = "Stepper";

export default Stepper;
