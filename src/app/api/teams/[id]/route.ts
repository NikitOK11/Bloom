import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teams/[id]
 * 
 * Fetches a single team with full details including all members and olympiad.
 * DOMAIN RULE: Teams always belong to an olympiad.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        creator: true,
        olympiad: true,  // Include olympiad context
        members: {
          include: {
            user: true,
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[id]
 * 
 * Updates team details. Only the creator should be able to do this.
 * Note: olympiadId cannot be changed - teams are bound to their olympiad.
 * Note: Authorization check would be added with authentication.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, requiredSkills, maxMembers, isOpen } = body;

    // Build update object (olympiadId is not updatable)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (requiredSkills !== undefined) {
      updateData.requiredSkills = Array.isArray(requiredSkills) 
        ? requiredSkills.join(",") 
        : requiredSkills;
    }
    if (maxMembers !== undefined) updateData.maxMembers = maxMembers;
    if (isOpen !== undefined) updateData.isOpen = isOpen;

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        creator: true,
        olympiad: true,
        members: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update team" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]
 * 
 * Deletes a team and all its memberships.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Delete team (cascade will handle members)
    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: "Team deleted" } });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
