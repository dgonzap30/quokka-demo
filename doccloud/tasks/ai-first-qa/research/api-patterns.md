# Research: API Patterns for AI Answer System

**Date:** 2025-10-06
**Agent:** Mock API Designer
**Task:** AI-First Question Answering System

---

## Existing API Method Conventions

### Pattern Analysis from `lib/api/client.ts`

#### Method Signatures
- All methods are async and return `Promise<T>`
- Use `async/await` with explicit delay simulation
- Follow camelCase naming (e.g., `getThread`, `createThread`)
- Parameters use typed inputs (e.g., `CreateThreadInput`)
- Author/user IDs passed as separate parameter, not in input object

**Examples:**
```typescript
async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[] } | null>
async createThread(input: CreateThreadInput, authorId: string): Promise<Thread>
async createPost(input: CreatePostInput, authorId: string): Promise<Post>
```

#### Network Delay Patterns
- **Standard operations:** 200-500ms (`delay()` or `delay(200 + Math.random() * 300)`)
- **AI/expensive operations:** 600-800ms (e.g., `getCourseInsights`)
- **Quick actions:** 50-100ms (e.g., `logout`, `markNotificationRead`)
- **New pattern needed:** 800-1200ms for AI answer generation (more expensive than insights)

#### Return Patterns
- Single entities: `Promise<Entity | null>` (null when not found)
- Collections: `Promise<Entity[]>` (empty array when none)
- Mutations: Return the created entity (e.g., `Promise<Thread>`)
- Void operations: `Promise<void>` (e.g., logout, mark read)

#### Error Handling
- No explicit throws in current implementation
- Returns null for missing entities
- AuthResult uses discriminated union (success/error)

---

## Existing Data Model Patterns

### Interface Structure from `lib/models/types.ts`

#### Entity ID Conventions
- String IDs with descriptive prefixes (e.g., `"thread-1"`, `"user-student-1"`)
- Generated IDs use: `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

#### Timestamp Fields
- ISO 8601 strings (e.g., `"2025-10-01T10:30:00Z"`)
- Common fields: `createdAt`, `updatedAt`
- Optional fields marked with `?`

#### Reference Pattern
- Foreign keys as strings (e.g., `authorId: string`, `courseId: string`)
- No embedded objects in base types (flat structure)
- Hydration happens in API layer, not data model

#### Flag/Status Pattern
- Boolean flags: `endorsed: boolean`, `flagged: boolean`, `read: boolean`
- Enums for status: `type ThreadStatus = 'open' | 'answered' | 'resolved'`
- Optional arrays: `tags?: string[]`

#### Existing Post Interface
```typescript
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

**Key Insight:** Post is used for human replies. AIAnswer should be separate type, NOT a Post variant.

---

## React Query Hook Patterns

### Query Key Structure from `lib/api/hooks.ts`

#### Naming Convention
- Hook names: `use<Entity>` (singular) or `use<Entities>` (plural)
- Mutation hooks: `useCreate<Entity>`, `useMark<Action>`

#### Query Key Patterns
```typescript
const queryKeys = {
  currentUser: ["currentUser"] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId ? ["notifications", userId, courseId] as const : ["notifications", userId] as const,
};
```

**Key Pattern:** Arrays with const assertion, hierarchical from broad to specific

#### Invalidation Strategy
- **Mutations invalidate related queries:**
  - `createThread` → invalidates `courseThreads(courseId)` + dashboards
  - `createPost` → invalidates `thread(threadId)` + dashboards
  - Mark notifications → invalidates all `["notifications"]` queries

- **Wildcard invalidation:** Use partial keys to invalidate multiple queries
  ```typescript
  queryClient.invalidateQueries({ queryKey: ["notifications"] }); // All notifications
  ```

#### Cache Configuration
- **staleTime:** How long data is fresh
  - User data: 5 minutes
  - Course data: 10 minutes
  - Thread data: 2 minutes
  - Notifications: 30 seconds (with polling)
  - Dashboards: 2-3 minutes

- **gcTime (garbage collection):** How long unused data stays in cache
  - Usually 2-3x staleTime
  - Min 5 minutes for most queries

#### Enabled Pattern
```typescript
queryFn: () => (threadId ? api.getThread(threadId) : Promise.resolve(null)),
enabled: !!threadId,  // Only run query when threadId exists
```

