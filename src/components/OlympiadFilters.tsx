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
 * Premium filter bar with glassmorphism styling.
 * Uses URL search params for shareable filtered views.
 */
export default function OlympiadFilters({ years, levels, subjects }: OlympiadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentYear = searchParams.get("year") || "";
  const currentLevel = searchParams.get("level") || "";
  const currentSubject = searchParams.get("subject") || "";

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("year", value);
    else params.delete("year");
    router.push(`/olympiads?${params.toString()}`);
  };

  const handleLevelChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("level", value);
    else params.delete("level");
    router.push(`/olympiads?${params.toString()}`);
  };

  const handleSubjectChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("subject", value);
    else params.delete("subject");
    router.push(`/olympiads?${params.toString()}`);
  };

  const hasFilters = currentYear || currentLevel || currentSubject;

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Year Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="year-filter" className="label">
            Year
          </label>
          <select
            id="year-filter"
            value={currentYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="input select"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="level-filter" className="label">
            Level
          </label>
          <select
            id="level-filter"
            value={currentLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="input select"
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
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="subject-filter" className="label">
            Subject
          </label>
          <select
            id="subject-filter"
            value={currentSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="input select"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Link href="/olympiads" className="btn btn-ghost btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </Link>
        )}
      </div>
    </div>
  );
}
