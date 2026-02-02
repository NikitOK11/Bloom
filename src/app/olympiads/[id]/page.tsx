import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import OlympiadDetail from "@/components/OlympiadDetail";
import { TeamLevel } from "@/types";

// Force dynamic rendering - fetch data at request time, not build time
export const dynamic = 'force-dynamic';

/**
 * Olympiad Detail Page
 * 
 * Страница олимпиады с детальной информацией и командами.
 * Поддерживает поиск как по id, так и по slug.
 * 
 * Фильтрация команд:
 * - interest: По направлению интересов
 * - level: По уровню опыта
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

  // Try to find by slug first, then by id
  let olympiad = await prisma.olympiad.findFirst({
    where: {
      OR: [
        { slug: params.id },
        { id: params.id },
      ],
    },
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
    <OlympiadDetail
      id={olympiad.id}
      slug={olympiad.slug}
      name={olympiad.name}
      shortName={olympiad.shortName}
      description={olympiad.description}
      level={olympiad.level}
      format={olympiad.format}
      subject={olympiad.subject}
      disciplines={olympiad.disciplines}
      teamSize={olympiad.teamSize}
      organizer={olympiad.organizer}
      website={olympiad.website}
      logoEmoji={olympiad.logoEmoji}
      teams={teamsWithTypes}
      teamCount={olympiad._count.teams}
    />
  );
}
