# Authentication Flow

## Overview

Our authentication system uses OAuth 2.0 for login (Google/GitHub) and JWT tokens for session management.

## Token Strategy

| Token Type | Lifetime | Purpose |
|------------|----------|---------|
| Access Token | 15 minutes | Authenticate API requests |
| Refresh Token | 7 days | Get new access tokens |

## OAuth Login Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│ Browser │     │ Backend │     │  Google  │     │Frontend │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬────┘
     │               │               │                │
     │ GET /auth/google              │                │
     │──────────────>│               │                │
     │               │               │                │
     │ 302 Redirect to Google        │                │
     │<──────────────│               │                │
     │               │               │                │
     │ User logs in with Google      │                │
     │──────────────────────────────>│                │
     │               │               │                │
     │ 302 Redirect to callback      │                │
     │<──────────────────────────────│                │
     │               │               │                │
     │ GET /auth/google/callback     │                │
     │──────────────>│               │                │
     │               │               │                │
     │               │ Validate & Create User         │
     │               │ Generate Tokens                │
     │               │               │                │
     │ 302 Redirect to frontend with tokens           │
     │<──────────────│               │                │
     │               │               │                │
     │ Load frontend with tokens in URL               │
     │───────────────────────────────────────────────>│
     │               │               │                │
     │               │               │    Store tokens│
     │               │               │    in memory   │
```

## Step-by-Step Breakdown

### 1. User Clicks "Login with Google"

Frontend redirects to: `GET /api/auth/google`

### 2. Backend Redirects to Google

The `GoogleAuthGuard` triggers and:
- `GoogleStrategy` constructor config is read
- User is redirected to Google's OAuth consent screen

### 3. User Approves on Google

Google redirects back to: `GET /api/auth/google/callback?code=...`

### 4. Backend Processes Callback

```typescript
// auth.controller.ts
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleCallback(@Req() req, @Res() res) {
  // 1. Guard validates code with Google
  // 2. GoogleStrategy.validate() extracts user info
  // 3. User info is attached to req.user

  // 4. Find or create user in database
  const user = await this.authService.validateOAuthUser(req.user);

  // 5. Generate tokens
  const tokens = await this.authService.login(user);

  // 6. Redirect to frontend with tokens
  return this.redirectWithTokens(res, tokens);
}
```

### 5. Frontend Receives Tokens

Redirect URL: `https://yourfrontend.com/auth/callback?accessToken=...&refreshToken=...`

Frontend should:
1. Extract tokens from URL
2. Store access token in memory (not localStorage)
3. Store refresh token in httpOnly cookie (more secure) or memory
4. Clear tokens from URL
5. Redirect to dashboard

## Token Refresh Flow

```
┌─────────┐                    ┌─────────┐
│ Browser │                    │ Backend │
└────┬────┘                    └────┬────┘
     │                              │
     │ Access token expired         │
     │                              │
     │ POST /auth/refresh           │
     │ Body: { refreshToken }       │
     │─────────────────────────────>│
     │                              │
     │                 Validate refresh token
     │                 Delete old refresh token
     │                 Generate new token pair
     │                              │
     │ { accessToken, refreshToken }│
     │<─────────────────────────────│
```

### Refresh Token Rotation

For security, we rotate refresh tokens:

1. User sends old refresh token
2. Backend validates and **deletes** the old token
3. Backend generates a **new** access + refresh token pair
4. User must use the new refresh token next time

This prevents refresh token reuse attacks.

## Protected Route Flow

```
┌─────────┐                    ┌─────────┐
│ Browser │                    │ Backend │
└────┬────┘                    └────┬────┘
     │                              │
     │ GET /auth/me                 │
     │ Header: Authorization: Bearer <accessToken>
     │─────────────────────────────>│
     │                              │
     │             JwtAuthGuard activates
     │             JwtStrategy.validate() runs
     │             User attached to req.user
     │                              │
     │ { user data }                │
     │<─────────────────────────────│
```

## Logout Flow

```
┌─────────┐                    ┌─────────┐
│ Browser │                    │ Backend │
└────┬────┘                    └────┬────┘
     │                              │
     │ POST /auth/logout            │
     │ Body: { refreshToken }       │
     │─────────────────────────────>│
     │                              │
     │              Delete refresh token from DB
     │                              │
     │ { message: "Logged out" }    │
     │<─────────────────────────────│
     │                              │
     │ Clear local tokens           │
```

## Security Considerations

### Why Access Tokens are Short-Lived

- If stolen, they're only valid for 15 minutes
- No database lookup required to validate (stateless)
- Fast to verify using JWT signature

### Why Refresh Tokens are Long-Lived

- Stored in database (can be revoked)
- Used only to get new tokens
- Rotated on each use

### Token Storage Best Practices

| Token | Recommended Storage | Reason |
|-------|---------------------|--------|
| Access Token | JavaScript variable (memory) | Cleared on page refresh |
| Refresh Token | httpOnly cookie | Not accessible via JavaScript |

### Never Store in localStorage

- Vulnerable to XSS attacks
- Any JavaScript can read it
- Persists after browser closes

## Database Tables

### users

Stores user profile from OAuth provider:

| Column | Type | Description |
|--------|------|-------------|
| id | text | CUID primary key |
| email | text | User's email |
| name | text | Display name |
| avatar | text | Profile picture URL |
| provider | text | 'google' or 'github' |
| provider_id | text | ID from OAuth provider |
| created_at | timestamp | When user was created |
| updated_at | timestamp | Last profile update |

### refresh_tokens

Stores active refresh tokens:

| Column | Type | Description |
|--------|------|-------------|
| id | text | CUID primary key |
| token | text | Hashed refresh token |
| user_id | text | Foreign key to users |
| expires_at | timestamp | When token expires |
| created_at | timestamp | When token was created |

## Error Scenarios

### Invalid Access Token

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Frontend should try refreshing the token.

### Invalid/Expired Refresh Token

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

Frontend should redirect to login.

### OAuth Error

If user cancels OAuth or there's an error:
- Google/GitHub redirects back with error
- Backend can handle this in the guard
- Currently redirects to frontend with error params
