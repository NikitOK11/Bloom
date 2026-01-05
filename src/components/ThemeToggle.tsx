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
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-200 hover:bg-[var(--bg-hover)]"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {/* Sun Icon - shown in dark mode (click to go light) */}
        <svg
          className={`w-5 h-5 transition-all duration-300 ease-out absolute ${
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

        {/* Moon Icon - shown in light mode (click to go dark) */}
        <svg
          className={`w-5 h-5 transition-all duration-300 ease-out absolute ${
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
      </button>

      {/* Tooltip */}
      <div 
        className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-50"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--surface-border)',
        }}
      >
        {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        {/* Arrow */}
        <div 
          className="absolute -top-1 right-4 w-2 h-2 rotate-45"
          style={{
            background: 'var(--bg-elevated)',
            borderLeft: '1px solid var(--surface-border)',
            borderTop: '1px solid var(--surface-border)',
          }}
        />
      </div>
    </div>
  );
}
