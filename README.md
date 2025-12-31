# ScienceDuel Backend

NestJS backend for the ScienceDuel real-time competitive learning platform.

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Auth**: JWT + OAuth (Google, GitHub)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in development
pnpm run start:dev

# Run in production
pnpm run start:prod
```

## Project Structure

```
src/
├── common/              # Shared decorators, guards, interfaces
├── config/              # Environment configuration
├── database/            # Database connection setup
└── modules/
    ├── auth/            # Authentication (OAuth, JWT)
    └── subjects/        # Game subjects (Physics, Maths, Chemistry)
```

## Modules

### Auth Module
Handles user authentication via Google and GitHub OAuth.

### Subjects Module
Manages available game subjects.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects` | Get all active subjects |
| GET | `/subjects/:slug` | Get subject by slug |

**Example Response:**
```json
[
  {
    "id": "uuid",
    "name": "Physics",
    "slug": "physics",
    "icon": "⚡",
    "isActive": true,
    "defaultTimeLimit": 30
  }
]
```

## Database Schema

### subjects
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name |
| slug | text | URL-friendly identifier |
| icon | text | Emoji or icon URL |
| description | text | Subject description |
| is_active | boolean | Show to users |
| default_time_limit | integer | Seconds per question |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |
