import { describe, it, expect } from "vitest";
import { testDb, createTestUser } from "../helpers/test-db";
import { createMockRequest, parseResponse, testData } from "../helpers/mock-request";
import { GET, POST } from "@/app/api/users/route";

/**
 * User API Route Tests
 * 
 * These tests verify the core user management functionality.
 * We test the happy path and critical error cases, not every edge case.
 */

describe("Users API", () => {
  describe("POST /api/users", () => {
    // Why: Creating users is fundamental - if this breaks, nothing else works
    it("creates a user with valid data", async () => {
      const request = createMockRequest("http://localhost/api/users", {
        method: "POST",
        body: testData.validUser,
      });

      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; data: { id: string; name: string; email: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(testData.validUser.name);
      expect(data.data.email).toBe(testData.validUser.email);
    });

    // Why: Email uniqueness is a business rule that prevents duplicate accounts
    it("rejects duplicate email addresses", async () => {
      // First, create a user
      await createTestUser({ email: "duplicate@example.com" });

      // Try to create another with same email
      const request = createMockRequest("http://localhost/api/users", {
        method: "POST",
        body: {
          ...testData.validUser,
          email: "duplicate@example.com",
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain("already registered");
    });

    // Why: Required fields must be enforced to maintain data integrity
    it("requires name and email", async () => {
      const request = createMockRequest("http://localhost/api/users", {
        method: "POST",
        body: { bio: "Just a bio" }, // Missing name and email
      });

      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    // Why: Skills/olympiads arrays should be properly converted to storage format
    it("stores skills and olympiads as comma-separated strings", async () => {
      const request = createMockRequest("http://localhost/api/users", {
        method: "POST",
        body: testData.validUser,
      });

      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; data: { id: string } }>(response);

      // Verify in database
      const user = await testDb.user.findUnique({
        where: { id: data.data.id },
      });

      expect(user?.skills).toBe("Mathematics,Problem Solving");
      expect(user?.olympiads).toBe("IMO,IPhO");
    });
  });

  describe("GET /api/users", () => {
    // Why: The users list is needed for browsing potential teammates
    it("returns all users", async () => {
      // Create test users
      await createTestUser({ name: "User 1", email: "user1@test.com" });
      await createTestUser({ name: "User 2", email: "user2@test.com" });

      const response = await GET();
      const data = await parseResponse<{ success: boolean; data: Array<{ name: string }> }>(response);

      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    // Why: Empty state should be handled gracefully
    it("returns empty array when no users exist", async () => {
      const response = await GET();
      const data = await parseResponse<{ success: boolean; data: unknown[] }>(response);

      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });
});
