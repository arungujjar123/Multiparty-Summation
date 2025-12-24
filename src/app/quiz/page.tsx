"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AchievementTracker } from "@/lib/achievements";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the minimum number of shares needed to reconstruct a secret in a (3,5) Shamir Secret Sharing scheme?",
    options: ["2 shares", "3 shares", "4 shares", "5 shares"],
    correctAnswer: 1,
    explanation: "In a (t,n) scheme, t shares are required. So in a (3,5) scheme, you need exactly 3 shares to reconstruct the secret.",
    category: "Basics"
  },
  {
    id: 2,
    question: "What mathematical concept is Shamir's Secret Sharing based on?",
    options: ["Matrix multiplication", "Polynomial interpolation", "Elliptic curves", "Hash functions"],
    correctAnswer: 1,
    explanation: "Shamir's scheme uses polynomial interpolation over finite fields. A polynomial of degree t-1 is uniquely determined by t points.",
    category: "Math Foundation"
  },
  {
    id: 3,
    question: "How many shares reveal NO information about the secret in a threshold-3 scheme?",
    options: ["0 shares", "1 share", "2 shares", "3 shares"],
    correctAnswer: 2,
    explanation: "In a threshold-t scheme, any t-1 or fewer shares reveal absolutely nothing about the secret. This is called perfect secrecy.",
    category: "Security"
  },
  {
    id: 4,
    question: "What is the main advantage of secure summation using Shamir's scheme?",
    options: [
      "It's faster than regular addition",
      "It requires no communication between parties",
      "It uses less memory",
      "It works with decimal numbers"
    ],
    correctAnswer: 1,
    explanation: "Summation is non-interactive! Each party can locally add their shares without any communication, thanks to the linearity property.",
    category: "Summation"
  },
  {
    id: 5,
    question: "Why is multiplication more complex than addition in secure multi-party computation?",
    options: [
      "Multiplication takes more CPU time",
      "It increases the polynomial degree",
      "It requires more memory",
      "It's mathematically impossible"
    ],
    correctAnswer: 1,
    explanation: "Multiplying two degree-(t-1) polynomials results in a degree-2(t-1) polynomial, requiring degree reduction through resharing.",
    category: "Multiplication"
  },
  {
    id: 6,
    question: "What does BGW protocol stand for?",
    options: [
      "Big Giant Web protocol",
      "Ben-Or, Goldwasser, Wigderson protocol",
      "Binary Gateway Workflow",
      "Blockchain Gateway Web"
    ],
    correctAnswer: 1,
    explanation: "BGW is named after its creators: Ben-Or, Goldwasser, and Wigderson. It's used for secure multiplication with degree reduction.",
    category: "Multiplication"
  },
  {
    id: 7,
    question: "What is the degree of the polynomial used to share a secret in a threshold-t scheme?",
    options: ["t", "t-1", "t+1", "2t"],
    correctAnswer: 1,
    explanation: "The polynomial has degree t-1. This ensures that exactly t points are needed to uniquely determine the polynomial.",
    category: "Math Foundation"
  },
  {
    id: 8,
    question: "Which property allows Shamir's scheme to perform addition on shared secrets?",
    options: ["Homomorphism", "Linearity", "Commutativity", "Associativity"],
    correctAnswer: 1,
    explanation: "Linearity allows addition of shares to correspond to addition of secrets: f(x) + g(x) shares the sum of the secrets.",
    category: "Properties"
  },
  {
    id: 9,
    question: "How many messages are exchanged in the resharing step of BGW multiplication protocol with n parties?",
    options: ["n messages", "n² messages", "2n messages", "log(n) messages"],
    correctAnswer: 1,
    explanation: "Each party sends a sub-share to every other party, resulting in n² total messages during resharing.",
    category: "Multiplication"
  },
  {
    id: 10,
    question: "What type of security does Shamir's Secret Sharing provide?",
    options: [
      "Computational security",
      "Information-theoretic security",
      "Quantum security",
      "Probabilistic security"
    ],
    correctAnswer: 1,
    explanation: "Shamir's scheme provides information-theoretic (unconditional) security - it's secure even against computationally unbounded adversaries.",
    category: "Security"
  },
  {
    id: 11,
    question: "In quantum hybrid protocols, what is the main advantage over classical (n,n) approaches?",
    options: [
      "Faster computation",
      "Only t players needed instead of all n",
      "Better encryption",
      "Smaller message size"
    ],
    correctAnswer: 1,
    explanation: "Hybrid (t,n) quantum protocols only require t players to compute summation/multiplication, providing better fault tolerance.",
    category: "Quantum"
  },
  {
    id: 12,
    question: "What is used in quantum protocols for enhanced security?",
    options: [
      "Larger prime numbers",
      "Quantum Fourier Transform and entanglement",
      "Faster processors",
      "More polynomial coefficients"
    ],
    correctAnswer: 1,
    explanation: "Quantum protocols use QFT, quantum entanglement, and measurement operations to achieve unconditional security based on quantum mechanics.",
    category: "Quantum"
  },
  {
    id: 13,
    question: "If you have shares (1,5), (2,8), (3,13) from a degree-2 polynomial, how many shares do you need to reconstruct?",
    options: ["1 share", "2 shares", "3 shares", "All shares"],
    correctAnswer: 2,
    explanation: "A degree-2 polynomial requires exactly 3 points (t=3) to uniquely determine it using Lagrange interpolation.",
    category: "Math Foundation"
  },
  {
    id: 14,
    question: "What happens if an adversary obtains t-1 shares in a threshold-t scheme?",
    options: [
      "They can partially reconstruct the secret",
      "They learn nothing about the secret",
      "They can guess with 50% probability",
      "They can factor the secret"
    ],
    correctAnswer: 1,
    explanation: "With t-1 shares, the adversary gains zero information about the secret. All possible secrets are equally likely.",
    category: "Security"
  },
  {
    id: 15,
    question: "What is Lagrange interpolation used for in Shamir's scheme?",
    options: [
      "To generate random polynomials",
      "To reconstruct the secret from shares",
      "To encrypt the shares",
      "To verify share authenticity"
    ],
    correctAnswer: 1,
    explanation: "Lagrange interpolation is used to reconstruct the polynomial (and thus the secret at x=0) from t or more shares.",
    category: "Math Foundation"
  }
];

