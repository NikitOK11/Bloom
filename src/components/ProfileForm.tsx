"use client";

import { useState, useEffect } from "react";
import { PROFILE_ROLES, PROFILE_INTERESTS, ProfileRole } from "@/types";

/**
 * ProfileForm Component Props
 */
interface ProfileFormProps {
  userId: string;
  onSave?: () => void;
}

/**
 * Profile data from API
 */
interface ProfileData {
  id: string;
  role: ProfileRole;
  gradeOrYear: string | null;
  interests: string;
  olympiadExperience: string | null;
  about: string | null;
}

/**
 * ProfileForm Component
 * 
 * Editable form for the user's profile.
 * Handles both creating a new profile and updating an existing one.
 * 
 * PRIVACY NOTE: This form is only for the user's own profile.
 * Other users' profiles are read-only and accessed through different components.
 */
export default function ProfileForm({ userId, onSave }: ProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    role: "school_student" as ProfileRole,
    gradeOrYear: "",
    interests: [] as string[],
    olympiadExperience: "",
    about: "",
  });

  // Fetch existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        const data = await res.json();

        if (data.success && data.data) {
          const profile: ProfileData = data.data;
          setHasExistingProfile(true);
          setFormData({
            role: profile.role as ProfileRole,
            gradeOrYear: profile.gradeOrYear || "",
            interests: profile.interests ? profile.interests.split(",").filter(Boolean) : [],
            olympiadExperience: profile.olympiadExperience || "",
            about: profile.about || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setHasExistingProfile(true);
        onSave?.();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center text-gray-500 py-8">Loading profile...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Profile {hasExistingProfile ? "updated" : "created"} successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Role Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Educational Background
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a... <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROFILE_ROLES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: value }))}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.role === value
                      ? "bg-primary-100 border-primary-500 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade / Year
            </label>
            <input
              type="text"
              value={formData.gradeOrYear}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gradeOrYear: e.target.value }))
              }
              placeholder="e.g., 11th grade, 2nd year, PhD candidate"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Interests & Focus Areas
        </h3>

        <div className="flex flex-wrap gap-2">
          {PROFILE_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.interests.includes(interest)
                  ? "bg-primary-100 text-primary-700 border-2 border-primary-500"
                  : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
              }`}
            >
              {interest.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Select all that apply
        </p>
      </div>

      {/* Olympiad Experience */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Olympiad Experience
        </h3>

        <textarea
          value={formData.olympiadExperience}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, olympiadExperience: e.target.value }))
          }
          placeholder="Tell us about your olympiad experience. Which competitions have you participated in? What results have you achieved?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* About */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          About Me
        </h3>

        <textarea
          value={formData.about}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, about: e.target.value }))
          }
          placeholder="Write a brief introduction about yourself. What motivates you? What are you looking for in a team?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : hasExistingProfile ? "Update Profile" : "Create Profile"}
        </button>
      </div>
    </form>
  );
}
