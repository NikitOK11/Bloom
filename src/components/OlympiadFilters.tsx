"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * OlympiadFilters Component Props
 */
interface OlympiadFiltersProps {
  levels: string[];
  formats: string[];
  subjects: string[];
}

/**
 * OlympiadFilters Component
 * 
 * Фильтры для списка олимпиад с glassmorphism-стилем.
 * Использует URL search params для сохранения состояния.
 */
export default function OlympiadFilters({ levels, formats, subjects }: OlympiadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentLevel = searchParams.get("level") || "";
  const currentFormat = searchParams.get("format") || "";
  const currentSubject = searchParams.get("subject") || "";

  const handleLevelChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set("level", value);
    else params.delete("level");
    router.push(`/olympiads?${params.toString()}`);
  };

  const handleFormatChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set("format", value);
    else params.delete("format");
    router.push(`/olympiads?${params.toString()}`);
  };

  const handleSubjectChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set("subject", value);
    else params.delete("subject");
    router.push(`/olympiads?${params.toString()}`);
  };

  const hasFilters = currentLevel || currentFormat || currentSubject;

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Level Filter */}
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="level-filter" className="form-label">
            Уровень
          </label>
          <select
            id="level-filter"
            value={currentLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="form-input form-select"
          >
            <option value="all">Все уровни</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Format Filter */}
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="format-filter" className="form-label">
            Формат
          </label>
          <select
            id="format-filter"
            value={currentFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
            className="form-input form-select"
          >
            <option value="all">Все форматы</option>
            {formats.map((format) => (
              <option key={format} value={format}>
                {format.charAt(0).toUpperCase() + format.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="subject-filter" className="form-label">
            Направление
          </label>
          <select
            id="subject-filter"
            value={currentSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="form-input form-select"
          >
            <option value="all">Все направления</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Link href="/olympiads" className="btn btn-ghost btn-sm">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить
          </Link>
        )}
      </div>
    </div>
  );
}
