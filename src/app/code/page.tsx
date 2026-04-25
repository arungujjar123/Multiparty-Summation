/**
 * @fileoverview Code Examples page
 */
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AchievementTracker } from "@/lib/achievements";

interface CodeExample {
  id: string;
  language: string;
  title: string;
  description: string;
  code: string;
  icon: string;
}

const codeExamples: CodeExample[] = [
  {
    id: "python-basic",
    language: "Python",
    title: "Basic Shamir Secret Sharing",
    description: "Split a secret into shares and reconstruct it using Lagrange interpolation.",
    icon: "🐍",
    code: `import secrets
from typing import List, Tuple

class ShamirSecretSharing:
    """Implementation of Shamir's Secret Sharing Scheme"""
    
    def __init__(self, prime: int = 2**127 - 1):
        """Initialize with a prime number for modular arithmetic"""
        self.prime = prime
    
    def generate_shares(self, secret: int, threshold: int, 
                       num_shares: int) -> List[Tuple[int, int]]:
        """
        Split secret into shares
        
        Args:
            secret: The secret value to split
            threshold: Minimum shares needed to reconstruct
            num_shares: Total number of shares to generate
            
        Returns:
            List of (x, y) coordinate pairs representing shares
        """
        if threshold > num_shares:
            raise ValueError("Threshold cannot exceed number of shares")
        
        # Generate random polynomial coefficients
        coefficients = [secret] + [
            secrets.randbelow(self.prime) 
            for _ in range(threshold - 1)
        ]
        
        # Evaluate polynomial at points 1, 2, ..., num_shares
        shares = []
        for x in range(1, num_shares + 1):
            y = self._evaluate_polynomial(coefficients, x)
            shares.append((x, y))
        
        return shares
    
    def _evaluate_polynomial(self, coefficients: List[int], x: int) -> int:
        """Evaluate polynomial at point x using Horner's method"""
        result = 0
        for coeff in reversed(coefficients):
            result = (result * x + coeff) % self.prime
        return result
    
    def reconstruct_secret(self, shares: List[Tuple[int, int]]) -> int:
        """
        Reconstruct secret from shares using Lagrange interpolation
        
        Args:
            shares: List of (x, y) coordinate pairs
            
        Returns:
            The reconstructed secret value
        """
        if len(shares) < 2:
            raise ValueError("Need at least 2 shares to reconstruct")
        
        secret = 0
        
        for i, (xi, yi) in enumerate(shares):
            # Calculate Lagrange basis polynomial
            numerator = 1
            denominator = 1
            
            for j, (xj, _) in enumerate(shares):
                if i != j:
                    numerator = (numerator * (0 - xj)) % self.prime
                    denominator = (denominator * (xi - xj)) % self.prime
            
            # Calculate modular inverse of denominator
            lagrange_basis = (
                numerator * pow(denominator, -1, self.prime)
            ) % self.prime
            
            secret = (secret + yi * lagrange_basis) % self.prime
        
        return secret


# Example usage
if __name__ == "__main__":
    sss = ShamirSecretSharing()
    
    # Split secret
    secret = 42
    threshold = 3
    num_shares = 5
    
    shares = sss.generate_shares(secret, threshold, num_shares)
    print(f"Secret: {secret}")
    print(f"Generated {len(shares)} shares with threshold {threshold}")
    print(f"Shares: {shares}\\n")
    
    # Reconstruct with threshold shares
    reconstructed = sss.reconstruct_secret(shares[:threshold])
    print(f"Reconstructed from {threshold} shares: {reconstructed}")
    print(f"Match: {reconstructed == secret}")
    
    # Try with different subset
    reconstructed2 = sss.reconstruct_secret(shares[1:4])
    print(f"\\nReconstructed from different {threshold} shares: {reconstructed2}")
    print(f"Match: {reconstructed2 == secret}")`,
  },
  {
    id: "javascript-basic",
    language: "JavaScript",
    title: "Basic Shamir Secret Sharing",
    description: "TypeScript/JavaScript implementation using BigInt for large numbers.",
    icon: "📜",
    code: `/**
 * Shamir's Secret Sharing implementation in TypeScript
 */

type Share = { x: bigint; y: bigint };

export class ShamirSecretSharing {
  private prime: bigint;

  constructor(prime: bigint = 2n ** 127n - 1n) {
    this.prime = prime;
  }

  /**
   * Generate shares from a secret
   */
  generateShares(
    secret: bigint,
    threshold: number,
    numShares: number
  ): Share[] {
    if (threshold > numShares) {
      throw new Error("Threshold cannot exceed number of shares");
    }

    // Generate random polynomial coefficients
    const coefficients: bigint[] = [secret];
    for (let i = 1; i < threshold; i++) {
      coefficients.push(this.randomBigInt());
    }

    // Evaluate polynomial at points 1, 2, ..., numShares
    const shares: Share[] = [];
    for (let x = 1n; x <= BigInt(numShares); x++) {
      const y = this.evaluatePolynomial(coefficients, x);
      shares.push({ x, y });
    }

    return shares;
  }

  /**
   * Reconstruct secret from shares using Lagrange interpolation
   */
  reconstructSecret(shares: Share[]): bigint {
    if (shares.length < 2) {
      throw new Error("Need at least 2 shares to reconstruct");
    }

    let secret = 0n;

    for (let i = 0; i < shares.length; i++) {
      const { x: xi, y: yi } = shares[i];

      // Calculate Lagrange basis polynomial
      let numerator = 1n;
      let denominator = 1n;

      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          const { x: xj } = shares[j];
          numerator = this.mod(numerator * (0n - xj));
          denominator = this.mod(denominator * (xi - xj));
        }
      }

      // Calculate Lagrange basis and add to result
      const lagrangeBasis = this.mod(
        numerator * this.modInverse(denominator)
      );
      secret = this.mod(secret + yi * lagrangeBasis);
    }

    return secret;
  }

  /**
   * Evaluate polynomial at point x using Horner's method
   */
  private evaluatePolynomial(coefficients: bigint[], x: bigint): bigint {
    let result = 0n;
    for (let i = coefficients.length - 1; i >= 0; i--) {
      result = this.mod(result * x + coefficients[i]);
    }
    return result;
  }

  /**
   * Generate cryptographically secure random BigInt
   */
  private randomBigInt(): bigint {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return result % this.prime;
  }

  /**
   * Modular arithmetic helper
   */
  private mod(n: bigint): bigint {
    const result = n % this.prime;
    return result < 0n ? result + this.prime : result;
  }

  /**
   * Calculate modular multiplicative inverse using Extended Euclidean Algorithm
   */
  private modInverse(a: bigint): bigint {
    let [old_r, r] = [a, this.prime];
    let [old_s, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }

    return this.mod(old_s);
  }
}

// Example usage
const sss = new ShamirSecretSharing();

const secret = 42n;
const threshold = 3;
const numShares = 5;

const shares = sss.generateShares(secret, threshold, numShares);
console.log(\`Secret: \${secret}\`);
console.log(\`Generated \${shares.length} shares with threshold \${threshold}\`);
console.log("Shares:", shares);

const reconstructed = sss.reconstructSecret(shares.slice(0, threshold));
console.log(\`\\nReconstructed: \${reconstructed}\`);
console.log(\`Match: \${reconstructed === secret}\`);`,
  },
  {
    id: "python-summation",
    language: "Python",
    title: "Secure Summation Protocol",
    description: "Add multiple secrets without revealing individual values.",
    icon: "➕",
    code: `from typing import List, Tuple

class SecureSummation:
    """Secure multi-party summation using Shamir's scheme"""
    
    def __init__(self, prime: int = 2**127 - 1):
        self.prime = prime
        self.sss = ShamirSecretSharing(prime)
    
    def secure_sum(self, secrets: List[int], threshold: int) -> int:
        """
        Compute sum of secrets without revealing individual values
        
        Args:
            secrets: List of secret values from each party
            threshold: Minimum shares needed for reconstruction
            
        Returns:
            Sum of all secrets
        """
        num_parties = len(secrets)
        
        # Each party generates shares of their secret
        all_shares = []
        for secret in secrets:
            shares = self.sss.generate_shares(
                secret, threshold, num_parties
            )
            all_shares.append(shares)
        
        # Each party receives one share from every other party
        # Party i receives share i from all parties
        combined_shares = []
        for i in range(num_parties):
            # Collect share i from each party
            party_shares = [shares[i] for shares in all_shares]
            
            # Sum the y-values (shares) - additive homomorphism
            x = party_shares[0][0]
            y_sum = sum(y for _, y in party_shares) % self.prime
            
            combined_shares.append((x, y_sum))
        
        # Reconstruct the sum using threshold shares
        result = self.sss.reconstruct_secret(combined_shares[:threshold])
        
        return result


# Example usage
if __name__ == "__main__":
    summation = SecureSummation()
    
    # Three parties with secret values
    secrets = [10, 20, 30]
    threshold = 2
    
    print("Party Secrets:", secrets)
    print(f"Threshold: {threshold}\\n")
    
    # Compute secure sum
    secure_result = summation.secure_sum(secrets, threshold)
    actual_sum = sum(secrets)
    
    print(f"Secure Sum Result: {secure_result}")
    print(f"Actual Sum: {actual_sum}")
    print(f"Match: {secure_result == actual_sum}")
    
    # Key insight: Individual secrets remain private!
    print("\\n✓ Individual secrets were never revealed")
    print("✓ Only the final sum is known to all parties")`,
  },
  {
    id: "javascript-multiplication",
    language: "JavaScript",
    title: "Secure Multiplication (BGW Protocol)",
    description: "Multiply secrets using degree reduction and resharing.",
    icon: "✖️",
    code: `/**
 * Secure multiplication using BGW protocol
 */

export class SecureMultiplication extends ShamirSecretSharing {
  /**
   * Multiply two shared secrets using BGW protocol
   */
  secureMultiply(
    sharesA: Share[],
    sharesB: Share[],
    threshold: number
  ): Share[] {
    if (sharesA.length !== sharesB.length) {
      throw new Error("Share counts must match");
    }

    const numParties = sharesA.length;

    // Step 1: Local multiplication of shares
    // Each party multiplies their shares
    const localProducts: Share[] = [];
    for (let i = 0; i < numParties; i++) {
      const x = sharesA[i].x;
      const y = this.mod(sharesA[i].y * sharesB[i].y);
      localProducts.push({ x, y });
    }

    // Step 2: Degree reduction via resharing
    // The product shares have degree 2(t-1), need to reduce to t-1
    const reducedShares = this.degreeReduction(
      localProducts,
      threshold,
      numParties
    );

    return reducedShares;
  }

  /**
   * Reduce polynomial degree through resharing
   */
  private degreeReduction(
    shares: Share[],
    threshold: number,
    numParties: number
  ): Share[] {
    // Each party reshares their product share
    const resharings: Share[][] = [];

    for (const share of shares) {
      // Generate new t-degree polynomial with share.y as constant term
      const newShares = this.generateShares(
        share.y,
        threshold,
        numParties
      );
      resharings.push(newShares);
    }

    // Combine reshared values
    const reducedShares: Share[] = [];
    for (let i = 0; i < numParties; i++) {
      let ySum = 0n;
      for (let j = 0; j < numParties; j++) {
        ySum = this.mod(ySum + resharings[j][i].y);
      }
      reducedShares.push({ x: BigInt(i + 1), y: ySum });
    }

    return reducedShares;
  }

  /**
   * Complete multiplication workflow with reconstruction
   */
  async multiplySecrets(
    secretA: bigint,
    secretB: bigint,
    threshold: number,
    numParties: number
  ): Promise<bigint> {
    // Generate initial shares
    const sharesA = this.generateShares(secretA, threshold, numParties);
    const sharesB = this.generateShares(secretB, threshold, numParties);

    console.log("Initial Shares A:", sharesA);
    console.log("Initial Shares B:", sharesB);

    // Perform secure multiplication
    const productShares = this.secureMultiply(sharesA, sharesB, threshold);
    console.log("Product Shares:", productShares);

    // Reconstruct the product
    const result = this.reconstructSecret(
      productShares.slice(0, threshold)
    );

    return result;
  }
}

// Example usage
(async () => {
  const multiplication = new SecureMultiplication();

  const secretA = 7n;
  const secretB = 6n;
  const threshold = 3;
  const numParties = 5;

  console.log(\`Secret A: \${secretA}\`);
  console.log(\`Secret B: \${secretB}\`);
  console.log(\`Threshold: \${threshold}\`);
  console.log(\`Parties: \${numParties}\\n\`);

  const result = await multiplication.multiplySecrets(
    secretA,
    secretB,
    threshold,
    numParties
  );

  const expected = secretA * secretB;

  console.log(\`\\nSecure Product: \${result}\`);
  console.log(\`Expected: \${expected}\`);
  console.log(\`Match: \${result === expected}\`);
})();`,
  },
];

