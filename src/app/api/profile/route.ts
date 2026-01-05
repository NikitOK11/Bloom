import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/profile
 * 
 * Gets the profile for the current user.
 * In MVP without auth, requires userId query parameter.
 * 
 * DOMAIN RULES:
 * - Returns null if user exists but has no profile (valid state)
 * - Profile is required to perform certain actions (e.g., join requests)
 * 
 * PRIVACY: This route is for own profile only.
 * To view other users' profiles, use /api/profile/[userId].
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    // Return user info + profile (profile may be null)
    return NextResponse.json({
      success: true,
      data: {
        user,
        profile,
        hasProfile: profile !== null,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * 
 * Creates a new profile for a user.
 * 
 * DOMAIN RULES:
 * - User must exist and NOT already have a profile
 * - This is the REQUIRED step after registration
 * - Once created, use PUT to update
 * 
 * Required fields:
 * - userId: the user's ID
 * - role: school_student | college_student | graduate | other
 * - interests: array of data analysis/ML/coding skills
 * 
 * Optional fields:
 * - skills: additional skills (comma-separated)
 * - gradeOrYear: grade level or year
 * - olympiadExperience: past competition experience
 * - about: free-form bio
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, gradeOrYear, interests, skills, olympiadExperience, about } = body;

    // Validate required fields
    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "userId and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["school_student", "college_student", "graduate", "other"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be: school_student, college_student, graduate, or other" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: "Profile already exists. Use PUT to update." },
        { status: 409 }
      );
    }

    // Convert interests array to comma-separated string
    const interestsString = Array.isArray(interests) 
      ? interests.join(",") 
      : (interests || "");

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId,
        role,
        gradeOrYear: gradeOrYear || null,
        interests: interestsString,
        skills: skills || null,
        olympiadExperience: olympiadExperience || null,
        about: about || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: profile,
        message: "Profile created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * 
 * Updates an existing profile.
 * 
 * DOMAIN RULES:
 * - Profile must already exist (use POST to create)
 * - Only provided fields are updated (partial update)
 * 
 * All fields optional (partial update):
 * - role: school_student | college_student | graduate | other
 * - gradeOrYear: grade level or year
 * - interests: array of data analysis/ML/coding skills
 * - skills: additional skills
 * - olympiadExperience: past competition experience
 * - about: free-form bio
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, gradeOrYear, interests, skills, olympiadExperience, about } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found. Use POST to create a new profile." },
        { status: 404 }
      );
    }

    // Validate role if provided
    const validRoles = ["school_student", "college_student", "graduate", "other"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be: school_student, college_student, graduate, or other" },
        { status: 400 }
      );
    }

    // Convert interests array to comma-separated string
    const interestsString = Array.isArray(interests) 
      ? interests.join(",") 
      : interests;

    // Update profile (only provided fields)
    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        ...(role !== undefined && { role }),
        ...(gradeOrYear !== undefined && { gradeOrYear }),
        ...(interestsString !== undefined && { interests: interestsString }),
        ...(skills !== undefined && { skills }),
        ...(olympiadExperience !== undefined && { olympiadExperience }),
        ...(about !== undefined && { about }),
      },
    });

    return NextResponse.json({
      success: true,
      data: profile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
