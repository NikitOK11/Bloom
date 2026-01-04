import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateJoinRequest } from "@/lib/join-request";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/teams/[id]/join-request
 * 
 * Creates a new join request for a team.
 * 
 * DOMAIN RULES ENFORCED:
 * - User must exist
 * - Team must exist and be open
 * - Team must not be full
 * - User must not already be a member
 * - User must not have an existing PENDING request
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const body = await request.json();
    const { userId, message } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate the request against all domain rules
    const validation = await validateJoinRequest(userId, teamId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    // Create the join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        teamId,
        message: message || null,
        status: "PENDING",
      },
      include: {
        user: true,
        team: {
          include: {
            creator: true,
            olympiad: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: joinRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating join request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create join request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams/[id]/join-request
 * 
 * Gets the current user's join request status for this team.
 * Useful for checking if a "Request to Join" button should be disabled.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Find user's request for this team (most recent)
    const joinRequest = await prisma.joinRequest.findFirst({
      where: {
        userId,
        teamId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        team: {
          select: {
            name: true,
            creatorId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: joinRequest,
    });
  } catch (error) {
    console.error("Error fetching join request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch join request" },
      { status: 500 }
    );
  }
}