export default function QuizPage() {
  // Shuffle questions on mount
  const [shuffledQuestions] = useState<QuizQuestion[]>(() => {
    const shuffled = [...quizQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(shuffledQuestions.length).fill(false));
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (answeredQuestions[currentQuestion]) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestion] = true;
    setAnsweredQuestions(newAnswered);
    
    if (answerIndex === shuffledQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
      
      // Track achievement
      AchievementTracker.trackQuizAttempt(score, shuffledQuestions.length);
      
      // Save to quiz history for dashboard
      const attempt = {
        date: new Date().toISOString(),
        score: score,
        totalQuestions: shuffledQuestions.length,
        percentage: Math.round((score / shuffledQuestions.length) * 100),
      };
      const history = JSON.parse(localStorage.getItem("quiz_history") || "[]");
      history.push(attempt);
      localStorage.setItem("quiz_history", JSON.stringify(history));
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    // Reshuffle questions for new attempt
    const shuffled = [...quizQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    window.location.reload(); // Reload to get fresh shuffled questions
  };

  const getScorePercentage = () => {
    return Math.round((score / shuffledQuestions.length) * 100);
  };

  const getScoreMessage = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return { text: "Outstanding! 🏆", color: "text-green-600 dark:text-green-400" };
    if (percentage >= 75) return { text: "Great job! 🌟", color: "text-blue-600 dark:text-blue-400" };
    if (percentage >= 60) return { text: "Good effort! 👍", color: "text-purple-600 dark:text-purple-400" };
    return { text: "Keep studying! 📚", color: "text-orange-600 dark:text-orange-400" };
  };

  if (quizCompleted) {
    const scoreMessage = getScoreMessage();
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-purple-200 dark:border-purple-800 animate-fade-in">
            <div className="text-center">
              <h1 className="text-5xl font-extrabold mb-6">
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600">
                  Quiz Complete!
                </span>
              </h1>
              
              <div className="mb-8">
                <div className="text-8xl font-bold mb-4 animate-scale-pulse">
                  {getScorePercentage()}%
                </div>
                <p className={`text-3xl font-bold ${scoreMessage.color} mb-2`}>
                  {scoreMessage.text}
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  You got {score} out of {shuffledQuestions.length} questions correct
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-8">
                {answeredQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      index < score
                        ? "bg-green-500"
                        : "bg-red-400"
                    }`}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={resetQuiz}
                  className="px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300 hover:shadow-2xl"
                >
                  🔄 Retake Quiz
                </button>
                <Link
                  href="/docs"
                  className="px-8 py-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600 transform hover:scale-110 transition-all duration-300"
                >
                  📚 Review Docs
                </Link>
                <Link
                  href="/"
                  className="px-8 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300"
                >
                  🏠 Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              Knowledge Quiz
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Test your understanding of Shamir Secret Sharing
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            🔀 Questions are randomized for each attempt
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {shuffledQuestions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-gray-200 dark:border-gray-700 mb-6 transition-all duration-500 hover:shadow-purple-500/20 animate-fade-in">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold mb-4">
              {question.category}
            </span>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              {question.question}
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showResult = showExplanation;
              
              let className = "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ";
              
              if (showResult) {
                if (isCorrect) {
                  className += "border-green-500 bg-green-50 dark:bg-green-900/20 ";
                } else if (isSelected) {
                  className += "border-red-500 bg-red-50 dark:bg-red-900/20 ";
                } else {
                  className += "border-gray-200 dark:border-gray-700 opacity-50 ";
                }
              } else {
                className += isSelected
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105 shadow-lg "
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:scale-102 ";
              }

              return (
                <div
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={className}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      showResult && isCorrect
                        ? "bg-green-500 text-white"
                        : showResult && isSelected
                        ? "bg-red-500 text-white"
                        : isSelected
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                      {showResult && isCorrect ? "✓" : showResult && isSelected ? "✗" : String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium flex-1">
                      {option}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {showExplanation && (
            <div className={`p-6 rounded-xl border-2 animate-fade-in ${
              selectedAnswer === question.correctAnswer
                ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
            }`}>
              <h3 className={`font-bold text-lg mb-2 ${
                selectedAnswer === question.correctAnswer
                  ? "text-green-900 dark:text-green-300"
                  : "text-blue-900 dark:text-blue-300"
              }`}>
                {selectedAnswer === question.correctAnswer ? "✅ Correct!" : "📝 Explanation"}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              currentQuestion === 0
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 hover:scale-110 hover:shadow-lg"
            }`}
          >
            ← Previous
          </button>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {score}/{currentQuestion + (showExplanation ? 1 : 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Score</div>
          </div>

          <button
            onClick={handleNext}
            disabled={!showExplanation}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              !showExplanation
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50"
            }`}
          >
            {currentQuestion === shuffledQuestions.length - 1 ? "Finish" : "Next"} →
          </button>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">Quick Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {shuffledQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuestion(index);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                }}
                className={`aspect-square rounded-lg font-bold text-sm transition-all duration-300 ${
                  index === currentQuestion
                    ? "bg-purple-500 text-white scale-110 shadow-lg"
                    : answeredQuestions[index]
                    ? "bg-green-500 text-white hover:scale-110"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-110"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
