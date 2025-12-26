"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OLYMPIADS, COMMON_SKILLS } from "@/types";

/**
 * Create Team Page
 * 
 * Client Component with form for creating a new team.
 * Uses "use client" because we need interactivity (useState, form handling).
 */
export default function CreateTeamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    olympiad: "",
    requiredSkills: [] as string[],
    maxMembers: 4,
    // In a real app, this would come from authentication
    creatorId: "", // Will be set when creating a user first
  });

  // Handle skill toggle
  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // For MVP demo, create a temporary user first
      // In production, this would use authenticated user's ID
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo User",
          email: `demo-${Date.now()}@example.com`,
          skills: formData.requiredSkills,
          olympiads: [formData.olympiad],
        }),
      });

      const userData = await userRes.json();
      if (!userData.success) {
        throw new Error(userData.error || "Failed to create user");
      }

      // Now create the team
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          creatorId: userData.data.id,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create team");
      }

      // Redirect to teams list on success
      router.push("/teams");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Team</h1>
      <p className="text-gray-600 mb-8">
        Start a new team and find members with the skills you need
      </p>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Team Name *
          </label>
          <input
            type="text"
            id="name"
            required
            className="input"
            placeholder="e.g., IMO Dream Team"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="input"
            placeholder="Tell potential members about your team, goals, and what you're looking for..."
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Olympiad Selection */}
        <div>
          <label htmlFor="olympiad" className="block text-sm font-medium text-gray-700 mb-1">
            Target Olympiad *
          </label>
          <select
            id="olympiad"
            required
            className="input"
            value={formData.olympiad}
            onChange={(e) => setFormData((prev) => ({ ...prev, olympiad: e.target.value }))}
          >
            <option value="">Select an olympiad</option>
            {OLYMPIADS.map((olympiad) => (
              <option key={olympiad} value={olympiad}>
                {olympiad}
              </option>
            ))}
          </select>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select the skills you&apos;re looking for in team members
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  formData.requiredSkills.includes(skill)
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Max Members */}
        <div>
          <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Team Size
          </label>
          <select
            id="maxMembers"
            className="input"
            value={formData.maxMembers}
            onChange={(e) => setFormData((prev) => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
          >
            {[2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} members
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Team"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
