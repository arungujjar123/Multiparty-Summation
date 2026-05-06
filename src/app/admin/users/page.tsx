/**
 * @fileoverview Admin User Management
 */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, UserRole } from "@/lib/auth";

export default function AdminUsersPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "admin" | "student">("all");
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load users");
        return;
      }

      setUsers(data.users || []);
    } catch {
      setError("An unexpected error occurred while loading users.");
    }
  };

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/login");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      // Use setTimeout to avoid synchronous state update warning
      const timer = setTimeout(() => {
        loadUsers();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (confirm(`Change user role to ${newRole}?`)) {
      setError("");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to update user role");
        return;
      }

      loadUsers();
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      alert("You cannot delete your own account!");
      return;
    }

    if (confirm(`Are you sure you want to delete ${userName}?`)) {
      setError("");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to delete user");
        return;
      }

      loadUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "all") return true;
    return u.role === filter;
  });

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

  const adminCount = users.filter((u) => u.role === "admin").length;
  const studentCount = users.filter((u) => u.role === "student").length;

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
              👥 User Management
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users and their roles</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {users.length}
                </p>
              </div>
              <div className="text-4xl">👤</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">Admins</p>
                <p className="text-3xl font-bold text-white mt-1">{adminCount}</p>
              </div>
              <div className="text-4xl">👑</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium">Students</p>
                <p className="text-3xl font-bold text-white mt-1">{studentCount}</p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 font-bold rounded-lg transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilter("admin")}
            className={`px-6 py-2 font-bold rounded-lg transition-all ${
              filter === "admin"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
            }`}
          >
            Admins Only
          </button>
          <button
            onClick={() => setFilter("student")}
            className={`px-6 py-2 font-bold rounded-lg transition-all ${
              filter === "student"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
            }`}
          >
            Students Only
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {u.name}
                        </span>
                        {u.id === user?.id && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        disabled={u.id === user?.id}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                          u.role === "admin"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        } ${u.id === user?.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <option value="admin">👑 Admin</option>
                        <option value="student">🎓 Student</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={u.id === user?.id}
                        className={`px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-all ${
                          u.id === user?.id ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
