"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMMON_SKILLS } from "@/types";

/**
 * Olympiad info for display
 */
interface OlympiadInfo {
  id: string;
  name: string;
  shortName: string;
  year: number;
  subject: string;
}

/**
 * Create Team Page (within Olympiad context)
 * 
 * DOMAIN RULE: Teams must be created within an olympiad.
 * This page is accessed via /olympiads/[id]/teams/create
 * and automatically associates the team with the olympiad.
 */
export default function CreateTeamForOlympiadPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [olympiad, setOlympiad] = useState<OlympiadInfo | null>(null);

  // Form state (no olympiad selection needed - it's from URL)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requiredSkills: [] as string[],
    maxMembers: 4,
  });

  // Fetch olympiad info on mount
  useEffect(() => {
    async function fetchOlympiad() {
      try {
        const res = await fetch(`/api/olympiads/${params.id}`);
        if (!res.ok) {
          throw new Error("Olympiad not found");
        }
        const data = await res.json();
        setOlympiad(data);
      } catch (err) {
        setError("Olympiad not found");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOlympiad();
  }, [params.id]);

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
          olympiads: [olympiad?.shortName || ""],
        }),
      });

      const userData = await userRes.json();
      if (!userData.success) {
        throw new Error(userData.error || "Failed to create user");
      }

      // Create team within olympiad context
      const res = await fetch(`/api/olympiads/${params.id}/teams`, {
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

      // Redirect to olympiad page on success
      router.push(`/olympiads/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - olympiad not found
  if (!olympiad) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Olympiad Not Found</h1>
        <p className="text-gray-600 mb-6">
          The olympiad you're looking for doesn't exist.
        </p>
        <Link href="/olympiads" className="btn-primary">
          Browse Olympiads
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href={`/olympiads/${params.id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to {olympiad.shortName}
        </Link>
      </div>

      {/* Olympiad Context Banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-primary-700">
          Creating team for <strong>{olympiad.name}</strong> ({olympiad.year})
        </p>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Team</h1>
      <p className="text-gray-600 mb-8">
        Start a new team for {olympiad.shortName} and find members with the skills you need
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
            placeholder={`e.g., ${olympiad.shortName} Dream Team`}
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

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select the skills you're looking for in team members
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
            {[2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} members
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
          <Link
            href={`/olympiads/${params.id}`}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
