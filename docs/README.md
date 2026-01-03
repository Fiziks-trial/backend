# Backend Documentation

## Quick Start

```bash
# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Push database schema
bun run db:push

# Start development server
bun run start:dev
```

## Documentation Structure

```
docs/
├── concepts/              # NestJS basics for beginners
│   ├── dependency-injection.md
│   ├── modules-and-providers.md
│   └── guards-and-strategies.md
│
├── architecture/          # System design & structure
│   ├── folder-structure.md
│   ├── database-design.md
│   └── auth-flow.md
│
└── api/                   # API documentation
    └── auth-endpoints.md
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS 11 | Backend framework |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL | Database (Supabase/Neon/Aurora) |
| Passport | OAuth authentication |
| JWT | Token-based authorization |
| Bun | Package manager & runtime |

## Features Implemented

- [x] Configuration module with env validation
- [x] Database connection with Drizzle ORM
- [x] Database schemas (users, refresh_tokens)
- [x] OAuth authentication (Google, GitHub)
- [x] JWT access & refresh tokens
- [x] Auth endpoints (login, logout, refresh, me)
- [x] Documentation

## Architecture

This is a **modular monolith** designed to be easily split into microservices later.

Each module:
- Lives in `src/modules/<name>/`
- Owns its own data (schemas in `entities/`)
- Can be extracted to a separate service

## Project Structure

```
backend/src/
├── main.ts                     # App entry point
├── app.module.ts               # Root module
├── config/                     # Environment configuration
├── database/                   # Drizzle connection
├── common/                     # Shared utilities
│   ├── decorators/             # @CurrentUser()
│   ├── guards/                 # JwtAuthGuard
│   └── interfaces/             # JWT types
└── modules/
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── entities/           # Database schemas
        ├── guards/             # OAuth guards
        └── strategies/         # Passport strategies
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google callback |
| GET | `/auth/github` | Start GitHub OAuth |
| GET | `/auth/github/callback` | GitHub callback |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user (protected) |

## Environment Variables

Required variables (see `.env.example`):

```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
JWT_SECRET=xxx
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Database Scripts

```bash
bun run db:push      # Push schema to database (dev)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio GUI
```

## Switching Databases

To switch PostgreSQL providers, just change `DATABASE_URL`:

```env
# Supabase
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"

# Neon
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname"

# AWS Aurora
DATABASE_URL="postgresql://user:pass@xxx.rds.amazonaws.com:5432/dbname"
```

No code changes required - it's standard PostgreSQL.
