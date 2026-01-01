# Users API Endpoints

Base URL: `/users`

## Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /users | No | Search users by username |
| GET | /users/me | Yes | Get own profile |
| PATCH | /users/me | Yes | Update own profile |
| GET | /users/username/:username | No | Get user by username |
| GET | /users/:id | No | Get public profile by ID |

---

## GET /users

Search users by username prefix. Finds usernames that start with the search query.

### Request

```http
GET /users?search=john&limit=10
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | Yes | - | Username prefix (min 3 characters) |
| limit | number | No | 10 | Max results to return (1-50) |

### Note

This is a **prefix search** - it only matches usernames that **start with** the query.
- `john` → finds `johndoe`, `johnny123`
- `john` → does NOT find `bigjohn`, `xXjohnXx`

### Success Response

**200 OK**

```json
{
  "users": [
    {
      "id": "clx1abc123def456",
      "username": "johndoe",
      "avatar": "https://lh3.googleusercontent.com/..."
    },
    {
      "id": "clx2xyz789ghi012",
      "username": "johnny123",
      "avatar": null
    }
  ],
  "count": 2
}
```

### Error Responses

**400 Bad Request** - Search query too short

```json
{
  "statusCode": 400,
  "message": "Search query must be at least 3 characters",
  "error": "Bad Request"
}
```

---

## GET /users/me

Get the authenticated user's full profile.

### Request

```http
GET /users/me
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
  "username": "johndoe",
  "coins": 150,
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

## PATCH /users/me

Update the authenticated user's profile.

### Request

```http
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "newusername",
  "avatar": "https://example.com/avatar.png"
}
```

### Validation Rules

| Field | Rules |
|-------|-------|
| username | Optional, 3-20 chars, letters/numbers/underscores only |
| avatar | Optional, string (URL) |

### Success Response

**200 OK**

```json
{
  "id": "clx1abc123def456",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.png",
  "username": "newusername",
  "coins": 150,
  "provider": "google",
  "providerId": "123456789",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T08:00:00.000Z"
}
```

### Error Responses

**400 Bad Request** - Validation failed

```json
{
  "statusCode": 400,
  "message": ["Username can only contain letters, numbers, and underscores"],
  "error": "Bad Request"
}
```

**409 Conflict** - Username taken

```json
{
  "statusCode": 409,
  "message": "Username already taken",
  "error": "Conflict"
}
```

---

## GET /users/username/:username

Get a user's public profile by their username. Used for frontend routes like `/u/:username`.

### Request

```http
GET /users/username/johndoe
```

### Success Response

**200 OK**

```json
{
  "id": "clx1abc123def456",
  "username": "johndoe",
  "avatar": "https://lh3.googleusercontent.com/...",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

## GET /users/:id

Get a user's public profile by ID.

### Request

```http
GET /users/clx1abc123def456
```

### Success Response

**200 OK**

```json
{
  "id": "clx1abc123def456",
  "username": "johndoe",
  "avatar": "https://lh3.googleusercontent.com/...",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Notes

- Public profile hides sensitive data (email, provider, coins)
- Used for viewing opponent profiles in matches

---

## Testing with cURL

```bash
# Search users
curl "http://localhost:3000/users?search=john&limit=5"

# Get own profile
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <token>"

# Update profile
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "newname"}'

# Get user by username
curl http://localhost:3000/users/username/johndoe

# Get public profile by ID
curl http://localhost:3000/users/clx1abc123def456
```
