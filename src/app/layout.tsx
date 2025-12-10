// src/app/layout.tsx
import "./globals.css";
import React from "react";
import Navigation from "@/components/Navigation";
import "katex/dist/katex.min.css";

export const metadata = {
  title: "Shamir MPC Visualizer",
  description: "Visual demo for Shamir secret sharing: sum & multiplication (reshare)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <Navigation />
        <main>{children}</main>
        <footer className="text-center text-sm py-8 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Built with <span className="text-red-500">❤️</span> using Next.js & TypeScript
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Shamir Secret Sharing Visualization • Secure Multi-Party Computation
          </p>
        </footer>
      </body>
    </html>
  );
}
