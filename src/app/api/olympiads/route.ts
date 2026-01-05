import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/olympiads
 * 
 * Получить все олимпиады с фильтрацией.
 * 
 * Query params:
 * - year: Фильтр по году
 * - level: Фильтр по уровню (школьная, студенческая, смешанная)
 * - format: Фильтр по формату (онлайн, оффлайн, смешанный)
 * - subject: Фильтр по направлению
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const level = searchParams.get("level");
    const format = searchParams.get("format");
    const subject = searchParams.get("subject");

    // Build the where clause based on filters
    const where: {
      year?: number;
      level?: string;
      format?: string;
      subject?: { contains: string };
    } = {};

    if (year) {
      where.year = parseInt(year, 10);
    }

    if (level) {
      where.level = level;
    }

    if (format) {
      where.format = format;
    }

    if (subject) {
      where.subject = { contains: subject };
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
 * Создать новую олимпиаду.
 * Обязательные поля: slug, name, shortName, year, subject
 * Опциональные: description, level, format, disciplines, teamSize, organizer, website, logoEmoji
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      slug,
      name, 
      shortName, 
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

    // Validate required fields
    if (!slug || !name || !shortName || !year || !subject) {
      return NextResponse.json(
        { error: "Обязательные поля: slug, name, shortName, year, subject" },
        { status: 400 }
      );
    }

    // Check if slug or shortName already exists
    const existing = await prisma.olympiad.findFirst({
      where: {
        OR: [
          { slug },
          { shortName },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Олимпиада с таким slug или shortName уже существует` },
        { status: 409 }
      );
    }

    // Create the olympiad
    const olympiad = await prisma.olympiad.create({
      data: {
        slug,
        name,
        shortName,
        description: description || null,
        year: parseInt(year, 10),
        level: level || "смешанная",
        subject,
        disciplines: disciplines || null,
        teamSize: teamSize || null,
        format: format || null,
        organizer: organizer || null,
        website: website || null,
        logoEmoji: logoEmoji || null,
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
