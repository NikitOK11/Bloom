import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/teams
 * 
 * Fetches all teams with creator info and member count.
 * Supports filtering by olympiad via query parameter.
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const olympiad = searchParams.get("olympiad");
    const isOpen = searchParams.get("isOpen");

    // Build where clause based on filters
    const where: Record<string, unknown> = {};
    if (olympiad) where.olympiad = olympiad;
    if (isOpen !== null) where.isOpen = isOpen === "true";

    const teams = await prisma.team.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * 
 * Creates a new team and adds the creator as a member.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, olympiad, requiredSkills, maxMembers, creatorId } = body;

    // Basic validation
    if (!name || !olympiad || !creatorId) {
      return NextResponse.json(
        { success: false, error: "Name, olympiad, and creatorId are required" },
        { status: 400 }
      );
    }

    // Verify creator exists
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    // Create team and add creator as first member in a transaction
    const team = await prisma.$transaction(async (tx) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          name,
          description: description || null,
          olympiad,
          requiredSkills: Array.isArray(requiredSkills) 
            ? requiredSkills.join(",") 
            : requiredSkills || "",
          maxMembers: maxMembers || 4,
          creatorId,
        },
      });

      // Add creator as a team member with "creator" role
      await tx.teamMember.create({
        data: {
          userId: creatorId,
          teamId: newTeam.id,
          role: "creator",
        },
      });

      return newTeam;
    });

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}
