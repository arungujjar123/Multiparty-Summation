/**
 * @fileoverview Authentication context provider
 */
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, isAdmin } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const data = await response.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Login failed" };
    }

    setUser(data.user || null);
    return { success: true };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Signup failed" };
    }

    setUser(data.user || null);
    return { success: true };
  };

  const signOut = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => setUser(null));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: isAdmin(user),
      isLoading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
