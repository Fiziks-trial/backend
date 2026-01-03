# Guards and Strategies

## What is a Strategy?

A **strategy** defines HOW authentication works. It contains the logic for:
- Where to redirect users (Google, GitHub)
- How to validate tokens/credentials
- What user data to extract

```typescript
// Google Strategy - defines how to authenticate with Google
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: '...',
      clientSecret: '...',
      callbackURL: '...',
      scope: ['email', 'profile'],
    });
  }

  // Called after Google authenticates user
  async validate(accessToken, refreshToken, profile) {
    return {
      email: profile.emails[0].value,
      name: profile.displayName,
    };
  }
}
```

## What is a Guard?

A **guard** decides IF a request should proceed. It:
- Runs before the route handler
- Returns `true` (allow) or `false` (deny)
- Can trigger authentication strategies

```typescript
// Simple guard that uses the 'google' strategy
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
```

## How They Work Together

```
Request: GET /auth/google
         ↓
GoogleAuthGuard activates
         ↓
Finds strategy named 'google' (GoogleStrategy)
         ↓
GoogleStrategy.constructor() runs
         ↓
Redirects to Google login page
         ↓
User approves on Google
         ↓
Google redirects to /auth/google/callback
         ↓
GoogleAuthGuard activates again
         ↓
GoogleStrategy.validate() runs with user profile
         ↓
Returns user object → attached to req.user
         ↓
Controller receives request with user data
```

## Our Strategies

### GoogleStrategy
- **Name:** `'google'`
- **Purpose:** Authenticate with Google OAuth 2.0
- **Location:** `src/modules/auth/strategies/google.strategy.ts`

### GithubStrategy
- **Name:** `'github'`
- **Purpose:** Authenticate with GitHub OAuth
- **Location:** `src/modules/auth/strategies/github.strategy.ts`

### JwtStrategy
- **Name:** `'jwt'`
- **Purpose:** Validate JWT tokens on protected routes
- **Location:** `src/modules/auth/strategies/jwt.strategy.ts`

## Our Guards

### GoogleAuthGuard
- **Uses:** `'google'` strategy
- **Purpose:** Trigger Google OAuth flow
- **Location:** `src/modules/auth/guards/google-auth.guard.ts`

### GithubAuthGuard
- **Uses:** `'github'` strategy
- **Purpose:** Trigger GitHub OAuth flow
- **Location:** `src/modules/auth/guards/github-auth.guard.ts`

### JwtAuthGuard
- **Uses:** `'jwt'` strategy
- **Purpose:** Protect routes that require authentication
- **Location:** `src/common/guards/jwt-auth.guard.ts`

## Usage Examples

### Trigger OAuth Login
```typescript
@Get('google')
@UseGuards(GoogleAuthGuard)
googleLogin() {
  // Empty - guard handles redirect
}
```

### Protect a Route
```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user) {
  return user;
}
```

## Why Separate Guards and Strategies?

| Strategies | Guards |
|------------|--------|
| Define authentication logic | Decide when to authenticate |
| Registered in module providers | Used with @UseGuards() |
| One per auth method | Can be reused across routes |
| Complex setup | Simple wrappers |
