/**
 * @fileoverview Admin Analytics Dashboard
 */
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminAnalyticsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/login");
    }
  }, [isAdmin, isLoading, router]);

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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
              📊 Analytics
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Platform statistics and insights</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Analytics Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            This page will display detailed analytics about user activity, quiz performance, and
            documentation views.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">User Engagement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track active users and session data
              </p>
            </div>
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Quiz Performance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyze quiz scores and completion rates
              </p>
            </div>
            <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Content Views</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor documentation page views
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
