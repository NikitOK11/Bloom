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
        <h3 className="font-semibold mb-4">Join Requests</h3>
        <div className="flex items-center justify-center py-8">
          <span className="w-6 h-6 border-2 border-[var(--accent-color)]/30 border-t-[var(--accent-color)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4">Join Requests</h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-glass)] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[var(--text-tertiary)]">No pending requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Join Requests</h3>
        <span className="tag tag-accent">{requests.length}</span>
      </div>

      {error && (
        <div className="bg-[var(--error-bg)] text-[var(--error)] px-4 py-3 rounded-lg mb-4 text-sm">
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
              className="border border-[var(--surface-border)] rounded-xl p-4 transition-colors hover:border-[var(--surface-border-hover)]"
            >
              {/* User Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="avatar">
                  {request.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{request.user.name}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{request.user.email}</p>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* View Profile Button */}
              <button
                onClick={() => setViewingProfileUserId(request.user.id)}
                className="btn btn-ghost btn-sm mb-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Full Profile
              </button>

              {/* Bio */}
              {request.user.bio && (
                <p className="text-sm text-[var(--text-secondary)] mb-3">{request.user.bio}</p>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 5 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      +{skills.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Message */}
              {request.message && (
                <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 mb-4">
                  <p className="text-sm text-[var(--text-secondary)] italic">
                    &ldquo;{request.message}&rdquo;
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing}
                  className="btn btn-success flex-1 btn-sm"
                >
                  {isProcessing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                  className="btn btn-danger flex-1 btn-sm"
                >
                  {isProcessing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Modal */}
      {viewingProfileUserId && (
        <>
          <div className="overlay" onClick={() => setViewingProfileUserId(null)} />
          <div className="modal p-0">
            <ProfileView
              userId={viewingProfileUserId}
              viewerId={actorUserId}
              onClose={() => setViewingProfileUserId(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
