"use client";

import { useState, useEffect } from "react";
import JoinRequestButton from "./JoinRequestButton";
import JoinRequestsList from "./JoinRequestsList";

/**
 * TeamJoinSection Component Props
 */
interface TeamJoinSectionProps {
  teamId: string;
  teamCreatorId: string;
  isTeamOpen: boolean;
  isTeamFull: boolean;
  memberUserIds: string[]; // IDs of current team members
}

/**
 * TeamJoinSection Component
 * 
 * Client-side wrapper that handles user context for join functionality.
 * In a real app, this would get the user from authentication context.
 * For MVP, we use a mock user selector.
 * 
 * DISPLAYS:
 * - Join request button for non-members
 * - Join requests list for team leaders
 */
export default function TeamJoinSection({
  teamId,
  teamCreatorId,
  isTeamOpen,
  isTeamFull,
  memberUserIds,
}: TeamJoinSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available users for demo purposes
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
          // Set first user as default if available
          if (data.data.length > 0) {
            setCurrentUserId(data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="card bg-gray-50">
        <p className="text-gray-500 text-center">Loading...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card bg-gray-50">
        <p className="text-gray-500 text-center">
          No users available. Create users first.
        </p>
      </div>
    );
  }

  const isMember = memberUserIds.includes(currentUserId);
  const isLeader = currentUserId === teamCreatorId;

  return (
    <div className="space-y-4">
      {/* User selector (for demo - would be replaced with auth in production) */}
      <div className="card bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Acting as user (demo):
        </label>
        <select
          value={currentUserId}
          onChange={(e) => setCurrentUserId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} {user.id === teamCreatorId ? "(Team Leader)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Join Request Section */}
      {!isLeader && isTeamOpen && !isTeamFull && (
        <div className="card bg-primary-50 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            Interested in joining?
          </h3>
          <p className="text-gray-600 mb-4">
            Send a request to the team leader.
          </p>
          <JoinRequestButton
            teamId={teamId}
            userId={currentUserId}
            isTeamOpen={isTeamOpen}
            isMember={isMember}
            isTeamFull={isTeamFull}
          />
        </div>
      )}

      {/* Show member status if already a member but not leader */}
      {isMember && !isLeader && (
        <div className="card bg-green-50 border-green-200">
          <div className="text-green-700 font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            You are a member of this team
          </div>
        </div>
      )}

      {/* Team Leader View - Join Requests */}
      {isLeader && (
        <JoinRequestsList teamId={teamId} actorUserId={currentUserId} />
      )}
    </div>
  );
}
