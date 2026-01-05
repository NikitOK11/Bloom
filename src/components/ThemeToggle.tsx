"use client";

import { useTheme } from "./ThemeProvider";

/**
 * ThemeToggle Component
 * 
 * A beautiful animated toggle button for switching between light and dark themes.
 * Features smooth icon transitions and subtle hover effects.
 * 
 * Design: Follows the premium, minimal aesthetic with glassmorphism.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn-icon btn-ghost relative overflow-hidden group"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Sun Icon */}
      <svg
        className={`w-5 h-5 absolute transition-all duration-300 ease-out ${
          theme === "dark" 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon Icon */}
      <svg
        className={`w-5 h-5 absolute transition-all duration-300 ease-out ${
          theme === "light" 
            ? "rotate-0 scale-100 opacity-100" 
            : "rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {/* Hover ring effect */}
      <span className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
    </button>
  );
}
