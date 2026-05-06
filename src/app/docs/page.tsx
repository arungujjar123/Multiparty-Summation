/**
 * @fileoverview Documentation page for Shamir Secret Sharing
 */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { AchievementTracker } from "@/lib/achievements";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content?: string;
  pdfs?: DocPdf[];
  attachments?: string[];
  order: number;
}

interface DocPdf {
  url: string;
  name: string;
  uploadedAt: string;
  publicId: string;
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
      } catch {
        setLoadError("Failed to load documentation");
      } finally {
        setIsLoadingSections(false);
      }
    };

    loadSections();
  }, []);

  const fallbackSections: DocSection[] = [
    { id: "introduction", title: "Introduction", icon: "📖", order: 1 },
    { id: "shamir", title: "Shamir's Scheme", icon: "🔐", order: 2 },
    { id: "summation", title: "Summation Protocol", icon: "➕", order: 3 },
    { id: "multiplication", title: "Multiplication Protocol", icon: "✖️", order: 4 },
    { id: "quantum", title: "Quantum Protocols", icon: "⚛️", order: 5 },
    { id: "security", title: "Security Properties", icon: "🛡️", order: 6 },
    { id: "implementation", title: "Implementation", icon: "💻", order: 7 },
    { id: "references", title: "References", icon: "📚", order: 8 },
  ];

  const visibleSections = sections.length > 0 ? sections : fallbackSections;
  const activeContent = visibleSections.find((section) => section.id === activeSection);

  const renderSectionContent = () => {
    if (!activeContent) return null;

    const getCoreComponent = () => {
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
          return null;
      }
    };

    const renderAttachments = (urls: string[], pdfs: DocPdf[] = []) => {
      const allUrls = [...new Set([...urls, ...pdfs.map((p) => p.url)])];
      if (allUrls.length === 0) return null;

      return (
        <div className="mt-8 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 py-4 border-b border-purple-100 dark:border-purple-900/40">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 m-0">
              📂 Document Gallery
            </h3>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">
              {allUrls.length} Files
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allUrls.map((url, idx) => {
              const pdfInfo = pdfs.find((p) => p.url === url);
              const displayName =
                pdfInfo?.name || url.split("/").pop()?.split("?")[0] || "PDF Document";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/40 rounded-xl shadow-md hover:shadow-lg transition-all hover:border-purple-300 dark:hover:border-purple-700"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-2xl shrink-0">📄</span>
                    <div className="overflow-hidden">
                      <h4 className="font-bold m-0 text-sm text-gray-800 dark:text-gray-200 truncate pr-2">
                        {displayName}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-all group"
                      title="View PDF"
                    >
                      👁️
                    </a>
                    <a
                      href={url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-all group"
                      title="Download PDF"
                    >
                      📥
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const coreComponent = getCoreComponent();
    const hasDbContent =
      typeof activeContent.content === "string" && activeContent.content.trim().length > 0;
    const dbAttachments = activeContent.attachments || [];
    const dbPdfs = activeContent.pdfs || [];

    return (
      <div className="space-y-12">
        {hasDbContent ? (
          <MarkdownContent content={activeContent.content!} />
        ) : (
          coreComponent || <EmptySection />
        )}

        {(dbAttachments.length > 0 || dbPdfs.length > 0) && (
          <div className="pt-12 border-t-4 border-dashed border-purple-100 dark:border-purple-900/30">
            {renderAttachments(dbAttachments, dbPdfs)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-400/10 dark:bg-pink-600/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
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
                    <span
                      className={`text-lg transition-transform duration-300 ${
                        activeSection === section.id
                          ? "animate-bounce"
                          : "group-hover:scale-125 group-hover:rotate-12"
                      }`}
                    >
                      {section.icon}
                    </span>
                    <span className={activeSection === section.id ? "font-bold" : ""}>
                      {section.title}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 transition-all duration-700 hover:shadow-2xl hover:shadow-purple-500/20 animate-fade-in">
              {loadError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {loadError}
                </div>
              )}
              {isLoadingSections ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading documentation...</p>
                </div>
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
  const html = useMemo(() => marked.parse(transformDocContent(content)), [content]);

  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none animate-fade-in docs-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function transformDocContent(raw: string) {
  const lines = raw.split(/\r?\n/);
  const stack: string[] = [];
  const output: string[] = [];

  for (const line of lines) {
    const match = line.match(/^:::\s*([a-zA-Z]+)?(?:\s+([a-zA-Z-]+))?\s*$/);
    if (!match) {
      output.push(line);
      continue;
    }

    const type = (match[1] || "").toLowerCase();
    const variant = (match[2] || "").toLowerCase();

    if (!type) {
      if (stack.length > 0) {
        stack.pop();
        output.push("</div>");
        continue;
      }
      output.push(line);
      continue;
    }

    if (type === "grid") {
      stack.push(type);
      output.push('<div class="doc-grid">');
      continue;
    }

    if (type === "card") {
      stack.push(type);
      const variantClass = variant ? ` doc-card--${variant}` : "";
      output.push(`<div class="doc-card${variantClass}">`);
      continue;
    }

    if (type === "callout") {
      stack.push(type);
      const variantClass = variant ? ` doc-callout--${variant}` : "";
      output.push(`<div class="doc-callout${variantClass}">`);
      continue;
    }

    output.push(line);
  }

  while (stack.length > 0) {
    stack.pop();
    output.push("</div>");
  }

  return output.join("\n");
}

function EmptySection() {
  return (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-lg">No content has been added for this section yet.</p>
    </div>
  );
}

function IntroductionSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
        📖 Introduction
      </h2>

      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Shamir&apos;s Secret Sharing is a cryptographic scheme introduced by{" "}
        <strong>Adi Shamir</strong> in 1979. It allows a secret to be divided into multiple shares,
        distributed among participants, such that only a threshold number of shares is needed to
        reconstruct the original secret.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg my-6 transition-all duration-500 hover:shadow-lg hover:border-l-8 hover:scale-[1.02] hover:bg-blue-100 dark:hover:bg-blue-900/30">
        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-2">Key Properties</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Threshold Property:</strong> Any t shares can reconstruct the secret
          </li>
          <li>
            <strong>Perfect Secrecy:</strong> t-1 or fewer shares reveal nothing about the secret
          </li>
          <li>
            <strong>Linearity:</strong> Enables secure addition without interaction
          </li>
          <li>
            <strong>Homomorphic:</strong> Operations on shares correspond to operations on secrets
          </li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100">
        Applications
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer group">
          <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2 transition-all duration-300 group-hover:scale-110">
            Secure Storage
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Distribute encryption keys across multiple servers to prevent single points of failure
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer group">
          <h4 className="font-bold text-green-900 dark:text-green-300 mb-2 transition-all duration-300 group-hover:scale-110">
            Multi-Party Computation
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Enable parties to jointly compute functions without revealing private inputs
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
        🔐 Shamir&apos;s Secret Sharing Scheme
      </h2>

      <h3 className="text-2xl font-bold mt-6 mb-4 text-gray-800 dark:text-gray-100">
        Mathematical Foundation
      </h3>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Shamir&apos;s scheme is based on polynomial interpolation over finite fields. A polynomial
        of degree <code>t-1</code>
        is uniquely determined by <code>t</code> points.
      </p>

      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg my-6 border border-gray-300 dark:border-gray-700 transition-all duration-500 hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 hover:scale-[1.01]">
        <h4 className="font-mono text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">
          Share Generation
        </h4>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>1.</strong> Choose a prime p and secret s ∈ ℤ<sub>p</sub>
          </li>
          <li>
            <strong>2.</strong> Generate random polynomial: f(x) = s + a<sub>1</sub>x + a
            <sub>2</sub>x² + ... + a<sub>t-1</sub>x<sup>t-1</sup> (mod p)
          </li>
          <li>
            <strong>3.</strong> Create shares: (i, f(i)) for i = 1, 2, ..., n
          </li>
        </ol>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg my-6 border border-green-200 dark:border-green-800 transition-all duration-500 hover:shadow-xl hover:border-green-500 dark:hover:border-green-400 hover:scale-[1.01]">
        <h4 className="font-mono text-lg font-bold mb-3 text-green-900 dark:text-green-300">
          Secret Reconstruction
        </h4>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          Using <strong>Lagrange Interpolation</strong>, any t shares can recover the secret:
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-300 dark:border-green-700 font-mono text-sm">
          s = f(0) = Σ<sub>j</sub> y<sub>j</sub> · λ<sub>j</sub> (mod p)
        </div>
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
        Shamir&apos;s scheme has a beautiful property: <strong>linearity</strong>. This allows
        parties to compute sums of secrets without any interaction, simply by adding their local
        shares.
      </p>

      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-lg my-6 transition-all duration-500 hover:shadow-xl hover:border-l-8 hover:scale-[1.02] hover:bg-green-100 dark:hover:bg-green-900/40">
        <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
          Protocol Steps
        </h3>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Step 1:</strong> Share secrets a and b using Shamir&apos;s scheme
            <div className="ml-4 mt-1 text-sm">
              Party i receives: f<sub>i</sub> = f(i) and g<sub>i</sub> = g(i)
            </div>
          </li>
          <li>
            <strong>Step 2:</strong> Each party locally computes sum share
            <div className="ml-4 mt-1 text-sm font-mono">
              h<sub>i</sub> = f<sub>i</sub> + g<sub>i</sub> (mod p)
            </div>
          </li>
          <li>
            <strong>Step 3:</strong> Reconstruct using t shares via Lagrange interpolation
            <div className="ml-4 mt-1 text-sm">Result: a + b (mod p)</div>
          </li>
        </ol>
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
        Unlike addition, multiplication is more complex. The naive approach increases polynomial
        degree from <code>t-1</code> to <code>2(t-1)</code>, requiring{" "}
        <strong>degree reduction</strong> through resharing.
      </p>
    </div>
  );
}

function QuantumProtocolsSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
        ⚛️ Hybrid Quantum Protocols
      </h2>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2>🛡️ Security Properties</h2>
    </div>
  );
}

function ImplementationSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2>💻 Implementation Details</h2>
    </div>
  );
}

function ReferencesSection() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
      <h2>📚 References</h2>
    </div>
  );
}
