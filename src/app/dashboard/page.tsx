/**
 * @fileoverview User Dashboard
 */
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  const studentLinks = [
    {
      href: "/visualizer",
      title: "Interactive Visualizer",
      icon: "🎨",
      description: "Explore Shamir secret sharing",
    },
    { href: "/docs", title: "Documentation", icon: "📚", description: "Learn the theory" },
    { href: "/quiz", title: "Take Quiz", icon: "📝", description: "Test your knowledge" },
    {
      href: "/achievements",
      title: "Achievements",
      icon: "🏆",
      description: "Track your progress",
    },
  ];

  const adminLinks = [
    {
      href: "/admin/docs",
      title: "Manage Documentation",
      icon: "📝",
      description: "Edit and add content",
    },
    {
      href: "/admin/users",
      title: "Manage Users",
      icon: "👥",
      description: "View and manage users",
    },
    {
      href: "/admin/analytics",
      title: "Analytics",
      icon: "📊",
      description: "View platform statistics",
    },
  ];

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-40 right-10 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "3s" }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                    isAdmin
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  }`}
                >
                  {isAdmin ? "👑 Admin" : "🎓 Student"}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-purple-600">👑</span> Admin Panel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="text-4xl mb-3">{link.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{link.title}</h3>
                  <p className="text-white/90 text-sm">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Student Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="text-blue-600">📖</span> Learning Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl p-6 shadow-xl border-2 border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:border-blue-500"
              >
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
                  {link.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {link.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
