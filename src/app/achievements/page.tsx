/**
 * @fileoverview Achievements and Badges page
 */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "quiz" | "learning" | "exploration" | "mastery";
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  requirement: string;
}

interface UserProgress {
  quiz_attempts: number;
  quiz_perfect_scores: number;
  visited_docs: boolean;
  visited_glossary: boolean;
  visited_faq: boolean;
  visited_code: boolean;
  visited_all_pages: boolean;
  visualizer_runs: number;
  completed_summation: number;
  completed_multiplication: number;
  first_visit_date: string | null;
  unlocked_count: number;
  total_points: number;
  unlocked_all: boolean;
  [key: string]: string | number | boolean | null;
}

const ACHIEVEMENTS_DATA: Omit<Achievement, "unlocked" | "unlockedDate">[] = [
  // Quiz Achievements
  {
    id: "quiz-first-attempt",
    title: "First Steps",
    description: "Complete your first quiz attempt",
    icon: "🎯",
    category: "quiz",
    points: 10,
    requirement: "quiz_attempts >= 1",
  },
  {
    id: "quiz-perfect-score",
    title: "Perfect Score",
    description: "Get 100% on the quiz",
    icon: "🏆",
    category: "quiz",
    points: 50,
    requirement: "quiz_perfect_scores >= 1",
  },
  {
    id: "quiz-five-attempts",
    title: "Dedicated Learner",
    description: "Complete the quiz 5 times",
    icon: "📚",
    category: "quiz",
    points: 25,
    requirement: "quiz_attempts >= 5",
  },
  {
    id: "quiz-three-perfect",
    title: "Quiz Master",
    description: "Get 3 perfect scores",
    icon: "👑",
    category: "mastery",
    points: 100,
    requirement: "quiz_perfect_scores >= 3",
  },

  // Learning Achievements
  {
    id: "docs-visited",
    title: "Knowledge Seeker",
    description: "Visit the documentation page",
    icon: "📖",
    category: "learning",
    points: 5,
    requirement: "visited_docs === true",
  },
  {
    id: "glossary-visited",
    title: "Terminology Expert",
    description: "Explore the glossary",
    icon: "📕",
    category: "learning",
    points: 10,
    requirement: "visited_glossary === true",
  },
  {
    id: "faq-visited",
    title: "Question Asker",
    description: "Check out the FAQ section",
    icon: "❓",
    category: "learning",
    points: 5,
    requirement: "visited_faq === true",
  },
  {
    id: "code-visited",
    title: "Code Explorer",
    description: "View the code examples",
    icon: "💻",
    category: "learning",
    points: 15,
    requirement: "visited_code === true",
  },
  {
    id: "all-pages-visited",
    title: "Site Navigator",
    description: "Visit all educational pages",
    icon: "🗺️",
    category: "exploration",
    points: 30,
    requirement: "visited_all_pages === true",
  },

  // Exploration Achievements
  {
    id: "visualizer-first-use",
    title: "Visual Learner",
    description: "Run the visualizer for the first time",
    icon: "🎨",
    category: "exploration",
    points: 15,
    requirement: "visualizer_runs >= 1",
  },
  {
    id: "visualizer-summation",
    title: "Addition Expert",
    description: "Complete a summation visualization",
    icon: "➕",
    category: "exploration",
    points: 20,
    requirement: "completed_summation >= 1",
  },
  {
    id: "visualizer-multiplication",
    title: "Multiplication Pro",
    description: "Complete a multiplication visualization",
    icon: "✖️",
    category: "exploration",
    points: 25,
    requirement: "completed_multiplication >= 1",
  },
  {
    id: "visualizer-ten-runs",
    title: "Protocol Enthusiast",
    description: "Run the visualizer 10 times",
    icon: "🔥",
    category: "exploration",
    points: 40,
    requirement: "visualizer_runs >= 10",
  },

  // Mastery Achievements
  {
    id: "early-adopter",
    title: "Early Adopter",
    description: "One of the first users of the platform",
    icon: "🌟",
    category: "mastery",
    points: 20,
    requirement: "first_visit_date !== null",
  },
  {
    id: "all-achievements",
    title: "Achievement Hunter",
    description: "Unlock 10 achievements",
    icon: "🎖️",
    category: "mastery",
    points: 75,
    requirement: "unlocked_count >= 10",
  },
  {
    id: "point-collector",
    title: "Point Collector",
    description: "Earn 200 achievement points",
    icon: "💎",
    category: "mastery",
    points: 50,
    requirement: "total_points >= 200",
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Unlock all achievements",
    icon: "🏅",
    category: "mastery",
    points: 200,
    requirement: "unlocked_all === true",
  },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalPoints: 0,
    completionPercentage: 0,
  });

  const loadUserProgress = useCallback((): UserProgress => {
    if (typeof window === "undefined") {
      return {
        quiz_attempts: 0,
        quiz_perfect_scores: 0,
        visited_docs: false,
        visited_glossary: false,
        visited_faq: false,
        visited_code: false,
        visited_all_pages: false,
        visualizer_runs: 0,
        completed_summation: 0,
        completed_multiplication: 0,
        first_visit_date: null,
        unlocked_count: 0,
        total_points: 0,
        unlocked_all: false,
      };
    }

    return {
      quiz_attempts: parseInt(localStorage.getItem("quiz_attempts") || "0"),
      quiz_perfect_scores: parseInt(localStorage.getItem("quiz_perfect_scores") || "0"),
      visited_docs: localStorage.getItem("visited_docs") === "true",
      visited_glossary: localStorage.getItem("visited_glossary") === "true",
      visited_faq: localStorage.getItem("visited_faq") === "true",
      visited_code: localStorage.getItem("visited_code") === "true",
      visited_all_pages: 
        localStorage.getItem("visited_docs") === "true" &&
        localStorage.getItem("visited_glossary") === "true" &&
        localStorage.getItem("visited_faq") === "true" &&
        localStorage.getItem("visited_code") === "true",
      visualizer_runs: parseInt(localStorage.getItem("visualizer_runs") || "0"),
      completed_summation: parseInt(localStorage.getItem("completed_summation") || "0"),
      completed_multiplication: parseInt(localStorage.getItem("completed_multiplication") || "0"),
      first_visit_date: localStorage.getItem("first_visit_date"),
      unlocked_count: 0, // Will be calculated
      total_points: 0, // Will be calculated
      unlocked_all: false, // Will be calculated
    };
  }, []);

  const checkAchievementRequirement = useCallback((
    achievement: Omit<Achievement, "unlocked" | "unlockedDate">,
    progress: UserProgress
  ): boolean => {
    try {
      // Special handling for meta-achievements
      if (achievement.id === "all-achievements") {
        const currentUnlocked = achievements.filter((a) => a.unlocked && a.id !== "all-achievements").length;
        return currentUnlocked >= 10;
      }
      if (achievement.id === "point-collector") {
        const currentPoints = achievements
          .filter((a) => a.unlocked && a.id !== "point-collector")
          .reduce((sum, a) => sum + a.points, 0);
        return currentPoints >= 200;
      }
      if (achievement.id === "completionist") {
        const totalAchievements = ACHIEVEMENTS_DATA.length;
        const currentUnlocked = achievements.filter((a) => a.unlocked && a.id !== "completionist").length;
        return currentUnlocked >= totalAchievements - 1;
      }

      // Evaluate requirement string
      const requirement = achievement.requirement;
      const context = { ...progress };
      
      // Simple requirement parsing
      if (requirement.includes(">=")) {
        const [key, value] = requirement.split(">=").map((s) => s.trim());
        const val = context[key];
        return (typeof val === 'number' ? val : 0) >= parseInt(value);
      }
      if (requirement.includes("===")) {
        const [key, value] = requirement.split("===").map((s) => s.trim());
        return context[key] === (value === "true");
      }

      return false;
    } catch {
      return false;
    }
  }, [achievements]);

  const loadAchievements = useCallback(() => {
    const savedData = typeof window !== "undefined" 
      ? localStorage.getItem("achievements") 
      : null;
    
    const unlockedAchievements = savedData ? JSON.parse(savedData) : {};

    // Check and unlock achievements based on current progress
    const progress = loadUserProgress();
    const updatedAchievements = ACHIEVEMENTS_DATA.map((achievement) => {
      const isUnlocked = checkAchievementRequirement(achievement, progress);
      const previousData = unlockedAchievements[achievement.id];

      return {
        ...achievement,
        unlocked: isUnlocked,
        unlockedDate: isUnlocked 
          ? previousData?.unlockedDate || new Date().toISOString()
          : undefined,
      };
    });

    // Save updated achievements
    const achievementsToSave = updatedAchievements.reduce((acc, achievement) => {
      if (achievement.unlocked) {
        acc[achievement.id] = {
          unlockedDate: achievement.unlockedDate,
        };
      }
      return acc;
    }, {} as Record<string, { unlockedDate: string }>);

    if (typeof window !== "undefined") {
      localStorage.setItem("achievements", JSON.stringify(achievementsToSave));
    }

    // Calculate stats
    const totalUnlocked = updatedAchievements.filter((a) => a.unlocked).length;
    const totalPoints = updatedAchievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    const completionPercentage = Math.round(
      (totalUnlocked / ACHIEVEMENTS_DATA.length) * 100
    );

    // Defer state updates to next microtask to avoid cascading render warning
    Promise.resolve().then(() => {
      setAchievements(updatedAchievements);
      setStats({ totalUnlocked, totalPoints, completionPercentage });
    });
  }, [loadUserProgress, checkAchievementRequirement]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAchievements();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAchievements]);

  const resetProgress = () => {
    if (typeof window === "undefined") return;
    
    const confirmReset = window.confirm(
      "Are you sure you want to reset all achievements? This cannot be undone."
    );
    
    if (confirmReset) {
      localStorage.removeItem("achievements");
      localStorage.removeItem("quiz_attempts");
      localStorage.removeItem("quiz_perfect_scores");
      localStorage.removeItem("visualizer_runs");
      localStorage.removeItem("completed_summation");
      localStorage.removeItem("completed_multiplication");
      loadAchievements();
    }
  };

  const categories = [
    { id: "all", label: "All", icon: "🎯" },
    { id: "quiz", label: "Quiz", icon: "📝" },
    { id: "learning", label: "Learning", icon: "📚" },
    { id: "exploration", label: "Exploration", icon: "🔍" },
    { id: "mastery", label: "Mastery", icon: "👑" },
  ];

  const filteredAchievements =
    selectedCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedAchievements = filteredAchievements.filter((a) => a.unlocked);
  const lockedAchievements = filteredAchievements.filter((a) => !a.unlocked);

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
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400">
            🏆 Achievements
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Track your learning journey and unlock badges as you master Shamir&apos;s Secret Sharing!
          </p>

          {/* Stats Dashboard */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-yellow-300 dark:border-yellow-700">
              <div className="text-4xl mb-2">🎖️</div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.totalUnlocked}/{ACHIEVEMENTS_DATA.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Achievements Unlocked
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-300 dark:border-orange-700">
              <div className="text-4xl mb-2">💎</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.totalPoints}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Points
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-red-300 dark:border-red-700">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.completionPercentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Completion
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mt-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-1000 ease-out"
                style={{ width: `${stats.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-400"
              }`}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              ✨ Unlocked ({unlockedAchievements.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="group p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl shadow-lg border-2 border-yellow-400 dark:border-yellow-600 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl animate-bounce">
                      {achievement.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        +{achievement.points}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        points
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                    {achievement.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {achievement.description}
                  </p>
                  {achievement.unlockedDate && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2">
                      <span>🗓️</span>
                      <span>
                        Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              🔒 Locked ({lockedAchievements.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-300 dark:border-gray-700 opacity-60 hover:opacity-80 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl grayscale">
                      {achievement.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        +{achievement.points}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        points
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-600 dark:text-gray-400">
                    {achievement.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="mt-12 text-center">
          <button
            onClick={resetProgress}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            🔄 Reset All Progress
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This will clear all achievements and statistics
          </p>
        </div>
      </div>
    </div>
  );
}
