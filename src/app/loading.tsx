/**
 * Loading Component
 * 
 * Shown while pages are loading.
 * Uses Tailwind animation for a simple spinner effect.
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
}
