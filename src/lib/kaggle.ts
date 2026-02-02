/**
 * Kaggle Integration Module
 * 
 * Provides functions to interact with Kaggle's public API to fetch user profile data.
 * 
 * INTEGRATION LIMITATIONS:
 * - Read-only: We only fetch public profile information
 * - No background sync: Data is fetched on-demand only
 * - API tokens not stored: Tokens are used transiently during the fetch
 * - Rate limits: Kaggle API has rate limits, so we cache data in DB
 * - Public data only: We respect Kaggle's privacy settings
 * 
 * KAGGLE API NOTES:
 * - The Kaggle API requires authentication to access user profiles
 * - Users can provide their Kaggle username + API token for initial fetch
 * - API token is only used to fetch data, never stored permanently
 * - Without API token, we attempt to scrape public profile page (limited data)
 */

/**
 * Kaggle rank tiers as displayed on their platform
 */
export const KAGGLE_RANK_TIERS = [
  "Grandmaster",
  "Master", 
  "Expert",
  "Contributor",
  "Novice",
] as const;

export type KaggleRankTier = typeof KAGGLE_RANK_TIERS[number];

/**
 * Structure of Kaggle profile data we extract
 */
export interface KaggleProfileData {
  username: string;
  profileUrl: string;
  displayName?: string;
  rankTier: string | null;
  medalsGold: number | null;
  medalsSilver: number | null;
  medalsBronze: number | null;
  competitionsCount: number | null;
}

/**
 * Error types for Kaggle integration
 */
export class KaggleError extends Error {
  constructor(
    message: string,
    public code: "PROFILE_NOT_FOUND" | "INVALID_CREDENTIALS" | "RATE_LIMITED" | "API_ERROR"
  ) {
    super(message);
    this.name = "KaggleError";
  }
}

/**
 * Validate Kaggle username format
 * Kaggle usernames are alphanumeric with underscores, 3-20 characters
 */
export function isValidKaggleUsername(username: string): boolean {
  const pattern = /^[a-zA-Z0-9_]{3,20}$/;
  return pattern.test(username);
}

/**
 * Build the Kaggle profile URL for a username
 */
export function getKaggleProfileUrl(username: string): string {
  return `https://www.kaggle.com/${username}`;
}

/**
 * Fetch Kaggle profile data using the Kaggle API
 * 
 * @param username - Kaggle username to look up
 * @param apiToken - Optional API token for authenticated requests (not stored)
 * @returns Profile data from Kaggle
 * @throws KaggleError if profile doesn't exist or API fails
 * 
 * NOTE: The Kaggle API requires Basic Auth with username:token
 * If no token is provided, we attempt a simpler validation
 */
export async function fetchKaggleProfile(
  username: string,
  apiToken?: string
): Promise<KaggleProfileData> {
  // Validate username format first
  if (!isValidKaggleUsername(username)) {
    throw new KaggleError(
      "Invalid Kaggle username format. Username should be 3-20 characters, alphanumeric and underscores only.",
      "PROFILE_NOT_FOUND"
    );
  }

  // If API token is provided, use Kaggle API for authenticated access
  if (apiToken) {
    return fetchKaggleProfileWithApi(username, apiToken);
  }

  // Without API token, verify profile exists via public page check
  // This provides limited data but confirms the profile is real
  return verifyKaggleProfileExists(username);
}

/**
 * Fetch profile data using Kaggle's authenticated API
 * 
 * Kaggle API endpoint: GET /api/v1/users/{username}
 * Authentication: Basic Auth with Kaggle username + API key
 */
