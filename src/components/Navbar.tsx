"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

/**
 * Navbar Component
 * 
 * Premium navigation bar with glassmorphism effect.
 * Features smooth animations and theme toggle.
 * 
 * UX Decision: Show Login/Register for guests, Profile/Settings for logged-in users.
 * Currently using localStorage to track "logged in" state (MVP approach).
 */
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Track scroll for glass effect intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check login state from localStorage/sessionStorage
  useEffect(() => {
    const checkAuth = () => {
      const userId = sessionStorage.getItem("pendingUserId") || localStorage.getItem("userId");
      const name = sessionStorage.getItem("pendingUserName") || localStorage.getItem("userName");
      setIsLoggedIn(!!userId);
      setUserName(name);
    };
    
    checkAuth();
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener("storage", checkAuth);
    // Custom event for same-tab auth changes
    window.addEventListener("authChange", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  // Navigation links - varies based on auth state
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/olympiads", label: "Olympiads" },
    { href: "/teams", label: "Teams" },
  ];

  // Check if a link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-[var(--bg-secondary)]/80 backdrop-blur-xl border-b border-[var(--surface-border)]" 
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <span className="text-lg">🌸</span>
            </div>
            <span className="font-bold text-xl text-[var(--text-primary)]">
              Bloom
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive(link.href) ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {/* Show Profile link only when logged in */}
            {isLoggedIn && (
              <Link
                href="/profile"
                className={`nav-link ${isActive("/profile") ? "nav-link-active" : ""}`}
              >
                Profile
              </Link>
            )}
          </div>

          {/* Right Section: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {isLoggedIn ? (
              /* Logged In State */
              <>
                {/* Settings */}
                <Link
                  href="/settings"
                  className="hidden sm:flex btn-icon btn-ghost"
                  aria-label="Settings"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                
                {/* User Avatar/Name */}
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-glass)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-sm font-medium text-[var(--accent-color)]">
                    {userName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">
                    {userName || "User"}
                  </span>
                </Link>
              </>
            ) : (
              /* Logged Out State */
              <>
                {/* Log In Button */}
                <Link
                  href="/login"
                  className={`hidden sm:flex btn-ghost btn-sm ${
                    pathname === "/login" ? "text-[var(--accent-color)]" : ""
                  }`}
                >
                  Log in
                </Link>

                {/* Register Button */}
                <Link
                  href="/register"
                  className="btn btn-primary btn-sm"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-color)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    isActive("/profile")
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-color)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)]"
                  }`}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] transition-colors"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-[var(--accent-color)] hover:bg-[var(--accent-subtle)] transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
