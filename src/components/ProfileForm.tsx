"use client";

import { useState, useEffect } from "react";
import { PROFILE_ROLES, PROFILE_INTERESTS, ProfileRole } from "@/types";

/**
 * ProfileForm Component Props
 */
interface ProfileFormProps {
  userId: string;
  onSave?: () => void;
  onSuccess?: () => void; // Called after successful save
}

/**
 * Profile data from API
 */
interface ProfileData {
  id: string;
  role: ProfileRole;
  gradeOrYear: string | null;
  interests: string;
  skills: string | null;
  olympiadExperience: string | null;
  about: string | null;
}

/**
 * ProfileForm Component
 * 
 * Editable form for updating existing user profiles.
 * 
 * DOMAIN RULES:
 * - Only for UPDATING existing profiles (use /profile/create for new)
 * - Uses PUT /api/profile endpoint
 * 
 * PRIVACY NOTE: This form is only for the user's own profile.
 */
export default function ProfileForm({ userId, onSave, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    role: "school_student" as ProfileRole,
    customRole: "", // Custom role text when "other" is selected
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

        if (data.success && data.data.profile) {
          const profile: ProfileData = data.data.profile;
          setHasExistingProfile(true);
          
          // Parse role - check if it's a custom "other:xxx" format
          let roleValue = profile.role as ProfileRole;
          let customRoleValue = "";
          if (profile.role.startsWith("other:")) {
            roleValue = "other" as ProfileRole;
            customRoleValue = profile.role.substring(6); // Remove "other:" prefix
          }
          
          setFormData({
            role: roleValue,
            customRole: customRoleValue,
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

    // Validate custom role if "other" is selected
    if (formData.role === "other" && !formData.customRole.trim()) {
      setError("Please specify your role");
      setSaving(false);
      return;
    }

    // If "other" is selected, store the custom role text in the role field
    const roleValue = formData.role === "other" && formData.customRole.trim()
      ? `other:${formData.customRole.trim()}`
      : formData.role;

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...formData,
          role: roleValue,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setHasExistingProfile(true);
        onSave?.();
        onSuccess?.();
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
      <div className="card p-8">
        <div className="flex items-center justify-center">
          <div 
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
          />
          <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div 
          className="rounded-xl p-4 flex items-center gap-2 animate-fade-in"
          style={{ 
            background: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)' 
          }}
        >
          <svg className="w-5 h-5" fill="rgb(34, 197, 94)" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span style={{ color: 'rgb(22, 163, 74)' }}>
            Profile {hasExistingProfile ? "updated" : "created"} successfully!
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="rounded-xl p-4 flex items-center gap-2 animate-fade-in"
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}
        >
          <svg className="w-5 h-5" fill="#ef4444" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span style={{ color: '#ef4444' }}>{error}</span>
        </div>
      )}

      {/* Role Selection */}
      <div className="card p-6">
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Educational Background
        </h3>

        <div className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              I am a... <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROFILE_ROLES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ 
                      ...prev, 
                      role: value,
                      customRole: value !== "other" ? "" : prev.customRole
                    }));
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: formData.role === value ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: formData.role === value ? 'white' : 'var(--text-secondary)',
                    border: formData.role === value ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Role Input */}
          {formData.role === "other" && (
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Please specify your role <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.customRole}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customRole: e.target.value }))
                }
                placeholder="e.g., Researcher, Working Professional, Teacher..."
                className="input w-full"
                required
              />
            </div>
          )}

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Grade / Year
            </label>
            <input
              type="text"
              value={formData.gradeOrYear}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gradeOrYear: e.target.value }))
              }
              placeholder="e.g., 11th grade, 2nd year, PhD candidate"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="card p-6">
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Interests & Focus Areas
        </h3>

        <div className="flex flex-wrap gap-2">
          {PROFILE_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: formData.interests.includes(interest) ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                color: formData.interests.includes(interest) ? 'white' : 'var(--text-secondary)',
                border: formData.interests.includes(interest) ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {interest.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Select all that apply
        </p>
      </div>

      {/* Olympiad Experience */}
      <div className="card p-6">
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Olympiad Experience
        </h3>

        <textarea
          value={formData.olympiadExperience}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, olympiadExperience: e.target.value }))
          }
          placeholder="Tell us about your olympiad experience. Which competitions have you participated in? What results have you achieved?"
          rows={4}
          className="input w-full resize-none"
        />
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          About Me
        </h3>

        <textarea
          value={formData.about}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, about: e.target.value }))
          }
          placeholder="Write a brief introduction about yourself. What motivates you? What are you looking for in a team?"
          rows={4}
          className="input w-full resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : hasExistingProfile ? "Update Profile" : "Create Profile"}
        </button>
      </div>
    </form>
  );
}
