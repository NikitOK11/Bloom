import prisma from "@/lib/prisma";
import OlympiadCard from "@/components/OlympiadCard";
import OlympiadFilters from "@/components/OlympiadFilters";
import Link from "next/link";

/**
 * Olympiads List Page
 * 
 * Server Component that fetches and displays all olympiads.
 * Supports filtering by year and level via URL search params.
 */
export default async function OlympiadsPage({
  searchParams,
}: {
  searchParams: { year?: string; level?: string; subject?: string };
}) {
  // Build filter conditions based on search params
  const where: {
    year?: number;
    level?: string;
    subject?: string;
  } = {};

  if (searchParams.year) {
    where.year = parseInt(searchParams.year, 10);
  }

  if (searchParams.level) {
    where.level = searchParams.level;
  }

  if (searchParams.subject) {
    where.subject = searchParams.subject;
  }

  // Fetch olympiads with team count
  const olympiads = await prisma.olympiad.findMany({
    where,
    include: {
      _count: {
        select: { teams: true },
      },
    },
    orderBy: [
      { year: "desc" },
      { name: "asc" },
    ],
  });

  // Get unique years for filter dropdown
  const allOlympiads = await prisma.olympiad.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  const years = allOlympiads.map((o) => o.year);

  // Available levels for filter
  const levels = ["international", "national", "regional"];

  // Available subjects for filter
  const subjects = [
    "Анализ данных",
    "Машинное обучение",
    "Спортивное программирование",
  ];

  return (
    <div className="container">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse Olympiads</h1>
        <p className="text-[var(--text-secondary)]">
          Explore academic olympiads and find teams to join
        </p>
      </div>

      {/* Filter Section */}
      <OlympiadFilters years={years} levels={levels} subjects={subjects} />

      {/* Olympiads Grid */}
      {olympiads.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {olympiads.map((olympiad) => (
            <OlympiadCard
              key={olympiad.id}
              id={olympiad.id}
              name={olympiad.name}
              shortName={olympiad.shortName}
              description={olympiad.description}
              year={olympiad.year}
              level={olympiad.level}
              subject={olympiad.subject}
              teamCount={olympiad._count.teams}
              startDate={olympiad.startDate}
              endDate={olympiad.endDate}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No olympiads found
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {searchParams.year || searchParams.level || searchParams.subject
              ? "Try adjusting your filters"
              : "Check back later for upcoming olympiads!"}
          </p>
          {(searchParams.year || searchParams.level || searchParams.subject) && (
            <Link href="/olympiads" className="btn btn-primary">
              Clear Filters
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
