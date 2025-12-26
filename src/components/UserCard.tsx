import Link from "next/link";

/**
 * UserCard Component Props
 */
interface UserCardProps {
  id: string;
  name: string;
  bio: string | null;
  skills: string;
  olympiads: string;
}

/**
 * UserCard Component
 * 
 * Displays a summary of a user in a card format.
 * Can be used in user listings or search results.
 */
export default function UserCard({
  id,
  name,
  bio,
  skills,
  olympiads,
}: UserCardProps) {
  // Parse comma-separated strings into arrays
  const skillsArray = skills ? skills.split(",").filter(Boolean) : [];
  const olympiadsArray = olympiads ? olympiads.split(",").filter(Boolean) : [];

  return (
    <Link href={`/users/${id}`} className="block">
      <article className="card hover:shadow-md transition-shadow cursor-pointer">
        {/* Header with Avatar */}
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar Placeholder */}
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl text-primary-700 font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
              {name}
            </h3>
            {/* Olympiad badges */}
            {olympiadsArray.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {olympiadsArray.slice(0, 3).map((olympiad) => (
                  <span
                    key={olympiad}
                    className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full"
                  >
                    {olympiad}
                  </span>
                ))}
                {olympiadsArray.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{olympiadsArray.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio (truncated) */}
        {bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {bio}
          </p>
        )}

        {/* Skills */}
        {skillsArray.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Skills:</p>
            <div className="flex flex-wrap gap-1">
              {skillsArray.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                >
                  {skill}
                </span>
              ))}
              {skillsArray.length > 4 && (
                <span className="text-xs text-gray-500 self-center">
                  +{skillsArray.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* View Profile Link */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-sm text-primary-600 font-medium hover:text-primary-700">
            View Profile →
          </span>
        </div>
      </article>
    </Link>
  );
}
