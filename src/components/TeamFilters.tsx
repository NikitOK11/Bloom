"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROFILE_INTERESTS, TEAM_LEVELS } from "@/types";

/**
 * TeamFilters Component Props
 */
interface TeamFiltersProps {
  olympiadId: string;
}

/**
 * TeamFilters Component
 * 
 * Client Component for filtering teams by:
 * - Interest area (from PROFILE_INTERESTS)
 * - Required experience level
 * 
 * Filters are applied via URL search params for shareable links.
 * Helps users find teams that match their profile faster.
 */
export default function TeamFilters({ olympiadId }: TeamFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filter values from URL
  const currentInterest = searchParams.get("interest") || "";
  const currentLevel = searchParams.get("level") || "";

  /**
   * Update URL with new filter value
   * Preserves other existing params
   */
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Navigate to the same page with updated params
    router.push(`/olympiads/${olympiadId}?${params.toString()}`);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    router.push(`/olympiads/${olympiadId}`);
  };

  const hasActiveFilters = currentInterest || currentLevel;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Interest Filter */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="interest-filter" className="block text-xs font-medium text-gray-500 mb-1">
            Interest Area
          </label>
          <select
            id="interest-filter"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={currentInterest}
            onChange={(e) => updateFilter("interest", e.target.value)}
          >
            <option value="">All interests</option>
            {PROFILE_INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="level-filter" className="block text-xs font-medium text-gray-500 mb-1">
            Experience Level
          </label>
          <select
            id="level-filter"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={currentLevel}
            onChange={(e) => updateFilter("level", e.target.value)}
          >
            <option value="">All levels</option>
            {TEAM_LEVELS.filter((l) => l.value !== "any").map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing teams matching:{" "}
            {currentInterest && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs ml-1">
                {currentInterest.replace(/_/g, " ")}
                <button
                  onClick={() => updateFilter("interest", "")}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {currentLevel && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs ml-1">
                {TEAM_LEVELS.find((l) => l.value === currentLevel)?.label || currentLevel}
                <button
                  onClick={() => updateFilter("level", "")}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
