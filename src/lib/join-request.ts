/**
 * Join Request Domain Logic
 * 
 * DOMAIN RULES:
 * - Users cannot join teams directly; they must go through the join request flow
 * - Only one PENDING request per user per team is allowed
 * - Users cannot request to join teams they are already members of
 * - Only team leaders (creators) can approve/reject requests
 * - When approved, user is added to team and request status becomes APPROVED
 * - **PROFILE REQUIRED**: Users MUST have a profile to submit join requests
 */

import prisma from "@/lib/prisma";
import { JoinRequestStatus } from "@/types";

// Valid status transitions
export const JOIN_REQUEST_STATUSES: JoinRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

/**
 * Validates that a user can submit a join request to a team
 * Returns an error message if invalid, or null if valid
 * 
 * VALIDATION ORDER:
 * 1. Team exists and is open
 * 2. Team is not full
 * 3. User exists
 * 4. User has a profile (REQUIRED - enforced domain rule)
 * 5. User is not already a member
 * 6. User doesn't have a pending request
 */
export async function validateJoinRequest(
  userId: string,
  teamId: string
): Promise<{ valid: false; error: string; status: number } | { valid: true }> {
  // Check if team exists and is open
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!team) {
    return { valid: false, error: "Team not found", status: 404 };
  }

  if (!team.isOpen) {
    return { valid: false, error: "Team is not accepting new members", status: 400 };
  }

  if (team._count.members >= team.maxMembers) {
    return { valid: false, error: "Team is already full", status: 400 };
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true, // Include profile to check if exists
    },
  });

  if (!user) {
    return { valid: false, error: "User not found", status: 404 };
  }

  // DOMAIN RULE: Profile is REQUIRED to send join requests
  // This ensures team leaders have information about applicants
  if (!user.profile) {
    return { 
      valid: false, 
      error: "You must complete your profile before requesting to join a team. Please create your profile first.",
      status: 403 
    };
  }

  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
  });

  if (existingMember) {
    return { valid: false, error: "You are already a member of this team", status: 409 };
  }

  // Check if user already has a pending request
  const existingRequest = await prisma.joinRequest.findFirst({
    where: {
      userId,
      teamId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    return { valid: false, error: "You already have a pending request for this team", status: 409 };
  }

  return { valid: true };
}

/**
 * Validates that a user can approve/reject a join request
 * Only the team leader (creator) can do this
 */
export async function validateRequestAction(
  requestId: string,
  actorUserId: string
): Promise<
  | { valid: false; error: string; status: number }
  | { valid: true; request: Awaited<ReturnType<typeof prisma.joinRequest.findUnique>> & { team: { creatorId: string; maxMembers: number; _count: { members: number } } } }
> {
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
        },
      },
      user: true,
    },
  });

  if (!request) {
    return { valid: false, error: "Join request not found", status: 404 };
  }

  if (request.status !== "PENDING") {
    return { valid: false, error: `Request has already been ${request.status.toLowerCase()}`, status: 400 };
  }

  // Only team creator can approve/reject
  if (request.team.creatorId !== actorUserId) {
    return { valid: false, error: "Only the team leader can approve or reject requests", status: 403 };
  }

  return { valid: true, request: request as typeof request & { team: { creatorId: string; maxMembers: number; _count: { members: number } } } };
}

/**
 * Approves a join request and adds the user to the team
 * DOMAIN RULE: This is the ONLY way users should be added to teams
 */
export async function approveJoinRequest(requestId: string) {
  // Use a transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    const request = await tx.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    // Check team capacity one more time
    if (request.team._count.members >= request.team.maxMembers) {
      throw new Error("Team is now full");
    }

    // Update request status
    const updatedRequest = await tx.joinRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
      include: {
        user: true,
        team: true,
      },
    });

    // Add user to team as member
    await tx.teamMember.create({
      data: {
        userId: request.userId,
        teamId: request.teamId,
        role: "member",
      },
    });

    return updatedRequest;
  });
}

/**
 * Rejects a join request
 */
export async function rejectJoinRequest(requestId: string) {
  return prisma.joinRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
    include: {
      user: true,
      team: true,
    },
  });
}
