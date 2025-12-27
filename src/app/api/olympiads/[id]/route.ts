import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/olympiads/[id]
 * 
 * Fetch a single olympiad by ID with its associated teams.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const olympiad = await prisma.olympiad.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          where: { isOpen: true },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { teams: true },
        },
      },
    });

    if (!olympiad) {
      return NextResponse.json(
        { error: "Olympiad not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(olympiad);
  } catch (error) {
    console.error("Error fetching olympiad:", error);
    return NextResponse.json(
      { error: "Failed to fetch olympiad" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/olympiads/[id]
 * 
 * Update an existing olympiad.
 * Only updates the fields that are provided.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, year, level, subject, website } = body;

    // Check if olympiad exists
    const existing = await prisma.olympiad.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Olympiad not found" },
        { status: 404 }
      );
    }

    // Build update data - only include provided fields
    const updateData: {
      name?: string;
      description?: string | null;
      year?: number;
      level?: string;
      subject?: string;
      website?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (year !== undefined) updateData.year = parseInt(year, 10);
    if (level !== undefined) updateData.level = level;
    if (subject !== undefined) updateData.subject = subject;
    if (website !== undefined) updateData.website = website;

    // Update the olympiad
    const olympiad = await prisma.olympiad.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(olympiad);
  } catch (error) {
    console.error("Error updating olympiad:", error);
    return NextResponse.json(
      { error: "Failed to update olympiad" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/olympiads/[id]
 * 
 * Delete an olympiad.
 * Note: This will only work if no teams are associated with the olympiad.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if olympiad exists
    const existing = await prisma.olympiad.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Olympiad not found" },
        { status: 404 }
      );
    }

    // Check if olympiad has teams
    if (existing._count.teams > 0) {
      return NextResponse.json(
        { error: "Cannot delete olympiad with associated teams" },
        { status: 400 }
      );
    }

    // Delete the olympiad
    await prisma.olympiad.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting olympiad:", error);
    return NextResponse.json(
      { error: "Failed to delete olympiad" },
      { status: 500 }
    );
  }
}
