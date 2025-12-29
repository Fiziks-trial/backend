# Auth API Endpoints

Base URL: `/auth`

## Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /auth/google | No | Start Google OAuth |
| GET | /auth/google/callback | No | Google OAuth callback |
| GET | /auth/github | No | Start GitHub OAuth |
| GET | /auth/github/callback | No | GitHub OAuth callback |
| POST | /auth/refresh | No | Refresh access token |
| POST | /auth/logout | No | Invalidate refresh token |
| GET | /auth/me | Yes | Get current user |

---

## GET /auth/google

Start Google OAuth login flow.

### Request

```http
GET /auth/google
```

### Response

**302 Redirect** to Google's OAuth consent page.

### Usage

```html
<a href="https://api.yourapp.com/auth/google">Login with Google</a>
```

---

## GET /auth/google/callback

Google redirects here after user approves.

### Request

```http
GET /auth/google/callback?code=<authorization_code>&state=<state>
```

### Response

**302 Redirect** to frontend with tokens:

```
https://yourfrontend.com/auth/callback?accessToken=<jwt>&refreshToken=<token>
```

### Error Response

If OAuth fails:
```
https://yourfrontend.com/auth/callback?error=<error_message>
```

---

## GET /auth/github

Start GitHub OAuth login flow.

### Request

```http
GET /auth/github
```

### Response

**302 Redirect** to GitHub's OAuth consent page.

### Usage

```html
<a href="https://api.yourapp.com/auth/github">Login with GitHub</a>
```

---

## GET /auth/github/callback

GitHub redirects here after user approves.

### Request

```http
GET /auth/github/callback?code=<authorization_code>
```

### Response

**302 Redirect** to frontend with tokens:

```
https://yourfrontend.com/auth/callback?accessToken=<jwt>&refreshToken=<token>
```

---

## POST /auth/refresh

Exchange a refresh token for new access and refresh tokens.

### Request

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

### Success Response

**200 OK**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "new-refresh-token"
}
```

### Error Response

**401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

### Notes

- Old refresh token is invalidated after use
- New refresh token must be stored and used for next refresh
- Access token is valid for 15 minutes
- Refresh token is valid for 7 days

---

## POST /auth/logout

Invalidate a refresh token.

### Request

```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

### Success Response

**200 OK**

```json
{
  "message": "Logged out successfully"
}
```

### Notes

- Deletes the refresh token from database
- Access token remains valid until expiry (15 min)
- For immediate access token invalidation, implement a token blacklist

---

## GET /auth/me

Get the currently authenticated user's profile.

### Request

```http
GET /auth/me
Authorization: Bearer <access_token>
```

### Success Response

**200 OK**

```json
{
  "id": "clx1abc123def456",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://lh3.googleusercontent.com/...",
  "provider": "google",
  "providerId": "123456789",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

**401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Frontend Integration Example

### React/Next.js

```typescript
// Start OAuth login
const loginWithGoogle = () => {
  window.location.href = `${API_URL}/auth/google`;
};

const loginWithGithub = () => {
  window.location.href = `${API_URL}/auth/github`;
};

// Handle callback (on /auth/callback page)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const error = params.get('error');

  if (error) {
    // Handle error
    console.error('OAuth error:', error);
    return;
  }

  if (accessToken && refreshToken) {
    // Store tokens
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    // Clear URL and redirect
    window.history.replaceState({}, '', '/auth/callback');
    router.push('/dashboard');
  }
}, []);

// Refresh token
const refreshAccessToken = async () => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Refresh failed, redirect to login
    logout();
    return;
  }

  const data = await response.json();
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
};

// Authenticated API call
const fetchUser = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // Try refreshing token
    await refreshAccessToken();
    // Retry request with new token
    return fetchUser();
  }

  return response.json();
};

// Logout
const logout = async () => {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  setAccessToken(null);
  setRefreshToken(null);
  router.push('/login');
};
```

### Axios Interceptor

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: getRefreshToken(),
        });

        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Testing with cURL

```bash
# Start Google OAuth (opens in browser)
open "http://localhost:3000/auth/google"

# Refresh tokens
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'

# Get current user
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer your-access-token"

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```
