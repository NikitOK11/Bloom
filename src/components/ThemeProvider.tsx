"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * Theme Context
 * 
 * Provides theme switching functionality throughout the app.
 * Supports "light", "dark", and "system" preferences.
 * 
 * Features:
 * - Persists theme choice in localStorage
 * - Respects system preference when set to "system"
 * - Smooth animated transitions between themes
 */

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "bloom-theme";

/**
 * Get the resolved theme based on preference
 */
function getResolvedTheme(preference: ThemePreference): Theme {
  if (preference === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark"; // Default to dark on server
  }
  return preference;
}

/**
 * ThemeProvider Component
 * 
 * Wraps the app and provides theme context to all children.
 * Handles theme persistence and system preference detection.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start with dark theme (primary) - will be hydrated from storage
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("dark");
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const preference = stored || "dark"; // Default to dark (primary theme)
    setThemePreferenceState(preference);
    setTheme(getResolvedTheme(preference));
    
    // Also load and apply accent color from storage
    const savedAccent = localStorage.getItem("bloom-accent");
    if (savedAccent) {
      const accentColors: Record<string, string> = {
        rose: "#f43f5e",
        orange: "#f97316",
        amber: "#f59e0b",
        emerald: "#10b981",
        cyan: "#06b6d4",
        blue: "#3b82f6",
        violet: "#8b5cf6",
        pink: "#ec4899",
      };
      const color = accentColors[savedAccent];
      if (color) {
        document.documentElement.style.setProperty("--accent-color", color);
        document.documentElement.style.setProperty("--accent-subtle", `${color}15`);
      }
    }
    
    // Also load and apply font size from storage
    const savedFontSize = localStorage.getItem("bloom-font-size");
    if (savedFontSize) {
      const fontSizes: Record<string, string> = {
        small: "14px",
        medium: "16px",
        large: "18px",
      };
      const size = fontSizes[savedFontSize];
      if (size) {
        document.documentElement.style.fontSize = size;
      }
    }
    
    setMounted(true);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (themePreference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themePreference]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    
    // Also set class for Tailwind dark mode compatibility
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    localStorage.setItem(STORAGE_KEY, preference);
    setTheme(getResolvedTheme(preference));
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemePreference(newTheme);
  };

  // Prevent flash of wrong theme by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 * 
 * Access the current theme and theme switching functions.
 * Returns safe defaults when used outside ThemeProvider (SSR).
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return safe defaults for SSR/static generation
    return {
      theme: "dark" as Theme,
      themePreference: "dark" as ThemePreference,
      setThemePreference: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
