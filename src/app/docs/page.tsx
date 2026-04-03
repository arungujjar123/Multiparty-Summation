/**
 * @fileoverview Documentation page for Shamir Secret Sharing
 */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AchievementTracker } from "@/lib/achievements";
import { marked } from "marked";

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content?: string;
}

export default function DocsPage() {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [activeSection, setActiveSection] = useState("introduction");
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  useEffect(() => {
    AchievementTracker.trackPageVisit("docs");
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      setIsLoadingSections(true);
      setLoadError("");
      try {
        const response = await fetch("/api/docs");
        const data = await response.json();

        if (!response.ok) {
          setLoadError(data.error || "Failed to load documentation");
          setIsLoadingSections(false);
          return;
        }

        const loadedSections = (data.sections || []) as DocSection[];
        setSections(loadedSections);
        if (loadedSections.length > 0) {
          setActiveSection((current) =>
            loadedSections.some((section) => section.id === current)
              ? current
              : loadedSections[0].id
          );
        }
      } catch (error) {
        setLoadError("Failed to load documentation");
      } finally {
        setIsLoadingSections(false);
      }
    };

    loadSections();
  }, []);

  const fallbackSections: DocSection[] = [
    { id: "introduction", title: "Introduction", icon: "📖" },
    { id: "shamir", title: "Shamir's Scheme", icon: "🔐" },
    { id: "summation", title: "Summation Protocol", icon: "➕" },
    { id: "multiplication", title: "Multiplication Protocol", icon: "✖️" },
    { id: "quantum", title: "Quantum Protocols", icon: "⚛️" },
    { id: "security", title: "Security Properties", icon: "🛡️" },
    { id: "implementation", title: "Implementation", icon: "💻" },
    { id: "references", title: "References", icon: "📚" },
  ];

  const visibleSections = sections.length > 0 ? sections : fallbackSections;
  const activeContent = visibleSections.find(
    (section) => section.id === activeSection
  );

  const renderSectionContent = () => {
    if (!activeContent) return null;

    if (activeContent.content && activeContent.content.trim().length > 0) {
      return <MarkdownContent content={activeContent.content} />;
    }

    switch (activeContent.id) {
      case "introduction":
        return <IntroductionSection />;
      case "shamir":
        return <ShamirSection />;
      case "summation":
        return <SummationSection />;
      case "multiplication":
        return <MultiplicationSection />;
      case "quantum":
        return <QuantumProtocolsSection />;
      case "security":
        return <SecuritySection />;
      case "implementation":
        return <ImplementationSection />;
      case "references":
        return <ReferencesSection />;
      default:
        return <EmptySection />;
    }
  };

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-400/10 dark:bg-pink-600/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative mb-4">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 transform hover:scale-105 transition-transform duration-300">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 animate-gradient bg-[length:200%_200%]">
                Documentation
              </span>
            </h1>
            <div className="absolute -inset-2 bg-linear-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-xl opacity-50 animate-pulse"></div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 animate-fade-in-up">
            Complete guide to Shamir Secret Sharing and Secure Multi-Party Computation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border-2 border-gray-200/50 dark:border-gray-700/50 hover:shadow-purple-500/20 transition-all duration-500">
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 uppercase mb-4 tracking-wider">
                📑 Contents
              </h3>
              <nav className="space-y-1">
                {visibleSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`group w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform flex items-center gap-3 ${
                      activeSection === section.id
                        ? "bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105 -translate-x-1"
                        : "text-gray-700 dark:text-gray-300 hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 hover:scale-102 hover:shadow-md hover:translate-x-1"
                    }`}
                  >
                    <span className={`text-lg transition-transform duration-300 ${
                      activeSection === section.id ? "animate-bounce" : "group-hover:scale-125 group-hover:rotate-12"
                    }`}>
                      {section.icon}
                    </span>
                    <span className={activeSection === section.id ? "font-bold" : ""}>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 transition-all duration-700 hover:shadow-2xl hover:shadow-purple-500/20 animate-fade-in">
              {loadError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {loadError}
                </div>
              )}
              {isLoadingSections ? (
                <div className="text-gray-600 dark:text-gray-400">Loading documentation...</div>
              ) : (
                renderSectionContent()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => marked.parse(content), [content]);

  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none animate-fade-in"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function EmptySection() {
  return (
    <div className="text-gray-600 dark:text-gray-400">
      No content has been added for this section yet.
    </div>
  );
}

function IntroductionSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
        📖 introduction
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Shamir's Secret Sharing is a cryptographic scheme introduced by <strong>Adi Shamir</strong> in 1979. 
        It allows a secret to be divided into multiple shares, distributed among participants, such that 
        only a threshold number of shares is needed to reconstruct the original secret.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg my-6 transition-all duration-500 hover:shadow-lg hover:border-l-8 hover:scale-[1.02] hover:bg-blue-100 dark:hover:bg-blue-900/30">
        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-2">Key Properties</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>Threshold Property:</strong> Any t shares can reconstruct the secret</li>
          <li><strong>Perfect Secrecy:</strong> t-1 or fewer shares reveal nothing about the secret</li>
          <li><strong>Linearity:</strong> Enables secure addition without interaction</li>
          <li><strong>Homomorphic:</strong> Operations on shares correspond to operations on secrets</li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Applications
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer group">
          <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2 transition-all duration-300 group-hover:scale-110">Secure Storage</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Distribute encryption keys across multiple servers to prevent single points of failure
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer group">
          <h4 className="font-bold text-green-900 dark:text-green-300 mb-2 transition-all duration-300 group-hover:scale-110">Multi-Party Computation</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Enable parties to jointly compute functions without revealing private inputs
          </p>
        </div>
        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
          <h4 className="font-bold text-pink-900 dark:text-pink-300 mb-2 transition-all duration-300 group-hover:scale-110">Threshold Cryptography</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Require cooperation of t parties to perform cryptographic operations
          </p>
        </div>
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 transition-all duration-300 group-hover:scale-110">Privacy-Preserving Analytics</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Aggregate sensitive data while maintaining individual privacy
          </p>
        </div>
      </div>
    </div>
  );
}

function ShamirSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
        🔐 Shamir's Secret Sharing Scheme
      </h2>

      <h3 className="text-2xl font-bold mt-6 mb-4 text-gray-800 dark:text-gray-100">Mathematical Foundation</h3>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Shamir's scheme is based on polynomial interpolation over finite fields. A polynomial of degree <code>t-1</code> 
        is uniquely determined by <code>t</code> points.
      </p>

      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg my-6 border border-gray-300 dark:border-gray-700 transition-all duration-500 hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 hover:scale-[1.01]">
        <h4 className="font-mono text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">Share Generation</h4>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
          <li><strong>1.</strong> Choose a prime p and secret s ∈ ℤ<sub>p</sub></li>
          <li><strong>2.</strong> Generate random polynomial: f(x) = s + a<sub>1</sub>x + a<sub>2</sub>x² + ... + a<sub>t-1</sub>x<sup>t-1</sup> (mod p)</li>
          <li><strong>3.</strong> Create shares: (i, f(i)) for i = 1, 2, ..., n</li>
          <li><strong>4.</strong> Distribute share (i, y<sub>i</sub>) to party i</li>
        </ol>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg my-6 border border-green-200 dark:border-green-800 transition-all duration-500 hover:shadow-xl hover:border-green-500 dark:hover:border-green-400 hover:scale-[1.01]">
        <h4 className="font-mono text-lg font-bold mb-3 text-green-900 dark:text-green-300">Secret Reconstruction</h4>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          Using <strong>Lagrange Interpolation</strong>, any t shares can recover the secret:
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-300 dark:border-green-700 font-mono text-sm">
          s = f(0) = Σ<sub>j</sub> y<sub>j</sub> · λ<sub>j</sub> (mod p)
          <br />
          <br />
          where λ<sub>j</sub> = Π<sub>k≠j</sub> (0 - x<sub>k</sub>) / (x<sub>j</sub> - x<sub>k</sub>) (mod p)
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">Example</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-500 hover:shadow-xl hover:border-purple-500 dark:hover:border-purple-400 hover:scale-[1.02] hover:-translate-y-1">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          <strong>Setup:</strong> Secret s = 4, threshold t = 3, prime p = 11
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          <strong>Polynomial:</strong> f(x) = 4 + 3x + 2x² (mod 11)
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>Shares:</strong> (1,9), (2,7), (3,10), (4,5), (5,6)
        </p>
        <p className="text-sm text-purple-700 dark:text-purple-300 mt-3">
          Any 3 shares can reconstruct secret = 4, but 2 or fewer reveal nothing!
        </p>
      </div>
    </div>
  );
}

function SummationSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-600">
        ➕ Secure Summation Protocol
      </h2>

      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Shamir's scheme has a beautiful property: <strong>linearity</strong>. This allows parties to compute 
        sums of secrets without any interaction, simply by adding their local shares.
      </p>

      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-lg my-6 transition-all duration-500 hover:shadow-xl hover:border-l-8 hover:scale-[1.02] hover:bg-green-100 dark:hover:bg-green-900/40">
        <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">Protocol Steps</h3>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Step 1:</strong> Share secrets a and b using Shamir's scheme
            <div className="ml-4 mt-1 text-sm">Party i receives: f<sub>i</sub> = f(i) and g<sub>i</sub> = g(i)</div>
          </li>
          <li>
            <strong>Step 2:</strong> Each party locally computes sum share
            <div className="ml-4 mt-1 text-sm font-mono">h<sub>i</sub> = f<sub>i</sub> + g<sub>i</sub> (mod p)</div>
          </li>
          <li>
            <strong>Step 3:</strong> Reconstruct using t shares via Lagrange interpolation
            <div className="ml-4 mt-1 text-sm">Result: a + b (mod p)</div>
          </li>
        </ol>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg my-6 transition-all duration-500 hover:shadow-xl hover:border-2 hover:border-blue-400 hover:scale-[1.01]">
        <h4 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">Why It Works</h4>
        <p className="text-gray-700 dark:text-gray-300">
          If f(x) shares secret a and g(x) shares secret b, then h(x) = f(x) + g(x) shares secret a + b 
          because:
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 mt-3 rounded border border-gray-300 dark:border-gray-700 font-mono text-sm">
          h(0) = f(0) + g(0) = a + b (mod p)
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          The degree remains t-1, so threshold reconstruction still requires t shares.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mt-6 border border-blue-200 dark:border-blue-800 transition-all duration-500 hover:shadow-xl hover:border-blue-500 hover:scale-105 hover:-translate-y-2">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">✨ Key Advantage</h4>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>Non-interactive:</strong> No communication needed! Each party independently computes their 
          share of the sum. This is highly efficient for multi-party computation.
        </p>
      </div>
    </div>
  );
}

function MultiplicationSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
        ✖️ Secure Multiplication Protocol
      </h2>

      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Unlike addition, multiplication is more complex. The naive approach increases polynomial degree 
        from <code>t-1</code> to <code>2(t-1)</code>, requiring <strong>degree reduction</strong> through resharing.
      </p>

      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-lg my-6 transition-all duration-500 hover:shadow-xl hover:border-l-8 hover:scale-[1.02] hover:bg-red-100 dark:hover:bg-red-900/30">
        <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">⚠️ The Challenge</h3>
        <p className="text-gray-700 dark:text-gray-300">
          If f(x) and g(x) are degree t-1, then h(x) = f(x) · g(x) is degree <strong>2(t-1)</strong>. 
          This requires 2t-1 shares to reconstruct, breaking our threshold property!
        </p>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        BGW Protocol (Ben-Or, Goldwasser, Wigderson)
      </h3>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg my-6 border border-purple-200 dark:border-purple-800 transition-all duration-500 hover:shadow-2xl hover:border-purple-500 hover:scale-[1.01]">
        <h4 className="font-bold text-lg mb-4 text-purple-900 dark:text-purple-300">Protocol Steps</h4>
        <ol className="space-y-4 text-gray-700 dark:text-gray-300">
          <li className="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
            <strong>1. Local Multiplication</strong>
            <div className="ml-4 mt-2 text-sm">
              Each party i computes: h<sub>i</sub> = f<sub>i</sub> · g<sub>i</sub> (mod p)
              <br />
              <span className="text-purple-600 dark:text-purple-400">→ Creates degree-2(t-1) sharing of a·b</span>
            </div>
          </li>

          <li className="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
            <strong>2. Resharing (Degree Reduction)</strong>
            <div className="ml-4 mt-2 text-sm space-y-2">
              <p>Each party i creates sub-shares of h<sub>i</sub> and sends them to all parties:</p>
              <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded font-mono text-xs">
                Party i → Party j: s<sub>i,j</sub> (share of h<sub>i</sub> for party j)
              </div>
              <span className="text-purple-600 dark:text-purple-400">→ n² messages total</span>
            </div>
          </li>

          <li className="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
            <strong>3. T-share Aggregation</strong>
            <div className="ml-4 mt-2 text-sm">
              Each party j computes: T<sub>j</sub> = Σ<sub>i</sub> s<sub>i,j</sub> (mod p)
              <br />
              <span className="text-purple-600 dark:text-purple-400">→ T<sub>j</sub> forms degree-(t-1) sharing of a·b</span>
            </div>
          </li>

          <li className="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
            <strong>4. Reconstruction</strong>
            <div className="ml-4 mt-2 text-sm">
              Use Lagrange interpolation on t T-shares to recover a·b
            </div>
          </li>
        </ol>
      </div>

      <div className="bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-6 rounded-lg my-6 border border-pink-200 dark:border-pink-800 transition-all duration-500 hover:shadow-2xl hover:border-pink-500 hover:scale-[1.02] hover:-translate-y-1">
        <h4 className="font-bold text-lg mb-3 text-pink-900 dark:text-pink-300">🔄 Resharing Visualization</h4>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          The resharing step uses Lagrange basis polynomials evaluated at each player's ID:
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-pink-300 dark:border-pink-700 font-mono text-sm">
          s<sub>i,j</sub> = h<sub>i</sub> · λ<sub>i</sub>(j)
          <br />
          <br />
          where λ<sub>i</sub>(x) = Π<sub>k≠i</sub> (x - x<sub>k</sub>) / (x<sub>i</sub> - x<sub>k</sub>)
        </div>
        <p className="text-sm text-pink-700 dark:text-pink-300 mt-3">
          💡 Our visualizer shows this message flow as an animated network matrix!
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg mt-6 border border-green-200 dark:border-green-800 transition-all duration-500 hover:shadow-xl hover:border-green-500 hover:scale-105 hover:-translate-y-1">
        <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">✅ Security Property</h4>
        <p className="text-gray-700 dark:text-gray-300">
          Throughout the protocol, no party learns anything beyond their own shares. The intermediate 
          degree-2(t-1) polynomial is never explicitly reconstructed—only converted to a new degree-(t-1) sharing.
        </p>
      </div>
    </div>
  );
}

function QuantumProtocolsSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
        ⚛️ Hybrid Quantum Protocols
      </h2>

      <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-6 rounded-r-lg mb-6 transition-all duration-500 hover:shadow-xl hover:border-l-8 hover:scale-[1.02] hover:bg-purple-100 dark:hover:bg-purple-900/30">
        <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-2">Research Paper</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          <strong>Sutradhar, K. & Om, H. (2020)</strong>
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          "Hybrid Quantum Protocols for Secure Multiparty Summation and Multiplication"
        </p>
        <p className="text-xs text-purple-700 dark:text-purple-400">
          <em>Scientific Reports</em>, 10, 9097. doi:10.1038/s41598-020-65871-8
        </p>
      </div>

      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Recent advances in quantum cryptography have led to the development of <strong>hybrid (t,n) threshold quantum protocols</strong> 
        that combine classical Shamir secret sharing with quantum computing techniques to achieve enhanced security and efficiency.
      </p>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Key Innovations
      </h3>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 transition-all duration-300 group-hover:scale-110">
            (t, n) Threshold Approach
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Unlike traditional (n,n) approaches, only <code>t</code> players are needed to compute summation 
            and multiplication, providing better fault tolerance and flexibility.
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2 transition-all duration-300 group-hover:scale-110">
            Secret-by-Secret Computation
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Computation type is secret-by-secret (not bit-by-bit), significantly reducing communication 
            and computation costs.
          </p>
        </div>

        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h4 className="font-bold text-pink-900 dark:text-pink-300 mb-2 transition-all duration-300 group-hover:scale-110">
            Quantum Fourier Transform
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Uses QFT, SUM gates, and generalized Pauli operators for quantum operations on d-level states.
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 transition-all duration-300 group-hover:scale-110">
            Enhanced Security
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Resists intercept-resend, entangle-measure, collusion, collective, and coherent quantum attacks.
          </p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Quantum Summation Protocol
      </h3>

      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700 mb-6 transition-all duration-500 hover:shadow-2xl hover:border-purple-500 hover:scale-[1.01]">
        <h4 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Protocol Overview</h4>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
          <li className="p-3 bg-white dark:bg-gray-800 rounded">
            <strong>Step 1:</strong> X and Y choose polynomials f(y) and g(y) using Shamir&apos;s scheme
            <div className="font-mono text-xs mt-1 text-purple-600 dark:text-purple-400">
              {`f(y) = a + c₁y + c₂y² + ... + c_{t-1}y^{t-1} mod d`}
            </div>
          </li>
          <li className="p-3 bg-white dark:bg-gray-800 rounded">
            <strong>Step 2:</strong> Players compute local sums: h(yᵢ) = f(yᵢ) + g(yᵢ) mod d
          </li>
          <li className="p-3 bg-white dark:bg-gray-800 rounded">
            <strong>Step 3:</strong> Compute shadows using Lagrange coefficients
            <div className="font-mono text-xs mt-1 text-purple-600 dark:text-purple-400">
              {`Aₖ = h(yₖ) · Πⱼ≠ₖ (0 - yⱼ)/(yₖ - yⱼ) mod d`}
            </div>
          </li>
          <li className="p-3 bg-white dark:bg-gray-800 rounded">
            <strong>Step 4-5:</strong> Initiator prepares entangled quantum states using QFT and SUM gates
          </li>
          <li className="p-3 bg-white dark:bg-gray-800 rounded">
            <strong>Step 6-7:</strong> Players apply quantum operations and measure their particles
          </li>
          <li className="p-3 bg-white dark:bg-gray-800 rounded">
            <strong>Step 8:</strong> Reconstruct sum: a + b = {`Σₖ(mₖ + Aₖ) mod d`}
          </li>
        </ol>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Quantum Multiplication Protocol
      </h3>

      <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 mb-6 transition-all duration-500 hover:shadow-2xl hover:border-purple-500 hover:scale-[1.02] hover:-translate-y-1">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          The quantum multiplication protocol extends summation by:
        </p>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-500">→</span>
            Computing h'(yᵢ) = f(yᵢ) × g(yᵢ) mod d locally
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">→</span>
            Sharing h'(yᵢ) using new random polynomials zᵢ(x)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">→</span>
            Computing total polynomial Tᵢ using Vandermonde matrix
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">→</span>
            Applying quantum operations similar to summation protocol
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">→</span>
            Reconstructing product: a × b = {`Σₖ(wₖ + Bₖ) mod d`}
          </li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Advantages Over Classical Protocols
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500 transition-all duration-300 hover:shadow-lg hover:border-l-8 hover:scale-[1.02] hover:translate-x-2">
          <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">✅ Better Communication Cost</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Only (t-1) message particles needed vs n particles in traditional protocols
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 transition-all duration-300 hover:shadow-lg hover:border-l-8 hover:scale-[1.02] hover:translate-x-2">
          <h4 className="font-bold text-blue-900 dark:blue-green-300 mb-2">✅ Reduced Computation Cost</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Secret-by-secret computation (not bit-by-bit) with modulo d where d ≤ 2^n
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500 transition-all duration-300 hover:shadow-lg hover:border-l-8 hover:scale-[1.02] hover:translate-x-2">
          <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">✅ Unconditional Security</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Based on quantum mechanics principles - resists all known quantum attacks
          </p>
        </div>

        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-l-4 border-pink-500 transition-all duration-300 hover:shadow-lg hover:border-l-8 hover:scale-[1.02] hover:translate-x-2">
          <h4 className="font-bold text-pink-900 dark:text-pink-300 mb-2">✅ Privacy Preservation</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            No player can obtain other players' private inputs throughout the protocol
          </p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Example: Quantum Summation
      </h3>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all duration-500 hover:shadow-2xl hover:border-indigo-500 hover:scale-[1.02] hover:-translate-y-1">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          <strong>Parameters:</strong> p = 11 (prime), t = 3 (threshold), n = 7 (total players)
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          <strong>Secrets:</strong> a = 4, b = 2
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          <strong>Polynomials:</strong>
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-indigo-300 dark:border-indigo-700 font-mono text-sm space-y-1">
          <div>f(y) = 4 + 2y + 3y² mod 11</div>
          <div>g(y) = 2 + 3y + y² mod 11</div>
        </div>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-4">
          After quantum operations and measurements, players reconstruct: <strong>a + b = 6 mod 11 ✓</strong>
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg mt-6 transition-all duration-500 hover:shadow-xl hover:border-l-8 hover:scale-[1.02] hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
        <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">💡 Practical Note</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          While our visualizer implements classical Shamir secret sharing (which is the foundation), the quantum 
          protocols extend these concepts with QFT, quantum entanglement, and measurement operations for enhanced 
          security in quantum computing environments.
        </p>
      </div>

      <div className="mt-8 p-6 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-purple-300 dark:border-purple-700 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2 cursor-pointer">
        <h4 className="font-bold text-lg mb-3 text-purple-900 dark:text-purple-200">
          🔬 Future of Secure Computation
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Hybrid quantum protocols represent the future of secure multi-party computation, combining the proven 
          reliability of classical cryptographic techniques with the unprecedented security guarantees offered by 
          quantum mechanics. As quantum computers become more accessible, these protocols will enable truly 
          secure distributed computation at scales previously impossible.
        </p>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
        🛡️ Security Properties
      </h2>

      <div className="grid md:grid-cols-2 gap-6 my-8">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2 transition-all duration-300 group-hover:scale-110">
            <span>🔒</span> Perfect Secrecy
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Any t-1 or fewer shares are <strong>information-theoretically secure</strong>—they reveal 
            absolutely nothing about the secret, even to a computationally unbounded adversary.
          </p>
        </div>

        <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2 transition-all duration-300 group-hover:scale-110">
            <span>✅</span> Threshold Property
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Any t shares can <strong>uniquely reconstruct</strong> the secret. The polynomial interpolation 
            guarantees exactly one solution.
          </p>
        </div>

        <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2 transition-all duration-300 group-hover:scale-110">
            <span>🎯</span> Privacy Preservation
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            During computation, parties never see the actual secrets—only their local shares. 
            The result is reconstructed without exposing intermediate values.
          </p>
        </div>

        <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2 cursor-pointer group">
          <h3 className="text-xl font-bold text-pink-900 dark:text-pink-300 mb-3 flex items-center gap-2 transition-all duration-300 group-hover:scale-110">
            <span>⚡</span> Verifiability
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            With additional mechanisms (commitments, zero-knowledge proofs), parties can verify that 
            others are following the protocol correctly.
          </p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Threat Model
      </h3>

      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
        <h4 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Adversary Capabilities</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Property</th>
              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Guarantee</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-400">
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="py-3 px-3"><strong>Passive Adversary</strong></td>
              <td className="py-3 px-3">Can corrupt t-1 parties, but cannot learn the secret</td>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="py-3 px-3"><strong>Active Adversary</strong></td>
              <td className="py-3 px-3">With verifiable schemes, can detect cheating</td>
            </tr>
            <tr>
              <td className="py-3 px-3"><strong>Computational Power</strong></td>
              <td className="py-3 px-3">Information-theoretic security (no assumptions needed)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg my-6">
        <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">⚠️ Implementation Considerations</h4>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>• Use cryptographically secure random number generation (crypto.getRandomValues)</li>
          <li>• Choose prime modulus large enough to prevent brute force attacks</li>
          <li>• Implement secure channels for share distribution</li>
          <li>• Consider adding authentication and integrity checks</li>
        </ul>
      </div>
    </div>
  );
}

function ImplementationSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
        💻 Implementation Details
      </h2>

      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Our visualizer implements Shamir secret sharing using modern JavaScript with TypeScript for type safety 
        and BigInt arithmetic for cryptographic correctness.
      </p>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">Tech Stack</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Frontend</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Next.js 16 (App Router)</li>
            <li>• TypeScript 5 (Strict Mode)</li>
            <li>• Tailwind CSS 4</li>
            <li>• Framer Motion (Animations)</li>
            <li>• KaTeX (Math Rendering)</li>
          </ul>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">Core Math</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• BigInt (Arbitrary Precision)</li>
            <li>• Miller-Rabin (Prime Testing)</li>
            <li>• Extended Euclidean Algorithm</li>
            <li>• Lagrange Interpolation</li>
            <li>• Crypto.getRandomValues (RNG)</li>
          </ul>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">Key Modules</h3>

      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
          <h4 className="font-mono text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">shamir.ts</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Core Shamir implementation with modular arithmetic utilities:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 font-mono">
            <li>• <code>mod(a, p)</code> - Modular arithmetic</li>
            <li>• <code>modInverse(a, p)</code> - Modular multiplicative inverse</li>
            <li>• <code>isPrime(n)</code> - Miller-Rabin primality test</li>
            <li>• <code>createShares(secret, n, t, p)</code> - Generate shares</li>
            <li>• <code>localSumShares(f, g, p)</code> - Local summation</li>
          </ul>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
          <h4 className="font-mono text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">lagrange.ts</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Lagrange interpolation for secret reconstruction:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 font-mono">
            <li>• <code>lagrangeAtZero(shares, p)</code> - Reconstruct secret at x=0</li>
            <li>• <code>computeLambdas(shares, p)</code> - Calculate basis coefficients</li>
            <li>• <code>lagrangeWithDetails(shares, p)</code> - Detailed breakdown for UI</li>
          </ul>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
          <h4 className="font-mono text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">resharing.ts</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            BGW multiplication protocol with degree reduction:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 font-mono">
            <li>• <code>multiplicationReshare(f, g, t, p)</code> - Full multiplication</li>
            <li>• <code>reconstructFromTshares(T, t, p)</code> - Reconstruct from T-shares</li>
            <li>• Returns resharing messages for visualization</li>
          </ul>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">Testing</h3>
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          Comprehensive test suite with <strong>26 unit tests</strong> covering:
        </p>
        <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
          <div>• Modular arithmetic correctness</div>
          <div>• Prime validation</div>
          <div>• Polynomial evaluation</div>
          <div>• Share generation & reconstruction</div>
          <div>• Summation protocol</div>
          <div>• Multiplication with resharing</div>
          <div>• Edge cases (t=1, t=n, secret=0)</div>
          <div>• Deterministic seeded testing</div>
        </div>
      </div>
    </div>
  );
}

function ReferencesSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
        📚 References & Further Reading
      </h2>

      <div className="space-y-6">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
            📄 Original Papers
          </h3>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Shamir, A. (1979). "How to share a secret"
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                <em>Communications of the ACM</em>, 22(11), 612-613.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                The foundational paper introducing (t,n) threshold secret sharing scheme.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Ben-Or, M., Goldwasser, S., & Wigderson, A. (1988)
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                "Completeness theorems for non-cryptographic fault-tolerant distributed computation"
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                <em>STOC '88</em> - BGW protocol for secure multiplication with resharing.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Cramer, R., Damgård, I., & Nielsen, J. B. (2015)
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                "Secure Multiparty Computation and Secret Sharing"
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Comprehensive textbook on MPC theory and practice.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
            🔬 Research Applications
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏥</span>
              <div>
                <p className="font-semibold">Privacy-Preserving Healthcare</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Aggregate patient data without exposing individual records
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-semibold">Financial Data Analysis</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Secure computation on sensitive financial information
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🗳️</span>
              <div>
                <p className="font-semibold">Electronic Voting Systems</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Threshold decryption of ballots with no single point of trust
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="font-semibold">Threshold Cryptography</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Distributed key generation and threshold signatures
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border-2 border-green-200 dark:border-green-700">
          <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
            🌐 Online Resources
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <a href="https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">
                Wikipedia: Shamir's Secret Sharing
              </a>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Comprehensive overview with examples</p>
            </li>
            <li className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <a href="https://www.cs.tau.ac.il/~bchor/Shamir.html" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">
                Interactive Shamir Demo
              </a>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Browser-based secret sharing calculator</p>
            </li>
            <li className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <span className="text-gray-800 dark:text-gray-200 font-semibold">
                MPC Study Group Resources
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Academic papers and implementation guides</p>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-linear-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-700 shadow-lg">
          <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-4 flex items-center gap-2">
            📄 Research Papers & PDFs
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Download or view original research papers and technical documentation to dive deeper into the theory and implementation.
          </p>
          
          <div className="space-y-3">
            {/* Quantum Protocols Paper */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                    Hybrid Quantum Protocols (2020)
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Sutradhar & Om - Scientific Reports
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Complete research on (t,n) threshold quantum protocols for secure multiparty summation and multiplication
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://www.nature.com/articles/s41598-020-65871-8.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-medium rounded-lg transition-all hover:scale-105 shadow-md whitespace-nowrap"
                  >
                    📥 Download
                  </a>
                  <a
                    href="https://www.nature.com/articles/s41598-020-65871-8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg border-2 border-red-300 dark:border-red-700 transition-all hover:scale-105 whitespace-nowrap"
                  >
                    🔗 View Online
                  </a>
                </div>
              </div>
            </div>

            {/* Original Shamir Paper */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                    How to Share a Secret (1979)
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Adi Shamir - Communications of the ACM
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    The original groundbreaking paper introducing Shamir's Secret Sharing scheme
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://web.mit.edu/6.857/OldStuff/Fall03/ref/Shamir-HowToShareASecret.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-medium rounded-lg transition-all hover:scale-105 shadow-md whitespace-nowrap"
                  >
                    📥 Download
                  </a>
                  <a
                    href="https://dl.acm.org/doi/10.1145/359168.359176"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg border-2 border-red-300 dark:border-red-700 transition-all hover:scale-105 whitespace-nowrap"
                  >
                    🔗 View Online
                  </a>
                </div>
              </div>
            </div>

            {/* BGW Protocol Paper */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                    BGW Protocol for MPC (1988)
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Ben-Or, Goldwasser, Wigderson - STOC
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Foundational work on secure multi-party multiplication protocols
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://dl.acm.org/doi/pdf/10.1145/62212.62213"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-medium rounded-lg transition-all hover:scale-105 shadow-md whitespace-nowrap"
                  >
                    📥 Download
                  </a>
                  <a
                    href="https://dl.acm.org/doi/10.1145/62212.62213"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg border-2 border-red-300 dark:border-red-700 transition-all hover:scale-105 whitespace-nowrap"
                  >
                    🔗 View Online
                  </a>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                💡 <strong>Tip:</strong> These PDFs provide the theoretical foundation for the concepts implemented in this visualizer. They're perfect for academic study and deeper understanding.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700">
          <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">
            🎓 About This Visualizer
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
            This educational tool was built to make Shamir secret sharing and secure multi-party computation 
            more accessible and understandable through interactive visualization. Based on research in secure 
            computation and privacy-preserving protocols.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs border border-blue-200 dark:border-blue-700">
              Open Source
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs border border-purple-200 dark:border-purple-700">
              Educational
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs border border-pink-200 dark:border-pink-700">
              Interactive
            </span>
          </div>
        </div>

        {/* Test Your Knowledge CTA */}
        <div className="mt-8 p-8 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border-2 border-purple-300 dark:border-purple-700 text-center transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <h3 className="text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">
            Test Your Knowledge!
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Ready to see how much you've learned? Take our interactive quiz covering all the concepts from this documentation.
          </p>
          <Link
            href="/quiz"
            className="inline-block px-10 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-xl shadow-xl transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            🚀 Start Quiz Now
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            15 questions • Multiple choice • Instant feedback
          </p>
        </div>
      </div>
    </div>
  );
}
