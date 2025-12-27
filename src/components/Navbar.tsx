"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navbar Component
 * 
 * Main navigation bar that appears on all pages.
 * Highlights the current active route.
 * Uses "use client" for usePathname hook.
 */
export default function Navbar() {
  const pathname = usePathname();

  // Navigation links configuration
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/olympiads", label: "Olympiads" },
    { href: "/teams", label: "Teams" },
    { href: "/profile", label: "Profile" },
  ];

  // Check if a link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="font-bold text-xl text-gray-900">
              Olympiad Teammates
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* CTA Button */}
            <Link
              href="/teams/create"
              className="ml-4 btn-primary"
            >
              Create Team
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
