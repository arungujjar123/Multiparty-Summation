/**
 * @fileoverview Home/Landing page
 */
"use client";
import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-4">
              🔐 Secure Multi-Party Computation
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              Shamir Secret Sharing
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Interactive visualization of Shamir's secret sharing scheme for secure summation and multiplication protocols
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/visualizer"
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
            >
              🚀 Launch Visualizer
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-lg font-bold rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all"
            >
              📚 Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">➕</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                Secure Summation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Compute sum of secrets without revealing individual values. Perfect for privacy-preserving addition.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">✖️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                Secure Multiplication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Multiply secrets using BGW protocol with degree reduction and resharing visualization.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                Step-by-Step Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive controls to pause, step through, and understand each phase of the protocol.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                Cryptographically Secure
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Uses crypto.getRandomValues() for secure random number generation and BigInt arithmetic.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                Math Inspector
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View detailed Lagrange interpolation calculations with KaTeX-rendered formulas.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">💾</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                Export Results
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Download simulation data in CSV or JSON format for further analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                  Set Parameters
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a prime modulus (p), number of players (n), threshold (t), and secrets to share.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                  Generate Shares
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create polynomial shares using Shamir's scheme. Each player receives unique share points.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-linear-to-br from-pink-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                  Compute & Visualize
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Watch the protocol execute step-by-step. See local computations, resharing animations, and final reconstruction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Ready to Explore?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Start visualizing secure multi-party computation protocols today
          </p>
          <Link
            href="/visualizer"
            className="inline-block px-10 py-5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all"
          >
            🚀 Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
