# QuokkaQ Backend API Reference

**Version:** 1.0.0
**Base URL:** `http://localhost:3001/api/v1`
**Protocol:** REST
**Authentication:** Session-based (HTTP-only cookies)

---

## Table of Contents

1. [Health Endpoints](#health-endpoints)
2. [Authentication](#authentication)
3. [Threads](#threads)
4. [Posts](#posts)
5. [Courses](#courses)
6. [Materials](#materials)
7. [Conversations](#conversations)
8. [AI Answers](#ai-answers)
9. [Instructor](#instructor)
10. [Notifications](#notifications)
11. [Error Responses](#error-responses)
12. [Common Data Types](#common-data-types)

---

## Health Endpoints

### GET /health

**Description:** Basic health check endpoint

**Authentication:** None required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T19:30:00.000Z",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200` - Service is healthy

---

### GET /ready

**Description:** Readiness check with database connectivity test

**Authentication:** None required

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-10-20T19:30:00.000Z",
  "database": "connected",
  "uptime": 3600
}
```

**Status Codes:**
- `200` - Service is ready
- `503` - Service not ready (database unavailable)

---

### GET /ping

**Description:** Simple ping endpoint

**Authentication:** None required

**Response:**
```json
{
  "pong": true
}
```

**Status Codes:**
- `200` - Success

---

## Authentication

### POST /auth/signup

**Description:** Register a new user account

**Authentication:** None required

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securePassword123",
  "name": "Alice Chen",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-abc123",
    "email": "alice@example.com",
    "name": "Alice Chen",
    "role": "student",
    "createdAt": "2025-10-20T19:30:00.000Z"
  },
  "message": "Account created successfully"
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Invalid input (email already exists, weak password)
- `422` - Validation error

---

### POST /auth/login

**Description:** Authenticate user and create session

**Authentication:** None required

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-abc123",
    "email": "alice@example.com",
    "name": "Alice Chen",
    "role": "student"
  },
  "message": "Login successful"
}
```

**Sets Cookie:** `session` (HTTP-only, signed)

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `422` - Validation error

---

### POST /auth/logout

**Description:** End user session

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Status Codes:**
- `200` - Logout successful
- `401` - Not authenticated

---

### GET /auth/session

**Description:** Get current user session

**Authentication:** Required

**Response:**
```json
{
  "user": {
    "id": "user-abc123",
    "email": "alice@example.com",
    "name": "Alice Chen",
    "role": "student",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-10-20T19:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Session valid
- `401` - Not authenticated

---

## Threads

### GET /threads

**Description:** List all threads with filtering and pagination

**Authentication:** Required

**Query Parameters:**
- `courseId` (optional) - Filter by course
- `status` (optional) - Filter by status (`open`, `answered`, `resolved`)
- `cursor` (optional) - Pagination cursor
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "threads": [
    {
      "id": "thread-123",
      "courseId": "course-cs101",
      "title": "How does binary search work?",
      "content": "I'm confused about the algorithm...",
      "authorId": "user-abc123",
      "status": "answered",
      "tags": ["algorithms", "binary-search"],
      "views": 42,
      "hasAIAnswer": true,
      "createdAt": "2025-10-20T19:00:00.000Z",
      "updatedAt": "2025-10-20T19:30:00.000Z"
    }
  ],
  "pagination": {
    "nextCursor": "thread-456",
    "hasMore": true
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated

---

### GET /threads/:id

**Description:** Get a single thread by ID

**Authentication:** Required

**Response:**
```json
{
  "id": "thread-123",
  "courseId": "course-cs101",
  "title": "How does binary search work?",
  "content": "I'm confused about the algorithm...",
  "authorId": "user-abc123",
  "status": "answered",
  "tags": ["algorithms", "binary-search"],
  "views": 42,
  "hasAIAnswer": true,
  "aiAnswerId": "ai-answer-789",
  "replyCount": 5,
  "createdAt": "2025-10-20T19:00:00.000Z",
  "updatedAt": "2025-10-20T19:30:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `404` - Thread not found

---

### POST /threads

**Description:** Create a new thread

**Authentication:** Required

**Request Body:**
```json
{
  "courseId": "course-cs101",
  "title": "How does binary search work?",
  "content": "I'm confused about the algorithm...",
  "tags": ["algorithms", "binary-search"]
}
```

**Response:**
```json
{
  "thread": {
    "id": "thread-123",
    "courseId": "course-cs101",
    "title": "How does binary search work?",
    "content": "I'm confused about the algorithm...",
    "authorId": "user-abc123",
    "status": "open",
    "tags": ["algorithms", "binary-search"],
    "views": 1,
    "createdAt": "2025-10-20T19:30:00.000Z",
    "updatedAt": "2025-10-20T19:30:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Thread created
- `400` - Invalid input
- `401` - Not authenticated
- `422` - Validation error

---

### PUT /threads/:id

**Description:** Update a thread (author or instructor only)

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["new-tag"],
  "status": "resolved"
}
```

**Response:**
```json
{
  "thread": {
    "id": "thread-123",
    "title": "Updated title",
    "content": "Updated content",
    "tags": ["new-tag"],
    "status": "resolved",
    "updatedAt": "2025-10-20T19:45:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Thread updated
- `401` - Not authenticated
- `403` - Forbidden (not author or instructor)
- `404` - Thread not found
- `422` - Validation error

---

## Posts

### GET /posts

**Description:** Get posts for a thread

**Authentication:** Required

**Query Parameters:**
- `threadId` (required) - Thread ID to get posts for
- `cursor` (optional) - Pagination cursor
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "posts": [
    {
      "id": "post-456",
      "threadId": "thread-123",
      "authorId": "user-def456",
      "content": "Here's how binary search works...",
      "endorsed": true,
      "flagged": false,
      "createdAt": "2025-10-20T19:15:00.000Z",
      "updatedAt": "2025-10-20T19:20:00.000Z"
    }
  ],
  "pagination": {
    "nextCursor": "post-789",
    "hasMore": false
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `422` - Missing threadId

---

### POST /posts

**Description:** Create a new post (reply to thread)

**Authentication:** Required

**Request Body:**
```json
{
  "threadId": "thread-123",
  "content": "Here's how binary search works..."
}
```

**Response:**
```json
{
  "post": {
    "id": "post-456",
    "threadId": "thread-123",
    "authorId": "user-def456",
    "content": "Here's how binary search works...",
    "endorsed": false,
    "flagged": false,
    "createdAt": "2025-10-20T19:15:00.000Z",
    "updatedAt": "2025-10-20T19:15:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Post created
- `400` - Invalid input
- `401` - Not authenticated
- `404` - Thread not found
- `422` - Validation error

---

## Courses

### GET /courses

**Description:** List all courses

**Authentication:** Required

**Response:**
```json
{
  "courses": [
    {
      "id": "course-cs101",
      "code": "CS101",
      "name": "Introduction to Computer Science",
      "instructorIds": ["user-instructor-1"],
      "description": "Learn the fundamentals of CS",
      "term": "Fall 2025",
      "active": true,
      "createdAt": "2025-08-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated

---

### GET /courses/:id

**Description:** Get a single course by ID

**Authentication:** Required

**Response:**
```json
{
  "id": "course-cs101",
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "instructorIds": ["user-instructor-1"],
  "description": "Learn the fundamentals of CS",
  "term": "Fall 2025",
  "active": true,
  "createdAt": "2025-08-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `404` - Course not found

---

## Materials

### GET /materials

**Description:** Get course materials

**Authentication:** Required

**Query Parameters:**
- `courseId` (required) - Course ID to get materials for

**Response:**
```json
{
  "materials": [
    {
      "id": "material-123",
      "courseId": "course-cs101",
      "title": "Lecture 1: Introduction",
      "type": "lecture",
      "content": "# Introduction to CS\n\nWelcome to CS101...",
      "week": 1,
      "createdAt": "2025-08-15T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `422` - Missing courseId

---

## Conversations

### GET /conversations

**Description:** Get AI conversations for a user

**Authentication:** Required

**Query Parameters:**
- `userId` (required) - User ID to get conversations for

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-123",
      "userId": "user-abc123",
      "courseId": "course-cs101",
      "title": "CS101 - AI Assistant",
      "createdAt": "2025-10-20T19:00:00.000Z",
      "updatedAt": "2025-10-20T19:30:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated

---

### POST /conversations

**Description:** Create a new AI conversation

**Authentication:** Required

**Request Body:**
```json
{
  "userId": "user-abc123",
  "courseId": "course-cs101",
  "title": "CS101 - AI Assistant"
}
```

**Response:**
```json
{
  "conversation": {
    "id": "conv-123",
    "userId": "user-abc123",
    "courseId": "course-cs101",
    "title": "CS101 - AI Assistant",
    "createdAt": "2025-10-20T19:00:00.000Z",
    "updatedAt": "2025-10-20T19:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Conversation created
- `400` - Invalid input
- `401` - Not authenticated
- `422` - Validation error

---

## AI Answers

### GET /ai-answers/:id

**Description:** Get an AI-generated answer by ID

**Authentication:** Required

**Response:**
```json
{
  "id": "ai-answer-789",
  "threadId": "thread-123",
  "content": "Binary search is a divide-and-conquer algorithm...",
  "confidenceLevel": "high",
  "confidenceScore": 95,
  "sources": [
    {
      "materialId": "material-123",
      "title": "Lecture 3: Search Algorithms",
      "relevance": 0.95
    }
  ],
  "instructorEndorsed": false,
  "createdAt": "2025-10-20T19:05:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `404` - AI answer not found

---

## Instructor

### GET /instructor/metrics

**Description:** Get ROI metrics for instructor dashboard

**Authentication:** Required (instructor or TA only)

**Query Parameters:**
- `courseId` (required) - Course ID
- `timeRange` (optional) - `week`, `month`, `quarter`, or `all-time` (default: `week`)

**Response:**
```json
{
  "courseId": "course-cs101",
  "timeRange": "week",
  "questionsAutoAnswered": 42,
  "timeSavedMinutes": 210,
  "citationCoverage": 85,
  "endorsedThreadsCount": 15,
  "endorsedThreadsViews": 450,
  "averageViewsPerEndorsed": 30,
  "totalThreads": 87,
  "totalReplies": 234,
  "activeStudents": 45,
  "topContributors": [
    {
      "userId": "user-alice",
      "name": "Alice Chen",
      "threadCount": 12,
      "replyCount": 34
    }
  ],
  "topTopics": [
    {
      "tag": "algorithms",
      "count": 15,
      "trend": "up"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Forbidden (not instructor or TA)
- `422` - Missing courseId

---

## Notifications

### GET /notifications

**Description:** Get notifications for a user

**Authentication:** Required

**Query Parameters:**
- `userId` (required) - User ID to get notifications for
- `unreadOnly` (optional) - Boolean to filter unread only

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "userId": "user-abc123",
      "type": "thread_reply",
      "title": "New reply to your thread",
      "message": "Bob Smith replied to your thread",
      "threadId": "thread-123",
      "read": false,
      "createdAt": "2025-10-20T19:30:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or session expired |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Common Data Types

### Thread Status

- `open` - Unanswered question
- `answered` - Has replies or AI answer
- `resolved` - Marked as resolved by author or instructor

### User Roles

- `student` - Regular student
- `instructor` - Course instructor
- `ta` - Teaching assistant

### Confidence Levels

- `high` - AI confidence ≥ 80%
- `medium` - AI confidence 50-79%
- `low` - AI confidence < 50%

### Material Types

- `lecture` - Lecture notes
- `slide` - Presentation slides
- `reading` - Reading assignment
- `video` - Video lecture
- `assignment` - Assignment document

---

## Pagination

All list endpoints support cursor-based pagination:

**Query Parameters:**
- `cursor` - Opaque cursor string from previous response
- `limit` - Number of items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "items": [...],
  "pagination": {
    "nextCursor": "opaque-cursor-string",
    "hasMore": true
  }
}
```

To get the next page, pass `nextCursor` as the `cursor` parameter.

---

## Rate Limiting

**Current Status:** Not implemented

**Planned:**
- 100 requests per minute per user
- 429 status code when exceeded
- `Retry-After` header with wait time

---

## Changelog

### Version 1.0.0 (2025-10-20)

**Added:**
- Health check endpoints (`/health`, `/ready`, `/ping`)
- Authentication endpoints (signup, login, logout, session)
- Thread CRUD endpoints
- Post CRUD endpoints
- Course endpoints
- Materials endpoints
- AI conversation endpoints
- AI answers endpoints
- Instructor metrics endpoint
- Notifications endpoint

**Status:** 12 of 44 planned endpoints implemented

---

## Development

**Base URL (Local):** `http://localhost:3001/api/v1`

**Start Server:**
```bash
cd backend
npm run dev
```

**Database:**
- Development: SQLite (`backend/dev.db`)
- Production: PostgreSQL (AWS RDS)

**Testing:**
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'

# Get threads (with session cookie)
curl http://localhost:3001/api/v1/threads \
  -H "Cookie: session=..."
```

---

## Support

For questions or issues, see:
- **Project README:** `/README.md`
- **CLAUDE.md:** Development guidelines
- **Issue Tracker:** (TBD)

**Last Updated:** 2025-10-20
