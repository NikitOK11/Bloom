import prisma from "@/lib/prisma";
import OlympiadCard from "@/components/OlympiadCard";
import OlympiadFilters from "@/components/OlympiadFilters";
import Link from "next/link";

// Force dynamic rendering - fetch data at request time, not build time
export const dynamic = 'force-dynamic';

/**
 * Страница списка олимпиад
 * 
 * Server Component для отображения всех олимпиад.
 * Поддерживает фильтрацию по уровню, формату и дисциплине.
 */
export default async function OlympiadsPage({
  searchParams,
}: {
  searchParams: { level?: string; format?: string; subject?: string };
}) {
  // Build filter conditions based on search params
  const where: {
    level?: string;
    format?: string;
    subject?: string;
  } = {};

  if (searchParams.level && searchParams.level !== "all") {
    where.level = searchParams.level;
  }

  if (searchParams.format && searchParams.format !== "all") {
    where.format = searchParams.format;
  }

  if (searchParams.subject && searchParams.subject !== "all") {
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

  // Get unique levels for filter dropdown
  const levels = ["школьная", "студенческая", "смешанная"];
  
  // Get unique formats for filter dropdown  
  const formats = ["онлайн", "оффлайн", "смешанный"];

  // Get unique subjects for filter
  const allOlympiads = await prisma.olympiad.findMany({
    select: { subject: true },
    distinct: ["subject"],
  });
  const subjects = allOlympiads.map((o) => o.subject);

  return (
    <div className="container pt-24 pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">
          Олимпиады
        </h1>
        <p className="text-[var(--text-secondary)]">
          Командные соревнования по программированию, анализу данных и ИИ
        </p>
      </div>

      {/* Filter Section */}
      <OlympiadFilters levels={levels} formats={formats} subjects={subjects} />

      {/* Olympiads Grid */}
      {olympiads.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {olympiads.map((olympiad) => (
            <OlympiadCard
              key={olympiad.id}
              id={olympiad.slug || olympiad.id}
              name={olympiad.name}
              shortName={olympiad.shortName}
              description={olympiad.description}
              level={olympiad.level}
              format={olympiad.format}
              subject={olympiad.subject}
              disciplines={olympiad.disciplines}
              teamSize={olympiad.teamSize}
              teamCount={olympiad._count.teams}
              logoEmoji={olympiad.logoEmoji}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Олимпиады не найдены
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {searchParams.level || searchParams.format || searchParams.subject
              ? "Попробуйте изменить фильтры"
              : "Скоро здесь появятся олимпиады!"}
          </p>
          {(searchParams.level || searchParams.format || searchParams.subject) && (
            <Link href="/olympiads" className="btn btn-primary">
              Сбросить фильтры
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
