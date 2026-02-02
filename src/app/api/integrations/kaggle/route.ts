import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchKaggleProfile, KaggleError } from "@/lib/kaggle";

/**
 * GET /api/integrations/kaggle
 * 
 * Get the connected Kaggle profile for a user.
 * 
 * Query Parameters:
 * - userId: string (required) - User ID to get Kaggle data for
 * 
 * Returns:
 * - Connected Kaggle profile data if exists
 * - null if no Kaggle profile connected
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get Kaggle external profile
    const kaggleProfile = await prisma.externalProfile.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "kaggle",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: kaggleProfile,
      isConnected: kaggleProfile !== null,
    });
  } catch (error) {
    console.error("Error fetching Kaggle profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Kaggle profile" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/kaggle
 * 
 * Disconnect (remove) the Kaggle profile from a user's account.
 * 
 * Query Parameters:
 * - userId: string (required) - User ID to disconnect Kaggle for
 * 
 * This completely removes the ExternalProfile record for Kaggle.
 * User can reconnect anytime by using the connect endpoint.
 */
export async function DELETE(request: Request) {
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if Kaggle profile exists
    const existingProfile = await prisma.externalProfile.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "kaggle",
        },
      },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { success: false, error: "No Kaggle profile connected" },
        { status: 404 }
      );
    }

    // Delete the external profile
    await prisma.externalProfile.delete({
      where: {
        userId_provider: {
          userId,
          provider: "kaggle",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kaggle profile disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Kaggle profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disconnect Kaggle profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/kaggle
 * 
 * Refresh/sync the Kaggle profile data for a user.
 * 
 * Request Body:
 * - userId: string (required) - User ID to refresh Kaggle data for
 * - apiToken?: string (optional) - Kaggle API token for full data refresh
 * 
 * This re-fetches data from Kaggle and updates the stored profile.
 * Useful when user wants to update their displayed stats.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, apiToken } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Get existing Kaggle profile
    const existingProfile = await prisma.externalProfile.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "kaggle",
        },
      },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { success: false, error: "No Kaggle profile connected. Please connect first." },
        { status: 404 }
      );
    }

    // Re-fetch Kaggle data
    let kaggleData;
    try {
      kaggleData = await fetchKaggleProfile(existingProfile.username, apiToken?.trim());
    } catch (error) {
      if (error instanceof KaggleError) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message,
            code: error.code,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Update the profile
    const updatedProfile = await prisma.externalProfile.update({
      where: {
        userId_provider: {
          userId,
          provider: "kaggle",
        },
      },
      data: {
        rankTier: kaggleData.rankTier,
        medalsGold: kaggleData.medalsGold,
        medalsSilver: kaggleData.medalsSilver,
        medalsBronze: kaggleData.medalsBronze,
        competitionsCount: kaggleData.competitionsCount,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kaggle profile refreshed successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error refreshing Kaggle profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh Kaggle profile" },
      { status: 500 }
    );
  }
}
