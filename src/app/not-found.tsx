/**
 * Not Found Page (404)
 * 
 * Shown when a user navigates to a page that doesn't exist.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
