"use client";

/**
 * Error Boundary
 * 
 * Catches errors in the app and displays a friendly error message.
 * This is a client component because it uses useEffect and reset.
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={reset} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}
