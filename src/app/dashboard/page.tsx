/**
 * @fileoverview Learning Dashboard page
 */
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface QuizAttempt {
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
}

interface StudySession {
  page: string;
  duration: number;
  timestamp: string;
}

interface DashboardStats {
  totalQuizAttempts: number;
  perfectScores: number;
  averageScore: number;
  highestScore: number;
  totalStudyTime: number;
  pagesVisited: number;
  currentStreak: number;
  achievements: number;
  lastVisit: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuizAttempts: 0,
    perfectScores: 0,
    averageScore: 0,
    highestScore: 0,
    totalStudyTime: 0,
    pagesVisited: 0,
    currentStreak: 0,
    achievements: 0,
    lastVisit: "",
  });

  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [recentActivity, setRecentActivity] = useState<StudySession[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
    trackPageVisit();
  }, []);

  const loadDashboardData = () => {
    if (typeof window === "undefined") return;

    // Load quiz statistics
    const quizAttempts = parseInt(localStorage.getItem("quiz_attempts") || "0");
    const perfectScores = parseInt(localStorage.getItem("quiz_perfect_scores") || "0");
    const quizHistoryData = JSON.parse(localStorage.getItem("quiz_history") || "[]");
    
    // Calculate average score
    let averageScore = 0;
    let highestScore = 0;
    if (quizHistoryData.length > 0) {
      const totalScore = quizHistoryData.reduce((sum: number, attempt: QuizAttempt) => sum + attempt.percentage, 0);
      averageScore = Math.round(totalScore / quizHistoryData.length);
      highestScore = Math.max(...quizHistoryData.map((a: QuizAttempt) => a.percentage));
    }

    // Load study time
    const totalStudyTime = parseInt(localStorage.getItem("total_study_time") || "0");

    // Count pages visited
    const visitedPages = [
      localStorage.getItem("visited_docs"),
      localStorage.getItem("visited_glossary"),
      localStorage.getItem("visited_faq"),
      localStorage.getItem("visited_code"),
      localStorage.getItem("visited_visualizer"),
    ].filter((v) => v === "true").length;

    // Load achievements count
    const achievementsData = JSON.parse(localStorage.getItem("achievements") || "{}");
    const achievementsCount = Object.keys(achievementsData).length;

    // Calculate streak
    const streak = calculateStreak();

    // Get last visit
    const lastVisit = localStorage.getItem("last_visit_date") || new Date().toISOString();

    setStats({
      totalQuizAttempts: quizAttempts,
      perfectScores: perfectScores,
      averageScore: averageScore,
      highestScore: highestScore,
      totalStudyTime: totalStudyTime,
      pagesVisited: visitedPages,
      currentStreak: streak,
      achievements: achievementsCount,
      lastVisit: lastVisit,
    });

    setQuizHistory(quizHistoryData.slice(-5).reverse());

    // Load recent activity
    const activityData = JSON.parse(localStorage.getItem("recent_activity") || "[]");
    setRecentActivity(activityData.slice(-10).reverse());

    // Generate recommendations
    generateRecommendations(quizAttempts, visitedPages, averageScore);
  };

  const calculateStreak = (): number => {
    const visitDates = JSON.parse(localStorage.getItem("visit_dates") || "[]");
    if (visitDates.length === 0) return 0;

    let streak = 1;
    const today = new Date().toDateString();
    
    for (let i = visitDates.length - 1; i > 0; i--) {
      const currentDate = new Date(visitDates[i]).toDateString();
      const prevDate = new Date(visitDates[i - 1]).toDateString();
      
      const diffTime = new Date(currentDate).getTime() - new Date(prevDate).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const trackPageVisit = () => {
    if (typeof window === "undefined") return;

    const today = new Date().toISOString().split("T")[0];
    const visitDates = JSON.parse(localStorage.getItem("visit_dates") || "[]");
    
    if (!visitDates.includes(today)) {
      visitDates.push(today);
      localStorage.setItem("visit_dates", JSON.stringify(visitDates));
    }

    localStorage.setItem("last_visit_date", new Date().toISOString());

    // Track session
    const activity: StudySession = {
      page: "dashboard",
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    const recentActivity = JSON.parse(localStorage.getItem("recent_activity") || "[]");
    recentActivity.push(activity);
    localStorage.setItem("recent_activity", JSON.stringify(recentActivity));
  };

  const generateRecommendations = (
    quizAttempts: number,
    pagesVisited: number,
    averageScore: number
  ) => {
    const recs: string[] = [];

    if (quizAttempts === 0) {
      recs.push("Take your first quiz to test your knowledge!");
    } else if (averageScore < 60) {
      recs.push("Review the documentation to improve your quiz scores");
      recs.push("Check out the code examples for practical understanding");
    } else if (averageScore < 80) {
      recs.push("You're doing well! Try the visualizer to deepen your understanding");
    } else {
      recs.push("Excellent work! Challenge yourself with the multiplication protocol");
    }

    if (pagesVisited < 3) {
      recs.push("Explore more educational pages to unlock achievements");
    }

    if (!localStorage.getItem("visited_glossary")) {
      recs.push("Visit the glossary to learn key terminology");
    }

    if (!localStorage.getItem("visited_code")) {
      recs.push("Check out code examples to see implementations");
    }

    if (quizAttempts > 0 && quizAttempts < 3) {
      recs.push("Take the quiz multiple times to reinforce learning");
    }

    setRecommendations(recs.slice(0, 4));
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getProgressLevel = (): { level: number; title: string; nextLevel: number } => {
    const totalPoints = stats.achievements * 50 + stats.totalQuizAttempts * 10 + stats.pagesVisited * 20;
    const level = Math.floor(totalPoints / 100) + 1;
    const nextLevelPoints = level * 100;
    const progress = ((totalPoints % 100) / 100) * 100;

    const titles = [
      "Beginner",
      "Learner",
      "Enthusiast",
      "Explorer",
      "Scholar",
      "Expert",
      "Master",
      "Cryptographer",
    ];

    return {
      level: level,
      title: titles[Math.min(level - 1, titles.length - 1)],
      nextLevel: Math.round(progress),
    };
  };

  const progress = getProgressLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <Link
            href="/"
            className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
          >
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            📊 Learning Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Track your progress, analyze performance, and get personalized recommendations
          </p>
        </div>

        {/* Level Progress */}
        <div className="mb-12 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Level {progress.level} - {progress.title}
              </h2>
              <p className="text-indigo-100">
                Keep learning to reach the next level!
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{progress.nextLevel}%</div>
              <div className="text-sm text-indigo-100">to next level</div>
            </div>
          </div>
          <div className="h-4 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000"
              style={{ width: `${progress.nextLevel}%` }}
            ></div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-300 dark:border-blue-700 hover:shadow-2xl transition-all duration-300">
            <div className="text-4xl mb-3">📝</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalQuizAttempts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Quiz Attempts
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-green-300 dark:border-green-700 hover:shadow-2xl transition-all duration-300">
            <div className="text-4xl mb-3">⭐</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.averageScore}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Score
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-purple-300 dark:border-purple-700 hover:shadow-2xl transition-all duration-300">
            <div className="text-4xl mb-3">🔥</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.currentStreak}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Day Streak
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-300 dark:border-orange-700 hover:shadow-2xl transition-all duration-300">
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.achievements}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Achievements
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎯</div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stats.perfectScores}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Perfect Scores
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📚</div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stats.pagesVisited}/5
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pages Explored
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📈</div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stats.highestScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Highest Score
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Quiz History */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span>📊</span> Recent Quiz Performance
            </h3>
            {quizHistory.length > 0 ? (
              <div className="space-y-3">
                {quizHistory.map((attempt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-2xl ${
                          attempt.percentage === 100
                            ? "animate-bounce"
                            : ""
                        }`}
                      >
                        {attempt.percentage === 100
                          ? "🏆"
                          : attempt.percentage >= 80
                          ? "⭐"
                          : attempt.percentage >= 60
                          ? "👍"
                          : "📝"}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          {attempt.score}/{attempt.totalQuestions} correct
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(attempt.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          attempt.percentage >= 80
                            ? "text-green-600 dark:text-green-400"
                            : attempt.percentage >= 60
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {attempt.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No quiz attempts yet
                </p>
                <Link
                  href="/quiz"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Take Your First Quiz
                </Link>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span>💡</span> Personalized Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                >
                  <div className="text-2xl mt-1">
                    {index === 0 ? "🎯" : index === 1 ? "📚" : index === 2 ? "🚀" : "✨"}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 flex-1">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <Link
            href="/quiz"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              📝
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Take Quiz
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test your knowledge
            </p>
          </Link>

          <Link
            href="/visualizer"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              🎯
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              Visualizer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See it in action
            </p>
          </Link>

          <Link
            href="/achievements"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              🏆
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
              Achievements
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View badges
            </p>
          </Link>

          <Link
            href="/docs"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              📚
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
              Documentation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Learn theory
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
