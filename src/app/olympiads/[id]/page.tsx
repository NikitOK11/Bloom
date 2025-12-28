import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import OlympiadDetail from "@/components/OlympiadDetail";
import Link from "next/link";

/**
 * Olympiad Detail Page
 * 
 * Server Component that displays detailed information about
 * a specific olympiad and its associated teams.
 */
export default async function OlympiadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch olympiad with teams
  const olympiad = await prisma.olympiad.findUnique({
    where: { id: params.id },
    include: {
      teams: {
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
        teams={olympiad.teams}
        teamCount={olympiad._count.teams}
      />
    </div>
  );
}
