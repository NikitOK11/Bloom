import prisma from "@/lib/prisma";
import TeamCard from "@/components/TeamCard";
import Link from "next/link";

/**
 * Teams List Page
 * 
 * Server Component that fetches and displays all teams.
 * Uses Prisma directly since this is a server component.
 */
export default async function TeamsPage() {
  // Fetch all open teams with creator info
  const teams = await prisma.team.findMany({
    where: { isOpen: true },
    include: {
      creator: {
        select: {
          id: true,
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
        <Link href="/teams/create" className="btn-primary">
          Create Team
        </Link>
      </div>

      {/* Filter Section (simplified for MVP) */}
      <div className="card mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Olympiad
            </label>
            <select className="input">
              <option value="">All Olympiads</option>
              <option value="IMO">IMO - Mathematics</option>
              <option value="IPhO">IPhO - Physics</option>
              <option value="IOI">IOI - Informatics</option>
              <option value="IChO">IChO - Chemistry</option>
              <option value="IBO">IBO - Biology</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select className="input">
              <option value="open">Open for Members</option>
              <option value="all">All Teams</option>
            </select>
          </div>
        </div>
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
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No teams found
          </h3>
          <p className="text-gray-600 mb-6">
            Be the first to create a team!
          </p>
          <Link href="/teams/create" className="btn-primary">
            Create a Team
          </Link>
        </div>
      )}
    </div>
  );
}
