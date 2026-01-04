import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/profile
 * 
 * Gets the profile for the current user.
 * In MVP without auth, requires userId query parameter.
 * 
 * PRIVACY: This route is only for the user's own profile.
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

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            skills: true,
            olympiads: true,
          },
        },
      },
    });

    // If no profile exists, return null (user can create one)
    return NextResponse.json({
      success: true,
      data: profile,
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
 * PUT /api/profile
 * 
 * Creates or updates the current user's profile.
 * Uses upsert to handle both create and update in one operation.
 * 
 * PRIVACY: Users can only update their own profile.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, gradeOrYear, interests, olympiadExperience, about } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
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

    // Validate role if provided
    const validRoles = ["school_student", "college_student", "graduate", "other"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Convert interests array to comma-separated string
    const interestsString = Array.isArray(interests) 
      ? interests.join(",") 
      : (interests || "");

    // Upsert profile (create if doesn't exist, update if it does)
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        role: role || "school_student",
        gradeOrYear: gradeOrYear || null,
        interests: interestsString,
        olympiadExperience: olympiadExperience || null,
        about: about || null,
      },
      update: {
        ...(role !== undefined && { role }),
        ...(gradeOrYear !== undefined && { gradeOrYear }),
        ...(interests !== undefined && { interests: interestsString }),
        ...(olympiadExperience !== undefined && { olympiadExperience }),
        ...(about !== undefined && { about }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
