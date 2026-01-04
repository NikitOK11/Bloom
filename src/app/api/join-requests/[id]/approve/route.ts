import { NextResponse } from "next/server";
import { validateRequestAction, approveJoinRequest } from "@/lib/join-request";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/join-requests/[id]/approve
 * 
 * Approves a join request and adds the user to the team.
 * 
 * DOMAIN RULES ENFORCED:
 * - Only the team leader (creator) can approve
 * - Request must be in PENDING status
 * - Team must still have capacity
 * - User is automatically added to team upon approval
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: requestId } = await params;
    const body = await request.json();
    const { actorUserId } = body;

    if (!actorUserId) {
      return NextResponse.json(
        { success: false, error: "actorUserId is required" },
        { status: 400 }
      );
    }

    // Validate the action
    const validation = await validateRequestAction(requestId, actorUserId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    // Check team capacity before approving
    const team = validation.request!.team;
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { success: false, error: "Team is now full, cannot approve more requests" },
        { status: 400 }
      );
    }

    // Approve the request (this also adds the user to the team)
    const approvedRequest = await approveJoinRequest(requestId);

    return NextResponse.json({
      success: true,
      data: approvedRequest,
      message: `${approvedRequest.user.name} has been added to the team`,
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve join request" },
      { status: 500 }
    );
  }
}
