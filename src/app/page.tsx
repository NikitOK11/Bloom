import Link from "next/link";

/**
 * Home Page
 * 
 * Landing page that introduces the platform and provides
 * quick navigation to key features.
 */
export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Find Your <span className="text-primary-600">Olympiad</span> Team
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with talented participants from around the world. 
          Build the perfect team for your next competition.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/teams" className="btn-primary text-lg px-6 py-3">
            Browse Teams
          </Link>
          <Link href="/teams/create" className="btn-secondary text-lg px-6 py-3">
            Create a Team
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
            <p className="text-gray-600">
              Showcase your skills, achievements, and the olympiads you&apos;re interested in.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Teams</h3>
            <p className="text-gray-600">
              Browse teams looking for members with your skills and interests.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Compete Together</h3>
            <p className="text-gray-600">
              Join forces with your team and prepare for upcoming olympiads.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center bg-primary-50 rounded-2xl my-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Find Your Team?</h2>
        <p className="text-gray-600 mb-6">
          Join our community of olympiad participants today.
        </p>
        <Link href="/profile" className="btn-primary">
          Get Started
        </Link>
      </section>

      {/* Stats Section (placeholder for future data) */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-primary-600">100+</p>
            <p className="text-gray-600">Active Users</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary-600">50+</p>
            <p className="text-gray-600">Teams Formed</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary-600">8</p>
            <p className="text-gray-600">Olympiads Covered</p>
          </div>
        </div>
      </section>
    </div>
  );
}
