# Modules and Providers

## What is a Module?

A **module** is a container that groups related code together:

```typescript
@Module({
  imports: [],      // Other modules this module needs
  controllers: [],  // HTTP request handlers
  providers: [],    // Services, repositories, factories
  exports: [],      // What other modules can use from this module
})
export class UserModule {}
```

## Module Structure

```
src/modules/user/
├── user.module.ts      # The module definition
├── user.controller.ts  # HTTP endpoints
├── user.service.ts     # Business logic
└── entities/           # Database schemas
```

## What is a Provider?

A **provider** is an instruction that tells NestJS:
> "When someone asks for X, give them Y"

### Provider Types

**1. useValue** - Give this exact value:
```typescript
{
  provide: 'API_KEY',
  useValue: 'abc123',
}
// When someone asks for 'API_KEY', give them 'abc123'
```

**2. useClass** - Create instance of this class:
```typescript
{
  provide: UserService,
  useClass: UserService,
}
// When someone asks for UserService, create new UserService()
```

**3. useFactory** - Run function to create value:
```typescript
{
  provide: 'DATABASE',
  useFactory: (config: ConfigService) => {
    const url = config.get('DATABASE_URL');
    return createConnection(url);
  },
  inject: [ConfigService],
}
// When someone asks for 'DATABASE', run this function
```

## useFactory Explained

When you need **logic** to create something:

```typescript
{
  provide: 'DATABASE_CONNECTION',
  useFactory: (configService) => {
    // Step 1: Get config
    const url = configService.get('DATABASE_URL');

    // Step 2: Create connection
    const client = postgres(url);

    // Step 3: Return final value
    return drizzle(client);
  },
  inject: [ConfigService],  // Dependencies the factory needs
}
```

### What is `inject: []`?

The factory function needs other providers to work. `inject` tells NestJS what to pass:

```typescript
useFactory: (configService, logger) => { ... },
inject: [ConfigService, LoggerService],
//       ↑ These get passed to the factory in order
```

## @Global() Decorator

Makes a module's exports available everywhere without importing:

```typescript
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

// Now ANY module can use ConfigService without importing ConfigModule
```

## forRoot() Pattern

Some modules need configuration. `forRoot()` is a static method that accepts options:

```typescript
// Without forRoot - no way to configure
@Module({ imports: [ConfigModule] })

// With forRoot - pass configuration
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
})
```

### How forRoot() Works

```typescript
class ConfigModule {
  static forRoot(options): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
```

## Example: Our Config Module

```typescript
// src/config/config.module.ts
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      validate,              // Validate env vars on startup
      isGlobal: true,        // Available everywhere
      envFilePath: '.env',   // Load from .env file
    }),
  ],
})
export class ConfigModule {}
```

This module:
1. Loads `.env` file
2. Validates all required variables
3. Makes `ConfigService` available globally