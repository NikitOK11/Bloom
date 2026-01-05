import Link from "next/link";

/**
 * OlympiadCard Component Props
 * 
 * Props for displaying olympiad summary cards in the listing.
 * Includes optional startDate/endDate for competition dates.
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
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

/**
 * OlympiadCard Component
 * 
 * Premium glass-morphism card displaying olympiad information.
 * Features subtle hover animations and clear visual hierarchy.
 * 
 * Design: Inspired by Linear and Apple card patterns
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
   */
  const formatDateRange = (start?: Date | string | null, end?: Date | string | null): string | null => {
    if (!start && !end) return null;
    
    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
    };
    
    if (start && end) {
      const startD = new Date(start);
      const endD = new Date(end);
      const startStr = formatDate(start);
      const endStr = formatDate(end);
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

  // Get level badge styling
  const getLevelBadge = (level: string) => {
    const classes: Record<string, string> = {
      international: "tag-accent",
      national: "tag-info",
      regional: "tag-success",
    };
    return classes[level] || "";
  };

  // Get subject icon
  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes("машинн") || subjectLower.includes("ml") || subjectLower.includes("machine")) return "🤖";
    if (subjectLower.includes("анализ") || subjectLower.includes("data") || subjectLower.includes("данн")) return "📊";
    if (subjectLower.includes("программ") || subjectLower.includes("informatics") || subjectLower.includes("computer")) return "💻";
    if (subjectLower.includes("math")) return "📐";
    if (subjectLower.includes("physics")) return "⚛️";
    if (subjectLower.includes("chemistry")) return "🧪";
    if (subjectLower.includes("biology")) return "🧬";
    if (subjectLower.includes("astronomy")) return "🔭";
    return "🏆";
  };

  return (
    <Link href={`/olympiads/${id}`} className="block group">
      <article className="card card-interactive card-glow h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
            <span className="text-2xl" aria-hidden="true">
              {getSubjectIcon(subject)}
            </span>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                {shortName}
              </h3>
              <span className={`tag shrink-0 capitalize ${getLevelBadge(level)}`}>
                {level}
              </span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              {dateRange || year}
            </p>
          </div>
        </div>

        {/* Full Name */}
        <h4 className="text-[var(--text-secondary)] font-medium mb-2 line-clamp-1">
          {name}
        </h4>

        {/* Description */}
        {description && (
          <p className="text-sm text-[var(--text-tertiary)] mb-4 line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* Subject Tag */}
        <div className="mb-4">
          <span className="tag">{subject}</span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-[var(--surface-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {teamCount > 0 && Array.from({ length: Math.min(teamCount, 3) }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--bg-elevated)]"
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                {teamCount} {teamCount === 1 ? "team" : "teams"}
              </span>
            </div>
            
            <span className="text-sm text-[var(--accent-color)] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              View
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
