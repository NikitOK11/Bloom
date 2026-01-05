import Link from "next/link";
import TeamCard from "./TeamCard";
import TeamFilters from "./TeamFilters";
import { TeamLevel } from "@/types";

/**
 * Team type for OlympiadDetail component
 */
interface TeamData {
  id: string;
  name: string;
  description: string | null;
  olympiadId: string;
  requiredSkills: string;
  maxMembers: number;
  isOpen: boolean;
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
 * Пропсы для детальной страницы олимпиады.
 * Поддерживает новую структуру с русским контентом.
 */
interface OlympiadDetailProps {
  id: string;
  slug: string | null;
  name: string;
  shortName: string;
  description: string | null;
  level: string;
  format: string | null;
  subject: string;
  disciplines: string | null;
  teamSize: string | null;
  organizer: string | null;
  website: string | null;
  logoEmoji: string | null;
  teams: TeamData[];
  teamCount: number;
}

/**
 * OlympiadDetail Component
 * 
 * Детальная страница олимпиады с полной информацией
 * и списком команд.
 */
export default function OlympiadDetail({
  id,
  slug,
  name,
  shortName,
  description,
  level,
  format,
  subject,
  disciplines,
  teamSize,
  organizer,
  website,
  logoEmoji,
  teams,
  teamCount,
}: OlympiadDetailProps) {
  // Parse disciplines into array
  const disciplinesList = disciplines?.split(",").map((d) => d.trim()) || [];

  // Get level badge styling
  const getLevelBadge = (level: string) => {
    const classes: Record<string, string> = {
      "школьная": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "студенческая": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "смешанная": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return classes[level] || "bg-[var(--accent-subtle)] text-[var(--accent-color)]";
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
    <div className="container pt-24 pb-12">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/olympiads"
          className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Все олимпиады
        </Link>
      </div>

      {/* Header Section */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
            <span className="text-4xl" aria-hidden="true">
              {logoEmoji || "🏆"}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                {shortName}
              </h1>
              <span className={`text-sm px-3 py-1 rounded-full border ${getLevelBadge(level)}`}>
                {level}
              </span>
              {format && (
                <span className={`text-sm px-3 py-1 rounded-full border ${getFormatBadge(format)}`}>
                  {format}
                </span>
              )}
            </div>
            
            <p className="text-lg text-[var(--text-secondary)] mb-4">
              {name}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
              {teamSize && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {teamSize}
                </span>
              )}
              {organizer && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {organizer}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {teamCount} {teamCount === 1 ? "команда" : teamCount < 5 ? "команды" : "команд"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 shrink-0">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Официальный сайт
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mt-6 pt-6 border-t border-[var(--surface-border)]">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
              Описание
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        )}

        {/* Disciplines */}
        {disciplinesList.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--surface-border)]">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
              Дисциплины
            </h2>
            <div className="flex flex-wrap gap-2">
              {disciplinesList.map((discipline) => (
                <span key={discipline} className="tag tag-accent">
                  {discipline}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Teams Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Команды для {shortName}
          </h2>
          <Link
            href={`/olympiads/${slug || id}/teams/create`}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Создать команду
          </Link>
        </div>

        {/* Team Filters */}
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
            <div className="w-20 h-20 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Команд пока нет
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Станьте первым, кто создаст команду для {shortName}!
            </p>
            <Link
              href={`/olympiads/${slug || id}/teams/create`}
              className="btn btn-primary"
            >
              Создать команду
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
