/**
 * Profile Access Control Logic
 * 
 * PRIVACY RULES:
 * Profiles are NOT publicly browsable. Access is restricted to:
 * 1. The profile owner (for viewing and editing their own profile)
 * 2. Team leaders reviewing join requests from the profile owner
 * 
 * This ensures user data is only shared in relevant contexts,
 * specifically when a user has actively requested to join a team.
 */

import prisma from "@/lib/prisma";

/**
 * Checks if a user can view another user's profile.
 * 
 * ACCESS RULES:
 * - Users can always view their own profile
 * - Team leaders can view profiles of users who have PENDING join requests
 *   to any team the leader created
 * 
 * @param viewerId - The ID of the user trying to view the profile
 * @param profileUserId - The ID of the user whose profile is being viewed
 * @returns Object with canView boolean and optional error/reason
 */
export async function canViewProfile(
  viewerId: string,
  profileUserId: string
): Promise<{ canView: boolean; reason?: string }> {
  // Rule 1: Users can always view their own profile
  if (viewerId === profileUserId) {
    return { canView: true };
  }

  // Rule 2: Check if viewer is a team leader with a pending request from this user
  // This requires:
  // a) The viewer has created at least one team
  // b) The profile user has a PENDING join request to one of those teams
  const pendingRequestFromUser = await prisma.joinRequest.findFirst({
    where: {
      userId: profileUserId,
      status: "PENDING",
      team: {
        creatorId: viewerId, // The viewer is the team creator
      },
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (pendingRequestFromUser) {
    return { 
      canView: true, 
      reason: `Viewing as leader of team "${pendingRequestFromUser.team.name}"` 
    };
  }

  // Default: Access denied
  // User profiles are private to prevent unwanted browsing
  return { 
    canView: false, 
    reason: "You can only view profiles of users who have sent join requests to your teams" 
  };
}

/**
 * Gets all team leader IDs for teams that have pending requests from a specific user.
 * Used to determine who can view a user's profile.
 * 
 * @param userId - The user whose profile access we're checking
 * @returns Array of user IDs who are leaders of teams with pending requests from this user
 */
export async function getAuthorizedViewers(userId: string): Promise<string[]> {
  const pendingRequests = await prisma.joinRequest.findMany({
    where: {
      userId,
      status: "PENDING",
    },
    include: {
      team: {
        select: {
          creatorId: true,
        },
      },
    },
  });

  // Get unique leader IDs using Array.from for compatibility
  const leaderIds = Array.from(new Set(pendingRequests.map((r) => r.team.creatorId)));
  
  // Always include the user themselves
  if (!leaderIds.includes(userId)) {
    leaderIds.push(userId);
  }

  return leaderIds;
}