async function fetchKaggleProfileWithApi(
  username: string,
  apiToken: string
): Promise<KaggleProfileData> {
  const apiUrl = `https://www.kaggle.com/api/v1/users/${username}`;
  
  // Kaggle API uses Basic Auth with username:token
  const authHeader = `Basic ${Buffer.from(`${username}:${apiToken}`).toString("base64")}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      throw new KaggleError(
        `Kaggle profile not found for username: ${username}`,
        "PROFILE_NOT_FOUND"
      );
    }

    if (response.status === 401) {
      throw new KaggleError(
        "Invalid Kaggle API credentials. Please check your username and API token.",
        "INVALID_CREDENTIALS"
      );
    }

    if (response.status === 429) {
      throw new KaggleError(
        "Kaggle API rate limit exceeded. Please try again later.",
        "RATE_LIMITED"
      );
    }

    if (!response.ok) {
      throw new KaggleError(
        `Kaggle API error: ${response.status} ${response.statusText}`,
        "API_ERROR"
      );
    }

    const data = await response.json();

    // Map Kaggle API response to our format
    // API response includes: displayName, userAchievements, tier, etc.
    return {
      username: data.userName || username,
      profileUrl: getKaggleProfileUrl(username),
      displayName: data.displayName,
      rankTier: mapKaggleTier(data.tier),
      medalsGold: data.userAchievements?.totalGoldMedals ?? null,
      medalsSilver: data.userAchievements?.totalSilverMedals ?? null,
      medalsBronze: data.userAchievements?.totalBronzeMedals ?? null,
      competitionsCount: data.userAchievements?.totalCompetitions ?? null,
    };
  } catch (error) {
    if (error instanceof KaggleError) {
      throw error;
    }
    throw new KaggleError(
      `Failed to fetch Kaggle profile: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR"
    );
  }
}

/**
 * Verify a Kaggle profile exists by checking the public profile page
 * This is a fallback when no API token is provided
 * 
 * NOTE: This only verifies existence, it cannot reliably extract detailed data
 * without an API token. We return minimal confirmed information.
 */
async function verifyKaggleProfileExists(username: string): Promise<KaggleProfileData> {
  const profileUrl = getKaggleProfileUrl(username);

  try {
    // Attempt to fetch the public profile page
    const response = await fetch(profileUrl, {
      method: "HEAD", // Just check if page exists
      redirect: "follow",
    });

    if (response.status === 404 || !response.ok) {
      throw new KaggleError(
        `Kaggle profile not found for username: ${username}. Please verify the username is correct.`,
        "PROFILE_NOT_FOUND"
      );
    }

    // Profile exists, but without API we can't get detailed stats
    // Return minimal data - user can add API token for full data later
    return {
      username,
      profileUrl,
      rankTier: null,
      medalsGold: null,
      medalsSilver: null,
      medalsBronze: null,
      competitionsCount: null,
    };
  } catch (error) {
    if (error instanceof KaggleError) {
      throw error;
    }
    throw new KaggleError(
      `Failed to verify Kaggle profile: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR"
    );
  }
}

/**
 * Map Kaggle tier string to standardized format
 * Kaggle uses "KAGGLE_TIER_1" style for API, but human-readable in UI
 */
function mapKaggleTier(tier: string | undefined): string | null {
  if (!tier) return null;
  
  const tierMap: Record<string, string> = {
    "KAGGLE_TIER_1": "Novice",
    "KAGGLE_TIER_2": "Contributor",
    "KAGGLE_TIER_3": "Expert",
    "KAGGLE_TIER_4": "Master",
    "KAGGLE_TIER_5": "Grandmaster",
    // Also handle direct tier names
    "Novice": "Novice",
    "Contributor": "Contributor",
    "Expert": "Expert",
    "Master": "Master",
    "Grandmaster": "Grandmaster",
  };

  return tierMap[tier] || tier;
}

/**
 * Get color for Kaggle rank tier (for UI display)
 */
export function getKaggleTierColor(tier: string | null): string {
  if (!tier) return "gray";
  
  const colorMap: Record<string, string> = {
    "Grandmaster": "#d4af37", // Gold
    "Master": "#ff6a00",      // Orange
    "Expert": "#7b68ee",      // Purple
    "Contributor": "#00ced1", // Cyan
    "Novice": "#98d8c8",      // Light teal
  };

  return colorMap[tier] || "gray";
}
