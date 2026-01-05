import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canViewProfile } from "@/lib/profile-access";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/profile/[userId]
 * 
 * Gets a specific user's profile with strict access control.
 * 
 * PRIVACY RULES ENFORCED:
 * - User can view their own profile
 * - Team leaders can view profiles of users with PENDING join requests
 *   to their teams
 * - All other access is denied
 * 
 * This prevents random profile browsing and ensures profiles
 * are only shared in relevant contexts (join request review).
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId: profileUserId } = await params;
    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get("viewerId");

    if (!viewerId) {
      return NextResponse.json(
        { success: false, error: "viewerId query parameter is required" },
        { status: 400 }
      );
    }

    // ACCESS CONTROL: Check if viewer is authorized to see this profile
    const accessCheck = await canViewProfile(viewerId, profileUserId);
    
    if (!accessCheck.canView) {
      return NextResponse.json(
        { 
          success: false, 
          error: accessCheck.reason || "Access denied",
          code: "PROFILE_ACCESS_DENIED"
        },
        { status: 403 }
      );
    }

    // Fetch the profile with user details
    const profile = await prisma.profile.findUnique({
      where: { userId: profileUserId },
    });

    // Get user info separately
    const user = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!profile) {
      // User exists but hasn't created a profile yet
      return NextResponse.json({
        success: true,
        data: {
          user,
          profile: null,
          hasProfile: false,
        },
        accessReason: accessCheck.reason,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        profile: {
          id: profile.id,
          role: profile.role,
          gradeOrYear: profile.gradeOrYear,
          interests: profile.interests,
          skills: profile.skills,
          olympiadExperience: profile.olympiadExperience,
          about: profile.about,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
        hasProfile: true,
      },
      accessReason: accessCheck.reason,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
