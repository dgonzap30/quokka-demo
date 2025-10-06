# React Query Patterns Research - AI Answer System

**Date:** 2025-10-06
**Task:** AI-First Question Answering System
**Focus:** React Query architecture for AI answer data fetching, mutations, and cache invalidation

---

## Current React Query Architecture

### Query Key Structure (lib/api/hooks.ts)

**Current Pattern: Hierarchical factory-based keys**

```typescript
const queryKeys = {
  currentUser: ["currentUser"] as const,
  session: ["session"] as const,
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
  courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId ? ["notifications", userId, courseId] : ["notifications", userId],
  studentDashboard: (userId: string) => ["studentDashboard", userId] as const,
  instructorDashboard: (userId: string) => ["instructorDashboard", userId] as const,
};
```

**Strengths:**
- Centralized key factory prevents typos
- TypeScript `as const` for type safety
- Hierarchical structure (e.g., `["courseThreads", courseId]`)
- Parameterization for cache isolation

**Patterns Observed:**
- Resource-first naming: `["thread", threadId]` not `["threads", threadId, "detail"]`
- Optional parameters: `notifications(userId, courseId?)` creates different keys
- User-scoped caching: `["studentDashboard", userId]`

---

### Cache Configuration Patterns

**Current Stale Time Strategy:**

| Query Type | Stale Time | Reasoning |
|------------|------------|-----------|
| `currentUser` | 5 minutes | User data changes infrequently |
| `session` | 5 minutes | Authentication state is stable |
| `courses` | 10 minutes | Course catalog changes rarely |
| `course` | 10 minutes | Individual course metadata stable |
| `courseThreads` | 2 minutes | Active discussion, needs freshness |
| `thread` | 2 minutes | Active discussion, needs freshness |
| `courseMetrics` | 5 minutes | Dashboard stats can be slightly stale |
| `courseInsights` | 5 minutes | AI-generated, expensive operation |
| `notifications` | 30 seconds | Real-time feel with polling (refetchInterval: 60s) |
| `studentDashboard` | 2 minutes | Landing page, balance freshness/performance |
| `instructorDashboard` | 3 minutes | Dashboard stats, less critical than student |

**GC Time (gcTime):**
- Most queries: 5-10 minutes (keep data in cache after unmount)
- Long-lived data (courses, user): 10-15 minutes
- Active discussions (threads): 5 minutes

**Refetch Settings:**
- Default: No refetch on window focus or reconnect
- Exception: `notifications` polls every 60 seconds

---

### Mutation Patterns

**Current Mutation Strategy:**

1. **Login/Signup:**
   ```typescript
   onSuccess: (result) => {
     if (isAuthSuccess(result)) {
       queryClient.setQueryData(queryKeys.currentUser, result.session.user);
       queryClient.setQueryData(queryKeys.session, result.session);
       queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
     }
   }
   ```
   - Optimistic cache update with `setQueryData`
   - Followed by invalidation to trigger refetch

2. **Logout:**
   ```typescript
   onSuccess: () => {
     queryClient.setQueryData(queryKeys.currentUser, null);
     queryClient.setQueryData(queryKeys.session, null);
     queryClient.invalidateQueries(); // Nuclear option: invalidate ALL
   }
   ```
   - Clears auth data
   - Invalidates all queries (clean slate)

3. **Create Thread:**
   ```typescript
   onSuccess: (newThread) => {
     queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(newThread.courseId) });
     queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
     queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
   }
   ```
   - Invalidates course threads (surgical)
   - Invalidates all dashboards (broad, uses partial key match)

4. **Create Post:**
   ```typescript
   onSuccess: (newPost) => {
     queryClient.invalidateQueries({ queryKey: queryKeys.thread(newPost.threadId) });
     queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
     queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
   }
   ```
   - Invalidates specific thread (surgical)
   - Invalidates dashboards (activity feed update)

