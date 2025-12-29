# Folder Structure

## Current Structure

```
backend/
├── src/
│   ├── main.ts                 # App entry point
│   ├── app.module.ts           # Root module
│   ├── app.controller.ts       # Health check endpoint
│   ├── app.service.ts          # Basic service
│   │
│   ├── config/                 # Configuration
│   │   ├── config.module.ts    # Global config module
│   │   └── env.validation.ts   # Env vars validation
│   │
│   ├── database/               # Database connection
│   │   ├── database.module.ts  # Global database module
│   │   └── database.providers.ts # Drizzle client provider
│   │
│   └── modules/                # Feature modules
│       └── auth/
│           └── entities/       # Database schemas
│               ├── index.ts
│               ├── user.schema.ts
│               └── refresh-token.schema.ts
│
├── docs/                       # Documentation
├── drizzle.config.ts           # Drizzle CLI config
└── .env                        # Environment variables
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

### `src/modules/`

Feature modules. Each module is self-contained.

```
modules/
└── auth/
    └── entities/         # Database schemas owned by auth
        ├── user.schema.ts
        └── refresh-token.schema.ts
```

## Design Principles

### 1. Modular Monolith

Each module in `src/modules/` is isolated:
- Has its own schemas (and later: services, controllers)
- Can be developed independently
- Can be extracted to microservice later

### 2. Each Module Owns Its Data

```
modules/auth/entities/
├── user.schema.ts           # Auth module owns users table
└── refresh-token.schema.ts  # Auth module owns tokens table
```

When extracting to microservice, the schema goes with the module.

### 3. Global Modules

`config/` and `database/` are global - available everywhere without importing.

## Planned Structure (After Auth Implementation)

```
backend/src/
├── common/                     # Shared utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── interfaces/
│       └── jwt-payload.interface.ts
│
└── modules/
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── entities/
        ├── guards/
        └── strategies/
```

## Microservices Migration Path

**Current (Monolith):**
```
backend/
└── src/modules/
    └── auth/
```

**Future (Microservices):**
```
auth-service/        # Extract auth module
└── src/
    ├── auth.module.ts
    ├── entities/
    └── ...
```

Each module becomes its own service with its own database.
