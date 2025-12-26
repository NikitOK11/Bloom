import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/teams/[id]/join
 * 
 * Adds a user to a team.
 * Validates team capacity and open status.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Get team with current member count
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if team is open
    if (!team.isOpen) {
      return NextResponse.json(
        { success: false, error: "Team is not accepting new members" },
        { status: 400 }
      );
    }

    // Check if team is full
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: "Team is already full" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "User is already a team member" },
        { status: 409 }
      );
    }

    // Add user to team
    const member = await prisma.teamMember.create({
      data: {
        userId,
        teamId,
        role: "member",
      },
      include: {
        user: true,
        team: true,
      },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join team" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]/join
 * 
 * Removes a user from a team (leave team).
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if membership exists
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "User is not a team member" },
        { status: 404 }
      );
    }

    // Prevent creator from leaving (they should delete the team instead)
    if (member.role === "creator") {
      return NextResponse.json(
        { success: false, error: "Team creator cannot leave. Delete the team instead." },
        { status: 400 }
      );
    }

    // Remove membership
    await prisma.teamMember.delete({
      where: {
        userId_teamId: { userId, teamId },
      },
    });

    return NextResponse.json({ success: true, data: { message: "Left team successfully" } });
  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave team" },
      { status: 500 }
    );
  }
}
