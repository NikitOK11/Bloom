import Link from "next/link";
import { TeamLevel, TEAM_LEVELS } from "@/types";

/**
 * TeamCard Component Props
 * 
 * Props for displaying team summary cards.
 * Includes team requirements for smart filtering display.
 */
interface TeamCardProps {
  id: string;
  name: string;
  description: string | null;
  olympiad: string;
  requiredSkills: string;
  memberCount: number;
  maxMembers: number;
  creatorName: string;
  isOpen: boolean;
  // Team requirements for display
  requiredInterests?: string | null;
  requiredLevel?: TeamLevel;
  requirementsNote?: string | null;
}

/**
 * TeamCard Component
 * 
 * Premium glass-morphism card displaying team information.
 * Features subtle hover animations and clear visual hierarchy.
 * 
 * Design: Inspired by Linear and Vercel card patterns
 */
export default function TeamCard({
  id,
  name,
  description,
  olympiad,
  requiredSkills,
  memberCount,
  maxMembers,
  creatorName,
  isOpen,
  requiredInterests,
  requiredLevel = "any",
}: TeamCardProps) {
  // Parse skills from comma-separated string
  const skills = requiredSkills ? requiredSkills.split(",").filter(Boolean).slice(0, 3) : [];
  
  // Parse interests from comma-separated string
  const interests = requiredInterests ? requiredInterests.split(",").filter(Boolean).slice(0, 2) : [];

  // Get level badge styling
  const getLevelBadge = (level: TeamLevel) => {
    const found = TEAM_LEVELS.find((l) => l.value === level);
    const label = found?.label || "Any Level";
    const classes = {
      beginner: "tag-success",
      intermediate: "tag-warning",
      advanced: "tag-error",
      any: "",
    };
    return { label, className: classes[level] || "" };
  };

  const levelBadge = getLevelBadge(requiredLevel);
  const slotsRemaining = maxMembers - memberCount;

  return (
    <Link href={`/teams/${id}`} className="block group">
      <article className="card card-interactive card-glow h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors truncate">
              {name}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              by {creatorName}
            </p>
          </div>
          
          {/* Status Badge */}
          <span className={`tag shrink-0 ${isOpen ? "tag-success" : ""}`}>
            <span className={`status-dot ${isOpen ? "status-dot-success" : ""}`} />
            {isOpen ? "Open" : "Full"}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="tag tag-accent">{olympiad}</span>
          {requiredLevel && requiredLevel !== "any" && (
            <span className={`tag ${levelBadge.className}`}>
              {levelBadge.label}
            </span>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span 
                  key={skill} 
                  className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  {skill.trim()}
                </span>
              ))}
              {requiredSkills.split(",").length > 3 && (
                <span className="text-xs px-2 py-1 text-[var(--text-muted)]">
                  +{requiredSkills.split(",").length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {interests.map((interest) => (
              <span 
                key={interest} 
                className="text-xs px-2 py-1 rounded-md bg-[var(--info-bg)] text-[var(--info)]"
              >
                {interest.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Footer - Member Count */}
        <div className="mt-auto pt-4 border-t border-[var(--surface-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Member avatars preview */}
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] border-2 border-[var(--bg-elevated)] flex items-center justify-center"
                  >
                    <span className="text-[10px] text-[var(--accent-color)]">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                {memberCount}/{maxMembers}
              </span>
            </div>
            
            {/* Slots indicator */}
            {isOpen && slotsRemaining > 0 && (
              <span className="text-xs text-[var(--success)]">
                {slotsRemaining} slot{slotsRemaining !== 1 ? "s" : ""} left
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
