import { describe, it, expect } from "vitest";
import { testDb, createTestUser, createTestTeam } from "../helpers/test-db";
import { createMockRequest, parseResponse, testData } from "../helpers/mock-request";
import { GET, POST } from "@/app/api/teams/route";

/**
 * Teams API Route Tests
 * 
 * Tests for team creation and listing functionality.
 * Focus on business-critical operations.
 */

describe("Teams API", () => {
  describe("POST /api/teams", () => {
    // Why: Team creation is core functionality for the platform
    it("creates a team and adds creator as first member", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });

      const request = createMockRequest("http://localhost/api/teams", {
        method: "POST",
        body: {
          ...testData.validTeam,
          creatorId: creator.id,
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; data: { id: string; name: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(testData.validTeam.name);

      // Verify creator was automatically added as member
      const members = await testDb.teamMember.findMany({
        where: { teamId: data.data.id },
      });
      expect(members).toHaveLength(1);
      expect(members[0].role).toBe("creator");
      expect(members[0].userId).toBe(creator.id);
    });

    // Why: Teams must have a creator - orphaned teams cause data issues
    it("rejects team creation without valid creator", async () => {
      const request = createMockRequest("http://localhost/api/teams", {
        method: "POST",
        body: {
          ...testData.validTeam,
          creatorId: "nonexistent-id",
        },
      });

      const response = await POST(request);
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(404);
      expect(data.error).toContain("Creator not found");
    });

    // Why: Required fields validation prevents incomplete teams
    it("requires name, olympiad, and creatorId", async () => {
      const request = createMockRequest("http://localhost/api/teams", {
        method: "POST",
        body: { description: "Just a description" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/teams", () => {
    // Why: Team browsing is how users discover teams to join
    it("returns teams with creator info and member count", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      await createTestTeam({
        name: "Test Team",
        creatorId: creator.id,
      });

      const request = createMockRequest("http://localhost/api/teams");
      const response = await GET(request);
      const data = await parseResponse<{
        success: boolean;
        data: Array<{
          name: string;
          creator: { name: string };
          _count: { members: number };
        }>;
      }>(response);

      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].creator.name).toBe("Test User");
      expect(data.data[0]._count.members).toBe(1); // Creator is a member
    });

    // Why: Filtering is important UX - users want to find relevant teams
    it("filters teams by olympiad when query param provided", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      await createTestTeam({ olympiad: "IMO", creatorId: creator.id });
      await createTestTeam({ 
        olympiad: "IOI", 
        creatorId: creator.id,
        name: "IOI Team" 
      });

      const request = createMockRequest("http://localhost/api/teams?olympiad=IMO");
      const response = await GET(request);
      const data = await parseResponse<{ data: Array<{ olympiad: string }> }>(response);

      expect(data.data).toHaveLength(1);
      expect(data.data[0].olympiad).toBe("IMO");
    });
  });
});
