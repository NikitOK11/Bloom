"use client";

import { useState, useEffect } from "react";

/**
 * JoinRequestButton Component Props
 */
interface JoinRequestButtonProps {
  teamId: string;
  userId: string;
  isTeamOpen: boolean;
  isMember: boolean;
  isTeamFull: boolean;
}

/**
 * JoinRequestButton Component
 * 
 * Handles the "Request to Join" functionality with proper state management.
 * 
 * DOMAIN RULES REFLECTED:
 * - Disabled if user is already a member
 * - Disabled if team is closed or full
 * - Disabled if user has a pending request
 * - Shows appropriate status messages
 */
export default function JoinRequestButton({
  teamId,
  userId,
  isTeamOpen,
  isMember,
  isTeamFull,
}: JoinRequestButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "approved" | "rejected">("idle");
  const [message, setMessage] = useState("");
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing request status on mount
  useEffect(() => {
    if (!userId || isMember) return;

    const checkExistingRequest = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}/join-request?userId=${userId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const requestStatus = data.data.status.toLowerCase();
          if (requestStatus === "pending") {
            setStatus("pending");
          } else if (requestStatus === "approved") {
            setStatus("approved");
          } else if (requestStatus === "rejected") {
            setStatus("rejected");
          }
        }
      } catch (err) {
        console.error("Error checking request status:", err);
      }
    };

    checkExistingRequest();
  }, [teamId, userId, isMember]);

  // Handle submit request
  const handleSubmitRequest = async () => {
    if (!userId) {
      setError("Please log in to request to join");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("pending");
        setShowMessageInput(false);
        setMessage("");
      } else {
        setError(data.error || "Failed to send request");
        setStatus("idle");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  // Don't show button if user is a member
  if (isMember) {
    return (
      <div className="tag tag-success">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        You are a member
      </div>
    );
  }

  // Show status for existing requests
  if (status === "pending") {
    return (
      <div className="tag tag-warning">
        <span className="status-dot bg-[var(--warning)]" />
        Request pending
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="tag tag-success">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Approved! Refresh to see changes
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="tag tag-error">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Request rejected
      </div>
    );
  }

  // Team is closed or full
  if (!isTeamOpen || isTeamFull) {
    return (
      <button disabled className="btn btn-primary">
        {isTeamFull ? "Team is full" : "Team is closed"}
      </button>
    );
  }

  // Show request form
  if (showMessageInput) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself (optional)..."
          className="input textarea"
          rows={3}
          maxLength={500}
        />
        <div className="flex gap-3">
          <button
            onClick={handleSubmitRequest}
            disabled={status === "loading"}
            className="btn btn-primary flex-1"
          >
            {status === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </button>
          <button
            onClick={() => {
              setShowMessageInput(false);
              setMessage("");
              setError(null);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-[var(--error)] text-sm">{error}</p>
        )}
      </div>
    );
  }

  // Default: Show "Request to Join" button
  return (
    <div>
      <button
        onClick={() => setShowMessageInput(true)}
        className="btn btn-primary"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Request to Join
      </button>
      {error && (
        <p className="text-[var(--error)] text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
