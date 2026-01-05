import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/login
 * 
 * Authenticates a user with email and password.
 * For MVP: Uses simple email lookup (no password verification in demo).
 * 
 * In production, this should:
 * - Hash and verify passwords with bcrypt
 * - Use proper session management (JWT/NextAuth)
 * - Implement rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
      },
    });

    if (!user) {
      // Generic error to prevent email enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // MVP: For demo purposes, accept any password
    // TODO: In production, verify password hash:
    // const isValid = await bcrypt.compare(password, user.passwordHash);
    // if (!isValid) { return error }

    // Check if password is at least provided (demo validation)
    if (password.length < 1) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return user data (exclude sensitive fields in production)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasProfile: !!user.profile,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
