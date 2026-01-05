import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/register
 * 
 * USER REGISTRATION ENDPOINT
 * 
 * DOMAIN RULES:
 * - Creates a User record (authentication identity only)
 * - Does NOT create a Profile (user must do this explicitly)
 * - Email must be unique
 * - Password is stored as plaintext for MVP (use bcrypt in production)
 * 
 * FLOW: Register → Redirect to /profile/create → User creates profile
 * 
 * Required fields:
 * - email: unique email address
 * - password: user's password
 * - name: display name
 * 
 * Returns:
 * - success: boolean
 * - data: { id, email, name, hasProfile: false }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user (auth identity only, no profile yet)
    // NOTE: In production, hash the password with bcrypt
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password, // TODO: Hash with bcrypt in production
        name: name.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Return user data with hasProfile flag
    return NextResponse.json(
      {
        success: true,
        data: {
          ...user,
          hasProfile: false, // New users never have a profile
        },
        message: "Registration successful. Please complete your profile.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
