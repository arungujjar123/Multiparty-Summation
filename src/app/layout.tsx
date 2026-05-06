// src/app/layout.tsx
import "./globals.css";
import React from "react";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import "katex/dist/katex.min.css";
import { Sora, Space_Grotesk } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Shamir MPC Visualizer",
  description: "Visual demo for Shamir secret sharing: sum & multiplication (reshare)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${sora.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>
          <Navigation />
          <main className="page-animate">{children}</main>
          <footer className="text-center text-sm py-8 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4">
              <p className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-1">
                Shamir Secret Sharing Visualization • Secure Multi-Party Computation
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">
                © {new Date().getFullYear()} Shamir MPC Visualizer. All rights reserved by Dr.
                Kartick Sutradhar.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