5. **Mark Notification Read:**
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["notifications"] });
   }
   ```
   - Invalidates all notification queries (partial match)

---

### Invalidation Patterns Observed

**Surgical Invalidation:**
- Use full key with parameters: `queryKeys.thread(threadId)`
- Only affects specific cache entry

**Broad Invalidation:**
- Use partial key: `{ queryKey: ["studentDashboard"] }`
- Matches all queries starting with that key
- Example: `["studentDashboard", "user-1"]` and `["studentDashboard", "user-2"]` both match

**Over-Invalidation Risks:**
- Creating thread invalidates ALL dashboards (every user)
- Creating post invalidates ALL dashboards
- Could cause unnecessary refetches for unaffected users

---

## Mock API Implementation (lib/api/client.ts)

**Current Methods:**
```typescript
api.getCurrentUser()          // 200-400ms delay
api.restoreSession()          // 100-200ms delay
api.login(input)              // 300-500ms delay
api.signup(input)             // 400-600ms delay
api.logout()                  // 50-100ms delay
api.getAllCourses()           // 200-500ms delay
api.getUserCourses(userId)    // 200-500ms delay
api.getCourse(courseId)       // 200-500ms delay
api.getCourseThreads(courseId)// 200-500ms delay
api.getCourseMetrics(courseId)// 300-500ms delay
api.getCourseInsights(courseId)// 600-800ms delay (AI simulation)
api.getNotifications(userId)  // 200-400ms delay
api.markNotificationRead(id)  // 50ms delay
api.getThread(threadId)       // 200-500ms delay, returns { thread, posts }
api.createThread(input, authorId) // 400-600ms delay
api.createPost(input, authorId)   // 300-500ms delay
```

**Patterns:**
- All methods simulate network delay with `delay()` function
- `seedData()` called at start of each method
- Mutations return created entities
- Read operations filter/sort data consistently

**Data Storage:**
- localStorage via `lib/store/localStore.ts`
- Keys: `quokkaq.users`, `quokkaq.threads`, `quokkaq.posts`, etc.
- Thread retrieval increments view count (side effect)

---

## AI Answer Requirements (from context.md)

### Data Model (Decision #1)
```
- Separate AIAnswer type (not merged with Post)
- Confidence as enum + number (0-100 scale)
- Citations as nested array of objects
- Thread.hasAIAnswer flag for quick filtering
- Thread.aiAnswerId for direct lookup
```

### API Generation Strategy (Decision #2)
```
- Auto-generate AI answer in createThread()
- Use template-based responses by course + question keywords
- Simulate 800-1200ms delay for realism
- Return AIAnswer immediately, don't wait for user to navigate
```

### UI Prominence Strategy (Decision #4)
```
- AI answer gets 32px padding (vs 24px for posts)
- ai-gradient border (2px, exclusive to AI)
- Positioned first, separate section above "Human Replies"
- Large AIBadge (default variant, 16px+ height)
- shadow-e3 elevation (highest in page)
```

### Endorsement Weight (Decision #5)
```
- Student endorsement: 1 point
- Instructor endorsement: 3 points (3x value)
- Show total count + breakdown on hover
- Instructor endorsements get special badge
```

---

## AI Answer Query Requirements

### 1. Fetching AI Answers

**Scenario A: Auto-fetch after thread creation**
- User creates thread → API auto-generates AI answer
- Thread detail page needs to fetch AI answer
- Only fetch if `thread.hasAIAnswer === true`
- Show loading state during fetch

**Scenario B: Thread detail page load**
- User navigates to thread detail
- Thread already has AI answer
- Fetch AI answer data (citations, confidence, endorsements)

**Scenario C: Ask page preview**
- User types question on ask page
- Preview shows what AI answer would look like
- Don't save AI answer until thread is created

### 2. Mutating AI Answers

**Scenario A: Endorse AI answer (student)**
- Student clicks endorse button
- Increment endorsement count (+1)
- Update cache immediately (optimistic)
- Rollback on error

**Scenario B: Endorse AI answer (instructor)**
- Instructor clicks endorse button
- Increment endorsement count (+3 weighted)
- Update instructor endorsement badge
- Update cache immediately (optimistic)
- Rollback on error

**Scenario C: Generate AI answer (preview)**
- User types question
- Generate preview AI answer (no save)
- Cache preview for duration of ask page session
- Discard if user navigates away

### 3. Invalidation Requirements

**After createThread:**
- Invalidate course threads (existing pattern)
- Invalidate dashboards (existing pattern)
- **NEW:** Invalidate AI coverage stats (instructor dashboard)

**After endorseAIAnswer:**
- Invalidate specific AI answer query
- **NEW:** Update thread list (endorsement count visible)
- **NEW:** Update AI coverage stats (instructor dashboard)

**After createPost (human reply):**
- Invalidate thread query (existing pattern)
- **NEW:** May affect AI answer ranking/visibility

---

## Performance Considerations

### Avoiding Over-Fetching

**Problem:** Thread detail page fetches thread + posts, then fetches AI answer separately
- Two sequential requests delay page load
- Could combine into single `getThread()` response

**Solution A (Recommended): Embed AI answer in getThread()**
```typescript
api.getThread(threadId) // Returns { thread, posts, aiAnswer? }
```
- Single request, faster page load
- AI answer optional (null if not generated)
- Matches existing pattern (thread + posts in one response)

**Solution B (Current approach): Separate hook**
```typescript
useThread(threadId)          // Fetches thread + posts
useAIAnswer(threadId)        // Fetches AI answer separately
```
- Two requests, slower page load
- More granular cache control
- Better for large AI answer payloads

**Recommendation:** Solution A (embed in getThread) for simplicity and performance.

### Cache Efficiency

**AI Answer Stale Time:**
- AI answers don't change once generated (immutable content)
- Only endorsement count changes (frequent)
- **Strategy:** Long stale time for content (10 minutes), short for endorsements (30 seconds)
- **Alternative:** Separate queries for content vs. endorsements

**AI Coverage Metrics:**
- Calculated from thread count + AI answer count
- Changes only when threads created or AI answers generated
- **Strategy:** 5 minutes stale time (same as other metrics)

---

## Existing Patterns to Follow

### ✅ Do's

1. **Use query key factory:**
   ```typescript
   const queryKeys = {
     aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,
   };
   ```

2. **Enable conditionally:**
   ```typescript
   enabled: !!threadId && thread?.hasAIAnswer === true
   ```

3. **Set stale time based on mutability:**
   ```typescript
   staleTime: 10 * 60 * 1000 // 10 minutes for immutable AI content
   ```

4. **Invalidate surgically:**
   ```typescript
   queryClient.invalidateQueries({ queryKey: queryKeys.aiAnswer(threadId) });
   ```

5. **Use optimistic updates for instant UI:**
   ```typescript
   onMutate: async ({ threadId }) => {
     await queryClient.cancelQueries({ queryKey: queryKeys.aiAnswer(threadId) });
     const previous = queryClient.getQueryData(queryKeys.aiAnswer(threadId));
     queryClient.setQueryData(queryKeys.aiAnswer(threadId), (old) => ({
       ...old,
       endorsementCount: old.endorsementCount + 1,
     }));
     return { previous };
   },
   onError: (err, vars, context) => {
     queryClient.setQueryData(queryKeys.aiAnswer(threadId), context.previous);
   },
   ```

### ❌ Don'ts

1. **Don't invalidate all dashboards for every mutation:**
   - Current pattern: `invalidateQueries({ queryKey: ["studentDashboard"] })`
   - Affects all users, not just current user
   - Better: `invalidateQueries({ queryKey: queryKeys.studentDashboard(currentUserId) })`

2. **Don't use `any` types:**
   - All mutations must have typed inputs
   - All queries must have typed returns

3. **Don't skip error handling:**
   - All mutations need onError callbacks
   - Optimistic updates need rollback logic

4. **Don't over-fetch:**
   - Avoid fetching AI answer if `hasAIAnswer === false`
   - Use enabled condition to prevent wasteful requests

---

## Open Questions & Risks

### Questions

1. **Should AI answer be embedded in getThread() or separate?**
   - Embedded: Faster, simpler, matches existing pattern
   - Separate: More granular cache, smaller payloads
   - **Recommendation:** Embedded (Solution A)

2. **Should endorsements be in AI answer query or separate?**
   - Combined: Simpler API, one request
   - Separate: Better cache granularity (content vs. endorsements)
   - **Recommendation:** Combined (simpler, acceptable performance)

3. **Should ask page preview use React Query cache?**
   - Yes: Consistent with other data fetching
   - No: Preview is ephemeral, doesn't need caching
   - **Recommendation:** Use cache with short stale time (30 seconds)

### Risks

1. **Performance Risk: AI answer generation delay**
   - Mitigation: Show loading state, don't block thread creation
   - Pattern: Thread creates immediately, AI generates async

2. **UX Risk: Stale endorsement counts**
   - Mitigation: Short stale time (30s) or refetchInterval
   - Pattern: Invalidate on mutation success

3. **Complexity Risk: Over-invalidation**
   - Current pattern invalidates all dashboards
   - Mitigation: Target specific user dashboard queries
   - Pattern: `invalidateQueries({ queryKey: queryKeys.studentDashboard(userId) })`

4. **Cache Consistency Risk: Thread list shows AI badge, but AI answer not cached**
   - Mitigation: Thread query includes hasAIAnswer flag
   - Pattern: AI badge reads from thread.hasAIAnswer, not separate query

---

## Recommendations Summary

### Data Fetching
- ✅ Embed AI answer in `getThread()` response (optional field)
- ✅ Use separate `useAIAnswer()` hook only if needed for ask page preview
- ✅ Enable query conditionally: `enabled: !!threadId && thread?.hasAIAnswer`

### Cache Strategy
- ✅ AI content: 10 minutes stale time (immutable)
- ✅ Endorsement counts: 30 seconds stale time (mutable)
- ✅ Ask page preview: 30 seconds stale time (ephemeral)

### Mutations
- ✅ `useEndorseAIAnswer()`: Optimistic update, rollback on error
- ✅ Auto-generate AI answer in `createThread()` mutation
- ✅ Preview generation in `useGenerateAIPreview()` (no save)

### Invalidation
- ✅ Surgical invalidation: `queryKeys.thread(threadId)` after endorsement
- ✅ Targeted dashboard invalidation: `queryKeys.instructorDashboard(userId)`
- ✅ Avoid broad invalidation: Don't use `["studentDashboard"]` alone

### Performance
- ✅ Single request for thread + AI answer (embedded approach)
- ✅ Long stale time for immutable AI content
- ✅ Prevent unnecessary fetches with `enabled` condition
