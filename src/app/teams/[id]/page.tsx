import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamJoinSection } from "@/components";
import { TeamLevel, TEAM_LEVELS } from "@/types";

/**
 * Team Detail Page Props
 */
interface TeamPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Team Detail Page
 * 
 * Premium team detail view with glassmorphism cards.
 * Shows full team information and join request functionality.
 * 
 * DOMAIN RULES:
 * - Teams belong to exactly one olympiad
 * - Users join teams via approved join requests only
 */
export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { id } = await params;

  // Fetch team with all related data
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      creator: true,
      olympiad: true,
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!team) {
    notFound();
  }

  // Parse data
  const skills = team.requiredSkills ? team.requiredSkills.split(",").filter(Boolean) : [];
  const interests = team.requiredInterests ? team.requiredInterests.split(",").filter(Boolean) : [];
  
  const getLevelLabel = (level: string) => {
    const found = TEAM_LEVELS.find((l) => l.value === level);
    return found?.label || "Any Level";
  };

  const getLevelClass = (level: string) => {
    const classes: Record<string, string> = {
      beginner: "tag-success",
      intermediate: "tag-warning",
      advanced: "tag-error",
    };
    return classes[level] || "";
  };
  
  const memberUserIds = team.members.map((m) => m.userId);
  const isTeamFull = team.members.length >= team.maxMembers;

  return (
    <div className="container">
      {/* Back Navigation */}
      <Link 
        href={`/olympiads/${team.olympiad.id}`} 
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to {team.olympiad.shortName}
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Header Card */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{team.name}</h1>
                <p className="text-[var(--text-tertiary)]">
                  Created by {team.creator.name}
                </p>
              </div>
              <span className={`tag ${team.isOpen ? "tag-success" : ""}`}>
                <span className={`status-dot ${team.isOpen ? "status-dot-success" : ""}`} />
                {team.isOpen ? "Open" : "Closed"}
              </span>
            </div>

            {/* Olympiad Badge */}
            <Link href={`/olympiads/${team.olympiad.id}`}>
              <span className="tag tag-accent hover:opacity-80 transition-opacity cursor-pointer">
                {team.olympiad.shortName} — {team.olympiad.name}
              </span>
            </Link>

            {/* Description */}
            {team.description && (
              <p className="text-[var(--text-secondary)] mt-4">{team.description}</p>
            )}

            {/* Required Skills */}
            {skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Requirements */}
            {(interests.length > 0 || team.requiredLevel !== "any" || team.requirementsNote) && (
              <div className="mt-6 pt-6 border-t border-[var(--surface-border)]">
                <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Team Requirements</h3>
                
                {/* Level */}
                {team.requiredLevel && team.requiredLevel !== "any" && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-[var(--text-secondary)]">Experience level:</span>
                    <span className={`tag ${getLevelClass(team.requiredLevel)}`}>
                      {getLevelLabel(team.requiredLevel)}
                    </span>
                  </div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm text-[var(--text-secondary)] block mb-2">Interest areas:</span>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <span key={interest} className="tag tag-info">
                          {interest.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note from leader */}
                {team.requirementsNote && (
                  <div className="bg-[var(--info-bg)] border border-[var(--info)]/20 rounded-lg p-4 mt-3">
                    <p className="text-xs text-[var(--info)] font-medium mb-1">From the team leader:</p>
                    <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{team.requirementsNote}&rdquo;</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Join Section */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Join This Team</h2>
            <TeamJoinSection
              teamId={team.id}
              teamCreatorId={team.creatorId}
              isTeamOpen={team.isOpen}
              isTeamFull={isTeamFull}
              memberUserIds={memberUserIds}
              requiredInterests={team.requiredInterests}
              requiredLevel={team.requiredLevel as TeamLevel}
              requirementsNote={team.requirementsNote}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Team Members</h2>
              <span className="tag">{team.members.length}/{team.maxMembers}</span>
            </div>

            <div className="space-y-4">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="avatar">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {member.role === "creator" && (
                    <span className="tag tag-accent">Leader</span>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: team.maxMembers - team.members.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border-2 border-dashed border-[var(--surface-border)] flex items-center justify-center">
                    <span className="text-[var(--text-muted)]">?</span>
                  </div>
                  <p className="text-[var(--text-muted)]">Open slot</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Info */}
          <div className="card">
            <h3 className="font-semibold mb-4">Team Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Created</dt>
                <dd className="text-[var(--text-primary)]">
                  {new Date(team.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Olympiad</dt>
                <dd>
                  <Link 
                    href={`/olympiads/${team.olympiad.id}`}
                    className="text-[var(--accent-color)] hover:underline"
                  >
                    {team.olympiad.shortName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-tertiary)]">Status</dt>
                <dd className={team.isOpen ? "text-[var(--success)]" : "text-[var(--text-secondary)]"}>
                  {team.isOpen ? "Accepting members" : "Team full"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
