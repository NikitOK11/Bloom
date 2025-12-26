import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

/**
 * Font Configuration
 * 
 * Using Inter - a clean, modern sans-serif font that's
 * highly readable and works great for UI.
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata for SEO
 */
export const metadata: Metadata = {
  title: "Olympiad Teammates | Find Your Team",
  description: "Connect with fellow olympiad participants and build your dream team for competitions.",
};

/**
 * Root Layout
 * 
 * This wraps all pages and provides:
 * - Global styles
 * - Shared navigation
 * - Consistent page structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation bar - appears on all pages */}
        <Navbar />
        
        {/* Main content area with consistent padding */}
        <main className="min-h-screen pt-16">
          {children}
        </main>

        {/* Simple footer */}
        <footer className="bg-gray-100 py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>© 2024 Olympiad Teammates. Built for olympiad participants, by olympiad participants.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
