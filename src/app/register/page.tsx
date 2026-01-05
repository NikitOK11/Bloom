"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * REGISTRATION PAGE
 * 
 * USER FLOW:
 * 1. User fills in email, password, name
 * 2. On submit → POST /api/auth/register
 * 3. On success → redirect to /profile/create
 * 
 * DOMAIN RULES:
 * - Creates User (auth identity) only
 * - Does NOT create Profile (must be done on next page)
 * - Email must be unique
 * - Password minimum 6 characters
 */
export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.email || !formData.password || !formData.name) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Registration failed");
        return;
      }

      // Success! Store user ID for profile creation
      // In production, this would be handled by session/JWT
      sessionStorage.setItem("pendingUserId", result.data.id);
      sessionStorage.setItem("pendingUserName", result.data.name);

      // Redirect to profile creation
      router.push("/profile/create");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--accent-gradient)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Bloom
          </span>
        </Link>

        <h1 
          className="text-center text-3xl font-bold animate-fade-in"
          style={{ color: 'var(--text-primary)' }}
        >
          Create an Account
        </h1>
        <p 
          className="mt-3 text-center animate-fade-in"
          style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}
        >
          Join Bloom to find teammates for olympiads
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input w-full"
                placeholder="Your name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input w-full"
                placeholder="At least 6 characters"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input w-full"
                placeholder="Confirm your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="rounded-xl p-4 flex items-start gap-3 animate-fade-in"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)' 
                }}
              >
                <svg
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="#ef4444"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-12 text-base font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--border-color)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span 
                  className="px-4"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                >
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="font-medium transition-colors duration-200"
                style={{ color: 'var(--accent-color)' }}
              >
                Sign in instead
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div 
            className="mt-6 rounded-xl p-4"
            style={{ 
              background: 'rgba(var(--accent-rgb), 0.1)', 
              border: '1px solid rgba(var(--accent-rgb), 0.2)' 
            }}
          >
            <h3 
              className="text-sm font-semibold flex items-center gap-2"
              style={{ color: 'var(--accent-color)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What happens next?
            </h3>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-gradient)', color: 'white' }}
                >1</span>
                Create your account
              </li>
              <li className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-gradient)', color: 'white' }}
                >2</span>
                Complete your profile
              </li>
              <li className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-gradient)', color: 'white' }}
                >3</span>
                Start finding teammates!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
