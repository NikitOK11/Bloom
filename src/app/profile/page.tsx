"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";
import ConnectedPlatforms from "@/components/ConnectedPlatforms";

/**
 * User data from API
 */
interface UserData {
  id: string;
  name: string;
  email: string;
}

interface ProfileData {
  id: string;
  userId: string;
  role: string;
  gradeOrYear: string | null;
  interests: string;
  skills: string | null;
  olympiadExperience: string | null;
  about: string | null;
}

/**
 * Profile Page
 * 
 * USER FLOW:
 * - If user has no profile → redirect to /profile/create
 * - If user has profile → show editable profile view
 * 
 * DOMAIN RULES:
 * - Profile is REQUIRED for certain actions (join requests)
 * - This page is for viewing/editing existing profiles
 * - New profiles must be created at /profile/create
 * 
 * MVP MODE: Uses user selector dropdown (would use auth in production)
 */

// Role labels
const ROLE_LABELS: Record<string, string> = {
  school_student: "School Student",
  college_student: "College/University Student",
  graduate: "Graduate / Professional",
  other: "Other",
};

/**
 * Get display label for role, handling custom "other:xxx" format
 */
function getRoleLabel(role: string): string {
  if (role.startsWith("other:")) {
    return role.substring(6); // Return the custom role text
  }
  return ROLE_LABELS[role] || role;
}

// Experience labels
const EXPERIENCE_LABELS: Record<string, string> = {
  none: "No olympiad experience yet",
  beginner: "Participated in 1-2 competitions",
  intermediate: "Participated in several competitions",
  experienced: "Multiple prizes/awards",
  advanced: "National/International level achievements",
};

export default function ProfilePage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch available users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setUsers(data.data);
          setSelectedUserId(data.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${selectedUserId}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.data.profile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [selectedUserId]);

  const handleProfileUpdated = () => {
    // Refresh profile after update
    if (selectedUserId) {
      fetch(`/api/profile?userId=${selectedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProfile(data.data.profile);
            setIsEditing(false);
          }
        });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Your Profile
        </h1>
        <div 
          className="card p-6"
          style={{ 
            background: 'rgba(251, 191, 36, 0.1)', 
            border: '1px solid rgba(251, 191, 36, 0.3)' 
          }}
        >
          <p style={{ color: 'rgb(217, 119, 6)' }} className="mb-4">
            No users found. Please register first.
          </p>
          <Link href="/register" className="btn btn-primary">
            Register Now
          </Link>
        </div>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const interestsList = profile?.interests ? profile.interests.split(",").filter(Boolean) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Your Profile
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
        Your profile helps team leaders learn more about you when reviewing join requests.
      </p>

      {/* User Selector (MVP - would be replaced with auth in production) */}
      <div className="card p-4 mb-6" style={{ background: 'var(--bg-tertiary)' }}>
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Viewing profile as (demo mode):
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            setIsEditing(false);
          }}
          className="input w-full"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* No Profile - Prompt to Create */}
      {!profile && selectedUser && (
        <div 
          className="card p-6"
          style={{ 
            background: 'rgba(251, 191, 36, 0.1)', 
            border: '1px solid rgba(251, 191, 36, 0.3)' 
          }}
        >
          <div className="flex items-start gap-4">
            <svg
              className="h-6 w-6 flex-shrink-0"
              fill="none"
              stroke="rgb(217, 119, 6)"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(217, 119, 6)' }}>
                Profile Not Created
              </h3>
              <p className="mt-1" style={{ color: 'rgb(180, 83, 9)' }}>
                {selectedUser.name} doesn&apos;t have a profile yet. A profile is required to:
              </p>
              <ul className="mt-2 list-disc list-inside text-sm" style={{ color: 'rgb(180, 83, 9)' }}>
                <li>Request to join teams</li>
                <li>Be discovered by team leaders</li>
                <li>Show your skills and experience</li>
              </ul>
              <Link href="/profile/create" className="btn btn-primary mt-4 inline-flex">
                Create Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Profile View */}
      {profile && selectedUser && !isEditing && (
        <div className="space-y-6">
          {/* User Header */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <span className="text-2xl text-white font-bold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedUser.name}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>{selectedUser.email}</p>
                  <span className="tag mt-2 inline-block">
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Profile Details
            </h3>
            
            {/* Grade/Year */}
            {profile.gradeOrYear && (
              <div className="mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Grade/Year:
                </span>
                <p style={{ color: 'var(--text-primary)' }}>{profile.gradeOrYear}</p>
              </div>
            )}

            {/* Experience */}
            {profile.olympiadExperience && (
              <div className="mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Olympiad Experience:
                </span>
                <p style={{ color: 'var(--text-primary)' }}>
                  {EXPERIENCE_LABELS[profile.olympiadExperience] || profile.olympiadExperience}
                </p>
              </div>
            )}

            {/* Interests */}
            {interestsList.length > 0 && (
              <div className="mb-4">
                <span 
                  className="text-sm font-medium block mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Skills & Interests:
                </span>
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((interest) => (
                    <span key={interest} className="tag">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Skills */}
            {profile.skills && (
              <div className="mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Additional Skills:
                </span>
                <p style={{ color: 'var(--text-primary)' }}>{profile.skills}</p>
              </div>
            )}

            {/* About */}
            {profile.about && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  About:
                </span>
                <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {profile.about}
                </p>
              </div>
            )}
          </div>

          {/* Profile Completeness */}
          <div 
            className="card p-4"
            style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.3)' 
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="rgb(34, 197, 94)"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium" style={{ color: 'rgb(22, 163, 74)' }}>
                Profile complete! You can now request to join teams.
              </span>
            </div>
          </div>

          {/* Connected Platforms Section */}
          <ConnectedPlatforms userId={selectedUserId} />
        </div>
      )}

      {/* Profile Edit Form */}
      {profile && selectedUser && isEditing && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Edit Profile
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
          <ProfileForm
            key={selectedUserId}
            userId={selectedUserId}
            onSuccess={handleProfileUpdated}
          />
        </div>
      )}
    </div>
  );
}
