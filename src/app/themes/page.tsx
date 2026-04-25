/**
 * @fileoverview Theme Customizer page
 */
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  preview: {
    gradient: string;
    border: string;
  };
}

const themes: Theme[] = [
  {
    id: "default",
    name: "Classic Blue",
    description: "Default theme with cool blue tones",
    icon: "🔵",
    colors: {
      primary: "#3B82F6",
      secondary: "#8B5CF6",
      accent: "#EC4899",
      background: "#FFFFFF",
      text: "#1F2937",
    },
    preview: {
      gradient: "from-blue-600 via-purple-600 to-pink-600",
      border: "border-blue-500",
    },
  },
  {
    id: "sunset",
    name: "Sunset Warmth",
    description: "Warm orange and red tones",
    icon: "🌅",
    colors: {
      primary: "#F97316",
      secondary: "#EF4444",
      accent: "#FBBF24",
      background: "#FFF7ED",
      text: "#78350F",
    },
    preview: {
      gradient: "from-orange-500 via-red-500 to-yellow-500",
      border: "border-orange-500",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural green and earth tones",
    icon: "🌲",
    colors: {
      primary: "#10B981",
      secondary: "#059669",
      accent: "#34D399",
      background: "#F0FDF4",
      text: "#064E3B",
    },
    preview: {
      gradient: "from-green-600 via-emerald-600 to-teal-600",
      border: "border-green-500",
    },
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    description: "Calming blue and cyan tones",
    icon: "🌊",
    colors: {
      primary: "#06B6D4",
      secondary: "#0EA5E9",
      accent: "#22D3EE",
      background: "#ECFEFF",
      text: "#164E63",
    },
    preview: {
      gradient: "from-cyan-500 via-blue-500 to-sky-500",
      border: "border-cyan-500",
    },
  },
  {
    id: "lavender",
    name: "Lavender Dreams",
    description: "Soft purple and violet tones",
    icon: "💜",
    colors: {
      primary: "#A855F7",
      secondary: "#9333EA",
      accent: "#C084FC",
      background: "#FAF5FF",
      text: "#581C87",
    },
    preview: {
      gradient: "from-purple-500 via-violet-500 to-purple-600",
      border: "border-purple-500",
    },
  },
  {
    id: "cherry",
    name: "Cherry Blossom",
    description: "Delicate pink and rose tones",
    icon: "🌸",
    colors: {
      primary: "#EC4899",
      secondary: "#F472B6",
      accent: "#FCA5A5",
      background: "#FFF1F2",
      text: "#881337",
    },
    preview: {
      gradient: "from-pink-500 via-rose-500 to-red-400",
      border: "border-pink-500",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark theme with deep blue accents",
    icon: "🌙",
    colors: {
      primary: "#60A5FA",
      secondary: "#A78BFA",
      accent: "#818CF8",
      background: "#0F172A",
      text: "#F1F5F9",
    },
    preview: {
      gradient: "from-blue-400 via-purple-400 to-indigo-400",
      border: "border-blue-400",
    },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Classic black and white",
    icon: "⚫",
    colors: {
      primary: "#374151",
      secondary: "#6B7280",
      accent: "#9CA3AF",
      background: "#FFFFFF",
      text: "#111827",
    },
    preview: {
      gradient: "from-gray-700 via-gray-600 to-gray-500",
      border: "border-gray-600",
    },
  },
];

export default function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    // Apply theme colors to CSS variables
    document.documentElement.style.setProperty("--color-primary", theme.colors.primary);
    document.documentElement.style.setProperty("--color-secondary", theme.colors.secondary);
    document.documentElement.style.setProperty("--color-accent", theme.colors.accent);

    // Save to localStorage
    localStorage.setItem("app_theme", themeId);
  };

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem("app_theme") || "default";
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    setPreviewTheme(null);
  };

  const handlePreview = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    setPreviewTheme(theme || null);
  };

  const currentTheme = themes.find((t) => t.id === selectedTheme) || themes[0];

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
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            🎨 Theme Customizer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Personalize your learning experience with beautiful color themes
          </p>
        </div>

        {/* Current Theme Display */}
        <div className="mb-12 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Current Theme: {currentTheme.icon} {currentTheme.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {currentTheme.description}
              </p>
            </div>
            <div className="flex gap-3">
              {Object.entries(currentTheme.colors)
                .slice(0, 3)
                .map(([key, color]) => (
                  <div
                    key={key}
                    className="w-16 h-16 rounded-lg shadow-lg border-2 border-white dark:border-gray-700 transform hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={key}
                  ></div>
                ))}
            </div>
          </div>

          {/* Theme Preview */}
          <div
            className={`p-6 rounded-xl bg-gradient-to-r ${currentTheme.preview.gradient} text-white`}
          >
            <h3 className="text-2xl font-bold mb-2">Preview</h3>
            <p className="mb-4 opacity-90">
              This is how your theme looks with gradient backgrounds
            </p>
            <button className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Sample Button
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onMouseEnter={() => handlePreview(theme.id)}
              onMouseLeave={() => setPreviewTheme(null)}
              className={`group relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer ${
                selectedTheme === theme.id
                  ? `${theme.preview.border} shadow-2xl`
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              {/* Selected Badge */}
              {selectedTheme === theme.id && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg animate-bounce">
                  ✓
                </div>
              )}

              {/* Theme Icon & Name */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-3 transition-transform duration-300 group-hover:scale-125">
                  {theme.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {theme.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {theme.description}
                </p>
              </div>

              {/* Color Swatches */}
              <div className="flex justify-center gap-2 mb-4">
                {Object.entries(theme.colors)
                  .slice(0, 3)
                  .map(([key, color]) => (
                    <div
                      key={key}
                      className="w-8 h-8 rounded-full shadow-md border-2 border-white dark:border-gray-700"
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
              </div>

              {/* Gradient Preview */}
              <div
                className={`h-12 rounded-lg bg-gradient-to-r ${theme.preview.gradient}`}
              ></div>

              {/* Apply Button */}
              <button
                className={`mt-4 w-full py-2 rounded-lg font-semibold transition-all duration-300 ${
                  selectedTheme === theme.id
                    ? "bg-green-500 text-white"
                    : `bg-gradient-to-r ${theme.preview.gradient} text-white hover:shadow-lg`
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeSelect(theme.id);
                }}
              >
                {selectedTheme === theme.id ? "✓ Active" : "Apply Theme"}
              </button>
            </div>
          ))}
        </div>

        {/* Theme Details */}
        {previewTheme && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-300 dark:border-gray-600 animate-fade-in z-50">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {previewTheme.icon} {previewTheme.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {previewTheme.description}
            </p>
            <div className="space-y-2">
              {Object.entries(previewTheme.colors)
                .slice(0, 3)
                .map(([key, color]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded shadow-md border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {color}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {key}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            💡 Customization Tips
          </h3>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-xl">🎨</span>
              <span>Themes are saved automatically and persist across sessions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🖱️</span>
              <span>Hover over themes to see color details</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🌓</span>
              <span>Themes work with both light and dark system modes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">✨</span>
              <span>Try different themes for different moods and times of day</span>
            </li>
          </ul>
        </div>

        {/* Related Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            href="/visualizer"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              🎯
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Try Visualizer
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See your theme in action
            </p>
          </Link>

          <Link
            href="/achievements"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              🏆
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              View Achievements
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your progress
            </p>
          </Link>

          <Link
            href="/quiz"
            className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">
              🎓
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400">
              Take Quiz
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Test your knowledge
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
