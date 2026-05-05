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

    const visitedDocs = localStorage.getItem("visited_docs") === "true";
    const visitedGlossary = localStorage.getItem("visited_glossary") === "true";
    const visitedFaq = localStorage.getItem("visited_faq") === "true";
    const visitedCode = localStorage.getItem("visited_code") === "true";

    return {
      quiz_attempts: parseInt(localStorage.getItem("quiz_attempts") || "0"),
      quiz_perfect_scores: parseInt(localStorage.getItem("quiz_perfect_scores") || "0"),
      visited_docs: visitedDocs,
      visited_glossary: visitedGlossary,
      visited_faq: visitedFaq,
      visited_code: visitedCode,
      visited_all_pages: visitedDocs && visitedGlossary && visitedFaq && visitedCode,
      visualizer_runs: parseInt(localStorage.getItem("visualizer_runs") || "0"),
      completed_summation: parseInt(localStorage.getItem("completed_summation") || "0"),
      completed_multiplication: parseInt(localStorage.getItem("completed_multiplication") || "0"),
      first_visit_date: localStorage.getItem("first_visit_date"),
      unlocked_count: 0, // calculated later
      total_points: 0,
      unlocked_all: false,
    };
  }, []);

  const checkAchievementRequirement = useCallback((
    achievement: Omit<Achievement, "unlocked" | "unlockedDate">,
    progress: UserProgress,
    currentAchievements: Achievement[]
  ): boolean => {
    try {
      if (achievement.id === "all-achievements") {
        const currentUnlocked = currentAchievements.filter((a) => a.unlocked && a.id !== "all-achievements").length;
        return currentUnlocked >= 10;
      }
      if (achievement.id === "point-collector") {
        const currentPoints = currentAchievements
          .filter((a) => a.unlocked && a.id !== "point-collector")
          .reduce((sum, a) => sum + a.points, 0);
        return currentPoints >= 200;
      }
      if (achievement.id === "completionist") {
        const totalAchievements = ACHIEVEMENTS_DATA.length;
        const currentUnlocked = currentAchievements.filter((a) => a.unlocked && a.id !== "completionist").length;
        return currentUnlocked >= totalAchievements - 1;
      }

      const requirement = achievement.requirement;
      const context = { ...progress };
      
      if (requirement.includes(">=")) {
        const [key, value] = requirement.split(">=").map((s) => s.trim());
        const val = context[key];
        return (typeof val === 'number' ? val : 0) >= parseInt(value);
      }
      if (requirement.includes("===")) {
        const [key, value] = requirement.split("===").map((s) => s.trim());
        return context[key] === (value === "true");
      }
      if (requirement.includes("!== null")) {
        const key = requirement.split("!== null")[0].trim();
        return context[key] !== null;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const loadAchievements = useCallback(() => {
    const savedData = typeof window !== "undefined" ? localStorage.getItem("achievements") : null;
    const unlockedAchievements = savedData ? JSON.parse(savedData) : {};
    const progress = loadUserProgress();
    
    // Initial pass to set unlocked based on persistent storage
    let currentAchievements = ACHIEVEMENTS_DATA.map((achievement) => {
      const isPersistentUnlocked = !!unlockedAchievements[achievement.id];
      return {
        ...achievement,
        unlocked: isPersistentUnlocked,
        unlockedDate: isPersistentUnlocked ? unlockedAchievements[achievement.id].unlockedDate : undefined,
      };
    });

    // Check requirements and unlock new ones
    currentAchievements = currentAchievements.map((achievement) => {
      if (achievement.unlocked) return achievement;
      
      const isUnlocked = checkAchievementRequirement(achievement, progress, currentAchievements);
      return {
        ...achievement,
        unlocked: isUnlocked,
        unlockedDate: isUnlocked ? new Date().toISOString() : undefined,
      };
    });

    const totalUnlocked = currentAchievements.filter((a) => a.unlocked).length;
    const totalPoints = currentAchievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
    const completionPercentage = Math.round((totalUnlocked / ACHIEVEMENTS_DATA.length) * 100);

    setAchievements(currentAchievements);
    setStats({ totalUnlocked, totalPoints, completionPercentage });

    // Save back to storage
    if (typeof window !== "undefined") {
      const achievementsToSave = currentAchievements.reduce((acc, a) => {
        if (a.unlocked) acc[a.id] = { unlockedDate: a.unlockedDate };
        return acc;
      }, {} as Record<string, { unlockedDate?: string }>);
      localStorage.setItem("achievements", JSON.stringify(achievementsToSave));
    }
  }, [loadUserProgress, checkAchievementRequirement]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAchievements();
  }, [loadAchievements]);

  const resetProgress = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("Are you sure you want to reset all achievements? This cannot be undone.")) {
      localStorage.removeItem("achievements");
      localStorage.removeItem("quiz_attempts");
      localStorage.removeItem("quiz_perfect_scores");
      localStorage.removeItem("visualizer_runs");
      localStorage.removeItem("completed_summation");
      localStorage.removeItem("completed_multiplication");
      localStorage.removeItem("visited_docs");
      localStorage.removeItem("visited_glossary");
      localStorage.removeItem("visited_faq");
      localStorage.removeItem("visited_code");
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

  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter((a) => a.category === selectedCategory);

  const unlocked = filteredAchievements.filter((a) => a.unlocked);
  const locked = filteredAchievements.filter((a) => !a.unlocked);

  return (
    <div className="min-h-screen hero-surface hero-grid">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <Link href="/" className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400">
            🏆 Achievements
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Track your learning journey and unlock badges as you master Shamir&apos;s Secret Sharing!
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-yellow-300 dark:border-yellow-700">
              <div className="text-4xl mb-2">🎖️</div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalUnlocked}/{ACHIEVEMENTS_DATA.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Achievements Unlocked</div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-300 dark:border-orange-700">
              <div className="text-4xl mb-2">💎</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalPoints}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-red-300 dark:border-red-700">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.completionPercentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-1000 ease-out" style={{ width: `${stats.completionPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-orange-500"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {unlocked.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">✨ Unlocked ({unlocked.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlocked.map((a) => (
                <div key={a.id} className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl shadow-lg border-2 border-yellow-400 hover:shadow-2xl transition-all transform hover:scale-105 animate-fade-in">
                  <div className="flex justify-between mb-4">
                    <div className="text-5xl animate-bounce">{a.icon}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">+{a.points}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{a.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{a.description}</p>
                  {a.unlockedDate && <div className="text-xs text-gray-500">Unlocked: {new Date(a.unlockedDate).toLocaleDateString()}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">🔒 Locked ({locked.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locked.map((a) => (
                <div key={a.id} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-300 dark:border-gray-700 opacity-60 hover:opacity-80 transition-all">
                  <div className="flex justify-between mb-4">
                    <div className="text-5xl grayscale">{a.icon}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-400">+{a.points}</div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-600 dark:text-gray-400">{a.title}</h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <button onClick={resetProgress} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105">
            🔄 Reset All Progress
          </button>
        </div>
      </div>
    </div>
  );
}
