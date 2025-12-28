import Link from "next/link";

/**
 * OlympiadCard Component Props
 * 
 * Props for displaying olympiad summary cards in the listing.
 * Includes optional startDate/endDate for 2025 competition dates.
 */
interface OlympiadCardProps {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  year: number;
  level: string;
  subject: string;
  teamCount: number;
  startDate?: Date | string | null;  // Competition start date
  endDate?: Date | string | null;    // Competition end date
}

/**
 * OlympiadCard Component
 * 
 * Displays a summary of an olympiad in a card format.
 * Used in the olympiads listing page.
 * Shows name, short description, dates, and link to details.
 */
export default function OlympiadCard({
  id,
  name,
  shortName,
  description,
  year,
  level,
  subject,
  teamCount,
  startDate,
  endDate,
}: OlympiadCardProps) {
  /**
   * Format date range for display
   * Shows "Feb 15 - Apr 20, 2025" style format
   */
  const formatDateRange = (start?: Date | string | null, end?: Date | string | null): string | null => {
    if (!start && !end) return null;
    
    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", { 
        month: "short", 
        day: "numeric" 
      });
    };
    
    if (start && end) {
      const startD = new Date(start);
      const endD = new Date(end);
      const startStr = formatDate(start);
      const endStr = formatDate(end);
      // If same year, show year once at the end
      if (startD.getFullYear() === endD.getFullYear()) {
        return `${startStr} — ${endStr}, ${startD.getFullYear()}`;
      }
      return `${startStr}, ${startD.getFullYear()} — ${endStr}, ${endD.getFullYear()}`;
    }
    
    if (start) return formatDate(start);
    if (end) return formatDate(end);
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
    <Link href={`/olympiads/${id}`} className="block">
      <article className="card hover:shadow-md transition-shadow cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {getSubjectEmoji(subject)}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                {shortName}
              </h3>
              {/* Show date range if available, otherwise just year */}
              <p className="text-sm text-gray-500">
                {dateRange || year}
              </p>
            </div>
          </div>
          {/* Level Badge */}
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getLevelBadgeClass(level)}`}
          >
            {level}
          </span>
        </div>

        {/* Full Name */}
        <p className="text-gray-700 font-medium mb-2">{name}</p>

        {/* Description (truncated) */}
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Subject Tag */}
        <div className="mb-4">
          <span className="tag">{subject}</span>
        </div>

        {/* Footer - Team Count */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">👥</span>
            <span className="text-sm text-gray-600">
              {teamCount} {teamCount === 1 ? "team" : "teams"} looking for members
            </span>
          </div>
          <span className="text-xs text-primary-600 font-medium">
            View details →
          </span>
        </div>
      </article>
    </Link>
  );
}
