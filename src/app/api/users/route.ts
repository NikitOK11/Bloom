import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/users
 * 
 * Fetches all users from the database.
 * In production, add pagination and auth restrictions.
 * 
 * NOTE: This is for MVP demo mode. In production, you would
 * not expose a list of all users publicly.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        // Check if user has a profile
        profile: {
          select: { id: true },
        },
      },
    });

    // Transform to include hasProfile flag
    const usersWithProfileStatus = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      hasProfile: user.profile !== null,
    }));

    return NextResponse.json({ success: true, data: usersWithProfileStatus });
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
 * DEPRECATED: Use /api/auth/register instead.
 * 
 * This endpoint is kept for backward compatibility during MVP.
 * Creates a user with minimal auth data.
 * 
 * NOTE: For proper registration with password, use /api/auth/register
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

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

    // Create user (auth-only, no profile data)
    // For proper registration with password, use /api/auth/register
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: "", // Empty password for legacy/demo users
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: { ...user, hasProfile: false },
      message: "User created. Note: For proper registration, use /api/auth/register"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
