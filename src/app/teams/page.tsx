import prisma from "@/lib/prisma";
import TeamCard from "@/components/TeamCard";
import Link from "next/link";

/**
 * Teams List Page
 * 
 * Server Component that fetches and displays all teams.
 * 
 * DOMAIN RULE: Teams always belong to an olympiad.
 * This page shows all teams across olympiads, but team creation
 * must happen within an olympiad context (via /olympiads/[id]/teams/create).
 */
export default async function TeamsPage() {
  // Fetch all open teams with creator and olympiad info
  const teams = await prisma.team.findMany({
    where: { isOpen: true },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      olympiad: {
        select: {
          id: true,
          shortName: true,
          name: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 
            className="text-3xl font-bold animate-fade-in"
            style={{ color: 'var(--text-primary)' }}
          >
            Browse Teams
          </h1>
          <p 
            className="mt-2 animate-fade-in"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}
          >
            Find a team that matches your skills and interests
          </p>
        </div>
        <Link 
          href="/olympiads" 
          className="btn btn-primary animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          Browse Olympiads
        </Link>
      </div>

      {/* Info Banner */}
      <div 
        className="rounded-xl p-4 mb-8 flex items-start gap-3 animate-fade-in"
        style={{ 
          background: 'rgba(var(--accent-rgb), 0.1)', 
          border: '1px solid rgba(var(--accent-rgb), 0.2)',
          animationDelay: '0.15s'
        }}
      >
        <span className="text-lg">💡</span>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-color)' }}>Tip:</strong> To create a team, first browse to an olympiad page and click "Create Team" there.
          Teams are always created within the context of a specific olympiad.
        </p>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <div 
              key={team.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${0.1 * (index % 6)}s` }}
            >
              <TeamCard
                id={team.id}
                name={team.name}
                description={team.description}
                olympiad={team.olympiad.shortName}
                requiredSkills={team.requiredSkills}
                memberCount={team._count.members}
                maxMembers={team.maxMembers}
                creatorName={team.creator.name}
                isOpen={team.isOpen}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 animate-fade-in">
          <div className="text-6xl mb-4">🔍</div>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            No teams found
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Browse olympiads to create or find teams!
          </p>
          <Link href="/olympiads" className="btn btn-primary">
            Browse Olympiads
          </Link>
        </div>
      )}
    </div>
  );
}
