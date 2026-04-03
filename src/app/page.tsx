/**
 * @fileoverview Home/Landing page
 */
"use client";
import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen hero-surface hero-grid relative overflow-hidden">
      <div className="hero-noise absolute inset-0 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute -top-36 right-10 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-float" aria-hidden="true"></div>
      <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl animate-pulse" aria-hidden="true"></div>
      <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} aria-hidden="true"></div>
      
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 text-xs uppercase tracking-[0.3em] animate-fade-in-up">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
              Secure MPC Lab
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-[var(--font-display)] font-bold leading-tight text-white animate-fade-in-up">
              Shamir Secret Sharing
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-sky-300 to-teal-300">
                Visualized for real-world protocols
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl">
              Explore threshold security, polynomial sharing, and secure summation with a live simulator built for clarity and speed.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/visualizer"
                className="group inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-lg font-bold rounded-xl shadow-lg shadow-cyan-500/30 transform hover:scale-[1.03] transition-all duration-300"
              >
                <span className="mr-2">🚀</span> Launch Visualizer
              </Link>
              <Link
                href="/docs"
                className="group inline-flex items-center justify-center px-8 py-4 border border-slate-600/70 bg-slate-900/60 text-slate-200 text-lg font-semibold rounded-xl hover:border-cyan-300/70 hover:text-white transition-all duration-300"
              >
                Read Documentation
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Threshold</p>
                <p className="text-2xl font-semibold text-white">t / n</p>
                <p className="text-sm text-slate-400">Dial security to your needs.</p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visualizer</p>
                <p className="text-2xl font-semibold text-white">Live MPC</p>
                <p className="text-sm text-slate-400">Step through every stage.</p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Learning</p>
                <p className="text-2xl font-semibold text-white">Instant</p>
                <p className="text-sm text-slate-400">Clear math with context.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="glass-panel rounded-3xl p-8 shadow-2xl shadow-cyan-500/20 border border-cyan-300/20">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
                <span>Live Session</span>
                <span className="text-emerald-300">Connected</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-950/60 border border-slate-700/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Secret A</span>
                    <span className="text-cyan-300">f(x)</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-2/3 bg-linear-to-r from-cyan-400 to-emerald-300"></div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/60 border border-slate-700/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Secret B</span>
                    <span className="text-sky-300">g(x)</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-1/2 bg-linear-to-r from-sky-300 to-cyan-300"></div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900/70 border border-cyan-500/40 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>Reconstruction</span>
                    <span className="text-emerald-300">Ready</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">42</p>
                  <p className="text-xs text-slate-400">t shares combined securely.</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass-panel rounded-2xl p-4 text-sm text-slate-200 shadow-xl shadow-emerald-500/20">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Protocol</p>
              <p className="mt-2 font-semibold">Summation + Resharing</p>
              <p className="text-slate-400 text-xs">Visual step timeline included.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Protocol Flow</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-[var(--font-display)] font-bold text-white">
                How it works, in three moves
              </h2>
            </div>
            <Link
              href="/docs"
              className="text-sm text-cyan-200 hover:text-cyan-100 transition-colors"
            >
              Read the full guide →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="glass-panel rounded-3xl p-6 border border-slate-700/50">
              <div className="text-sm text-slate-400">01</div>
              <h3 className="mt-3 text-xl font-semibold text-white">Set parameters</h3>
              <p className="mt-2 text-sm text-slate-400">
                Configure modulus, players, and threshold before you share any secret.
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-6 border border-slate-700/50">
              <div className="text-sm text-slate-400">02</div>
              <h3 className="mt-3 text-xl font-semibold text-white">Distribute shares</h3>
              <p className="mt-2 text-sm text-slate-400">
                Generate polynomial shares and deliver them to each participant securely.
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-6 border border-slate-700/50">
              <div className="text-sm text-slate-400">03</div>
              <h3 className="mt-3 text-xl font-semibold text-white">Compute & reconstruct</h3>
              <p className="mt-2 text-sm text-slate-400">
                Combine t shares to recover results while preserving privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="glass-panel rounded-3xl p-10 border border-cyan-400/30 text-center">
            <h2 className="text-3xl md:text-4xl font-[var(--font-display)] font-bold text-white">
              Ready to explore the protocol?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Launch the visualizer and see threshold security in action.
            </p>
            <Link
              href="/visualizer"
              className="group mt-8 inline-flex items-center justify-center px-10 py-5 bg-linear-to-r from-cyan-400 to-emerald-300 hover:from-cyan-300 hover:to-emerald-200 text-slate-950 text-lg font-bold rounded-xl shadow-xl shadow-cyan-500/30 transform hover:scale-[1.03] transition-all duration-300"
            >
              Start the demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
