import Link from "next/link";

/**
 * Home Page
 * 
 * Premium landing page with hero section, features, and social proof.
 * Design inspired by Linear, Vercel, and Apple aesthetics.
 */
export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient orb effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-color)] opacity-10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[var(--accent-light)] opacity-10 blur-[100px] rounded-full" />
        
        <div className="container relative">
          <div className="py-24 md:py-32 text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-glass)] border border-[var(--surface-border)] mb-8 animate-fadeIn">
              <span className="status-dot status-dot-accent animate-pulseGlow" />
              <span className="text-sm text-[var(--text-secondary)]">Now open for 2026 competitions</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slideUp">
              Find Your Perfect{" "}
              <span className="gradient-text">Olympiad Team</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: "100ms" }}>
              Connect with talented participants worldwide. Build exceptional teams 
              for academic olympiads, hackathons, and competitions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp" style={{ animationDelay: "200ms" }}>
              <Link href="/olympiads" className="btn btn-primary btn-lg">
                <span>Browse Olympiads</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/profile/create" className="btn btn-secondary btn-lg">
                Create Profile
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 pt-8 border-t border-[var(--surface-border)] animate-fadeIn" style={{ animationDelay: "400ms" }}>
              <p className="text-sm text-[var(--text-muted)] mb-4">Trusted by participants from</p>
              <div className="flex flex-wrap justify-center gap-8 text-[var(--text-tertiary)]">
                <span className="font-medium">Yandex Cup</span>
                <span className="font-medium">AIIJC</span>
                <span className="font-medium">RuCode</span>
                <span className="font-medium">AIDAO</span>
                <span className="font-medium">HSE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Three simple steps to find your ideal competition teammates
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {/* Feature 1 */}
            <div className="card card-glow text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
              <p className="text-[var(--text-secondary)]">
                Showcase your skills, experience, and the olympiads you&apos;re interested in competing in.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-glow text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Teams</h3>
              <p className="text-[var(--text-secondary)]">
                Browse teams by olympiad, filter by requirements, and find the perfect match for your abilities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-glow text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Compete Together</h3>
              <p className="text-[var(--text-secondary)]">
                Join the team, collaborate with your teammates, and prepare for upcoming competitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="card relative overflow-hidden py-12 md:py-16 text-center">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/5 to-transparent pointer-events-none" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Team?</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                Join our community of olympiad participants and start building your dream team today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/profile/create" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link href="/olympiads" className="btn btn-secondary btn-lg">
                  Explore Olympiads
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold gradient-text mb-2">100+</p>
              <p className="text-[var(--text-secondary)]">Active Participants</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold gradient-text mb-2">50+</p>
              <p className="text-[var(--text-secondary)]">Teams Formed</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold gradient-text mb-2">8</p>
              <p className="text-[var(--text-secondary)]">Olympiads Covered</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
