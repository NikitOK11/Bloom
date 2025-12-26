import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Dynamic route parameters for user operations
 */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * 
 * Fetches a single user by ID, including their team memberships.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        // Include teams the user has created
        createdTeams: true,
        // Include teams the user is a member of
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * 
 * Updates a user's profile.
 * Only updates fields that are provided.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, bio, skills, olympiads } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills) ? skills.join(",") : skills;
    }
    if (olympiads !== undefined) {
      updateData.olympiads = Array.isArray(olympiads) ? olympiads.join(",") : olympiads;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * 
 * Deletes a user and all their associated data.
 * Cascade delete handles team memberships.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: "User deleted" } });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
