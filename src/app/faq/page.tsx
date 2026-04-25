"use client";
import React, { useState } from "react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Shamir's Secret Sharing?",
    answer:
      "Shamir's Secret Sharing is a cryptographic algorithm that divides a secret into multiple parts (shares), where a minimum threshold number of shares is needed to reconstruct the original secret, but fewer shares reveal nothing about it.",
    category: "Basics",
  },
  {
    question: "How does the threshold work?",
    answer:
      "The threshold (t) is the minimum number of shares required to reconstruct the secret. For example, in a (3,5) scheme, any 3 out of 5 shares can recover the secret, but 2 or fewer shares reveal no information.",
    category: "Basics",
  },
  {
    question: "Why is a prime number required?",
    answer:
      "Prime numbers are used to create a finite field for modular arithmetic. This ensures that all operations (addition, subtraction, multiplication, division) work correctly and that the mathematical properties needed for secret sharing are maintained.",
    category: "Technical",
  },
  {
    question: "Can I use any prime number?",
    answer:
      "Yes, but the prime must be larger than both your secret and the number of parties. Common choices are small primes like 11, 13, 17 for teaching, or very large primes (256-bit or larger) for real cryptographic applications.",
    category: "Technical",
  },
  {
    question: "Is Shamir's scheme secure?",
    answer:
      "Yes! Shamir's Secret Sharing provides information-theoretic security, meaning it's secure even against adversaries with unlimited computing power. With t-1 or fewer shares, absolutely no information about the secret is leaked.",
    category: "Security",
  },
  {
    question: "What happens if I lose a share?",
    answer:
      "As long as you still have at least t shares, you can reconstruct the secret. This is the beauty of threshold schemes - they provide fault tolerance. You can lose up to (n-t) shares and still recover the secret.",
    category: "Practical",
  },
  {
    question: "Can shares be reused?",
    answer:
      "No! Each secret should use a unique polynomial with random coefficients. Reusing polynomials or shares for different secrets can compromise security.",
    category: "Security",
  },
  {
    question: "How does secure summation work?",
    answer:
      "Secure summation leverages the linearity property. Each party locally adds their shares of two secrets (a and b) to get a share of the sum. No communication is needed! The sum shares can then be used to reconstruct (a+b).",
    category: "Operations",
  },
  {
    question: "Why is multiplication more complex than addition?",
    answer:
      "When you multiply two degree-(t-1) polynomials, the result has degree 2(t-1). This requires 2t-1 shares to reconstruct instead of t, breaking the threshold property. We need degree reduction (resharing) to fix this.",
    category: "Operations",
  },
  {
    question: "What is the BGW protocol?",
    answer:
      "BGW (Ben-Or, Goldwasser, Wigderson) is a protocol for secure multiplication. It handles the degree reduction problem by having parties reshare their multiplication results, creating new degree-(t-1) shares of the product.",
    category: "Operations",
  },
  {
    question: "How many messages are exchanged in BGW multiplication?",
    answer:
      "In the resharing step, each party sends a sub-share to every other party, resulting in n² total messages for n parties.",
    category: "Technical",
  },
  {
    question: "Can I perform other operations besides +/-/×?",
    answer:
      "Yes! Any function that can be expressed as an arithmetic circuit (using addition and multiplication) can be computed securely using MPC techniques built on secret sharing.",
    category: "Operations",
  },
  {
    question: "What are quantum protocols?",
    answer:
      "Quantum protocols extend classical secret sharing using quantum mechanics (QFT, entanglement). They offer enhanced security against quantum attacks and can reduce communication costs in threshold schemes.",
    category: "Advanced",
  },
  {
    question: "Do I need quantum computers to use this visualizer?",
    answer:
      "No! Our visualizer implements classical Shamir secret sharing which runs on regular computers. The quantum section in the docs is for educational purposes about future extensions.",
    category: "Practical",
  },
  {
    question: "What's the difference between (t,n) and (n,n) schemes?",
    answer:
      "(t,n) schemes require only t out of n parties to reconstruct, providing fault tolerance. (n,n) schemes require all parties, offering no flexibility if anyone is unavailable.",
    category: "Basics",
  },
  {
    question: "Can malicious parties cheat?",
    answer:
      "Basic Shamir's scheme assumes honest-but-curious parties. For malicious adversaries, you need verifiable secret sharing (VSS) with additional mechanisms like commitments and zero-knowledge proofs.",
    category: "Security",
  },
  {
    question: "How do I choose the threshold value?",
    answer:
      "Choose t based on your trust model. Higher t means more parties needed (more security against collusion) but less fault tolerance. Common choice: t = ⌈n/2⌉ + 1 for majority threshold.",
    category: "Practical",
  },
  {
    question: "What's Lagrange interpolation?",
    answer:
      "It's the mathematical method used to reconstruct the polynomial (and thus the secret) from t shares. It finds the unique polynomial of degree t-1 that passes through the given points.",
    category: "Technical",
  },
  {
    question: "Can I use this in production?",
    answer:
      "This visualizer is educational. For production, use well-tested libraries (e.g., SPDZ, MP-SPDZ, Sharemind) with proper security audits, key management, and secure channels.",
    category: "Practical",
  },
  {
    question: "Where can I learn more?",
    answer:
      "Check our Documentation page for detailed theory, take the Quiz to test your knowledge, and explore the referenced research papers (Shamir 1979, BGW 1988) for mathematical foundations.",
    category: "Learning",
  },
  {
    question: "Why does my reconstruction fail sometimes?",
    answer:
      "Common issues: (1) Using fewer than t shares, (2) Incorrect modular arithmetic, (3) Using the same x-coordinate twice, (4) Prime number too small. Check your parameters!",
    category: "Troubleshooting",
  },
  {
    question: "Can shares be distributed over the internet?",
    answer:
      "Yes, but use secure channels (TLS/SSL). The shares themselves don't need encryption (they're already 'encrypted' by the scheme), but you want to prevent interception and ensure authenticity.",
    category: "Practical",
  },
  {
    question: "What's the computational complexity?",
    answer:
      "Share generation: O(nt) for n shares with threshold t. Reconstruction: O(t²) using Lagrange interpolation. Very efficient compared to public-key cryptography!",
    category: "Technical",
  },
  {
    question: "How does this compare to encryption?",
    answer:
      "Different use cases! Encryption (AES, RSA) protects data from one party. Secret sharing splits data among multiple parties with threshold reconstruction. Both are useful for different scenarios.",
    category: "Basics",
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = ["All", ...Array.from(new Set(faqData.map((f) => f.category)))];

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              ❓ FAQ
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Frequently Asked Questions about Shamir Secret Sharing
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-purple-500 shadow-lg"
              />
              <span className="absolute right-4 top-4 text-2xl">🔍</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
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
            Showing{" "}
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {filteredFAQs.length}
            </span>{" "}
            question{filteredFAQs.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-purple-500 dark:hover:border-purple-400"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left transition-all duration-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">❓</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {faq.question}
                      </h3>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-2xl transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6 pt-2 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl mb-4">🤔</p>
            <p className="text-gray-600 dark:text-gray-400">
              No questions found matching your search.
            </p>
          </div>
        )}

        {/* Still Have Questions */}
        <div className="mt-12 p-8 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border-2 border-purple-300 dark:border-purple-700 text-center">
          <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">
            Still Have Questions?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Check out our comprehensive documentation or test your knowledge with our interactive
            quiz!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs"
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300"
            >
              📚 Read Documentation
            </Link>
            <Link
              href="/quiz"
              className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300"
            >
              🎯 Take the Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
