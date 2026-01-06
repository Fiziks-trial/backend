# ScienceDuel Backend

NestJS backend for the ScienceDuel real-time competitive learning platform.

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Auth**: JWT + OAuth (Google, GitHub)
- **Real-time**: Socket.io (planned)
- **Caching**: Redis (planned - for matchmaking)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle-kit push

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
    ├── auth/            # Authentication (OAuth, JWT, refresh tokens)
    ├── users/           # User profiles, stats, schemas
    ├── subjects/        # Game subjects (Physics, Maths, Chemistry)
    └── matches/         # Match system, participants, history
```

## Modules

### Auth Module
Handles user authentication via Google and GitHub OAuth.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/github` | Initiate GitHub OAuth |
| GET | `/auth/me` | Get current user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout and invalidate refresh token |

### Users Module
Manages user profiles and statistics.

**Implemented Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users?search=&limit=` | Search users by username |
| GET | `/users/me` | Get current user profile (auth) |
| PATCH | `/users/me` | Update current user profile (auth) |
| GET | `/users/username/:username` | Get public profile by username |
| GET | `/users/:id` | Get public profile by ID |

**Planned Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:id/stats` | Get user profile with subject stats |
| GET | `/users/:id/matches` | Get user's match history |

### Subjects Module
Manages available game subjects.

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects` | Get all active subjects |
| GET | `/subjects/:slug` | Get subject by slug |

### Matches Module (In Progress)
Handles real-time competitive matches between users.

**Planned Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/matches/queue` | Join matchmaking queue |
| DELETE | `/matches/queue` | Leave matchmaking queue |
| GET | `/matches/:id` | Get match details |
| GET | `/users/:id/matches` | Get user's match history |
| GET | `/leaderboards/global` | Global leaderboard |
| GET | `/leaderboards/subject/:id` | Subject-specific leaderboard |

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (CUID2) |
| email | text | User email (unique) |
| name | text | Display name |
| avatar | text | Avatar URL |
| provider | text | OAuth provider (google/github) |
| provider_id | text | OAuth provider user ID |
| username | text | Unique username |
| xp | integer | Total experience points |
| total_matches | integer | Total matches played |
| wins | integer | Total wins (indexed for leaderboard) |
| losses | integer | Total losses |
| draws | integer | Total draws |
| created_at | timestamp | Account creation time |
| updated_at | timestamp | Last update time |

**Indexes:**
- `provider_idx` - (provider, provider_id) for OAuth lookup
- `users_wins_idx` - (wins) for global leaderboard

### user_subject_stats
Per-subject statistics and ELO ratings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | text | FK → users.id |
| subject_id | uuid | FK → subjects.id |
| elo | integer | ELO rating (default: 1200) |
| matches | integer | Matches in this subject |
| wins | integer | Wins in this subject |
| losses | integer | Losses in this subject |
| draws | integer | Draws in this subject |
| current_streak | integer | Current winning streak |
| max_streak | integer | Best winning streak |
| last_played_at | timestamp | Last match in this subject |
| created_at | timestamp | First match in this subject |

**Indexes:**
- `user_subject_stats_user_subject_idx` - (user_id, subject_id) unique
- `user_subject_stats_subject_elo_idx` - (subject_id, elo) for subject leaderboards
- `user_subject_stats_user_idx` - (user_id) for profile queries

### subjects
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name |
| slug | text | URL-friendly identifier (unique) |
| icon | text | Emoji or icon URL |
| description | text | Subject description |
| is_active | boolean | Show to users |
| default_time_limit | integer | Seconds per question |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### matches
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| subject_id | uuid | FK → subjects.id |
| status | text | 'in_progress' / 'completed' / 'cancelled' |
| winner_id | text | FK → users.id (null for draws) |
| created_at | timestamp | Match creation time |
| started_at | timestamp | Match start time |
| ended_at | timestamp | Match end time |

**Indexes:**
- `matches_status_subject_idx` - (status, subject_id) for active matches
- `matches_created_at_idx` - (created_at) for recent matches

### match_participants
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| match_id | uuid | FK → matches.id |
| user_id | text | FK → users.id |
| score | integer | Points scored |
| correct_answers | integer | Number of correct answers |
| rating_before | integer | ELO before match |
| rating_after | integer | ELO after match |
| rating_change | integer | ELO change (+/-) |
| xp_earned | integer | XP earned from match |
| joined_at | timestamp | When user joined match |

**Indexes:**
- `match_participants_user_idx` - (user_id) for match history
- `match_participants_match_user_idx` - (match_id, user_id) unique

### refresh_tokens
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | text | FK → users.id |
| token | text | Refresh token (unique) |
| expires_at | timestamp | Token expiration |
| created_at | timestamp | Token creation time |

---

## Migrations

To generate a new migration after schema changes:

```bash
pnpm drizzle-kit generate --name <migration_name>
```

**Migration History:**
| # | Name | Description |
|---|------|-------------|
| 0000 | auth_initial | Users, refresh_tokens tables |
| 0001 | subjects_table | Subjects table |
| 0002 | add_username_and_coins_to_users | Username, coins fields |
| 0003 | add_matches_and_user_stats | Matches, match_participants, user_subject_stats; replace coins with xp |

---

## Architecture Decisions

### Denormalized Stats on Users Table
Global stats (totalMatches, wins, losses, draws, xp) are stored directly on the users table for O(1) profile reads and efficient global leaderboards.

### Per-Subject Stats in Separate Table
ELO ratings, streaks, and per-subject stats are in `user_subject_stats` to support:
- Multiple rating systems (one per subject)
- Subject-specific leaderboards
- Detailed progress tracking per subject

### Matchmaking in Redis (Planned)
Matchmaking queues will be handled in Redis, not the database:
- Ephemeral data (waiting players)
- Fast pub/sub for real-time matching
- No 'waiting' status in matches table

### Rating History in match_participants
`rating_before`, `rating_after`, `rating_change` fields enable:
- Match history with "+15" / "-12" rating changes
- Historical rating graph reconstruction
- No need to store separate rating history table
