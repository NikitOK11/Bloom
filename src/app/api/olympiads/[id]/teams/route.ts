import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/olympiads/[id]/teams
 * 
 * DOMAIN RULE: Teams are always created within an olympiad context.
 * This endpoint enforces that teams cannot exist independently.
 * 
 * Creates a new team for the specified olympiad and adds the creator as a member.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const olympiadId = params.id;
    const body = await request.json();
    const { name, description, requiredSkills, maxMembers, creatorId } = body;

    // Validate required fields
    if (!name || !creatorId) {
      return NextResponse.json(
        { success: false, error: "Name and creatorId are required" },
        { status: 400 }
      );
    }

    // Verify olympiad exists
    const olympiad = await prisma.olympiad.findUnique({
      where: { id: olympiadId },
    });

    if (!olympiad) {
      return NextResponse.json(
        { success: false, error: "Olympiad not found" },
        { status: 404 }
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
      // Create the team with required olympiad relation
      const newTeam = await tx.team.create({
        data: {
          name,
          description: description || null,
          olympiadId, // Required relation to olympiad
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

    // Fetch full team data with relations
    const fullTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        olympiad: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: fullTeam }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/olympiads/[id]/teams
 * 
 * Fetches all teams for a specific olympiad.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const olympiadId = params.id;

    // Verify olympiad exists
    const olympiad = await prisma.olympiad.findUnique({
      where: { id: olympiadId },
    });

    if (!olympiad) {
      return NextResponse.json(
        { success: false, error: "Olympiad not found" },
        { status: 404 }
      );
    }

    // Fetch teams for this olympiad
    const teams = await prisma.team.findMany({
      where: { olympiadId },
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
