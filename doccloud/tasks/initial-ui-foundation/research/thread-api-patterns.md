# Thread API Patterns Research

**Date:** 2025-10-04
**Researcher:** API Planner Agent
**Task:** Design thread and post API methods for QuokkaQ

---

## Existing API Patterns Analysis

### 1. API Client Structure (`lib/api/client.ts`)

**Key Observations:**
- Exported as single `api` object with methods
- All methods return `Promise<T>` for async consistency
- Network delay simulation via `delay()` helper (200-500ms base, varies by operation type)
- ID generation via `generateId(prefix)` helper
- All methods call `seedData()` first to ensure localStorage is initialized
- Error handling via thrown `Error` objects or discriminated union types (e.g., `AuthResult`)

**Method Naming Convention:**
- Query operations: `get*` (e.g., `getAllCourses`, `getCurrentUser`, `getCourseById`)
- Mutations: action verbs (e.g., `login`, `signup`, `logout`, `markNotificationRead`)
- Pattern: camelCase, descriptive, RESTful semantics

**Network Delay Patterns:**
- Read operations: 200-500ms (via `delay()` with no args)
- Quick actions (logout, mark read): 50-100ms
- Expensive operations (signup): 400-600ms
- AI operations (getCourseInsights): 600-800ms

**Data Hydration:**
- Methods return enriched data (not just IDs)
- Example: `getCourseThreads` returns full `Thread[]`, not just IDs
- No separate hydration layer - done within API methods

**Error Handling Approaches:**
1. **Discriminated Union** (auth): Returns `AuthResult = AuthResponse | AuthError`
2. **Null Returns** (not found): Returns `Course | null`, `User | null`
3. **Empty Arrays** (no results): Returns `[]` instead of null

### 2. React Query Hooks (`lib/api/hooks.ts`)

**Hook Naming:**
- Queries: `use<EntityName>` or `use<EntityName>s` (e.g., `useCourses`, `useCourse`)
- Mutations: `use<ActionVerb><Entity>` (e.g., `useLogin`, `useMarkNotificationRead`)

**Query Key Patterns:**
- Centralized in `queryKeys` object at top of file
- Array format with const assertion: `["entity"] as const` or `["entity", id] as const`
- Dynamic keys use functions: `queryKeys.course(courseId)`
- Composite keys for filtered data: `["notifications", userId, courseId]`

**Query Configuration:**
- `staleTime`: 30s (notifications) to 10 minutes (courses)
- `gcTime`: Usually 2x staleTime
- `enabled`: Used with optional params (e.g., `enabled: !!userId`)
- `refetchInterval`: Only for polling (e.g., notifications poll every 60s)

**Mutation Patterns:**
- Always get `queryClient` via `useQueryClient()`
- `onSuccess` callback invalidates related queries
- Pattern: `queryClient.invalidateQueries({ queryKey: [...] })`
- Optimistic updates: Not yet used in existing code (opportunity)

### 3. TypeScript Types (`lib/models/types.ts`)

**Interface Patterns:**
- All fields explicitly typed (no `any`)
- Optional fields marked with `?`
- ISO 8601 strings for dates (e.g., `"2025-10-01T10:30:00Z"`)
- Enums as union types: `type ThreadStatus = 'open' | 'answered' | 'resolved'`
- Related objects via IDs: `authorId: string` (not embedded `author: User`)

