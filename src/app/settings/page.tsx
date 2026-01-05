"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Settings Page
 * 
 * Comprehensive settings with:
 * - Appearance: Theme, Accent Color, Font Size
 * - Privacy: Clear site data
 * - Account: View email, Log out
 * 
 * All settings persist to localStorage for cross-session consistency.
 */

// Accent color presets with beautiful gradients
const accentColors = [
  { id: "rose", name: "Rose", color: "#f43f5e", gradient: "from-rose-500 to-pink-500" },
  { id: "orange", name: "Orange", color: "#f97316", gradient: "from-orange-500 to-amber-500" },
  { id: "amber", name: "Amber", color: "#f59e0b", gradient: "from-amber-500 to-yellow-500" },
  { id: "emerald", name: "Emerald", color: "#10b981", gradient: "from-emerald-500 to-teal-500" },
  { id: "cyan", name: "Cyan", color: "#06b6d4", gradient: "from-cyan-500 to-blue-500" },
  { id: "blue", name: "Blue", color: "#3b82f6", gradient: "from-blue-500 to-indigo-500" },
  { id: "violet", name: "Violet", color: "#8b5cf6", gradient: "from-violet-500 to-purple-500" },
  { id: "pink", name: "Pink", color: "#ec4899", gradient: "from-pink-500 to-rose-500" },
];

// Font size options
const fontSizes = [
  { id: "small", name: "Small", size: "14px", preview: "Aa" },
  { id: "medium", name: "Medium", size: "16px", preview: "Aa" },
  { id: "large", name: "Large", size: "18px", preview: "Aa" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useTheme();
  
  // Settings state - initialize as null until loaded from storage
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load settings and auth state on mount
  useEffect(() => {
    // Load saved settings
    const savedAccent = localStorage.getItem("bloom-accent") || "rose";
    const savedFontSize = localStorage.getItem("bloom-font-size") || "medium";
    setAccentColor(savedAccent);
    setFontSize(savedFontSize);

    // Load auth state
    const userId = sessionStorage.getItem("pendingUserId") || localStorage.getItem("userId");
    const name = sessionStorage.getItem("pendingUserName") || localStorage.getItem("userName");
    const email = sessionStorage.getItem("userEmail") || localStorage.getItem("userEmail");
    setIsLoggedIn(!!userId);
    setUserName(name);
    setUserEmail(email);
    
    setMounted(true);
  }, []);

  // Apply accent color only when explicitly changed by user (not on mount)
  const handleAccentColorChange = (newAccent: string) => {
    setAccentColor(newAccent);
    const selectedColor = accentColors.find(c => c.id === newAccent);
    if (selectedColor) {
      document.documentElement.style.setProperty("--accent-color", selectedColor.color);
      document.documentElement.style.setProperty("--accent-subtle", `${selectedColor.color}15`);
      localStorage.setItem("bloom-accent", newAccent);
    }
  };

  // Apply font size
  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    const size = fontSizes.find(f => f.id === newSize)?.size || "16px";
    document.documentElement.style.fontSize = size;
    localStorage.setItem("bloom-font-size", newSize);
  };

  // Clear all site data
  const handleClearData = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Reset state
    setIsLoggedIn(false);
    setUserName(null);
    setUserEmail(null);
    setShowClearConfirm(false);
    setClearSuccess(true);

    // Dispatch auth change
    window.dispatchEvent(new Event("authChange"));

    // Hide success after 3s
    setTimeout(() => setClearSuccess(false), 3000);
  };

  // Log out
  const handleLogout = () => {
    // Clear auth data only
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("pendingUserId");
    sessionStorage.removeItem("pendingUserName");
    sessionStorage.removeItem("userEmail");

    setIsLoggedIn(false);
    setUserName(null);
    setUserEmail(null);

    // Dispatch auth change
    window.dispatchEvent(new Event("authChange"));

    // Redirect to home
    router.push("/");
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container max-w-2xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Settings
          </h1>
          <p className="text-[var(--text-secondary)]">
            Customize your Bloom experience
          </p>
        </div>

        {/* Success Message */}
        {clearSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--success-color)]/10 border border-[var(--success-color)]/20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--success-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-[var(--success-color)]">All site data has been cleared successfully.</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Appearance Section */}
          <section className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Appearance
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Customize how Bloom looks on your device
                </p>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "light", name: "Light", icon: "☀️" },
                  { id: "dark", name: "Dark", icon: "🌙" },
                  { id: "system", name: "System", icon: "💻" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemePreference(t.id as "light" | "dark" | "system")}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      themePreference === t.id
                        ? "border-[var(--accent-color)] bg-[var(--accent-subtle)]"
                        : "border-[var(--surface-border)] hover:border-[var(--accent-color)]/50 bg-[var(--bg-tertiary)]"
                    }`}
                  >
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {t.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleAccentColorChange(color.id)}
                    className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                      accentColor === color.id
                        ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--text-primary)] scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                    aria-label={`Select ${color.name} accent color`}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {fontSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleFontSizeChange(size.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      fontSize === size.id
                        ? "border-[var(--accent-color)] bg-[var(--accent-subtle)]"
                        : "border-[var(--surface-border)] hover:border-[var(--accent-color)]/50 bg-[var(--bg-tertiary)]"
                    }`}
                  >
                    <div 
                      className="font-semibold text-[var(--text-primary)] mb-1"
                      style={{ fontSize: size.size }}
                    >
                      {size.preview}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {size.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Privacy Section */}
          <section className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Privacy
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Manage your data and privacy settings
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Clear Site Data */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                <div className="flex-1 mr-4">
                  <h3 className="font-medium text-[var(--text-primary)] mb-1">
                    Clear site data
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Remove all cookies, local storage, and session data. This will log you out.
                  </p>
                </div>
                {showClearConfirm ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearData}
                      className="btn btn-danger btn-sm"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="btn btn-secondary btn-sm shrink-0"
                  >
                    Clear data
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Account
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Manage your account settings
                </p>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-xl font-semibold text-[var(--accent-color)]">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">
                        {userName || "User"}
                      </div>
                      {userEmail && (
                        <div className="text-sm text-[var(--text-muted)] truncate">
                          {userEmail}
                        </div>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className="btn btn-secondary btn-sm shrink-0"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>

                {/* Log Out */}
                <button
                  onClick={handleLogout}
                  className="w-full p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--error-color)]/10 border border-transparent hover:border-[var(--error-color)]/20 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)] group-hover:text-[var(--error-color)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Log out</span>
                  </div>
                </button>
              </div>
            ) : (
              /* Not Logged In */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-[var(--text-primary)] mb-2">
                  You're not logged in
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Sign in to access your account settings
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/login" className="btn btn-secondary">
                    Log in
                  </Link>
                  <Link href="/register" className="btn btn-primary">
                    Create account
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="text-center text-sm text-[var(--text-muted)]">
            <p>Bloom • Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
