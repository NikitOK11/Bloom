import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchKaggleProfile, KaggleError } from "@/lib/kaggle";

/**
 * POST /api/integrations/kaggle/connect
 * 
 * Connect a Kaggle account to the current user's profile.
 * 
 * FLOW:
 * 1. Validate Kaggle username
 * 2. Fetch public profile data from Kaggle (optionally with API token)
 * 3. Store/update ExternalProfile record
 * 
 * SECURITY:
 * - API token is used ONLY for the initial fetch, never stored
 * - Only public Kaggle data is stored
 * - User can disconnect at any time
 * 
 * Request Body:
 * - userId: string (required) - User ID to connect Kaggle for
 * - kaggleUsername: string (required) - Kaggle username
 * - apiToken?: string (optional) - Kaggle API token for full data fetch
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, kaggleUsername, apiToken } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (!kaggleUsername) {
      return NextResponse.json(
        { success: false, error: "kaggleUsername is required" },
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

    // Fetch Kaggle profile data
    // NOTE: API token is used here only and NOT stored
    let kaggleData;
    try {
      kaggleData = await fetchKaggleProfile(kaggleUsername.trim(), apiToken?.trim());
    } catch (error) {
      if (error instanceof KaggleError) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message,
            code: error.code,
          },
          { status: error.code === "PROFILE_NOT_FOUND" ? 404 : 400 }
        );
      }
      throw error;
    }

    // Upsert ExternalProfile - create or update existing
    const externalProfile = await prisma.externalProfile.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "kaggle",
        },
      },
      update: {
        username: kaggleData.username,
        profileUrl: kaggleData.profileUrl,
        rankTier: kaggleData.rankTier,
        medalsGold: kaggleData.medalsGold,
        medalsSilver: kaggleData.medalsSilver,
        medalsBronze: kaggleData.medalsBronze,
        competitionsCount: kaggleData.competitionsCount,
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        provider: "kaggle",
        username: kaggleData.username,
        profileUrl: kaggleData.profileUrl,
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
      message: "Kaggle profile connected successfully",
      data: externalProfile,
    });
  } catch (error) {
    console.error("Error connecting Kaggle profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect Kaggle profile" },
      { status: 500 }
    );
  }
}
