# Subjects API Endpoints

Base URL: `/subjects`

## Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /subjects | No | Get all active subjects |
| GET | /subjects/:slug | No | Get subject by slug |

---

## GET /subjects

Get all active subjects.

### Request

```http
GET /subjects
```

### Success Response

**200 OK**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Physics",
    "slug": "physics",
    "icon": "⚡",
    "description": "Mechanics, thermodynamics, electromagnetism and more",
    "isActive": true,
    "defaultTimeLimit": 30,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Mathematics",
    "slug": "maths",
    "icon": "📐",
    "description": "Algebra, calculus, geometry and more",
    "isActive": true,
    "defaultTimeLimit": 45,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Chemistry",
    "slug": "chemistry",
    "icon": "🧪",
    "description": "Organic, inorganic, physical chemistry and more",
    "isActive": true,
    "defaultTimeLimit": 30,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Notes

- Only returns subjects where `isActive = true`
- Inactive subjects are hidden from players

---

## GET /subjects/:slug

Get a single subject by its URL-friendly slug.

### Request

```http
GET /subjects/physics
```

### Success Response

**200 OK**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Physics",
  "slug": "physics",
  "icon": "⚡",
  "description": "Mechanics, thermodynamics, electromagnetism and more",
  "isActive": true,
  "defaultTimeLimit": 30,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "Subject with slug \"invalid-slug\" not found",
  "error": "Not Found"
}
```

---

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name |
| slug | text | URL-friendly identifier (unique) |
| icon | text | Emoji or icon URL |
| description | text | Subject description |
| is_active | boolean | Show to users (default: true) |
| default_time_limit | integer | Seconds per question (default: 30) |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

---

## Frontend Usage

```typescript
// Fetch all subjects for subject selection screen
const fetchSubjects = async () => {
  const response = await fetch(`${API_URL}/subjects`);
  return response.json();
};

// Fetch single subject for game lobby
const fetchSubject = async (slug: string) => {
  const response = await fetch(`${API_URL}/subjects/${slug}`);
  if (!response.ok) throw new Error('Subject not found');
  return response.json();
};
```

---

## Testing with cURL

```bash
# Get all subjects
curl http://localhost:3000/subjects

# Get single subject
curl http://localhost:3000/subjects/physics

# Get non-existent subject (404)
curl http://localhost:3000/subjects/invalid
```
