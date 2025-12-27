import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/olympiads
 * 
 * Fetch all olympiads with optional filtering by year and level.
 * Returns olympiads sorted by year (newest first).
 * 
 * Query params:
 * - year: Filter by specific year
 * - level: Filter by level (international, national, regional)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const level = searchParams.get("level");

    // Build the where clause based on filters
    const where: {
      year?: number;
      level?: string;
    } = {};

    if (year) {
      where.year = parseInt(year, 10);
    }

    if (level) {
      where.level = level;
    }

    // Fetch olympiads with team count
    const olympiads = await prisma.olympiad.findMany({
      where,
      include: {
        _count: {
          select: { teams: true },
        },
      },
      orderBy: [
        { year: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(olympiads);
  } catch (error) {
    console.error("Error fetching olympiads:", error);
    return NextResponse.json(
      { error: "Failed to fetch olympiads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/olympiads
 * 
 * Create a new olympiad.
 * Required fields: name, shortName, year, subject
 * Optional fields: description, level, website
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, shortName, description, year, level, subject, website } = body;

    // Validate required fields
    if (!name || !shortName || !year || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: name, shortName, year, and subject are required" },
        { status: 400 }
      );
    }

    // Check if shortName already exists
    const existing = await prisma.olympiad.findUnique({
      where: { shortName },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Olympiad with short name "${shortName}" already exists` },
        { status: 409 }
      );
    }

    // Create the olympiad
    const olympiad = await prisma.olympiad.create({
      data: {
        name,
        shortName,
        description: description || null,
        year: parseInt(year, 10),
        level: level || "international",
        subject,
        website: website || null,
      },
    });

    return NextResponse.json(olympiad, { status: 201 });
  } catch (error) {
    console.error("Error creating olympiad:", error);
    return NextResponse.json(
      { error: "Failed to create olympiad" },
      { status: 500 }
    );
  }
}
