import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Team Detail Page Props
 */
interface TeamPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Team Detail Page
 * 
 * Shows full details of a team including all members.
 * DOMAIN RULE: Teams belong to exactly one olympiad.
 */
export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { id } = await params;

  // Fetch team with all related data including olympiad
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      creator: true,
      olympiad: true,  // Include olympiad context
      members: {
        include: {
          user: true,
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  // Show 404 if team not found
  if (!team) {
    notFound();
  }

  // Parse required skills
  const skills = team.requiredSkills ? team.requiredSkills.split(",").filter(Boolean) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link - to olympiad page */}
      <Link 
        href={`/olympiads/${team.olympiad.id}`} 
        className="text-primary-600 hover:text-primary-700 mb-4 inline-block"
      >
        ← Back to {team.olympiad.shortName}
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Team Header */}
          <div className="card mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                <p className="text-gray-500 mt-1">
                  Created by {team.creator.name}
                </p>
              </div>
              <span className={`tag ${team.isOpen ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {team.isOpen ? "Open" : "Closed"}
              </span>
            </div>

            {/* Olympiad Badge - links to olympiad */}
            <div className="mb-4">
              <Link href={`/olympiads/${team.olympiad.id}`}>
                <span className="tag hover:bg-primary-200 transition-colors cursor-pointer">
                  {team.olympiad.shortName} - {team.olympiad.name}
                </span>
              </Link>
            </div>

            {/* Description */}
            {team.description && (
              <p className="text-gray-700 mb-6">{team.description}</p>
            )}

            {/* Required Skills */}
            {skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Looking for:</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Join Team Section */}
          {team.isOpen && team.members.length < team.maxMembers && (
            <div className="card bg-primary-50 border-primary-200">
              <h3 className="font-semibold text-gray-900 mb-2">Interested in joining?</h3>
              <p className="text-gray-600 mb-4">
                This team is looking for {team.maxMembers - team.members.length} more member(s).
              </p>
              <button className="btn-primary">
                Request to Join
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Note: In the full version, this would send a join request to the team creator.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Team Members */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Team Members ({team.members.length}/{team.maxMembers})
            </h2>

            <div className="space-y-4">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user.name}
                      {member.role === "creator" && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                          Creator
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: team.maxMembers - team.members.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-400">?</span>
                  </div>
                  <p className="text-gray-400">Open slot</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Stats */}
          <div className="card mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Team Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(team.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Olympiad</dt>
                <dd className="text-gray-900">
                  <Link 
                    href={`/olympiads/${team.olympiad.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {team.olympiad.shortName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className={team.isOpen ? "text-green-600" : "text-gray-600"}>
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
