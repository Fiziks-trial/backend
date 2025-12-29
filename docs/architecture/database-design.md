# Database Design

## ORM: Drizzle

We use **Drizzle ORM** for type-safe database queries.

### Why Drizzle?

| Feature | Drizzle | TypeORM | Prisma |
|---------|---------|---------|--------|
| Type Safety | Full | Partial | Full |
| Bundle Size | Small | Large | Large |
| Learning Curve | Low | Medium | Medium |
| Raw SQL Access | Easy | Hard | Hard |
| Performance | Fast | Medium | Medium |

## Database Connection

Located in `src/database/`:

```typescript
// database.providers.ts
export const databaseProviders = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: (configService: ConfigService) => {
      const url = configService.get<string>('DATABASE_URL');
      const client = postgres(url);
      return drizzle(client);
    },
    inject: [ConfigService],
  },
];
```

### How to Use in Services

```typescript
@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: DrizzleDB,
  ) {}

  async findUser(email: string) {
    return this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
  }
}
```

## Tables

### users

Stores user information from OAuth providers.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (cuid) |
| email | text | User's email (unique) |
| name | text | Display name |
| avatar | text | Profile picture URL |
| provider | text | 'google' or 'github' |
| provider_id | text | ID from OAuth provider |
| created_at | timestamp | When user signed up |
| updated_at | timestamp | Last update |

**Unique constraint:** `(provider, provider_id)` - One account per OAuth provider.

### refresh_tokens

Stores refresh tokens for JWT authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (cuid) |
| token | text | The refresh token (unique) |
| user_id | text | Foreign key → users.id |
| expires_at | timestamp | When token expires |
| created_at | timestamp | When token was created |

**On delete cascade:** When user is deleted, their tokens are deleted too.

## Schema Location

Each module owns its schemas:

```
src/modules/auth/entities/
├── user.schema.ts
├── refresh-token.schema.ts
└── index.ts              # Re-exports all schemas
```

## Migrations

Generate and run migrations with Drizzle Kit:

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Open Drizzle Studio (GUI)
bun run db:studio
```