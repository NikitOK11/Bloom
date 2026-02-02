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
// DOMAIN RULE: Teams must belong to exactly one olympiad
export interface Team {
  id: string;
  name: string;
  description: string | null;
  olympiadId: string;  // Required relation to olympiad
  requiredSkills: string;
  maxMembers: number;
  isOpen: boolean;
  creatorId: string;
  // TEAM REQUIREMENTS: Help users find matching teams
  requiredInterests: string | null;  // Comma-separated interests
  requiredLevel: TeamLevel;          // Required experience level
  requirementsNote: string | null;   // Free-text note from team leader
  createdAt: Date;
  updatedAt: Date;
}

// Team experience level options
export type TeamLevel = "any" | "beginner" | "intermediate" | "advanced";

export const TEAM_LEVELS: { value: TeamLevel; label: string }[] = [
  { value: "any", label: "Any Level" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Team with creator, olympiad, and members included
export interface TeamWithDetails extends Team {
  creator: User;
  olympiad: Olympiad;
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
// DOMAIN RULE: olympiadId is required - teams must belong to an olympiad
export interface CreateTeamInput {
  name: string;
  description?: string;
  olympiadId: string;  // Required - teams are created within olympiad context
  requiredSkills: string[];
  maxMembers?: number;
  creatorId: string;
  // Team requirements
  requiredInterests?: string[];
  requiredLevel?: TeamLevel;
  requirementsNote?: string;
}

// API Response wrapper for consistency
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// List of common olympiads (for dropdowns, etc.)
export const OLYMPIADS = [
  "IOI",   // International Olympiad in Informatics
] as const;

// Common skills (for suggestions)
export const COMMON_SKILLS = [
  "Mathematics",
  "Programming",
  "Machine Learning",
  "Data Analysis",
  "Algorithms",
  "Data Structures",
  "Statistics",
  "Python",
  "SQL",
] as const;

// Olympiad levels
export const OLYMPIAD_LEVELS = [
  "international",
  "national",
  "regional",
] as const;

export type OlympiadLevel = typeof OLYMPIAD_LEVELS[number];

// Base Olympiad type (matches Prisma model)
// Updated with startDate/endDate for 2025 competitions
export interface Olympiad {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  year: number;
  level: string;
  subject: string;
  website: string | null;
  startDate: Date | null;  // Competition start date
  endDate: Date | null;    // Competition end date
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
// Includes optional date fields for 2025 competitions
export interface CreateOlympiadInput {
  name: string;
  shortName: string;
  description?: string;
  year: number;
  level?: string;
  subject: string;
  website?: string;
  startDate?: Date;
  endDate?: Date;
}

// Data for updating an olympiad
export interface UpdateOlympiadInput {
  name?: string;
  description?: string;
  year?: number;
  level?: string;
  subject?: string;
  website?: string;
  startDate?: Date;
  endDate?: Date;
}

// ==========================================
// JOIN REQUEST TYPES
// ==========================================

// JoinRequest status values
// DOMAIN RULE: Users join teams only via approved requests
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// Base JoinRequest type (matches Prisma model)
export interface JoinRequest {
  id: string;
  status: JoinRequestStatus;
  message: string | null;
  userId: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

// JoinRequest with user details (for team leader view)
export interface JoinRequestWithUser extends JoinRequest {
  user: User;
}

// JoinRequest with team details (for user view)
export interface JoinRequestWithTeam extends JoinRequest {
  team: Team;
}

// JoinRequest with full details
export interface JoinRequestWithDetails extends JoinRequest {
  user: User;
  team: TeamWithDetails;
}

// Data needed to create a join request
export interface CreateJoinRequestInput {
  userId: string;
  teamId: string;
  message?: string;
}

// ==========================================
// PROFILE TYPES
// ==========================================

// Profile role options
// Describes the user's educational status
export type ProfileRole = "school_student" | "college_student" | "graduate" | "other";

export const PROFILE_ROLES: { value: ProfileRole; label: string }[] = [
  { value: "school_student", label: "School Student" },
  { value: "college_student", label: "College Student" },
  { value: "graduate", label: "Graduate" },
  { value: "other", label: "Other" },
];

// Common interests for profile selection
export const PROFILE_INTERESTS = [
  "algorithms",
  "data_structures",
  "machine_learning",
  "data_science",
  "competitive_programming",
  "mathematics",
  "physics",
  "web_development",
  "mobile_development",
  "cybersecurity",
] as const;

export type ProfileInterest = typeof PROFILE_INTERESTS[number];

// Base Profile type (matches Prisma model)
// PRIVACY: Profiles are NOT publicly browsable
export interface Profile {
  id: string;
  userId: string;
  role: ProfileRole;
  gradeOrYear: string | null;
  interests: string; // Comma-separated
  olympiadExperience: string | null;
  about: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Profile with parsed interests array (for frontend)
export interface ProfileWithArrays extends Omit<Profile, "interests"> {
  interests: string[];
}

// Profile with user details
export interface ProfileWithUser extends Profile {
  user: User;
}

// Data needed to create/update a profile
export interface UpdateProfileInput {
  role?: ProfileRole;
  gradeOrYear?: string;
  interests?: string[];
  olympiadExperience?: string;
  about?: string;
}

// ==========================================
// EXTERNAL PROFILE TYPES
// ==========================================
// External profiles store read-only data from third-party platforms
// (Kaggle, GitHub, Codeforces, etc.)

/**
 * Supported external platform providers
 * Extensible list - add new providers here as integrations are built
 */
export type ExternalProfileProvider = "kaggle" | "github" | "codeforces";

/**
 * Base ExternalProfile type (matches Prisma model)
 * 
 * INTEGRATION NOTES:
 * - Read-only: Data is fetched from external APIs, not user-editable
 * - No auto-sync: User must manually refresh to update stats
 * - Public data only: Only publicly visible information is stored
 */
export interface ExternalProfile {
  id: string;
  userId: string;
  provider: ExternalProfileProvider;
  username: string;
  profileUrl: string;
  rankTier: string | null;
  medalsGold: number | null;
  medalsSilver: number | null;
  medalsBronze: number | null;
  competitionsCount: number | null;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Kaggle-specific rank tiers
 */
export type KaggleRankTier = 
  | "Grandmaster"
  | "Master"
  | "Expert"
  | "Contributor"
  | "Novice";

/**
 * Input for connecting an external profile
 */
export interface ConnectExternalProfileInput {
  userId: string;
  provider: ExternalProfileProvider;
  username: string;
  apiToken?: string; // Optional, used only during fetch, never stored
}
