import { NextResponse } from "next/server";
import { validateRequestAction, rejectJoinRequest } from "@/lib/join-request";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/join-requests/[id]/reject
 * 
 * Rejects a join request.
 * 
 * DOMAIN RULES ENFORCED:
 * - Only the team leader (creator) can reject
 * - Request must be in PENDING status
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

    // Reject the request
    const rejectedRequest = await rejectJoinRequest(requestId);

    return NextResponse.json({
      success: true,
      data: rejectedRequest,
      message: `Request from ${rejectedRequest.user.name} has been rejected`,
    });
  } catch (error) {
    console.error("Error rejecting join request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject join request" },
      { status: 500 }
    );
  }
}
