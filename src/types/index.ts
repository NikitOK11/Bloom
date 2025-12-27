/**
 * Type Definitions for the Application
 * 
 * These types mirror our Prisma models but are used in the frontend
 * and API responses. Keeping them separate allows flexibility.
 */

// Base User type (matches Prisma model)
export interface User {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string;    // Comma-separated string
  olympiads: string; // Comma-separated string
  createdAt: Date;
  updatedAt: Date;
}

// User with parsed arrays (for frontend convenience)
export interface UserWithArrays extends Omit<User, "skills" | "olympiads"> {
  skills: string[];
  olympiads: string[];
}

// Data needed to create a new user
export interface CreateUserInput {
  name: string;
  email: string;
  bio?: string;
  skills: string[];    // Frontend sends arrays
  olympiads: string[]; // We convert to strings for DB
}

// Data for updating a user
export interface UpdateUserInput {
  name?: string;
  bio?: string;
  skills?: string[];
  olympiads?: string[];
}

// Base Team type
export interface Team {
  id: string;
  name: string;
  description: string | null;
  olympiad: string;
  requiredSkills: string;
  maxMembers: number;
  isOpen: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Team with creator and members included
export interface TeamWithDetails extends Team {
  creator: User;
  members: TeamMemberWithUser[];
  _count?: {
    members: number;
  };
}

// Team member join table
export interface TeamMember {
  id: string;
  role: string;
  joinedAt: Date;
  userId: string;
  teamId: string;
}

// Team member with user details
export interface TeamMemberWithUser extends TeamMember {
  user: User;
}

// Data needed to create a team
export interface CreateTeamInput {
  name: string;
  description?: string;
  olympiad: string;
  requiredSkills: string[];
  maxMembers?: number;
  creatorId: string;
}

// API Response wrapper for consistency
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// List of common olympiads (for dropdowns, etc.)
export const OLYMPIADS = [
  "IMO",   // International Mathematical Olympiad
  "IPhO",  // International Physics Olympiad
  "IOI",   // International Olympiad in Informatics
  "IChO",  // International Chemistry Olympiad
  "IBO",   // International Biology Olympiad
  "IAO",   // International Astronomy Olympiad
  "IPHO",  // International Philosophy Olympiad
  "ILO",   // International Linguistics Olympiad
] as const;

// Common skills (for suggestions)
export const COMMON_SKILLS = [
  "Mathematics",
  "Physics",
  "Programming",
  "Chemistry",
  "Biology",
  "Problem Solving",
  "Algorithms",
  "Data Structures",
  "Geometry",
  "Number Theory",
  "Combinatorics",
  "Calculus",
] as const;

// Olympiad levels
export const OLYMPIAD_LEVELS = [
  "international",
  "national",
  "regional",
] as const;

export type OlympiadLevel = typeof OLYMPIAD_LEVELS[number];

// Base Olympiad type (matches Prisma model)
export interface Olympiad {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  year: number;
  level: string;
  subject: string;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Olympiad with related teams count
export interface OlympiadWithTeams extends Olympiad {
  teams?: Team[];
  _count?: {
    teams: number;
  };
}

// Data needed to create an olympiad
export interface CreateOlympiadInput {
  name: string;
  shortName: string;
  description?: string;
  year: number;
  level?: string;
  subject: string;
  website?: string;
}

// Data for updating an olympiad
export interface UpdateOlympiadInput {
  name?: string;
  description?: string;
  year?: number;
  level?: string;
  subject?: string;
  website?: string;
}
