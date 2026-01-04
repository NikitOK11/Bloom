"use client";

import { useState, useEffect } from "react";
import { ProfileRole, PROFILE_ROLES } from "@/types";

/**
 * Profile data structure from API
 */
interface ProfileViewData {
  user: {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    skills: string;
    olympiads: string;
    createdAt: string;
  };
  profile: {
    id: string;
    role: ProfileRole;
    gradeOrYear: string | null;
    interests: string;
    olympiadExperience: string | null;
    about: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  hasProfile: boolean;
}

/**
 * ProfileView Component Props
 */
interface ProfileViewProps {
  userId: string;      // The user whose profile to view
  viewerId: string;    // The user requesting to view (for access control)
  onClose?: () => void;
}

/**
 * ProfileView Component
 * 
 * Read-only view of a user's profile.
 * Used by team leaders when reviewing join requests.
 * 
 * PRIVACY: Access is strictly controlled on the server.
 * Only team leaders with pending join requests from this user can view.
 */
export default function ProfileView({ userId, viewerId, onClose }: ProfileViewProps) {
  const [data, setData] = useState<ProfileViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${userId}?viewerId=${viewerId}`);
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else if (result.code === "PROFILE_ACCESS_DENIED") {
          setAccessDenied(true);
          setError(result.error);
        } else {
          setError(result.error || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, viewerId]);

  // Get role label
  const getRoleLabel = (role: string): string => {
    const found = PROFILE_ROLES.find((r) => r.value === role);
    return found?.label || role;
  };

  // Parse comma-separated string to array
  const parseList = (str: string | null | undefined): string[] => {
    return str ? str.split(",").filter(Boolean) : [];
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Access Denied</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Profile not found"}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 text-gray-600 hover:text-gray-900"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const { user, profile, hasProfile } = data;
  const skills = parseList(user.skills);
  const olympiads = parseList(user.olympiads);
  const interests = parseList(profile?.interests);

  return (
    <div className="p-6">
      {/* Header with close button */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-primary-700 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            {hasProfile && profile && (
              <span className="inline-block mt-1 text-sm bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {getRoleLabel(profile.role)}
                {profile.gradeOrYear && ` · ${profile.gradeOrYear}`}
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* User Bio */}
      {user.bio && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Bio
          </h3>
          <p className="text-gray-700">{user.bio}</p>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Olympiads of Interest */}
      {olympiads.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Olympiads of Interest
          </h3>
          <div className="flex flex-wrap gap-2">
            {olympiads.map((olympiad) => (
              <span
                key={olympiad}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {olympiad}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extended Profile Section (if exists) */}
      {hasProfile && profile && (
        <>
          {/* Interests */}
          {interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Interests & Focus Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {interest.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Olympiad Experience */}
          {profile.olympiadExperience && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Olympiad Experience
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {profile.olympiadExperience}
              </p>
            </div>
          )}

          {/* About */}
          {profile.about && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                About
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.about}</p>
            </div>
          )}
        </>
      )}

      {/* No profile message */}
      {!hasProfile && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">
            This user has not completed their extended profile yet.
          </p>
        </div>
      )}

      {/* Member since */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
