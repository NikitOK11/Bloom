import { describe, it, expect } from "vitest";
import { testDb, createTestUser, createTestTeam, addTeamMember } from "../helpers/test-db";

/**
 * Prisma Relation Tests
 * 
 * These tests verify that our database relationships work correctly.
 * We test the data layer directly, separate from API routes.
 * 
 * Why test relations?
 * - Catches schema misconfigurations early
 * - Documents expected data relationships
 * - Ensures cascade deletes work properly
 */

describe("Database Relations", () => {
  describe("User-Team relationships", () => {
    // Why: A user should be able to create multiple teams
    it("user can create multiple teams", async () => {
      const user = await createTestUser({ email: "creator@test.com" });
      
      await createTestTeam({ name: "Team 1", creatorId: user.id });
      await createTestTeam({ name: "Team 2", creatorId: user.id });

      const userWithTeams = await testDb.user.findUnique({
        where: { id: user.id },
        include: { createdTeams: true },
      });

      expect(userWithTeams?.createdTeams).toHaveLength(2);
    });

    // Why: A user should be able to be a member of multiple teams
    it("user can be member of multiple teams", async () => {
      const creator1 = await createTestUser({ email: "creator1@test.com" });
      const creator2 = await createTestUser({ email: "creator2@test.com" });
      const member = await createTestUser({ email: "member@test.com" });

      const team1 = await createTestTeam({ creatorId: creator1.id });
      const team2 = await createTestTeam({ creatorId: creator2.id, name: "Team 2" });

      await addTeamMember(member.id, team1.id);
      await addTeamMember(member.id, team2.id);

      const memberWithTeams = await testDb.user.findUnique({
        where: { id: member.id },
        include: { teamMembers: { include: { team: true } } },
      });

      expect(memberWithTeams?.teamMembers).toHaveLength(2);
    });

    // Why: Team should have access to all its members
    it("team includes all members with user details", async () => {
      const creator = await createTestUser({ email: "creator@test.com", name: "Creator" });
      const member1 = await createTestUser({ email: "member1@test.com", name: "Member 1" });
      const member2 = await createTestUser({ email: "member2@test.com", name: "Member 2" });

      const team = await createTestTeam({ creatorId: creator.id });
      await addTeamMember(member1.id, team.id);
      await addTeamMember(member2.id, team.id);

      const teamWithMembers = await testDb.team.findUnique({
        where: { id: team.id },
        include: {
          members: {
            include: { user: true },
          },
        },
      });

      expect(teamWithMembers?.members).toHaveLength(3); // Creator + 2 members
      
      const memberNames = teamWithMembers?.members.map(m => m.user.name);
      expect(memberNames).toContain("Creator");
      expect(memberNames).toContain("Member 1");
      expect(memberNames).toContain("Member 2");
    });
  });

  describe("Cascade deletes", () => {
    // Why: Deleting a team should clean up memberships (prevents orphaned data)
    it("deleting team removes all memberships", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const member = await createTestUser({ email: "member@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });
      await addTeamMember(member.id, team.id);

      // Delete the team
      await testDb.team.delete({ where: { id: team.id } });

      // Memberships should be gone
      const memberships = await testDb.teamMember.findMany({
        where: { teamId: team.id },
      });
      expect(memberships).toHaveLength(0);

      // But users should still exist
      const creatorStillExists = await testDb.user.findUnique({
        where: { id: creator.id },
      });
      expect(creatorStillExists).not.toBeNull();
    });

    // Why: Deleting a user should clean up their memberships
    it("deleting user removes their team memberships", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const member = await createTestUser({ email: "member@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });
      await addTeamMember(member.id, team.id);

      // Delete the member
      await testDb.user.delete({ where: { id: member.id } });

      // Their membership should be gone
      const memberships = await testDb.teamMember.findMany({
        where: { userId: member.id },
      });
      expect(memberships).toHaveLength(0);

      // Team should still exist with creator
      const teamWithMembers = await testDb.team.findUnique({
        where: { id: team.id },
        include: { members: true },
      });
      expect(teamWithMembers).not.toBeNull();
      expect(teamWithMembers?.members).toHaveLength(1); // Only creator remains
    });
  });

  describe("Unique constraints", () => {
    // Why: Users should not be able to join a team twice
    it("prevents duplicate team membership", async () => {
      const creator = await createTestUser({ email: "creator@test.com" });
      const member = await createTestUser({ email: "member@test.com" });
      const team = await createTestTeam({ creatorId: creator.id });
      
      await addTeamMember(member.id, team.id);

      // Trying to add same member again should fail
      await expect(
        addTeamMember(member.id, team.id)
      ).rejects.toThrow();
    });

    // Why: Email uniqueness is enforced at DB level
    it("prevents duplicate emails", async () => {
      await createTestUser({ email: "unique@test.com" });

      await expect(
        createTestUser({ email: "unique@test.com" })
      ).rejects.toThrow();
    });
  });
});
