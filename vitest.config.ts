import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest Configuration
 * 
 * Key decisions:
 * - Use jsdom for React component testing
 * - Separate test environment from dev database
 * - Path aliases match tsconfig for consistency
 * - Tests run sequentially to avoid database race conditions
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM-related tests
    environment: "jsdom",
    
    // Global setup for test database
    setupFiles: ["./src/__tests__/setup.ts"],
    
    // Include test files from __tests__ directories
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    
    // Exclude node_modules and build output
    exclude: ["node_modules", ".next", "out"],
    
    // Enable global test functions (describe, it, expect)
    globals: true,
    
    // Run tests sequentially to avoid database race conditions
    // This is important when tests share a database
    sequence: {
      concurrent: false,
    },
    
    // Pool options for test isolation
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run all tests in single process for DB sharing
      },
    },
    
    // Coverage configuration (opt-in)
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
