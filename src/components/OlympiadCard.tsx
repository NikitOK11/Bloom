import Link from "next/link";

/**
 * OlympiadCard Component Props
 * 
 * Пропсы для карточки олимпиады в списке.
 * Поддерживает новую структуру данных с русским контентом.
 */
interface OlympiadCardProps {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  level: string;
  format: string | null;
  subject: string;
  disciplines: string | null;
  teamSize: string | null;
  teamCount: number;
  logoEmoji: string | null;
}

/**
 * OlympiadCard Component
 * 
 * Карточка олимпиады с glassmorphism-эффектом.
 * Отображает основную информацию и теги дисциплин.
 */
export default function OlympiadCard({
  id,
  name,
  shortName,
  description,
  level,
  format,
  subject,
  disciplines,
  teamSize,
  teamCount,
  logoEmoji,
}: OlympiadCardProps) {
  // Parse disciplines into array
  const disciplinesList = disciplines?.split(",").map((d) => d.trim()).slice(0, 3) || [];

  // Get level badge styling
  const getLevelBadge = (level: string) => {
    const classes: Record<string, string> = {
      "школьная": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "студенческая": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "смешанная": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return classes[level] || "tag-accent";
  };

  // Get format badge styling
  const getFormatBadge = (format: string | null) => {
    if (!format) return "";
    const classes: Record<string, string> = {
      "онлайн": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      "оффлайн": "bg-orange-500/10 text-orange-400 border-orange-500/20",
      "смешанный": "bg-pink-500/10 text-pink-400 border-pink-500/20",
    };
    return classes[format] || "";
  };

  return (
    <Link href={`/olympiads/${id}`} className="block group">
      <article className="card card-interactive card-glow h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
            <span className="text-2xl" aria-hidden="true">
              {logoEmoji || "🏆"}
            </span>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors line-clamp-1">
                {shortName}
              </h3>
            </div>
            {/* Level & Format badges */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getLevelBadge(level)}`}>
                {level}
              </span>
              {format && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getFormatBadge(format)}`}>
                  {format}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Full Name */}
        <h4 className="text-sm text-[var(--text-secondary)] font-medium mb-3 line-clamp-2">
          {name}
        </h4>

        {/* Description */}
        {description && (
          <p className="text-sm text-[var(--text-tertiary)] mb-4 line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* Discipline Tags */}
        {disciplinesList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {disciplinesList.map((discipline) => (
              <span key={discipline} className="tag text-xs">
                {discipline}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-[var(--surface-border)]">
          <div className="flex items-center justify-between text-sm">
            {/* Team Size */}
            {teamSize && (
              <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {teamSize}
              </span>
            )}
            
            {/* Team Count */}
            <span className="text-[var(--accent-color)] font-medium">
              {teamCount} {teamCount === 1 ? "команда" : teamCount < 5 ? "команды" : "команд"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
