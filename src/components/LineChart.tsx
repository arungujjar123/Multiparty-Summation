/**
 * @fileoverview Minimal dependency-free SVG line chart
 */
"use client";
import React from "react";

export interface ChartSeries {
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

interface LineChartProps {
  title: string;
  series: ChartSeries[];
  xLabel?: string;
  yFormat?: (v: number) => string;
  height?: number;
}

const WIDTH = 560;
const PAD = { top: 16, right: 16, bottom: 32, left: 52 };

export default function LineChart({
  title,
  series,
  xLabel = "Round",
  yFormat = (v) => v.toFixed(2),
  height = 240,
}: LineChartProps) {
  const all = series.flatMap((s) => s.values).filter(Number.isFinite);
  const count = Math.max(0, ...series.map((s) => s.values.length));

  if (all.length === 0 || count === 0) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">No data yet. Run training.</div>
    );
  }

  let min = Math.min(...all);
  let max = Math.max(...all);
  if (max - min < 1e-9) {
    min -= 0.5;
    max += 0.5;
  }

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const xAt = (i: number) => PAD.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
  const yAt = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));

  return (
    <figure>
      <figcaption className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={title}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yAt(v)}
              y2={yAt(v)}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={yAt(v) + 4}
              textAnchor="end"
              className="fill-gray-500 dark:fill-gray-400"
              fontSize={11}
            >
              {yFormat(v)}
            </text>
          </g>
        ))}
        <text
          x={PAD.left + plotW / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-gray-500 dark:fill-gray-400"
          fontSize={11}
        >
          {xLabel} (1 – {count})
        </text>
        {series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeDasharray={s.dashed ? "6 5" : undefined}
            strokeLinejoin="round"
            points={s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ")}
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-2">
            <svg width="22" height="6" aria-hidden="true">
              <line
                x1="0"
                x2="22"
                y1="3"
                y2="3"
                stroke={s.color}
                strokeWidth={3}
                strokeDasharray={s.dashed ? "5 3" : undefined}
              />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
