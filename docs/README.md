# Backend Documentation

## Quick Start

```bash
# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
bun run db:generate
bun run db:migrate

# Start development server
bun run start:dev
```

## Documentation Structure

```
docs/
├── concepts/           # NestJS basics for beginners
│   ├── dependency-injection.md
│   └── modules-and-providers.md
│
└── architecture/       # System design & structure
    ├── folder-structure.md
    └── database-design.md
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS 11 | Backend framework |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL | Database (Supabase) |
| Bun | Package manager & runtime |

## Current Status

This PR sets up the foundation:
- [x] Configuration module with env validation
- [x] Database connection with Drizzle ORM
- [x] Database schemas (users, refresh_tokens)
- [x] Documentation structure

Coming in next PR:
- [ ] OAuth authentication (Google, GitHub)
- [ ] JWT token management
- [ ] Auth endpoints

## Architecture

This is a **modular monolith** designed to be easily split into microservices later.

Each module:
- Lives in `src/modules/<name>/`
- Owns its own data (schemas in `entities/`)
- Can be extracted to a separate service

## Project Structure

```
backend/src/
├── main.ts                 # App entry point
├── app.module.ts           # Root module
├── config/                 # Environment configuration
├── database/               # Drizzle connection
└── modules/
    └── auth/
        └── entities/       # Database schemas
```

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- `JWT_SECRET` - Secret for signing tokens
- `FRONTEND_URL` - Frontend app URL for redirects
