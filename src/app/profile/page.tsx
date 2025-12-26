"use client";

import { useState } from "react";
import { OLYMPIADS, COMMON_SKILLS } from "@/types";

/**
 * Profile Page
 * 
 * Allows users to create/edit their profile.
 * In MVP, this creates a new user each time (no auth).
 * In production, this would load/save the authenticated user's profile.
 */
export default function ProfilePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [] as string[],
    olympiads: [] as string[],
  });

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  // Toggle olympiad selection
  const toggleOlympiad = (olympiad: string) => {
    setFormData((prev) => ({
      ...prev,
      olympiads: prev.olympiads.includes(olympiad)
        ? prev.olympiads.filter((o) => o !== olympiad)
        : [...prev.olympiads, olympiad],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Profile created successfully! You can now create or join teams.",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          bio: "",
          skills: [],
          olympiads: [],
        });
      } else {
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
      <p className="text-gray-600 mb-8">
        Tell us about yourself so teams can find you
      </p>

      {/* Status Message */}
      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg mb-6 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            required
            className="input"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            required
            className="input"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          />
          <p className="text-sm text-gray-500 mt-1">
            Used for team communication (not displayed publicly)
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            About You
          </label>
          <textarea
            id="bio"
            rows={4}
            className="input"
            placeholder="Tell us about your olympiad experience, achievements, and what you're looking for..."
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Skills
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select all that apply
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  formData.skills.includes(skill)
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Olympiads */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Olympiads of Interest
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Which olympiads are you interested in?
          </p>
          <div className="flex flex-wrap gap-2">
            {OLYMPIADS.map((olympiad) => (
              <button
                key={olympiad}
                type="button"
                onClick={() => toggleOlympiad(olympiad)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  formData.olympiads.includes(olympiad)
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-primary-300"
                }`}
              >
                {olympiad}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      {/* Note about MVP */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>MVP Note:</strong> In the full version, this page would load your
          existing profile if you&apos;re logged in, and update it instead of creating
          a new one each time.
        </p>
      </div>
    </div>
  );
}
