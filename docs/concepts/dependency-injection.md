# Dependency Injection (DI)

## The Problem

Without DI, classes create their own dependencies:

```typescript
class UserService {
  private db;

  constructor() {
    // BAD: Creating dependency inside the class
    this.db = new DatabaseConnection('postgresql://localhost/mydb');
  }
}
```

**Problems:**
- Can't change database URL without editing code
- Can't test with a fake database
- Every class creates its own connection (wasteful)
- Classes are tightly coupled

## The Solution

With DI, classes **receive** dependencies from outside:

```typescript
class UserService {
  constructor(private db: DatabaseConnection) {
    // GOOD: Receive dependency from outside
  }
}

// Someone else creates and passes the database
const database = new DatabaseConnection('postgresql://...');
const userService = new UserService(database);
```

**Benefits:**
- Change config without editing classes
- Pass fake dependencies for testing
- Share instances across the app
- Loose coupling

## How NestJS Does DI

NestJS automates dependency injection:

```typescript
@Injectable()
class UserService {
  constructor(private db: DatabaseConnection) {}
  // NestJS automatically provides DatabaseConnection
}
```

You just declare what you need, NestJS handles the rest.

## The @Inject() Decorator

For non-class dependencies (strings, configs), use `@Inject()`:

```typescript
@Injectable()
class AuthService {
  constructor(
    @Inject('DATABASE_CONNECTION') private db,
  ) {}
}
```

`@Inject('DATABASE_CONNECTION')` tells NestJS:
> "Find the provider registered as 'DATABASE_CONNECTION' and give it to me"

## Visual Flow

```
┌─────────────────────────────────────────┐
│           NestJS Container              │
│                                         │
│  Registered Providers:                  │
│  ├── 'DATABASE_CONNECTION' → db object  │
│  ├── ConfigService → config object      │
│  └── UserService → user service         │
│                                         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  When creating AuthService:             │
│                                         │
│  1. See constructor needs 'DATABASE'    │
│  2. Look up 'DATABASE' in container     │
│  3. Found! Pass it to constructor       │
└─────────────────────────────────────────┘
```

## Analogy: Restaurant Kitchen

- **Providers** = Recipes (instructions to make something)
- **@Inject()** = Waiter's order ("I need a burger")
- **Container** = Kitchen that knows all recipes
- **Constructor** = The plate where food is served

```
Waiter: "AuthService needs DATABASE"
Kitchen: "Let me find that recipe... found it!"
Kitchen: "Here's the DATABASE for AuthService"
```