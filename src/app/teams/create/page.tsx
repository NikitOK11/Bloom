"use client";

import Link from "next/link";

/**
 * Create Team Page (Deprecated)
 * 
 * DOMAIN RULE: Teams must be created within an olympiad context.
 * This page redirects users to browse olympiads first, where they
 * can create teams via /olympiads/[id]/teams/create.
 */
export default function CreateTeamPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
      <div className="text-6xl mb-6">🏆</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Create a Team
      </h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Teams are created within the context of a specific olympiad. 
        Please browse olympiads first and create your team from there.
      </p>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
        <h2 className="font-semibold text-blue-800 mb-2">How to create a team:</h2>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Browse available olympiads</li>
          <li>Select the olympiad you want to compete in</li>
          <li>Click "Create Team" on the olympiad page</li>
          <li>Fill in your team details and start recruiting!</li>
        </ol>
      </div>

      <Link href="/olympiads" className="btn-primary inline-block">
        Browse Olympiads
      </Link>
    </div>
  );
}
