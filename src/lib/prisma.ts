import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * WHY THIS PATTERN?
 * In development, Next.js hot-reloads the server on file changes.
 * Without this pattern, each reload would create a new PrismaClient,
 * eventually exhausting database connections.
 * 
 * This singleton ensures we reuse the same client across hot reloads.
 */

// Extend globalThis to include our prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use existing client or create a new one
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In development, save the client to globalThis to survive hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
