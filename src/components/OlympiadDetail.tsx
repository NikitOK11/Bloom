import Link from "next/link";
import TeamCard from "./TeamCard";
import TeamFilters from "./TeamFilters";
import { TeamLevel } from "@/types";

/**
 * Team type for OlympiadDetail component
 * DOMAIN RULE: Teams belong to an olympiad via olympiadId
 * Includes team requirements for display and filtering
 */
interface TeamData {
  id: string;
  name: string;
  description: string | null;
  olympiadId: string;  // Required relation to olympiad
  requiredSkills: string;
  maxMembers: number;
  isOpen: boolean;
  // NEW: Team requirements
  requiredInterests: string | null;
  requiredLevel: TeamLevel;
  requirementsNote: string | null;
  creator: {
    id: string;
    name: string;
  };
  _count: {
    members: number;
  };
}

/**
 * OlympiadDetail Component Props
 * 
 * Props for the detailed olympiad view page.
 * Includes dates for 2025 competitions.
 */
interface OlympiadDetailProps {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  year: number;
  level: string;
  subject: string;
  website: string | null;
  startDate?: Date | string | null;  // Competition start date
  endDate?: Date | string | null;    // Competition end date
  teams: TeamData[];
  teamCount: number;
}

/**
 * OlympiadDetail Component
 * 
 * Displays detailed information about an olympiad,
 * including its description and associated teams.
 */
export default function OlympiadDetail({
  id,
  name,
  shortName,
  description,
  year,
  level,
  subject,
  website,
  startDate,
  endDate,
  teams,
  teamCount,
}: OlympiadDetailProps) {
  /**
   * Format date range for display
   * Shows "15 февр. — 20 апр. 2025" style format
   */
  const formatDateRange = (start?: Date | string | null, end?: Date | string | null): string | null => {
    if (!start && !end) return null;
    
    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    };
    
    if (start && end) {
      const startD = new Date(start);
      const endD = new Date(end);
      const startStr = startD.toLocaleDateString("ru-RU", { month: "short", day: "numeric" });
      const endStr = formatDate(end);
      return `${startStr} — ${endStr}`;
    }
    
    if (start) return formatDate(start);
    if (end) return `до ${formatDate(end)}`;
    return null;
  };

  const dateRange = formatDateRange(startDate, endDate);

  // Get level badge styling based on level type
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "international":
        return "bg-purple-100 text-purple-700";
      case "national":
        return "bg-blue-100 text-blue-700";
      case "regional":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Get subject emoji based on subject/category
  // Updated for 2025 competitions: ML, Data Analysis, Programming
  const getSubjectEmoji = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes("машинн") || subjectLower.includes("ml") || subjectLower.includes("machine")) return "🤖";
    if (subjectLower.includes("анализ") || subjectLower.includes("data") || subjectLower.includes("данн")) return "📊";
    if (subjectLower.includes("программ") || subjectLower.includes("informatics") || subjectLower.includes("computer")) return "💻";
    if (subjectLower.includes("math")) return "📐";
    if (subjectLower.includes("physics")) return "⚛️";
    if (subjectLower.includes("chemistry")) return "🧪";
    if (subjectLower.includes("biology")) return "🧬";
    if (subjectLower.includes("astronomy")) return "🔭";
    if (subjectLower.includes("linguistics")) return "📚";
    if (subjectLower.includes("philosophy")) return "🤔";
    return "🏆";
  };

  return (
    <div>
      {/* Header Section */}
      <div className="card mb-8">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-4xl" aria-hidden="true">
                {getSubjectEmoji(subject)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{shortName}</h1>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getLevelBadgeClass(level)}`}
              >
                {level}
              </span>
            </div>
            <p className="text-lg text-gray-700 mb-2">{name}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {/* Show date range if available, otherwise just year */}
              <span className="flex items-center gap-1">
                📅 {dateRange || year}
              </span>
              <span className="flex items-center gap-1">
                📚 {subject}
              </span>
              <span className="flex items-center gap-1">
                👥 {teamCount} {teamCount === 1 ? "team" : "teams"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                🌐 Official Website
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              About this Olympiad
            </h2>
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}
      </div>

      {/* Teams Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Teams for {shortName} {year}
          </h2>
          <Link
            href={`/olympiads/${id}/teams/create`}
            className="btn-primary"
          >
            Create Team
          </Link>
        </div>

        {/* Team Filters - helps users find matching teams */}
        <TeamFilters olympiadId={id} />

        {teams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                id={team.id}
                name={team.name}
                description={team.description}
                olympiad={shortName}
                requiredSkills={team.requiredSkills}
                memberCount={team._count.members}
                maxMembers={team.maxMembers}
                creatorName={team.creator.name}
                isOpen={team.isOpen}
                requiredInterests={team.requiredInterests}
                requiredLevel={team.requiredLevel}
                requirementsNote={team.requirementsNote}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 card">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a team for {shortName}!
            </p>
            <Link
              href={`/olympiads/${id}/teams/create`}
              className="btn-primary"
            >
              Create a Team
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
