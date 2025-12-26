import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

/**
 * Teams Page Integration Test
 * 
 * This is a minimal integration test for the teams page.
 * We mock Prisma to avoid database dependency in component tests.
 * 
 * Why test this?
 * - Verifies the page renders correctly with data
 * - Catches integration issues between page and components
 */

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    team: {
      findMany: vi.fn(),
    },
  },
}));

// Import after mocking
import prisma from "@/lib/prisma";
import TeamsPage from "@/app/teams/page";

// Ensure DOM cleanup between tests
afterEach(() => {
  cleanup();
});

describe("TeamsPage", () => {
  // Why: Users should see teams when they exist
  it("renders a list of teams", async () => {
    const mockTeams = [
      {
        id: "1",
        name: "Team Alpha",
        description: "First team",
        olympiad: "IMO",
        requiredSkills: "Math",
        maxMembers: 4,
        isOpen: true,
        creatorId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { id: "user-1", name: "Alice" },
        _count: { members: 2 },
      },
      {
        id: "2",
        name: "Team Beta",
        description: "Second team",
        olympiad: "IOI",
        requiredSkills: "Programming",
        maxMembers: 3,
        isOpen: true,
        creatorId: "user-2",
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { id: "user-2", name: "Bob" },
        _count: { members: 1 },
      },
    ];

    vi.mocked(prisma.team.findMany).mockResolvedValue(mockTeams);

    // Render the server component
    const page = await TeamsPage();
    render(page);

    // Verify both teams are displayed
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("Team Beta")).toBeInTheDocument();
    expect(screen.getByText("by Alice")).toBeInTheDocument();
    expect(screen.getByText("by Bob")).toBeInTheDocument();
  });

  // Why: Empty state should guide users to create teams
  it("shows empty state when no teams exist", async () => {
    vi.mocked(prisma.team.findMany).mockResolvedValue([]);

    const page = await TeamsPage();
    render(page);

    expect(screen.getByText("No teams found")).toBeInTheDocument();
    expect(screen.getByText("Be the first to create a team!")).toBeInTheDocument();
  });

  // Why: Page header should always be visible
  it("displays page header", async () => {
    vi.mocked(prisma.team.findMany).mockResolvedValue([]);

    const page = await TeamsPage();
    render(page);

    expect(screen.getByText("Browse Teams")).toBeInTheDocument();
    expect(
      screen.getByText("Find a team that matches your skills and interests")
    ).toBeInTheDocument();
  });
});
