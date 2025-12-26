import { PrismaClient } from "@prisma/client";

/**
 * Test Database Client
 * 
 * WHY A SEPARATE TEST DATABASE?
 * - Isolation: Tests should not affect development data
 * - Speed: SQLite in-memory or file-based is fast for tests
 * - Reproducibility: Clean state for each test run
 * 
 * IMPORTANT: We use the SAME database file as the main app during tests.
 * The resetDatabase function cleans data between tests.
 * This ensures API routes (which use the main prisma client) work correctly.
 */

// Reuse the main prisma client - API routes will use this
export { default as testDb } from "@/lib/prisma";
import prisma from "@/lib/prisma";

/**
 * Reset the database to a clean state
 * 
 * Called between tests to ensure isolation.
 * Order matters due to foreign key constraints.
 */
export async function resetDatabase() {
  // Delete in order: dependent tables first
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnect from the test database
 * 
 * Called after all tests complete to free resources.
 */
export async function disconnectTestDb() {
  await prisma.$disconnect();
}

/**
 * Factory functions for creating test data
 * 
 * These provide sensible defaults while allowing overrides.
 * Makes tests more readable and maintainable.
 */

interface CreateTestUserOptions {
  name?: string;
  email?: string;
  bio?: string;
  skills?: string;
  olympiads?: string;
}

export async function createTestUser(options: CreateTestUserOptions = {}) {
  return prisma.user.create({
    data: {
      name: options.name ?? "Test User",
      email: options.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      bio: options.bio ?? null,
      skills: options.skills ?? "math,physics",
      olympiads: options.olympiads ?? "IMO,IPhO",
    },
  });
}

interface CreateTestTeamOptions {
  name?: string;
  description?: string;
  olympiad?: string;
  requiredSkills?: string;
  maxMembers?: number;
  isOpen?: boolean;
  creatorId: string;
}

export async function createTestTeam(options: CreateTestTeamOptions) {
  const team = await prisma.team.create({
    data: {
      name: options.name ?? "Test Team",
      description: options.description ?? "A test team",
      olympiad: options.olympiad ?? "IMO",
      requiredSkills: options.requiredSkills ?? "math",
      maxMembers: options.maxMembers ?? 4,
      isOpen: options.isOpen ?? true,
      creatorId: options.creatorId,
    },
  });

  // Automatically add creator as team member (matches API behavior)
  await prisma.teamMember.create({
    data: {
      userId: options.creatorId,
      teamId: team.id,
      role: "creator",
    },
  });

  return team;
}

/**
 * Add a member to a team
 */
export async function addTeamMember(userId: string, teamId: string, role = "member") {
  return prisma.teamMember.create({
    data: {
      userId,
      teamId,
      role,
    },
  });
}
