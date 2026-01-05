"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * PROFILE CREATION PAGE
 * 
 * USER FLOW:
 * 1. User arrives after registration (or direct navigation)
 * 2. User fills in required profile fields
 * 3. On submit → POST /api/profile
 * 4. On success → redirect to /profile
 * 
 * DOMAIN RULES:
 * - User must exist (normally from registration)
 * - Profile must not already exist
 * - Role is required
 * - Interests are for data analysis/ML/coding skills
 */

// Available interest options (data analysis & ML focused)
const INTEREST_OPTIONS = [
  "Machine Learning",
  "Deep Learning", 
  "Data Analysis",
  "Statistical Modeling",
  "Python",
  "R",
  "SQL",
  "Data Visualization",
  "NLP",
  "Computer Vision",
  "Time Series",
  "Feature Engineering",
  "Neural Networks",
  "Competitive Programming",
  "Mathematics",
  "Research",
];

// Role options
const ROLE_OPTIONS = [
  { value: "school_student", label: "School Student" },
  { value: "college_student", label: "College/University Student" },
  { value: "graduate", label: "Graduate / Professional" },
  { value: "other", label: "Other" },
];

// Experience level options
const EXPERIENCE_OPTIONS = [
  { value: "none", label: "No olympiad experience yet" },
  { value: "beginner", label: "Participated in 1-2 competitions" },
  { value: "intermediate", label: "Participated in several competitions" },
  { value: "experienced", label: "Multiple prizes/awards" },
  { value: "advanced", label: "National/International level achievements" },
];

export default function CreateProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    role: "",
    customRole: "", // Custom role text when "other" is selected
    gradeOrYear: "",
    interests: [] as string[],
    skills: "",
    olympiadExperience: "",
    about: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // Check for pending user from registration
  useEffect(() => {
    const pendingUserId = sessionStorage.getItem("pendingUserId");
    const pendingUserName = sessionStorage.getItem("pendingUserName");
    
    if (pendingUserId) {
      setUserId(pendingUserId);
      setUserName(pendingUserName);
    }
    setIsCheckingUser(false);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!userId) {
      setError("No user found. Please register first.");
      return;
    }

    if (!formData.role) {
      setError("Please select your role");
      return;
    }

    if (formData.role === "other" && !formData.customRole.trim()) {
      setError("Please specify your role");
      return;
    }

    if (formData.interests.length === 0) {
      setError("Please select at least one interest/skill");
      return;
    }

    setIsLoading(true);

    try {
      // If "other" is selected, store the custom role text in the role field
      const roleValue = formData.role === "other" && formData.customRole.trim()
        ? `other:${formData.customRole.trim()}`
        : formData.role;

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: roleValue,
          gradeOrYear: formData.gradeOrYear || null,
          interests: formData.interests,
          skills: formData.skills || null,
          olympiadExperience: formData.olympiadExperience || null,
          about: formData.about || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Failed to create profile");
        return;
      }

      // Clear pending user data
      sessionStorage.removeItem("pendingUserId");
      sessionStorage.removeItem("pendingUserName");

      // Redirect to profile page
      router.push("/profile");
    } catch (err) {
      console.error("Profile creation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking for user
  if (isCheckingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // Show message if no user found
  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'var(--accent-gradient)' }}
          />
        </div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="card p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              stroke="rgb(251, 191, 36)"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Registration Required
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Please register first before creating your profile.
            </p>
            <Link href="/register" className="btn btn-primary">
              Go to Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--accent-gradient)' }}
        />
        <div 
          className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
        />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Complete Your Profile
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            {userName ? `Welcome, ${userName}!` : "Welcome!"} Tell us about yourself to find the perfect teammates.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-full text-white"
                style={{ background: 'rgb(34, 197, 94)' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="ml-2 text-sm font-medium" style={{ color: 'rgb(34, 197, 94)' }}>
                Account Created
              </span>
            </div>
            <div className="w-16 h-0.5 mx-4" style={{ background: 'var(--accent-color)' }}></div>
            <div className="flex items-center">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-full text-white font-medium"
                style={{ background: 'var(--accent-gradient)' }}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium" style={{ color: 'var(--accent-color)' }}>
                Create Profile
              </span>
            </div>
            <div className="w-16 h-0.5 mx-4" style={{ background: 'var(--border-color)' }}></div>
            <div className="flex items-center">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-full font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Find Teams
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Role Selection */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                What describes you best? <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value !== "other") {
                    setFormData((prev) => ({ ...prev, customRole: "" }));
                  }
                }}
                className="input w-full"
              >
                <option value="">Select your role...</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Role Input */}
            {formData.role === "other" && (
              <div>
                <label
                  htmlFor="customRole"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Please specify your role <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="customRole"
                  name="customRole"
                  type="text"
                  required
                  value={formData.customRole}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="e.g., Researcher, Working Professional, Teacher..."
                />
              </div>
            )}

            {/* Grade/Year */}
            <div>
              <label
                htmlFor="gradeOrYear"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Grade / Year of Study
              </label>
              <input
                id="gradeOrYear"
                name="gradeOrYear"
                type="text"
                value={formData.gradeOrYear}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., 11th grade, 2nd year, etc."
              />
            </div>

            {/* Interests */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Skills & Interests <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                Select all that apply. This helps teams find you.
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                      style={{
                        background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        border: isSelected ? 'none' : '1px solid var(--border-color)',
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              {formData.interests.length > 0 && (
                <p className="mt-2 text-sm" style={{ color: 'var(--accent-color)' }}>
                  {formData.interests.length} selected
                </p>
              )}
            </div>

            {/* Additional Skills */}
            <div>
              <label
                htmlFor="skills"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Additional Skills
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                value={formData.skills}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., TensorFlow, PyTorch, Kaggle competitions..."
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Any other skills or technologies you want to highlight
              </p>
            </div>

            {/* Olympiad Experience */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Olympiad Experience
              </label>
              <select
                name="olympiadExperience"
                value={formData.olympiadExperience}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="">Select your experience level...</option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* About */}
            <div>
              <label
                htmlFor="about"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                About You
              </label>
              <textarea
                id="about"
                name="about"
                rows={4}
                value={formData.about}
                onChange={handleChange}
                className="input w-full resize-none"
                placeholder="Tell potential teammates about yourself, your goals, and what you're looking for..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="rounded-xl p-4 flex items-start gap-3 animate-fade-in"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)' 
                }}
              >
                <svg
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="#ef4444"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Profile...
                  </span>
                ) : (
                  "Complete Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
