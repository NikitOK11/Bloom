# ============================================
# Dockerfile for Next.js + Prisma Application
# ============================================
# This Dockerfile is optimized for local development.
# It builds and runs the Next.js application with Prisma.

# Use Node.js LTS (Long Term Support) for stability
# Alpine variant is smaller but we use the full image for better compatibility
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Install OpenSSL for Prisma compatibility with Alpine
# This is required for Prisma to work correctly on Alpine Linux
RUN apk add --no-cache openssl

# Copy package files first for better Docker layer caching
# This allows npm install to be cached if dependencies don't change
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
# Using npm ci for faster, reliable installs from lock file
RUN npm ci

# Copy Prisma schema before the rest of the app
# This allows Prisma generate to be cached separately
COPY prisma ./prisma/

# Generate Prisma Client
# This creates the database client based on your schema
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
# We provide a dummy DATABASE_URL for build time only.
# This is needed because Next.js tries to prerender pages that use Prisma.
# The actual DATABASE_URL will be provided at runtime via docker-compose.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Expose port 3000 (Next.js default port)
EXPOSE 3000

# Start the application
# We use 'prisma db push' for development to sync schema with database
# For production, you would use 'prisma migrate deploy' with proper migrations
CMD ["sh", "-c", "npx prisma db push && npm run start"]
