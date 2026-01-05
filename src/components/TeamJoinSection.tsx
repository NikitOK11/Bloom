"use client";

import { useState, useEffect } from "react";
import JoinRequestButton from "./JoinRequestButton";
import JoinRequestsList from "./JoinRequestsList";
import { TeamLevel, TEAM_LEVELS } from "@/types";

/**
 * TeamJoinSection Component Props
 * 
 * Props include team requirements for showing match warnings
 */
interface TeamJoinSectionProps {
  teamId: string;
  teamCreatorId: string;
  isTeamOpen: boolean;
  isTeamFull: boolean;
  memberUserIds: string[]; // IDs of current team members
  // NEW: Team requirements for soft warning
  requiredInterests?: string | null;
  requiredLevel?: TeamLevel;
  requirementsNote?: string | null;
}

/**
 * TeamJoinSection Component
 * 
 * Client-side wrapper that handles user context for join functionality.
 * In a real app, this would get the user from authentication context.
 * For MVP, we use a mock user selector.
 * 
 * DISPLAYS:
 * - Soft warning if user profile doesn't match team requirements
 * - Join request button for non-members
 * - Join requests list for team leaders
 * 
 * DOMAIN RULE: Users can still apply even if they don't match requirements
 */
export default function TeamJoinSection({
  teamId,
  teamCreatorId,
  isTeamOpen,
  isTeamFull,
  memberUserIds,
  requiredInterests,
  requiredLevel = "any",
  requirementsNote,
}: TeamJoinSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    interests: string[];
    role: string;
  } | null>(null);
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

  // Fetch current user's profile when user changes
  useEffect(() => {
    if (!currentUserId) {
      setCurrentUserProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${currentUserId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentUserProfile({
            interests: data.data.interests ? data.data.interests.split(",") : [],
            role: data.data.role,
          });
        } else {
          setCurrentUserProfile(null);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setCurrentUserProfile(null);
      }
    };

    fetchProfile();
  }, [currentUserId]);

  /**
   * Check if user matches team requirements
   * Returns an object with match status and warnings
   * DOMAIN RULE: This is informational only - users can still apply
   */
  const checkRequirementMatch = () => {
    const warnings: string[] = [];
    
    if (!currentUserProfile) {
      // No profile = can't check, but still allow applying
      return { hasProfile: false, warnings: ["Complete your profile to see if you match this team's requirements"] };
    }

    // Check interest match
    if (requiredInterests) {
      const teamInterests = requiredInterests.split(",").filter(Boolean);
      const userInterests = currentUserProfile.interests;
      const hasMatchingInterest = teamInterests.some((i) => userInterests.includes(i));
      
      if (!hasMatchingInterest && teamInterests.length > 0) {
        warnings.push(`Team is looking for: ${teamInterests.map((i) => i.replace(/_/g, " ")).join(", ")}`);
      }
    }

    // Check level match (rough mapping from profile role to level)
    if (requiredLevel && requiredLevel !== "any") {
      const levelLabel = TEAM_LEVELS.find((l) => l.value === requiredLevel)?.label || requiredLevel;
      warnings.push(`Team prefers ${levelLabel.toLowerCase()} level members`);
    }

    return { hasProfile: true, warnings };
  };

  const requirementCheck = checkRequirementMatch();

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

          {/* SOFT WARNING: Show if user doesn't match requirements */}
          {/* DOMAIN RULE: Does not block user from applying */}
          {requirementCheck.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <p className="text-yellow-800 font-medium text-sm mb-1">
                    {requirementCheck.hasProfile 
                      ? "Your profile may not fully match this team's requirements"
                      : "Profile needed to check requirements"
                    }
                  </p>
                  <ul className="text-yellow-700 text-xs space-y-0.5">
                    {requirementCheck.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="text-yellow-600 text-xs mt-2 italic">
                    You can still apply — the team leader will review your request.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements note from team leader */}
          {requirementsNote && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Team leader's note:</p>
              <p className="text-blue-700 text-sm italic">"{requirementsNote}"</p>
            </div>
          )}

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