export default function CodeExamplesPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");

  useEffect(() => {
    AchievementTracker.trackPageVisit("code");
  }, []);

  const languages = ["All", "Python", "JavaScript"];

  const filteredExamples =
    selectedLanguage === "All"
      ? codeExamples
      : codeExamples.filter((ex) => ex.language === selectedLanguage);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-screen hero-surface hero-grid">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <Link
            href="/"
            className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
          >
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 dark:from-purple-400 dark:via-blue-400 dark:to-pink-400">
            💻 Code Examples
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Production-ready implementations of Shamir&apos;s Secret Sharing in multiple languages.
            Copy, modify, and integrate into your projects!
          </p>
        </div>

        {/* Language Filter */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedLanguage === lang
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400"
              }`}
            >
              {lang === "All"
                ? "🌐 All Languages"
                : lang === "Python"
                  ? "🐍 Python"
                  : "📜 JavaScript/TypeScript"}
            </button>
          ))}
        </div>

        {/* Code Examples */}
        <div className="space-y-8">
          {filteredExamples.map((example) => (
            <div
              key={example.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 animate-fade-in"
            >
              {/* Example Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-5xl">{example.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{example.title}</h2>
                      <p className="text-purple-100 mb-2">{example.description}</p>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                        {example.language}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(example.code, example.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 ${
                      copiedId === example.id
                        ? "bg-green-500 text-white"
                        : "bg-white text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    {copiedId === example.id ? "✓ Copied!" : "📋 Copy Code"}
                  </button>
                </div>
              </div>

              {/* Code Block */}
              <div className="relative">
                <pre className="p-6 overflow-x-auto bg-gray-900 text-gray-100 text-sm leading-relaxed">
                  <code>{example.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            href="/docs"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              📚
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Read Documentation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Learn the theory behind these implementations
            </p>
          </Link>

          <Link
            href="/visualizer"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              🎯
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              Try Visualizer
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See these algorithms in action step-by-step
            </p>
          </Link>

          <Link
            href="/glossary"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              📖
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400">
              Technical Glossary
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Reference for cryptographic terminology
            </p>
          </Link>
        </div>

        {/* Installation Instructions */}
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            🚀 Getting Started
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-200">
                Python Requirements
              </h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                <code>
                  {`# Python 3.7+ required
# No external dependencies needed!

# Run the examples:
python shamir_basic.py
python secure_summation.py`}
                </code>
              </pre>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-200">
                JavaScript/TypeScript Setup
              </h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                <code>
                  {`# Node.js 12+ or modern browser
# No external dependencies!

# Run with Node.js:
node shamir_basic.js

# Or use in TypeScript project`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
