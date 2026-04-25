/**
 * @fileoverview Modern navigation component with styled navbar
 */
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.push("/");
  };

  const publicLinks = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/visualizer", label: "Visualizer", icon: "🔬" },
    { href: "/docs", label: "Documentation", icon: "📚" },
  ];

  const userLinks = [
    { href: "/quiz", label: "Quiz", icon: "🎯" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/achievements", label: "Achievements", icon: "🏆" },
  ];

  const adminLinks = [{ href: "/admin/docs", label: "Admin", icon: "👑" }];

  const navLinks = [...publicLinks, ...(user ? userLinks : []), ...(isAdmin ? adminLinks : [])];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/70 border-b border-slate-800/60 shadow-lg backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-linear-to-br from-cyan-400 to-sky-500 rounded-lg flex items-center justify-center shadow-md shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-sky-300">
                  Shamir MPC
                </h1>
                <p className="text-xs text-slate-400">Visualizer</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-linear-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/40 scale-105"
                      : "text-slate-200/80 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}

            {/* Auth Button */}
            {!user ? (
              <Link
                href="/login"
                className="px-4 py-2 bg-linear-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-bold rounded-lg shadow-md shadow-cyan-500/40 transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>🔐</span>
                Login
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    isAdmin
                      ? "bg-linear-to-r from-cyan-400 to-emerald-300 text-slate-950"
                      : "bg-linear-to-r from-sky-400 to-cyan-300 text-slate-950"
                  }`}
                >
                  {isAdmin ? "👑" : "🎓"} {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs font-bold bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-200 hover:bg-slate-900/60"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-t border-slate-800/60">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? "bg-linear-to-r from-cyan-400 to-sky-500 text-slate-950"
                      : "text-slate-200/80 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
            {/* Mobile Auth Button */}
            {!user ? (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium bg-linear-to-r from-cyan-400 to-sky-500 text-slate-950"
              >
                <span>🔐</span> Login
              </Link>
            ) : (
              <div className="px-3 py-2 flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    isAdmin
                      ? "bg-linear-to-r from-cyan-400 to-emerald-300 text-slate-950"
                      : "bg-linear-to-r from-sky-400 to-cyan-300 text-slate-950"
                  }`}
                >
                  {isAdmin ? "👑" : "🎓"} {user.name}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 text-xs font-bold bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            )}{" "}
          </div>
        </div>
      )}
    </nav>
  );
}
