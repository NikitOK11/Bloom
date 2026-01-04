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
      <div className="text-green-600 font-medium flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        You are a member
      </div>
    );
  }

  // Show status for existing requests
  if (status === "pending") {
    return (
      <div className="text-yellow-600 font-medium flex items-center gap-2">
        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Request pending
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="text-green-600 font-medium flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Request approved! Refresh to see changes.
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="text-red-600 font-medium flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Request was rejected
      </div>
    );
  }

  // Team is closed or full
  if (!isTeamOpen || isTeamFull) {
    return (
      <button
        disabled
        className="btn-primary opacity-50 cursor-not-allowed"
      >
        {isTeamFull ? "Team is full" : "Team is closed"}
      </button>
    );
  }

  // Show request form
  if (showMessageInput) {
    return (
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmitRequest}
            disabled={status === "loading"}
            className="btn-primary flex-1"
          >
            {status === "loading" ? "Sending..." : "Send Request"}
          </button>
          <button
            onClick={() => {
              setShowMessageInput(false);
              setMessage("");
              setError(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </div>
    );
  }

  // Default: Show "Request to Join" button
  return (
    <div>
      <button
        onClick={() => setShowMessageInput(true)}
        className="btn-primary"
      >
        Request to Join
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
