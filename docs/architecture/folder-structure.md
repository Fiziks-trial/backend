# Folder Structure

## Current Structure

```
backend/
├── src/
│   ├── main.ts                      # App entry point
│   ├── app.module.ts                # Root module (imports all modules)
│   ├── app.controller.ts            # Health check endpoint
│   ├── app.service.ts               # Basic service
│   │
│   ├── config/                      # Configuration
│   │   ├── config.module.ts         # Global config module
│   │   └── env.validation.ts        # Env vars validation
│   │
│   ├── database/                    # Database connection
│   │   ├── database.module.ts       # Global database module
│   │   └── database.providers.ts    # Drizzle client provider
│   │
│   ├── common/                      # Shared utilities
│   │   ├── index.ts                 # Barrel export
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts  # Extract user from request
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts    # Protect routes with JWT
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts   # JWT types
│   │
│   └── modules/                     # Feature modules
│       └── auth/
│           ├── auth.module.ts       # Auth module definition
│           ├── auth.controller.ts   # Auth endpoints
│           ├── auth.service.ts      # Auth business logic
│           ├── entities/            # Database schemas
│           │   ├── index.ts
│           │   ├── user.schema.ts
│           │   └── refresh-token.schema.ts
│           ├── guards/              # OAuth guards
│           │   ├── google-auth.guard.ts
│           │   └── github-auth.guard.ts
│           └── strategies/          # Passport strategies
│               ├── google.strategy.ts
│               ├── github.strategy.ts
│               └── jwt.strategy.ts
│
├── docs/                            # Documentation
│   ├── README.md                    # Docs index
│   ├── concepts/                    # Explanations of concepts
│   │   ├── dependency-injection.md
│   │   ├── modules-and-providers.md
│   │   └── guards-and-strategies.md
│   ├── architecture/                # System design docs
│   │   ├── folder-structure.md      # This file
│   │   └── auth-flow.md             # OAuth flow explanation
│   └── api/                         # API documentation
│       └── auth-endpoints.md        # Auth API reference
│
├── drizzle/                         # Generated migrations
│   └── *.sql                        # SQL migration files
│
├── drizzle.config.ts                # Drizzle CLI config
├── .env                             # Environment variables
├── .env.example                     # Example env vars
└── package.json                     # Dependencies & scripts
```

## Folder Purposes

### `src/config/`

Centralized configuration management.

| File | Purpose |
|------|---------|
| `config.module.ts` | Loads and validates env vars globally |
| `env.validation.ts` | Defines required env vars with validation rules |

### `src/database/`

Generic database connection (doesn't know about tables).

| File | Purpose |
|------|---------|
| `database.module.ts` | Exports database connection globally |
| `database.providers.ts` | Creates Drizzle client with postgres driver |

### `src/common/`

Shared utilities used across multiple modules.

| Folder | Purpose |
|--------|---------|
| `decorators/` | Custom parameter decorators (@CurrentUser) |
| `guards/` | Guards used across modules (JwtAuthGuard) |
| `interfaces/` | Shared TypeScript interfaces |

### `src/modules/`

Feature modules. Each module is self-contained.

```
modules/
└── auth/
    ├── auth.module.ts       # Module definition
    ├── auth.controller.ts   # HTTP endpoints
    ├── auth.service.ts      # Business logic
    ├── entities/            # Database schemas owned by auth
    │   ├── user.schema.ts
    │   └── refresh-token.schema.ts
    ├── guards/              # Auth-specific guards
    │   ├── google-auth.guard.ts
    │   └── github-auth.guard.ts
    └── strategies/          # Passport strategies
        ├── google.strategy.ts
        ├── github.strategy.ts
        └── jwt.strategy.ts
```

## Design Principles

### 1. Modular Monolith

Each module in `src/modules/` is isolated:
- Has its own schemas, services, controllers
- Can be developed independently
- Can be extracted to microservice later

### 2. Each Module Owns Its Data

```
modules/auth/entities/
├── user.schema.ts           # Auth module owns users table
└── refresh-token.schema.ts  # Auth module owns tokens table
```

When extracting to microservice, the schema goes with the module.

### 3. Global vs Local

| Type | Location | Usage |
|------|----------|-------|
| Global | `src/config/`, `src/database/`, `src/common/` | Available everywhere |
| Module-specific | `src/modules/<name>/` | Only used within that module |

### 4. Guards Placement

| Guard | Location | Reason |
|-------|----------|--------|
| `JwtAuthGuard` | `src/common/guards/` | Used by many modules |
| `GoogleAuthGuard` | `src/modules/auth/guards/` | Only used by auth |
| `GithubAuthGuard` | `src/modules/auth/guards/` | Only used by auth |

### 5. Barrel Exports

Each folder has an `index.ts` that re-exports everything:

```typescript
// src/common/index.ts
export * from './guards/jwt-auth.guard';
export * from './decorators/current-user.decorator';
export * from './interfaces/jwt-payload.interface';
```

This allows cleaner imports:

```typescript
// Instead of:
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Use:
import { JwtAuthGuard, CurrentUser } from '../../common';
```

## Adding a New Module

To add a new feature module (e.g., `courses`):

```
src/modules/
├── auth/
└── courses/                 # New module
    ├── courses.module.ts    # Module definition
    ├── courses.controller.ts
    ├── courses.service.ts
    ├── entities/            # Course-specific tables
    │   └── course.schema.ts
    ├── dto/                 # Data transfer objects
    │   ├── create-course.dto.ts
    │   └── update-course.dto.ts
    └── interfaces/          # Course-specific types
        └── course.interface.ts
```

Then register in `app.module.ts`:

```typescript
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    CoursesModule,  // Add new module
  ],
})
export class AppModule {}
```

## Microservices Migration Path

**Current (Monolith):**
```
backend/
└── src/modules/
    ├── auth/
    └── courses/
```

**Future (Microservices):**
```
services/
├── auth-service/        # Extract auth module
│   └── src/
│       ├── auth.module.ts
│       ├── entities/
│       └── ...
│
├── courses-service/     # Extract courses module
│   └── src/
│       ├── courses.module.ts
│       ├── entities/
│       └── ...
│
└── api-gateway/         # Routes requests to services
    └── src/
```

Each module becomes its own service with its own database.

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Module | `<name>.module.ts` | `auth.module.ts` |
| Controller | `<name>.controller.ts` | `auth.controller.ts` |
| Service | `<name>.service.ts` | `auth.service.ts` |
| Schema | `<name>.schema.ts` | `user.schema.ts` |
| Guard | `<name>.guard.ts` | `jwt-auth.guard.ts` |
| Strategy | `<name>.strategy.ts` | `google.strategy.ts` |
| DTO | `<action>-<name>.dto.ts` | `create-course.dto.ts` |
| Interface | `<name>.interface.ts` | `jwt-payload.interface.ts` |
| Decorator | `<name>.decorator.ts` | `current-user.decorator.ts` |
