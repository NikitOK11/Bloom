import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teams/[id]/join-requests
 * 
 * Fetches all join requests for a team.
 * In production, this should be restricted to the team leader only.
 * 
 * Query params:
 * - status: Filter by status ("PENDING", "APPROVED", "REJECTED")
 * - actorUserId: The user making the request (for authorization)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const actorUserId = searchParams.get("actorUserId");

    // Verify team exists and get creator info for authorization
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        creatorId: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Authorization: Only team leader can view all requests
    // In MVP without auth, we check actorUserId matches creatorId
    if (actorUserId && team.creatorId !== actorUserId) {
      return NextResponse.json(
        { success: false, error: "Only the team leader can view join requests" },
        { status: 403 }
      );
    }

    // Build query filters
    const where: { teamId: string; status?: string } = { teamId };
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    // Fetch join requests with user details
    const joinRequests = await prisma.joinRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            skills: true,
            olympiads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: joinRequests,
    });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch join requests" },
      { status: 500 }
    );
  }
}
