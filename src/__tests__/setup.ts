import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { testDb, resetDatabase, disconnectTestDb } from "./helpers/test-db";

/**
 * Global Test Setup
 * 
 * This file runs before all tests and handles:
 * - Jest-DOM matchers for React Testing Library
 * - Test database lifecycle (connect, reset, disconnect)
 * 
 * We reset database BEFORE each test (not after) to ensure clean state
 * even if previous test crashed.
 */

// Connect to test database before running any tests
beforeAll(async () => {
  // Ensure test database schema is ready
  await testDb.$connect();
  // Clean slate at the start
  await resetDatabase();
});

// Reset database before each test for isolation
beforeEach(async () => {
  await resetDatabase();
});

// Cleanup: disconnect from database after all tests
afterAll(async () => {
  await disconnectTestDb();
});
