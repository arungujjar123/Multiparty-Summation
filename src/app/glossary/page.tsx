"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AchievementTracker } from "@/lib/achievements";

interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
  relatedTerms?: string[];
  category: string;
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Shamir Secret Sharing",
    definition: "A cryptographic scheme that divides a secret into multiple shares, where any threshold number (t) of shares can reconstruct the secret, but fewer than t shares reveal nothing.",
    example: "With a (3,5) scheme, any 3 out of 5 shares can recover the secret.",
    relatedTerms: ["Threshold", "Shares", "Polynomial"],
    category: "Core Concepts"
  },
  {
    term: "Threshold (t)",
    definition: "The minimum number of shares required to reconstruct the secret. Also determines the degree of the polynomial (t-1).",
    example: "In a threshold-3 scheme, you need exactly 3 shares to reconstruct the secret.",
    relatedTerms: ["Shares", "Polynomial Degree"],
    category: "Core Concepts"
  },
  {
    term: "Shares",
    definition: "Points on a polynomial that represent distributed pieces of a secret. Each share is a coordinate (x, y) where y = f(x).",
    example: "Share (1, 9) means x=1, y=9 on the polynomial.",
    relatedTerms: ["Polynomial", "Secret Sharing"],
    category: "Core Concepts"
  },
  {
    term: "Polynomial Interpolation",
    definition: "The mathematical process of finding a unique polynomial that passes through a given set of points. Used to reconstruct the secret.",
    example: "Given points (1,2), (2,3), (3,5), we can find the unique degree-2 polynomial.",
    relatedTerms: ["Lagrange Interpolation", "Polynomial"],
    category: "Mathematics"
  },
  {
    term: "Lagrange Interpolation",
    definition: "A method for polynomial interpolation that uses Lagrange basis polynomials to reconstruct a polynomial from its points.",
    example: "f(0) = Σ yⱼ · λⱼ where λⱼ are Lagrange coefficients.",
    relatedTerms: ["Polynomial Interpolation", "Reconstruction"],
    category: "Mathematics"
  },
  {
    term: "Finite Field",
    definition: "A mathematical field with a finite number of elements. In Shamir's scheme, operations are done modulo a prime p.",
    example: "Working modulo 11: (7 + 8) mod 11 = 4",
    relatedTerms: ["Modular Arithmetic", "Prime"],
    category: "Mathematics"
  },
  {
    term: "Prime Number (p)",
    definition: "A number greater than 1 that has no positive divisors other than 1 and itself. Used as the modulus in Shamir's scheme.",
    example: "Common primes: 11, 13, 17, 19, 23, 31...",
    relatedTerms: ["Finite Field", "Modular Arithmetic"],
    category: "Mathematics"
  },
  {
    term: "Polynomial Degree",
    definition: "The highest power of x in a polynomial. In a threshold-t scheme, the polynomial has degree t-1.",
    example: "f(x) = 4 + 3x + 2x² has degree 2",
    relatedTerms: ["Threshold", "Polynomial"],
    category: "Mathematics"
  },
  {
    term: "Perfect Secrecy",
    definition: "The property that t-1 or fewer shares reveal absolutely zero information about the secret, even to a computationally unbounded adversary.",
    example: "With 2 out of 3 shares, all possible secrets are equally likely.",
    relatedTerms: ["Information-Theoretic Security", "Threshold"],
    category: "Security"
  },
  {
    term: "Information-Theoretic Security",
    definition: "Security that does not depend on computational assumptions. Secure even against adversaries with unlimited computing power.",
    example: "Shamir's scheme is information-theoretically secure.",
    relatedTerms: ["Perfect Secrecy", "Unconditional Security"],
    category: "Security"
  },
  {
    term: "Homomorphic Property",
    definition: "The ability to perform operations on encrypted/shared data that correspond to operations on the original data.",
    example: "Adding shares of a and b gives shares of (a+b).",
    relatedTerms: ["Linearity", "Secure Computation"],
    category: "Properties"
  },
  {
    term: "Linearity",
    definition: "The property that allows addition of shares to correspond to addition of secrets. f(x) + g(x) shares the sum of secrets.",
    example: "If f shares 4 and g shares 2, then h=f+g shares 6.",
    relatedTerms: ["Homomorphic Property", "Summation"],
    category: "Properties"
  },
  {
    term: "Secure Multi-Party Computation (MPC)",
    definition: "A cryptographic technique allowing multiple parties to jointly compute a function while keeping their inputs private.",
    example: "Calculate average salary without revealing individual salaries.",
    relatedTerms: ["Secret Sharing", "Privacy-Preserving"],
    category: "Core Concepts"
  },
  {
    term: "BGW Protocol",
    definition: "Ben-Or, Goldwasser, Wigderson protocol for secure multiplication. Handles degree reduction through resharing.",
    example: "Multiplies two shared secrets while maintaining threshold property.",
    relatedTerms: ["Multiplication", "Resharing", "Degree Reduction"],
    category: "Protocols"
  },
  {
    term: "Degree Reduction",
    definition: "The process of converting a degree-2(t-1) polynomial back to degree-(t-1) after multiplication. Essential for maintaining threshold.",
    example: "After multiplying, degree increases from 2 to 4. Resharing reduces it back to 2.",
    relatedTerms: ["Resharing", "Multiplication"],
    category: "Protocols"
  },
  {
    term: "Resharing",
    definition: "The process of creating new shares of an existing shared value. Used in multiplication for degree reduction.",
    example: "Each party creates sub-shares and sends them to others.",
    relatedTerms: ["Degree Reduction", "BGW Protocol"],
    category: "Protocols"
  },
  {
    term: "Reconstruction",
    definition: "The process of recovering the original secret from threshold number of shares using Lagrange interpolation.",
    example: "Given 3 shares in a (3,5) scheme, compute f(0) to get the secret.",
    relatedTerms: ["Lagrange Interpolation", "Threshold"],
    category: "Core Concepts"
  },
  {
    term: "Quantum Fourier Transform (QFT)",
    definition: "A quantum algorithm used in quantum secret sharing protocols for enhanced security.",
    example: "Used in hybrid quantum protocols for summation/multiplication.",
    relatedTerms: ["Quantum Protocols", "Entanglement"],
    category: "Quantum"
  },
  {
    term: "Threshold Cryptography",
    definition: "Cryptographic systems where operations require cooperation of at least t parties from a total of n parties.",
    example: "Threshold signatures, threshold decryption.",
    relatedTerms: ["Secret Sharing", "Multi-Party Computation"],
    category: "Core Concepts"
  },
  {
    term: "Vandermonde Matrix",
    definition: "A matrix with special structure used in polynomial interpolation and reconstruction in secret sharing.",
    example: "Used to solve for polynomial coefficients from shares.",
    relatedTerms: ["Polynomial Interpolation", "Linear Algebra"],
    category: "Mathematics"
  }
];

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");  
  useEffect(() => {
    AchievementTracker.trackPageVisit("glossary");
  }, []);
  const categories = ["All", ...Array.from(new Set(glossaryTerms.map(t => t.category)))];

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              📖 Glossary
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Complete reference of technical terms and concepts
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-purple-500 shadow-lg"
              />
              <span className="absolute right-4 top-4 text-2xl">🔍</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedCategory === cat
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:scale-105"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-bold text-purple-600 dark:text-purple-400">{filteredTerms.length}</span> term{filteredTerms.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Glossary Terms */}
        <div className="grid gap-6">
          {filteredTerms.map((term, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-purple-500 dark:hover:border-purple-400"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {term.term}
                </h2>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                  {term.category}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {term.definition}
              </p>

              {term.example && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Example:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{term.example}</p>
                </div>
              )}

              {term.relatedTerms && term.relatedTerms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Related:</span>
                  {term.relatedTerms.map((related, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
                      onClick={() => setSearchQuery(related)}
                    >
                      {related}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl mb-4">🔍</p>
            <p className="text-gray-600 dark:text-gray-400">No terms found matching your search.</p>
          </div>
        )}

        {/* Back to Docs */}
        <div className="mt-12 text-center">
          <Link
            href="/docs"
            className="inline-block px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300"
          >
            📚 Back to Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
