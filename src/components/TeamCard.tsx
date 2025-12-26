import Link from "next/link";

/**
 * TeamCard Component Props
 */
interface TeamCardProps {
  id: string;
  name: string;
  description: string | null;
  olympiad: string;
  requiredSkills: string;
  memberCount: number;
  maxMembers: number;
  creatorName: string;
  isOpen: boolean;
}

/**
 * TeamCard Component
 * 
 * Displays a summary of a team in a card format.
 * Used in the teams listing page.
 */
export default function TeamCard({
  id,
  name,
  description,
  olympiad,
  requiredSkills,
  memberCount,
  maxMembers,
  creatorName,
  isOpen,
}: TeamCardProps) {
  // Parse skills from comma-separated string
  const skills = requiredSkills ? requiredSkills.split(",").filter(Boolean) : [];

  return (
    <Link href={`/teams/${id}`} className="block">
      <article className="card hover:shadow-md transition-shadow cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-gray-500">by {creatorName}</p>
          </div>
          {/* Status Badge */}
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isOpen
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isOpen ? "Open" : "Full"}
          </span>
        </div>

        {/* Olympiad Tag */}
        <div className="mb-3">
          <span className="tag">{olympiad}</span>
        </div>

        {/* Description (truncated) */}
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Required Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Looking for:</p>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer - Member Count */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Member avatars placeholder */}
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs text-primary-700">👤</span>
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {memberCount}/{maxMembers} members
            </span>
          </div>

          {/* Slots available */}
          {isOpen && memberCount < maxMembers && (
            <span className="text-xs text-primary-600 font-medium">
              {maxMembers - memberCount} spot{maxMembers - memberCount !== 1 ? "s" : ""} left
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
