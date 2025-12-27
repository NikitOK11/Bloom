"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * OlympiadFilters Component Props
 */
interface OlympiadFiltersProps {
  years: number[];
  levels: string[];
  subjects: string[];
}

/**
 * OlympiadFilters Component
 * 
 * Client component for filtering olympiads by year and level.
 * Uses URL search params for filter state (enables sharing filtered views).
 */
export default function OlympiadFilters({ years, levels, subjects }: OlympiadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentYear = searchParams.get("year") || "";
  const currentLevel = searchParams.get("level") || "";
  const currentSubject = searchParams.get("subject") || "";

  // Handle filter changes by updating URL params
  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("year", value);
    } else {
      params.delete("year");
    }
    router.push(`/olympiads?${params.toString()}`);
  };

  const handleLevelChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("level", value);
    } else {
      params.delete("level");
    }
    router.push(`/olympiads?${params.toString()}`);
  };

  const handleSubjectChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("subject", value);
    } else {
      params.delete("subject");
    }
    router.push(`/olympiads?${params.toString()}`);
  };

  const hasFilters = currentYear || currentLevel || currentSubject;

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap gap-4">
        {/* Year Filter */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="year-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Year
          </label>
          <select
            id="year-filter"
            value={currentYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="input"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="level-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Level
          </label>
          <select
            id="level-filter"
            value={currentLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="input"
          >
            <option value="">All Levels</option>
            {levels.map((level) => (
              <option key={level} value={level} className="capitalize">
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="subject-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subject
          </label>
          <select
            id="subject-filter"
            value={currentSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="input"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <div className="flex items-end">
            <Link
              href="/olympiads"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
