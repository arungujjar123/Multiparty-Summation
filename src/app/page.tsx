/**
 * @fileoverview Home/Landing page
 */
"use client";
import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Hero Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <span className="inline-block px-6 py-3 bg-linear-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold mb-4 shadow-lg hover:scale-105 transition-transform duration-300 border-2 border-blue-200 dark:border-blue-800">
              🔐 Secure Multi-Party Computation
            </span>
          </div>
          <div className="relative inline-block mb-6">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 animate-fade-in-up">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 animate-gradient bg-[length:200%_200%]">
                Shamir Secret Sharing
              </span>
            </h1>
            <div className="absolute -inset-4 bg-linear-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-2xl opacity-50 animate-pulse"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Interactive visualization of Shamir's secret sharing scheme for secure summation and multiplication protocols
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/visualizer"
              className="group px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden"
            >
              <span className="relative z-10">🚀 Launch Visualizer</span>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
            <Link
              href="/docs"
              className="group px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-lg font-bold rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:border-purple-500 dark:hover:border-purple-400"
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
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">➕</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Secure Summation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Compute sum of secrets without revealing individual values. Perfect for privacy-preserving addition.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">✖️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Secure Multiplication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Multiply secrets using BGW protocol with degree reduction and resharing visualization.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">
                Step-by-Step Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive controls to pause, step through, and understand each phase of the protocol.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">🔒</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                Cryptographically Secure
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Uses crypto.getRandomValues() for secure random number generation and BigInt arithmetic.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Math Inspector
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View detailed Lagrange interpolation calculations with KaTeX-rendered formulas.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">💾</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Export Results
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Download simulation data in CSV or JSON format for further analysis.
              </p>
            </div>

            {/* Feature 7 - CODE EXAMPLES */}
            <div className="group p-6 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <Link href="/code" className="block">
                <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">💻</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Code Examples
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Production-ready implementations in Python and JavaScript. Copy and use in your projects!
                </p>
              </Link>
            </div>

            {/* Feature 8 - QUIZ */}
            <div className="group p-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border-2 border-purple-300 dark:border-purple-700 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <Link href="/quiz" className="block">
                <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:animate-bounce">🎓</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Interactive Quiz
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Test your knowledge with 15 randomized questions. Get instant feedback and explanations!
                </p>
              </Link>
            </div>

            {/* Feature 9 - GLOSSARY */}
            <div className="group p-6 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-lg border-2 border-blue-300 dark:border-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <Link href="/glossary" className="block">
                <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">📖</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Technical Glossary
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive reference of 20+ cryptographic terms with examples and explanations.
                </p>
              </Link>
            </div>

            {/* Feature 10 - FAQ */}
            <div className="group p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border-2 border-green-300 dark:border-green-700 hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <Link href="/faq" className="block">
                <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">❓</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                  FAQ
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Find answers to 24+ common questions about Shamir's scheme and secure computation.
                </p>
              </Link>
            </div>

            {/* Feature 11 - ACHIEVEMENTS */}
            <div className="group p-6 bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl shadow-lg border-2 border-yellow-300 dark:border-yellow-700 hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <Link href="/achievements" className="block">
                <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:animate-bounce">🏆</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
                  Achievements
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track progress and unlock 17 badges by completing quizzes and exploring features!
                </p>
              </Link>
            </div>

            {/* Feature 12 - DASHBOARD */}
            <div className="group p-6 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <Link href="/dashboard" className="block">
                <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125">📊</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Learning Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track quiz performance, study patterns, streaks, and get personalized recommendations!
                </p>
              </Link>
            </div>

            {/* Feature 13 - THEMES */}
            <div className="group p-6 bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl shadow-lg border-2 border-pink-300 dark:border-pink-700 hover:shadow-2xl hover:shadow-pink-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer md:col-span-2">
              <Link href="/themes" className="block">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="text-7xl animate-pulse">🎨</div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100 transition-colors duration-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">
                      Theme Customizer
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Personalize your experience with 8 beautiful themes! Choose from Classic Blue, Sunset, Forest, Ocean, and more.
                    </p>
                    <div className="inline-block px-6 py-3 bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-110 transition-all duration-300">
                      🌈 Customize Themes
                    </div>
                  </div>
                </div>
              </Link>
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
              <div className="flex-shrink-0 w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 cursor-pointer">
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
              <div className="flex-shrink-0 w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50 cursor-pointer">
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
              <div className="flex-shrink-0 w-12 h-12 bg-linear-to-br from-pink-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50 cursor-pointer">
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
            className="group inline-block px-10 py-5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-xl shadow-xl transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden"
          >
            <span className="relative z-10">🚀 Get Started Now</span>
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </Link>
        </div>
      </section>
    </div>
  );
}