**Existing Thread & Post Types:**
```typescript
export interface Thread {
  id: string;
  courseId: string;
  title: string;
  content: string;
  authorId: string;
  status: ThreadStatus;
  tags?: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  endorsed: boolean;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4. Mock Data Structure (`mocks/threads.json`)

**Observations:**
- Array of seed objects (not nested structure)
- Realistic values (45 views, proper timestamps, descriptive content)
- Deterministic IDs: `"thread-1"`, `"thread-2"`, etc.
- Proper relationships: `"authorId": "user-student-1"` matches users.json
- Tags are lowercase kebab-case: `["algorithms", "binary-search"]`
- Timestamps use ISO 8601 UTC format

**Data Consistency:**
- 4 threads across 3 courses
- Mix of statuses: 2 answered, 1 resolved, 1 open
- View counts vary (23-67 views)
- createdAt < updatedAt (except for open threads)

### 5. LocalStorage Layer (`lib/store/localStore.ts`)

**Storage Keys:**
- Namespace pattern: `"quokkaq.<entity>"`
- Example: `"quokkaq.threads"`, `"quokkaq.users"`

**Helper Functions:**
- `getThreads()`: Returns all threads
- `getThreadsByCourse(courseId)`: Filtered by course
- `getThreadById(id)`: Single thread lookup
- All have SSR guards: `if (typeof window === "undefined") return []`

**Mutation Functions:**
- Not yet implemented for threads (only users, notifications)
- Pattern: Load → Modify → Save back to localStorage
- Example from notifications: `markNotificationRead(id)` modifies in place

---

## Gaps & Requirements

### Missing API Methods

**Thread Operations:**
1. ✅ `getThreads()` - Already exists as `getCourseThreads(courseId)`
2. ✅ `getThread(id)` - Need to add
3. ✅ `createThread(input)` - Need to add
4. ✅ `updateThreadStatus(threadId, status)` - Need to add

**Post Operations:**
1. ✅ `getPosts(threadId)` - Need to add
2. ✅ `createPost(input)` - Need to add
3. ✅ `endorsePost(postId)` - Need to add (toggle)
4. ✅ `flagPost(postId)` - Need to add (toggle)

### Missing Types

**Input Interfaces:**
1. `CreateThreadInput` - For creating new threads
2. `CreatePostInput` - For creating new posts
3. `ThreadFilters` - Optional filters for getThreads (status, tags, search)

### Missing Mock Data

**Posts/Replies:**
- Need `mocks/posts.json` with seed replies
- Should reference existing threads and users
- Include mix of endorsed/flagged states
- Realistic academic Q&A content

### Missing localStorage Helpers

**Thread Mutations:**
- `createThreadInStore(thread: Thread): void`
- `updateThreadInStore(id: string, updates: Partial<Thread>): void`
- `incrementThreadViews(id: string): void`

**Post Access & Mutations:**
- `getPosts(): Post[]`
- `getPostsByThread(threadId: string): Post[]`
- `getPostById(id: string): Post | null`
- `createPostInStore(post: Post): void`
- `updatePostInStore(id: string, updates: Partial<Post>): void`

---

## Design Decisions

### 1. Thread Filtering Strategy

**Option A: Server-side filtering in API method**
```typescript
getThreads(courseId: string, filters?: { status?: ThreadStatus; tags?: string[]; search?: string })
```
- Pros: Simulates real backend, clean separation
- Cons: More complex API signature

**Option B: Client-side filtering in component**
```typescript
const { data: threads } = useCourseThreads(courseId);
const filtered = threads?.filter(t => t.status === 'open');
```
- Pros: Simpler API, leverages React Query cache
- Cons: Less realistic backend simulation

**Recommendation:** Option A - backend-ready design is priority

### 2. Post Data Hydration

**Option A: Return raw posts with authorId**
```typescript
getPosts(threadId) → Post[] // authorId references users
```
- Pros: Matches existing pattern, backend-ready
- Cons: Components must fetch users separately

**Option B: Return hydrated posts with author object**
```typescript
interface PostWithAuthor extends Post { author: User }
getPosts(threadId) → PostWithAuthor[]
```
- Pros: Easier for components, fewer queries
- Cons: Deviates from existing pattern, harder to cache

**Recommendation:** Option A - stay consistent with existing patterns

### 3. Endorsement/Flag Toggle Logic

**Option A: Explicit set/unset methods**
```typescript
endorsePost(postId) // Always set to true
unendorsePost(postId) // Always set to false
```
- Pros: Explicit intent
- Cons: More methods, redundant

**Option B: Single toggle method**
```typescript
endorsePost(postId) // Flips boolean
```
- Pros: Simpler, fewer methods
- Cons: Ambiguous semantics (is it setting or toggling?)

**Option C: Pass boolean value**
```typescript
endorsePost(postId, endorsed: boolean)
```
- Pros: Explicit control
- Cons: More complex for simple toggle UI

**Recommendation:** Option B - simpler for mock, add `toggleEndorsement` to method name for clarity

### 4. Thread View Increment Strategy

**Option A: Auto-increment on getThread(id)**
```typescript
async getThread(id) {
  const thread = getThreadById(id);
  if (thread) incrementThreadViews(id);
  return thread;
}
```
- Pros: Automatic, no extra API call
- Cons: Increments on every query (even cache hits)

**Option B: Separate incrementViews(id) method**
```typescript
async incrementThreadViews(id) {
  incrementThreadViewsInStore(id);
}
```
- Pros: Explicit control, can debounce
- Cons: Extra API call

**Recommendation:** Option A - simpler for mock, realistic enough

### 5. Query Invalidation Strategy

**Thread Mutations:**
- `createThread` → Invalidate `["courseThreads", courseId]`, `["courseMetrics", courseId]`
- `updateThreadStatus` → Invalidate `["thread", id]`, `["courseThreads", courseId]`, `["courseMetrics", courseId]`

**Post Mutations:**
- `createPost` → Invalidate `["posts", threadId]`, `["thread", threadId]` (for reply count)
- `toggleEndorsePost` → Invalidate `["posts", threadId]`, `["thread", threadId]`
- `toggleFlagPost` → Invalidate `["posts", threadId]` (no thread impact)

---

## Performance Considerations

### Network Delays

| Operation | Delay | Rationale |
|-----------|-------|-----------|
| `getThreads` | 200-500ms | Standard read |
| `getThread` | 200-500ms | Standard read + view increment |
| `createThread` | 300-500ms | Write with validation |
| `updateThreadStatus` | 100-150ms | Quick toggle |
| `getPosts` | 200-400ms | Standard read |
| `createPost` | 300-500ms | Write with validation |
| `toggleEndorsePost` | 100ms | Quick action |
| `toggleFlagPost` | 100ms | Quick action |

### Stale Time Recommendations

| Query | Stale Time | Rationale |
|-------|------------|-----------|
| `useThreads` | 2 minutes | Moderate activity |
| `useThread` | 1 minute | Viewed frequently |
| `usePosts` | 1 minute | Active discussions |

---

## Backend Migration Path

When connecting to real backend:

1. **Replace localStorage with fetch calls:**
   ```typescript
   // Before (mock)
   const threads = getThreadsByCourse(courseId);

   // After (real)
   const response = await fetch(`${API_URL}/courses/${courseId}/threads`);
   const threads = await response.json();
   ```

2. **Add authentication headers:**
   ```typescript
   headers: {
     'Authorization': `Bearer ${session.token}`,
     'Content-Type': 'application/json'
   }
   ```

3. **Handle real errors:**
   ```typescript
   if (!response.ok) {
     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
   }
   ```

4. **Environment variable switch:**
   ```typescript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
   ```

5. **Remove seedData() calls** - backend maintains its own database

---

## Related Files

- `lib/api/client.ts` - Add 8 new methods
- `lib/api/hooks.ts` - Add 8 new React Query hooks
- `lib/models/types.ts` - Add 3 new input interfaces
- `lib/store/localStore.ts` - Add 8 new helper functions
- `mocks/posts.json` - Create new seed data file

---

## Next Steps

1. ✅ Document findings in this research file
2. ⏳ Create implementation plan in `plans/thread-api-design.md`
3. ⏳ Update context.md with API design decision summary
