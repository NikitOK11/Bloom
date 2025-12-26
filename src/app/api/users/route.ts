import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/users
 * 
 * Fetches all users from the database.
 * In production, add pagination for large datasets.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * 
 * Creates a new user.
 * Expects: { name, email, bio?, skills[], olympiads[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, bio, skills, olympiads } = body;

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user - convert arrays to comma-separated strings
    const user = await prisma.user.create({
      data: {
        name,
        email,
        bio: bio || null,
        skills: Array.isArray(skills) ? skills.join(",") : skills || "",
        olympiads: Array.isArray(olympiads) ? olympiads.join(",") : olympiads || "",
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
