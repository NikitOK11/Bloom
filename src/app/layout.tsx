import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

/**
 * Font Configuration
 * 
 * Using Inter - a clean, modern sans-serif font with
 * excellent readability for UI. Similar to SF Pro.
 */
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Metadata for SEO
 */
export const metadata: Metadata = {
  title: "Bloom | Find Your Olympiad Team",
  description: "Connect with talented olympiad participants and build your dream competition team. A premium platform for academic excellence.",
  keywords: ["olympiad", "team", "competition", "hackathon", "academics"],
};

/**
 * Root Layout
 * 
 * Provides:
 * - Theme provider for dark/light mode
 * - Global styles and design system
 * - Shared navigation
 * - Consistent page structure with premium aesthetic
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('bloom-theme') || 'dark';
                if (theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {/* Gradient background mesh for visual depth */}
          <div className="fixed inset-0 gradient-mesh pointer-events-none -z-10" />
          
          {/* Navigation bar - appears on all pages */}
          <Navbar />
          
          {/* Main content area with consistent padding */}
          <main className="min-h-screen pt-20 pb-16">
            {children}
          </main>

          {/* Premium footer */}
          <footer className="border-t border-subtle">
            <div className="container py-12">
              <div className="grid md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center">
                      <span className="text-xl">🌸</span>
                    </div>
                    <span className="text-xl font-bold text-primary">Bloom</span>
                  </div>
                  <p className="text-secondary max-w-md">
                    The premier platform for finding teammates for olympiads, hackathons, and academic competitions. 
                    Build exceptional teams, achieve extraordinary results.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="font-semibold text-primary mb-4">Platform</h4>
                  <ul className="space-y-2">
                    <li><a href="/olympiads" className="text-secondary hover:text-accent transition-colors">Olympiads</a></li>
                    <li><a href="/teams" className="text-secondary hover:text-accent transition-colors">Teams</a></li>
                    <li><a href="/profile" className="text-secondary hover:text-accent transition-colors">Profile</a></li>
                  </ul>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="font-semibold text-primary mb-4">Resources</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-secondary hover:text-accent transition-colors">Help Center</a></li>
                    <li><a href="#" className="text-secondary hover:text-accent transition-colors">Guidelines</a></li>
                    <li><a href="#" className="text-secondary hover:text-accent transition-colors">Contact</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="divider" />
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted">
                <p>© 2026 Bloom. Crafted for excellence.</p>
                <div className="flex items-center gap-6">
                  <a href="#" className="hover:text-secondary transition-colors">Privacy</a>
                  <a href="#" className="hover:text-secondary transition-colors">Terms</a>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
