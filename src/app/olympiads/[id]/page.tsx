import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import OlympiadDetail from "@/components/OlympiadDetail";
import Link from "next/link";
import { TeamLevel } from "@/types";

/**
 * Olympiad Detail Page
 * 
 * Server Component that displays detailed information about
 * a specific olympiad and its associated teams.
 * 
 * Supports filtering teams by:
 * - interest: Filter by required interest area
 * - level: Filter by required experience level
 */
export default async function OlympiadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { interest?: string; level?: string };
}) {
  // Build team filter conditions based on search params
  const teamWhere: {
    isOpen: boolean;
    requiredLevel?: string;
  } = { isOpen: true };

  // Filter by level if provided (and not "any")
  if (searchParams.level && searchParams.level !== "any") {
    teamWhere.requiredLevel = searchParams.level;
  }

  // Fetch olympiad with teams
  const olympiad = await prisma.olympiad.findUnique({
    where: { id: params.id },
    include: {
      teams: {
        where: teamWhere,
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
      },
      _count: {
        select: { teams: true },
      },
    },
  });

  // Show 404 if olympiad not found
  if (!olympiad) {
    notFound();
  }

  // Filter teams by interest in-memory (SQLite doesn't support array contains)
  let filteredTeams = olympiad.teams;
  if (searchParams.interest) {
    filteredTeams = olympiad.teams.filter((team) => {
      const interests = team.requiredInterests?.split(",") || [];
      return interests.includes(searchParams.interest!);
    });
  }

  // Cast teams to include proper level type
  const teamsWithTypes = filteredTeams.map((team) => ({
    ...team,
    requiredLevel: (team.requiredLevel || "any") as TeamLevel,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/olympiads"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Olympiads
        </Link>
      </div>

      {/* Olympiad Detail Component */}
      <OlympiadDetail
        id={olympiad.id}
        name={olympiad.name}
        shortName={olympiad.shortName}
        description={olympiad.description}
        year={olympiad.year}
        level={olympiad.level}
        subject={olympiad.subject}
        website={olympiad.website}
        startDate={olympiad.startDate}
        endDate={olympiad.endDate}
        teams={teamsWithTypes}
        teamCount={olympiad._count.teams}
      />
    </div>
  );
}