---

## Mock Data Generation Strategy

### Existing Mock Files Structure

#### Storage Pattern (from `localStore.ts`)
- JSON files in `/mocks/*.json` for seed data
- localStorage keys: `quokkaq.<entity>` (e.g., `quokkaq.threads`)
- Seed runs once per browser (check `quokkaq.initialized`)
- All mutations update localStorage, not JSON files

#### Seed Data Examples

**threads.json:**
```json
{
  "id": "thread-1",
  "courseId": "course-cs101",
  "title": "How does binary search work?",
  "content": "...",
  "authorId": "user-student-1",
  "status": "answered",
  "tags": ["algorithms", "binary-search"],
  "views": 45,
  "createdAt": "2025-10-01T10:30:00Z",
  "updatedAt": "2025-10-01T14:20:00Z"
}
```

**Key Characteristics:**
- 4 seed threads (covering CS101, CS201, MATH221)
- Realistic content (questions students actually ask)
- Mix of statuses (open, answered, resolved)
- Varied view counts (23-67)
- Recent timestamps (Sept-Oct 2025)

---

## Mock Data Requirements for AI Answers

### Citation Data Source
- Need mock course materials (textbooks, lectures, assignments)
- Should reference real-sounding sources:
  - "Lecture 4: Binary Search Trees" (slides)
  - "Textbook Chapter 3.2: Sorting Algorithms"
  - "Assignment 2: Implementing Hash Tables"
  - "Discussion Section 5: Big O Analysis"

### Template Response Strategy
- **By course code prefix:**
  - CS* → Computer Science terminology, code examples
  - MATH* → Mathematical notation, proofs, formulas
  - PHYS* → Physics equations, diagrams

- **By question keywords:**
  - "binary search" → Algorithm explanation + complexity
  - "integration" → Step-by-step math solution
  - "recursion" → Base case + recursive case pattern

- **Confidence scoring factors:**
  - Exact keyword match: 85-95%
  - Related topic: 70-85%
  - General course topic: 60-70%
  - Fallback: 55-60%

### Mock Citation Generation
- Each answer: 3-5 citations
- Mix citation types:
  - 40% Lecture slides
  - 30% Textbook chapters
  - 20% Assignments/labs
  - 10% Discussion sections/office hours

**Example Citation Structure:**
```typescript
{
  id: "cite-1",
  type: "lecture",
  title: "Lecture 4: Binary Search Trees",
  sourceUrl: "/courses/cs101/lectures/4",
  relevanceScore: 0.92,
  excerpt: "Binary search requires sorted data and achieves O(log n) time complexity..."
}
```

---

## Query Invalidation Design

### New Invalidation Triggers

**When AI answer is generated:**
- Invalidate `thread(threadId)` → getThread should return AIAnswer
- Invalidate `courseThreads(courseId)` → Thread cards show hasAIAnswer badge
- Invalidate `courseMetrics(courseId)` → AI coverage % updates
- Invalidate instructor dashboard → AI coverage stat changes

