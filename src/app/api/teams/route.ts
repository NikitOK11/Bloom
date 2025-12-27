import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/teams
 * 
 * Fetches all teams with creator info and member count.
 * Supports filtering by olympiadId via query parameter.
 * 
 * DOMAIN RULE: Teams always belong to an olympiad.
 * This endpoint returns teams with their olympiad context.
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const olympiadId = searchParams.get("olympiadId");
    const isOpen = searchParams.get("isOpen");

    // Build where clause based on filters
    const where: Record<string, unknown> = {};
    if (olympiadId) where.olympiadId = olympiadId;
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
 * @deprecated Use POST /api/olympiads/[id]/teams instead.
 * 
 * DOMAIN RULE: Teams must be created within an olympiad context.
 * This endpoint is deprecated and will return an error directing
 * users to the correct endpoint.
 */
export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      error: "Teams must be created within an olympiad. Use POST /api/olympiads/[olympiadId]/teams instead." 
    },
    { status: 400 }
  );
}
