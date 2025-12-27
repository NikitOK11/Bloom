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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Teams</h1>
          <p className="text-gray-600 mt-2">
            Find a team that matches your skills and interests
          </p>
        </div>
        <Link href="/olympiads" className="btn-primary">
          Browse Olympiads
        </Link>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> To create a team, first browse to an olympiad page and click "Create Team" there.
          Teams are always created within the context of a specific olympiad.
        </p>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
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
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No teams found
          </h3>
          <p className="text-gray-600 mb-6">
            Browse olympiads to create or find teams!
          </p>
          <Link href="/olympiads" className="btn-primary">
            Browse Olympiads
          </Link>
        </div>
      )}
    </div>
  );
}