**When AI answer is endorsed:**
- Invalidate `aiAnswer(aiAnswerId)` → Endorsement count updates
- Invalidate `thread(threadId)` → Thread view shows new endorsement
- NO need to invalidate courseThreads (endorsements don't affect list)

### Query Key Design

```typescript
const queryKeys = {
  // Existing keys...
  aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,
  aiAnswerById: (aiAnswerId: string) => ["aiAnswer", "byId", aiAnswerId] as const,
  courseMaterials: (courseId: string) => ["courseMaterials", courseId] as const,
};
```

**Rationale:** AIAnswer tied to thread, so use threadId as primary key

---

## Integration Points with Existing API

### Extend `createThread()` Method
**Current:**
```typescript
async createThread(input: CreateThreadInput, authorId: string): Promise<Thread>
```

**Modified behavior:**
1. Create thread (existing logic)
2. Call `generateAIAnswer(thread)` asynchronously
3. Return thread immediately (don't wait for AI)
4. AI answer generates in background

**Alternative:** Auto-generate synchronously before returning
- Pro: Thread already has AI answer when viewed
- Con: Slower thread creation (800-1200ms delay)
- **Decision:** Synchronous generation (better UX, acceptable delay)

### Extend `getThread()` Method
**Current:**
```typescript
async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[] } | null>
```

**Modified return type:**
```typescript
async getThread(threadId: string): Promise<{
  thread: Thread;
  aiAnswer: AIAnswer | null;
  posts: Post[];
} | null>
```

**Implementation:**
1. Get thread (existing)
2. Get AI answer if `thread.hasAIAnswer === true`
3. Get posts (existing)
4. Return combined object

---

## Mock API Contract Stability

### New Methods (No Breaking Changes)
- `generateAIAnswer(thread: Thread): Promise<AIAnswer>`
- `getAIAnswer(threadId: string): Promise<AIAnswer | null>`
- `endorseAIAnswer(aiAnswerId: string, userId: string, userRole: UserRole): Promise<void>`

### Modified Methods (Backwards Compatible)
- `createThread()` → Same signature, adds side effect (AI generation)
- `getThread()` → Adds `aiAnswer` field to return object, existing fields unchanged

### Thread Model Extension (Backwards Compatible)
```typescript
interface Thread {
  // ... existing fields
  hasAIAnswer?: boolean;      // Optional, defaults to false
  aiAnswerId?: string;        // Optional, only set if hasAIAnswer=true
}
```

---

## Performance Considerations

### Delay Simulation
- **AI generation:** 800-1200ms (realistic LLM latency)
  ```typescript
  await delay(800 + Math.random() * 400);
  ```
- **Get AI answer:** 200-400ms (cache hit simulation)
- **Endorse AI answer:** 100ms (quick action)

### localStorage Impact
- Each AI answer: ~1-2KB (content + citations)
- Expected volume: 1 AI answer per thread
- 100 threads = ~100-200KB (well within 5-10MB limit)

### React Query Cache
- AIAnswer cached separately from Thread
- Independent invalidation (endorsements don't refetch thread)
- 2-minute staleTime (same as threads)

---

## Accessibility Considerations

### AI Answer Prominence
- Must maintain focus order: AI answer before human replies
- Screen readers announce "AI-generated answer" clearly
- Confidence meter has text label, not just visual
- Citations are keyboard accessible

### Endorsement Interaction
- Endorse button has clear label: "Endorse this AI answer"
- Shows current endorsement count before action
- Optimistic update for instant feedback
- Error rollback if endorsement fails

---

## Related Files and Dependencies

### Files to Modify
1. **`lib/models/types.ts`** - Add AIAnswer, Citation, ConfidenceLevel types
2. **`lib/api/client.ts`** - Add generateAIAnswer, getAIAnswer, endorseAIAnswer methods
3. **`lib/api/hooks.ts`** - Add useAIAnswer, useEndorseAIAnswer hooks
4. **`lib/store/localStore.ts`** - Add AI answer storage functions

### Files to Create
1. **`mocks/ai-answers.json`** - Seed AI answers (optional, can generate on-the-fly)
2. **`mocks/course-materials.json`** - Mock citations for AI answers
3. **`lib/utils/ai-templates.ts`** - Template responses by course/topic

### No Changes Needed
- Existing query keys remain stable
- Existing hooks unchanged (no breaking changes)
- Existing components unaffected (new components are isolated)

---

## Key Decisions Summary

1. **AIAnswer is separate from Post** - Different data structure, different UI treatment
2. **Synchronous AI generation in createThread** - Better UX despite 800-1200ms delay
3. **Query key: threadId, not aiAnswerId** - AI answer is 1:1 with thread
4. **Template-based mock responses** - Deterministic, course-aware, keyword-matching
5. **3-5 citations per answer** - Realistic, mix of source types
6. **Confidence 55-95% range** - Always shows some confidence, never 100%
7. **Instructor endorsements worth 3x** - Shows expertise weighting
8. **Backwards compatible extensions** - No breaking changes to existing API

---

## Next Steps for Implementation Plan

1. Define exact TypeScript interfaces (AIAnswer, Citation, ConfidenceLevel)
2. Specify mock data generation algorithm (templates, keywords, scoring)
3. Detail API method implementations (parameters, returns, side effects)
4. Design React Query hooks (keys, invalidation, optimistic updates)
5. Create mock course materials JSON structure
6. Plan localStorage storage strategy for AI answers
