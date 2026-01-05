import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/olympiads/[id]
 * 
 * Получить олимпиаду по ID или slug с командами.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by slug first, then by id
    const olympiad = await prisma.olympiad.findFirst({
      where: {
        OR: [
          { slug: params.id },
          { id: params.id },
        ],
      },
      include: {
        teams: {
          where: { isOpen: true},
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
        { error: "Олимпиада не найдена" },
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
 * Обновить существующую олимпиаду.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      year, 
      level, 
      subject, 
      disciplines,
      teamSize,
      format,
      organizer,
      website,
      logoEmoji,
    } = body;

    // Find by slug or id
    const existing = await prisma.olympiad.findFirst({
      where: {
        OR: [
          { slug: params.id },
          { id: params.id },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Олимпиада не найдена" },
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
      disciplines?: string | null;
      teamSize?: string | null;
      format?: string | null;
      organizer?: string | null;
      website?: string | null;
      logoEmoji?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (year !== undefined) updateData.year = parseInt(year, 10);
    if (level !== undefined) updateData.level = level;
    if (subject !== undefined) updateData.subject = subject;
    if (disciplines !== undefined) updateData.disciplines = disciplines;
    if (teamSize !== undefined) updateData.teamSize = teamSize;
    if (format !== undefined) updateData.format = format;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (website !== undefined) updateData.website = website;
    if (logoEmoji !== undefined) updateData.logoEmoji = logoEmoji;

    // Update the olympiad
    const olympiad = await prisma.olympiad.update({
      where: { id: existing.id },
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
 * Удалить олимпиаду (только если нет команд).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Find by slug or id
    const existing = await prisma.olympiad.findFirst({
      where: {
        OR: [
          { slug: params.id },
          { id: params.id },
        ],
      },
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Олимпиада не найдена" },
        { status: 404 }
      );
    }

    // Check if olympiad has teams
    if (existing._count.teams > 0) {
      return NextResponse.json(
        { error: "Нельзя удалить олимпиаду с командами" },
        { status: 400 }
      );
    }

    // Delete the olympiad
    await prisma.olympiad.delete({
      where: { id: existing.id },
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
