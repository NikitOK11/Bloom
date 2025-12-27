import Link from "next/link";
import TeamCard from "./TeamCard";

/**
 * Team type for OlympiadDetail component
 */
interface TeamData {
  id: string;
  name: string;
  description: string | null;
  olympiad: string;
  requiredSkills: string;
  maxMembers: number;
  isOpen: boolean;
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
  teams,
  teamCount,
}: OlympiadDetailProps) {
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

  // Get subject emoji
  const getSubjectEmoji = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes("math")) return "📐";
    if (subjectLower.includes("physics")) return "⚛️";
    if (subjectLower.includes("chemistry")) return "🧪";
    if (subjectLower.includes("biology")) return "🧬";
    if (subjectLower.includes("informatics") || subjectLower.includes("computer")) return "💻";
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
              <span className="flex items-center gap-1">
                📅 {year}
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Teams for {shortName} {year}
          </h2>
          <Link
            href={`/teams/create?olympiad=${shortName}`}
            className="btn-primary"
          >
            Create Team
          </Link>
        </div>

        {teams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                id={team.id}
                name={team.name}
                description={team.description}
                olympiad={team.olympiad}
                requiredSkills={team.requiredSkills}
                memberCount={team._count.members}
                maxMembers={team.maxMembers}
                creatorName={team.creator.name}
                isOpen={team.isOpen}
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
              href={`/teams/create?olympiad=${shortName}`}
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
