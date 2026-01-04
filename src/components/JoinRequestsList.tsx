"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileView from "./ProfileView";

/**
 * JoinRequest type for this component
 */
interface JoinRequestData {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    skills: string;
    olympiads: string;
  };
}

/**
 * JoinRequestsList Component Props
 */
interface JoinRequestsListProps {
  teamId: string;
  actorUserId: string; // The team leader viewing requests
}

/**
 * JoinRequestsList Component
 * 
 * Displays pending join requests for a team and allows the leader
 * to approve or reject them.
 * 
 * DOMAIN RULES:
 * - Only team leaders should see this component
 * - Approving adds the user to the team
 * - Each request can only be approved or rejected once
 * - Team leaders can view full profiles of requesters
 */
export default function JoinRequestsList({
  teamId,
  actorUserId,
}: JoinRequestsListProps) {
  const [requests, setRequests] = useState<JoinRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Profile modal state
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);

  // Fetch pending requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/teams/${teamId}/join-requests?status=PENDING&actorUserId=${actorUserId}`
      );
      const data = await res.json();

      if (data.success) {
        setRequests(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load requests");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [teamId, actorUserId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle approve
  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const res = await fetch(`/api/join-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUserId }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        setError(data.error || "Failed to approve request");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setError("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const res = await fetch(`/api/join-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUserId }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        setError(data.error || "Failed to reject request");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  // Parse skills from comma-separated string
  const parseSkills = (skills: string): string[] => {
    return skills ? skills.split(",").filter(Boolean) : [];
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Join Requests</h3>
        <div className="text-gray-500 text-center py-4">Loading...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Join Requests</h3>
        <div className="text-gray-500 text-center py-4">
          No pending requests
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">
        Join Requests ({requests.length})
      </h3>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {requests.map((request) => {
          const skills = parseSkills(request.user.skills);
          const isProcessing = processingId === request.id;

          return (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              {/* User Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-semibold">
                    {request.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{request.user.name}</p>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* View Profile Button - Access controlled on server */}
              <button
                onClick={() => setViewingProfileUserId(request.user.id)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-3 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Full Profile
              </button>

              {/* Bio */}
              {request.user.bio && (
                <p className="text-sm text-gray-600 mb-2">{request.user.bio}</p>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{skills.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Message */}
              {request.message && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700 italic">
                    "{request.message}"
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Modal */}
      {viewingProfileUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ProfileView
              userId={viewingProfileUserId}
              viewerId={actorUserId}
              onClose={() => setViewingProfileUserId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
