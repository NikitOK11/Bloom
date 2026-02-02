# Olympiad Teammates - MVP

A web platform that helps olympiad participants find teammates for competitions.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma** with PostgreSQL
- **Tailwind CSS** for styling
- **Docker** for containerization

## Quick Start with Docker (Recommended)

The easiest way to run this project is with Docker:

```bash
# Build and start all services
docker compose build
docker compose up
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To stop the application:
```bash
docker compose down
```

To stop and remove all data (database):
```bash
docker compose down -v
```

## Getting Started (Manual Setup)

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- PostgreSQL database (or use Docker)

### Installation

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure DATABASE_URL in .env:**
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/olympiad_db"
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Initialize the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── users/         # User CRUD endpoints
│   │   └── teams/         # Team CRUD endpoints
│   ├── teams/             # Team pages
│   │   ├── [id]/          # Team detail page
│   │   └── create/        # Create team page
│   ├── profile/           # Profile page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── Navbar.tsx         # Navigation bar
│   ├── TeamCard.tsx       # Team card display
│   └── UserCard.tsx       # User card display
├── lib/                   # Utilities
│   └── prisma.ts          # Prisma client singleton
└── types/                 # TypeScript types
    └── index.ts           # Shared type definitions
```

## API Endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a user
- `GET /api/users/[id]` - Get user by ID
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Teams
- `GET /api/teams` - List all teams (with filters)
- `POST /api/teams` - Create a team
- `GET /api/teams/[id]` - Get team by ID
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team
- `POST /api/teams/[id]/join` - Join a team
- `DELETE /api/teams/[id]/join` - Leave a team

## Database Schema

### User
- `id` - Unique identifier
- `name` - User's full name
- `email` - Unique email address
- `bio` - Optional biography
- `skills` - Comma-separated skills
- `olympiads` - Comma-separated olympiad interests

### Team
- `id` - Unique identifier
- `name` - Team name
- `description` - Team description
- `olympiad` - Target olympiad
- `requiredSkills` - Skills needed
- `maxMembers` - Maximum team size
- `isOpen` - Whether accepting members
- `creatorId` - Creator's user ID

### TeamMember
- Links users to teams with role information

## MVP Features

✅ User profile creation
✅ Team creation with skill requirements
✅ Browse teams by olympiad
✅ View team details and members
✅ Join/leave teams

## Future Enhancements

- [ ] User authentication
- [ ] Team invitations system
- [ ] In-app messaging
- [ ] Advanced search filters
- [ ] User achievements/badges
- [ ] Competition calendar

## Notes

This is an MVP (Minimum Viable Product) focused on core functionality.
No authentication is implemented - in production, you would add a proper
auth solution like NextAuth.js, Clerk, or similar.

## License

MIT
