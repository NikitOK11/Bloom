import { describe, it, expect } from "vitest";
import { testDb, createTestUser, createTestTeam, addTeamMember } from "../helpers/test-db";
import { createMockRequest, parseResponse } from "../helpers/mock-request";
import { POST, DELETE } from "@/app/api/teams/[id]/join/route";

/**
 * Team Join API Tests
 * 
 * Joining teams is a critical user interaction.
 * These tests verify the business rules around team membership.
 */

describe("Team Join API", () => {
  describe("POST /api/teams/[id]/join", () => {
    // Why: Core functionality - users need to be able to join teams
    it("allows a user to join an open team", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const joiner = await createTestUser({ email: "joiner@test.com", name: "Joiner" });
      const team = await createTestTeam({ creatorId: creator.id });

      const request = createMockRequest(`http://localhost/api/teams/${team.id}/join`, {
        method: "POST",
        body: { userId: joiner.id },
      });

      const response = await POST(request, { params: Promise.resolve({ id: team.id }) });
      const data = await parseResponse<{ success: boolean; data: { role: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.role).toBe("member");

      // Verify in database
      const members = await testDb.teamMember.findMany({
        where: { teamId: team.id },
      });
      expect(members).toHaveLength(2); // Creator + new member
    });

    // Why: Prevent accidental double-joins which would corrupt data
    it("prevents duplicate membership", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const member = await createTestUser({ email: "member@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });
      
      // Add member first
      await addTeamMember(member.id, team.id);

      // Try to add again
      const request = createMockRequest(`http://localhost/api/teams/${team.id}/join`, {
        method: "POST",
        body: { userId: member.id },
      });

      const response = await POST(request, { params: Promise.resolve({ id: team.id }) });
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(409);
      expect(data.error).toContain("already a team member");
    });

    // Why: Team capacity is a business rule that must be enforced
    it("prevents joining a full team", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const member1 = await createTestUser({ email: "member1@test.com" });
      const wannaJoin = await createTestUser({ email: "wannajoin@test.com" });
      
      // Create team with max 2 members
      const team = await createTestTeam({ 
        creatorId: creator.id, 
        maxMembers: 2 
      });
      
      // Fill the team
      await addTeamMember(member1.id, team.id);

      // Try to join full team
      const request = createMockRequest(`http://localhost/api/teams/${team.id}/join`, {
        method: "POST",
        body: { userId: wannaJoin.id },
      });

      const response = await POST(request, { params: Promise.resolve({ id: team.id }) });
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("full");
    });

    // Why: Closed teams should not accept new members
    it("prevents joining a closed team", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const wannaJoin = await createTestUser({ email: "wannajoin@test.com" });
      
      const team = await createTestTeam({ 
        creatorId: creator.id, 
        isOpen: false 
      });

      const request = createMockRequest(`http://localhost/api/teams/${team.id}/join`, {
        method: "POST",
        body: { userId: wannaJoin.id },
      });

      const response = await POST(request, { params: Promise.resolve({ id: team.id }) });
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("not accepting");
    });

    // Why: Graceful error handling for invalid references
    it("returns 404 for nonexistent team", async () => {
      const user = await createTestUser({ email: "user@test.com" });

      const request = createMockRequest("http://localhost/api/teams/fake-id/join", {
        method: "POST",
        body: { userId: user.id },
      });

      const response = await POST(request, { params: Promise.resolve({ id: "fake-id" }) });
      expect(response.status).toBe(404);
    });

    // Why: Graceful error handling for invalid user references
    it("returns 404 for nonexistent user", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });

      const request = createMockRequest(`http://localhost/api/teams/${team.id}/join`, {
        method: "POST",
        body: { userId: "fake-user-id" },
      });

      const response = await POST(request, { params: Promise.resolve({ id: team.id }) });
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/teams/[id]/join", () => {
    // Why: Users should be able to leave teams they no longer want to be part of
    it("allows a member to leave a team", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const member = await createTestUser({ email: "member@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });
      await addTeamMember(member.id, team.id);

      const request = createMockRequest(
        `http://localhost/api/teams/${team.id}/join?userId=${member.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: team.id }) });
      expect(response.status).toBe(200);

      // Verify removal
      const membership = await testDb.teamMember.findUnique({
        where: { userId_teamId: { userId: member.id, teamId: team.id } },
      });
      expect(membership).toBeNull();
    });

    // Why: Creators abandoning teams would leave orphaned data
    it("prevents creator from leaving (must delete team instead)", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });

      const request = createMockRequest(
        `http://localhost/api/teams/${team.id}/join?userId=${creator.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: team.id }) });
      const data = await parseResponse<{ success: boolean; error: string }>(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("creator cannot leave");
    });
  });
});
