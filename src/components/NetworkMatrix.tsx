/**
 * @fileoverview Network matrix visualization for resharing messages
 * Shows animated arrows from player i to player j during resharing
 */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReshareMessage {
  from: number;
  to: number;
  value: bigint;
}

interface NetworkMatrixProps {
  messages: ReshareMessage[];
  n: number; // number of players
  isAnimating?: boolean;
  speed?: number; // messages per second
}

export default function NetworkMatrix({
  messages,
  n,
  isAnimating = false,
  speed = 2,
}: NetworkMatrixProps) {
  const [visibleMessages, setVisibleMessages] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset animation when isAnimating becomes false
  useEffect(() => {
    if (!isAnimating) {
      setVisibleMessages(new Set());
      setCurrentIndex(0);
    }
  }, [isAnimating]);

  // Animate messages
  useEffect(() => {
    if (!isAnimating || currentIndex >= messages.length) return;

    const timer = setTimeout(() => {
      setVisibleMessages((v) => new Set([...v, currentIndex]));
      setCurrentIndex((prev) => prev + 1);
    }, 1000 / speed);

    return () => clearTimeout(timer);
  }, [isAnimating, currentIndex, messages.length, speed]);

  if (messages.length === 0) {
    return <div className="text-center py-8 text-gray-500">No resharing messages to display</div>;
  }

  // Group messages by (from, to) pair
  const messageGrid: Map<string, ReshareMessage> = new Map();
  messages.forEach((msg) => {
    const key = `${msg.from}-${msg.to}`;
    messageGrid.set(key, msg);
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Resharing Network</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Player i sends z_i(j) to player j. Each cell shows the value sent.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700">
                From \ To
              </th>
              {Array.from({ length: n }, (_, j) => (
                <th
                  key={j}
                  className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700 text-center"
                >
                  P{j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i}>
                <td className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700 font-semibold text-center">
                  P{i + 1}
                </td>
                {Array.from({ length: n }, (_, j) => {
                  const key = `${i + 1}-${j + 1}`;
                  const msg = messageGrid.get(key);
                  const msgIndex = messages.findIndex((m) => m.from === i + 1 && m.to === j + 1);
                  const isVisible = visibleMessages.has(msgIndex);

                  return (
                    <td
                      key={j}
                      className={`border border-gray-300 dark:border-gray-600 p-2 text-center transition-colors ${
                        i === j
                          ? "bg-gray-200 dark:bg-gray-700"
                          : isVisible
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : ""
                      }`}
                    >
                      <AnimatePresence>
                        {msg && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                              opacity: isVisible ? 1 : 0.3,
                              scale: isVisible ? 1 : 0.9,
                            }}
                            className={`font-mono text-sm ${
                              isVisible
                                ? "text-blue-700 dark:text-blue-300 font-bold"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            {msg.value.toString()}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Messages shown: {visibleMessages.size} / {messages.length}
        </p>
        {isAnimating && currentIndex < messages.length && (
          <div className="flex items-center gap-2">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-600 dark:text-blue-400">Animating...</span>
          </div>
        )}
      </div>
    </div>
  );
}
