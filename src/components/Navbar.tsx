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
 * Design: Inspired by Linear and Vercel navigation
 */
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll for glass effect intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links configuration
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/olympiads", label: "Olympiads" },
    { href: "/teams", label: "Teams" },
    { href: "/profile", label: "Profile" },
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
          </div>

          {/* Right Section: Theme Toggle & CTA */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Register Link */}
            <Link
              href="/register"
              className={`hidden sm:flex btn-secondary btn-sm ${
                pathname === "/register" ? "border-[var(--accent-color)]" : ""
              }`}
            >
              Register
            </Link>

            {/* CTA Button */}
            <Link
              href="/olympiads"
              className="btn btn-primary btn-sm"
            >
              <span className="hidden sm:inline">Find Teams</span>
              <span className="sm:hidden">Teams</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden btn-icon btn-ghost"
              aria-label="Toggle menu"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`}
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
            mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
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
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
