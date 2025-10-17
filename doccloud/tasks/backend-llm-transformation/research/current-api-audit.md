# Current API Audit - Integration Readiness Analysis

**Generated:** 2025-10-16
**Analyst:** Integration Readiness Checker
**Task:** Backend LLM Transformation

---

## Executive Summary

**Overall Readiness Score:** 8.5/10

**Critical Assessment:**
- ✅ **Excellent API abstraction** - Clean separation between UI and data layer
- ✅ **Strong React Query integration** - Proper cache invalidation patterns
- ✅ **Type safety throughout** - Comprehensive TypeScript interfaces
- ⚠️ **Template-based AI** - Needs replacement with real LLM calls
- ⚠️ **Mock data tight coupling** - Some hardcoded patterns need migration
- ✅ **Ready for backend swap** - API client designed for easy migration

**Estimated Migration Timeline:** 8-12 hours (phased implementation)

**Critical Blockers:** None - All blockers are manageable during migration

---

## 1. API Client Architecture Analysis

### 1.1 Current Implementation (`lib/api/client.ts`)

**Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`
**Lines:** 2,081 total
**Complexity:** High (multiple subsystems)

#### API Surface Inventory

| Category | Methods | Status | Migration Complexity |
|----------|---------|--------|---------------------|
| **Authentication** | 5 | ✅ Frontend-only | Low (no changes needed) |
| **Courses** | 8 | ✅ Ready | Low (direct swap) |
| **Threads** | 3 | ⚠️ AI integration | Medium (auto-gen AI) |
| **Posts** | 1 | ✅ Ready | Low (direct swap) |
| **AI Answers** | 4 | ⚠️ Template-based | **HIGH (core transformation)** |
| **Notifications** | 3 | ✅ Ready | Low (direct swap) |
| **Dashboards** | 2 | ✅ Ready | Medium (aggregation) |
| **Instructor** | 8 | ✅ Ready | Low-Medium (analytics) |
| **Course Materials** | 2 | ✅ Ready | Low (direct swap) |

**Total Methods:** 36 API methods

#### Critical Dependencies for LLM Integration

**Methods Requiring LLM Integration:**

1. **`generateAIResponse()` (lines 438-486)**
   - **Current:** Template keyword matching (CS_TEMPLATES, MATH_TEMPLATES)
   - **Target:** Real LLM API call with course material context
   - **Breaking Change:** No (internal implementation only)
   - **Complexity:** High

2. **`generateAIResponseWithMaterials()` (lines 494-579)**
   - **Current:** Template + course material citations (hybrid)
   - **Target:** LLM with RAG (Retrieval-Augmented Generation)
   - **Breaking Change:** No (already uses CourseMaterial)
   - **Complexity:** High
   - **Status:** ✅ **EXCELLENT** - Already fetches course materials!

3. **`generateAIAnswer()` (lines 1512-1560)**
   - **Current:** Calls `generateAIResponseWithMaterials()`
   - **Target:** Keep wrapper, update underlying generator
   - **Breaking Change:** No
   - **Complexity:** Low (just update call)

4. **`generateAIPreview()` (lines 1566-1602)**
   - **Current:** Same as `generateAIAnswer()` but doesn't save
   - **Target:** Same LLM call pattern, no persistence
   - **Breaking Change:** No
   - **Complexity:** Low (reuse logic)

### 1.2 Helper Functions Analysis

**Template System (lines 268-433):**

| Function | Purpose | Status | Migration Plan |
|----------|---------|--------|----------------|
| `extractKeywords()` | Extract keywords from text | ✅ Keep | Use for LLM context ranking |
| `calculateMatchRatio()` | Match question to template | ❌ Remove | Replace with LLM semantic matching |
| `generateExcerpt()` | Create material excerpts | ✅ Keep | Use for LLM citations |
| `generateSnippet()` | Search result snippets | ✅ Keep | Use for material search |
| `generateCitations()` | Hardcoded citations | ❌ Remove | LLM generates from materials |
| `mapMaterialTypeToCitationType()` | Type conversion | ✅ Keep | Still needed for citations |
| `getConfidenceLevel()` | Score → level | ✅ Keep | LLM can output scores |

**Key Insight:** 60% of helper functions are reusable! Only template matching logic needs replacement.

### 1.3 Data Flow Patterns

**Current Flow (Template-Based):**
```
User Question
   ↓
extractKeywords()
   ↓
calculateMatchRatio() → Find best template
   ↓
getCourseMaterials() → Fetch materials
   ↓
Score materials by keyword match
   ↓
generateCitations() → Create Citation[]
   ↓
Return AIAnswer
```

**Target Flow (LLM-Based):**
```
User Question
   ↓
getCourseMaterials() → Fetch materials
   ↓
Build LLM context (materials + question)
   ↓
LLM API Call (OpenAI/Anthropic)
   ↓
Parse LLM response → Extract citations
   ↓
Map to Citation[] type
   ↓
Return AIAnswer
```

**Breaking Changes:** ❌ None - Same input/output signature

---

## 2. React Query Hooks Analysis

### 2.1 Current Implementation (`lib/api/hooks.ts`)

**Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`
**Lines:** 827 total
**Hook Count:** 27 hooks (queries + mutations)

#### Hook Inventory

| Hook | Type | Invalidation Pattern | LLM Integration | Risk |
|------|------|---------------------|-----------------|------|
| `useCurrentUser()` | Query | Auth-based | No | None |
| `useSession()` | Query | Auth-based | No | None |
| `useLogin()` | Mutation | Invalidates user | No | None |
| `useSignup()` | Mutation | Invalidates user | No | None |
| `useLogout()` | Mutation | Invalidates all | No | None |
| `useCourses()` | Query | Long staleTime | No | None |
| `useUserCourses()` | Query | User-scoped | No | None |
| `useCourse()` | Query | Long staleTime | No | None |
| `useCourseThreads()` | Query | 2min staleTime | **Yes (AI answers)** | Low |
| `useCourseMetrics()` | Query | 5min staleTime | No | None |
| `useCourseInsights()` | Query | 5min staleTime | No | None |
| `useCourseMaterials()` | Query | 10min staleTime | **Yes (LLM context)** | None |
| `useMultiCourseMaterials()` | Query | Parallel fetch | **Yes (multi-course)** | Low |
| `useSearchCourseMaterials()` | Query | 2min staleTime | **Yes (semantic search)** | Medium |
| `useNotifications()` | Query | 30s + polling | No | None |
| `useMarkNotificationRead()` | Mutation | Invalidates notifs | No | None |
| `useMarkAllNotificationsRead()` | Mutation | Invalidates notifs | No | None |
| `useThread()` | Query | 2min staleTime | **Yes (AI answer embedded)** | Low |
| **`useCreateThread()`** | Mutation | **AI auto-gen** | **Yes (CRITICAL)** | **HIGH** |
| `useCreatePost()` | Mutation | Invalidates thread | No | None |
| `useStudentDashboard()` | Query | 2min staleTime | No | None |
| `useInstructorDashboard()` | Query | 3min staleTime | No | None |
| `useAIAnswer()` | Query | 10min staleTime | **Yes (optional)** | None |
| **`useGenerateAIPreview()`** | Mutation | **Ask page** | **Yes (CRITICAL)** | **HIGH** |
| **`useEndorseAIAnswer()`** | Mutation | Optimistic updates | Yes | Low |
| `useInstructorInsights()` | Query | 1min staleTime | Yes (AI flags) | Low |
| `useFrequentlyAskedQuestions()` | Query | 5min staleTime | Yes (clustering) | Medium |
| `useTrendingTopics()` | Query | 10min staleTime | No | None |
| `useSearchQuestions()` | Query | 2min staleTime | **Potential (semantic)** | Medium |
| `useBulkEndorseAIAnswers()` | Mutation | Bulk invalidation | Yes | Low |
| `useSaveResponseTemplate()` | Mutation | Optimistic | No | None |
| `useDeleteResponseTemplate()` | Mutation | Optimistic | No | None |

**Total LLM-Affected Hooks:** 12 out of 27 (44%)

### 2.2 Critical LLM Integration Points

#### **HIGH RISK: `useCreateThread()` (lines 362-389)**

**Current Behavior:**
```typescript
onSuccess: (result) => {
  const { thread, aiAnswer } = result; // AI answer generated automatically

  // Pre-populate cache with AI answer
  if (aiAnswer) {
    queryClient.setQueryData(queryKeys.thread(thread.id), {
      thread,
      posts: [],
      aiAnswer,
    });
  }
}
```

**Issues:**
- ❌ AI generation is **synchronous** with thread creation
- ❌ Fails gracefully but no retry mechanism
- ❌ LLM latency (800-1200ms mock → 1-3s real) may break UX

**Migration Strategy:**
1. **Option A (Async):** Return thread immediately, generate AI in background
2. **Option B (Streaming):** Stream AI response to client as it generates
3. **Option C (Queue):** Add to generation queue, poll for completion

**Recommended:** Option A with optimistic cache update

**Breaking Change:** ⚠️ Potential - API response changes if async

#### **HIGH RISK: `useGenerateAIPreview()` (lines 468-479)**

**Current Behavior:**
- Mutation returns full `AIAnswer` object
- 30-second cache (lines 474-476)
- Used in ask page for live preview

**Issues:**
- ❌ Real LLM calls are expensive (can't cache 30s)
- ❌ No debouncing for rapid edits
- ❌ No streaming support

**Migration Strategy:**
- Add debouncing (500ms)
- Reduce cache to 5-10s
- Consider streaming for better UX
- Add cost tracking

**Breaking Change:** ❌ None (same API shape)

#### **MEDIUM RISK: `useSearchCourseMaterials()` (lines 278-288)**

**Current:** Keyword matching
**Target:** Semantic search with embeddings (future)

**Current Implementation:**
```typescript
queryFn: () => input ? api.searchCourseMaterials(input) : Promise.resolve([]),
enabled: !!input && input.query.length >= 3,
staleTime: 2 * 60 * 1000, // 2 minutes
```

**Issues:**
- ✅ Already designed for async search
- ⚠️ No semantic search yet (context says "defer to v2")
- ✅ Proper debouncing via enabled condition

**Migration Strategy:**
- Phase 1: Keep keyword search (no changes)
- Phase 2: Add vector embeddings backend
- Phase 3: Swap to semantic search

**Breaking Change:** ❌ None

### 2.3 Cache Invalidation Patterns

**Excellent Patterns Found:**

1. **Granular Invalidation:**
```typescript
// Only invalidate affected course threads
queryClient.invalidateQueries({
  queryKey: queryKeys.courseThreads(thread.courseId)
});
```

2. **Optimistic Updates with Rollback:**
```typescript
onMutate: async ({ aiAnswerId, userId, isInstructor }) => {
  await queryClient.cancelQueries({ queryKey });
  const previousThread = queryClient.getQueryData(queryKey);

  // Optimistic update
  queryClient.setQueryData(queryKey, (old) => ({ ...old, /* updates */ }));

  return { previousThread, threadId }; // Rollback context
},
onError: (err, variables, context) => {
  queryClient.setQueryData(
    queryKeys.thread(context.threadId),
    context.previousThread
  );
},
```

3. **Pre-population:**
```typescript
// Pre-populate thread cache after creation
queryClient.setQueryData(queryKeys.thread(thread.id), {
  thread,
  posts: [],
  aiAnswer,
});
```

**Risk Assessment:** ✅ **LOW** - Patterns are production-ready

---

## 3. Type Safety Analysis

### 3.1 Current Types (`lib/models/types.ts`)

**Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`
**Lines:** 1,722 total
**Type Count:** 80+ interfaces/types

#### AI-Related Types Inventory

| Type | Purpose | Backend-Ready | Notes |
|------|---------|---------------|-------|
| `AIAnswer` | AI response structure | ✅ Yes | Complete type definition |
| `Citation` | Material citations | ✅ Yes | Maps to CourseMaterial |
| `ConfidenceLevel` | AI confidence | ✅ Yes | 'high' \| 'medium' \| 'low' |
| `GenerateAIAnswerInput` | AI generation input | ✅ Yes | All fields needed for LLM |
| `EndorseAIAnswerInput` | Endorsement | ✅ Yes | No changes needed |
| `CourseMaterial` | Material structure | ✅ Yes | **Perfect for RAG** |
| `CourseMaterialType` | Material categories | ✅ Yes | Maps to citation types |
| `MaterialReference` | Lightweight ref | ✅ Yes | Optional alternative |
| `AIContext` | Context tracking | ✅ Yes | Multi-course support |
| `EnhancedAIResponse` | Extended response | ⚠️ Unused | Consider for LLM |
| `Message` | Conversation | ⚠️ New feature | For conversation storage |
| `SearchCourseMaterialsInput` | Material search | ✅ Yes | Ready for semantic |

#### Type Gaps for LLM Integration

**Missing Types (Need to Add):**

1. **LLM Provider Interface:**
```typescript
interface LLMProvider {
  generateAnswer(input: LLMGenerateInput): Promise<LLMResponse>;
  estimateTokens(text: string): number;
  maxContextTokens: number;
  model: string;
}
```

2. **LLM Request/Response:**
```typescript
interface LLMGenerateInput {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: 'stop' | 'length' | 'error';
  citations?: Citation[];
}
```

3. **Conversation Storage:**
```typescript
interface AIConversation {
  id: string;
  userId: string;
  courseId?: string;
  messages: Message[];
  metadata: ConversationMetadata;
  createdAt: string;
  updatedAt: string;
}
```

4. **Context Builder:**
```typescript
interface CourseContext {
  courseId: string;
  courseName: string;
  materials: CourseMaterial[];
  totalTokens: number;
  relevanceScores: Map<string, number>;
}
```

**Existing Types to Extend:**

1. **`AIAnswer` Enhancement:**
```typescript
interface AIAnswer {
  // ... existing fields ...

  // NEW: LLM metadata
  llmProvider?: 'openai' | 'anthropic';
  llmModel?: string;
  tokensUsed?: number;
  generationTime?: number; // milliseconds
  contextMaterialIds?: string[]; // Track which materials were used
}
```

2. **`GenerateAIAnswerInput` Enhancement:**
```typescript
interface GenerateAIAnswerInput {
  // ... existing fields ...

  // NEW: Optional conversation context
  conversationHistory?: Message[];
  // NEW: Multi-course flag
  enableMultiCourse?: boolean;
}
```

### 3.2 Type Safety Score

**Overall Type Safety:** 9.5/10

**Strengths:**
- ✅ Comprehensive type coverage
- ✅ Type guards for validation
- ✅ Strict TypeScript mode
- ✅ No `any` types in core logic
- ✅ Union types for discriminated unions

**Gaps:**
- ⚠️ Missing LLM-specific types (easy to add)
- ⚠️ No conversation storage types (defined in types.ts but unused)
- ✅ Material types are perfect for RAG

**Breaking Changes for Types:** ❌ None (only additions)

---

## 4. Local Store Analysis

### 4.1 Current Implementation (`lib/store/localStore.ts`)

**Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`
**Lines:** 662 total
**Storage Keys:** 11 localStorage keys

#### Storage Structure

| Key | Type | Size Estimate | LLM Impact |
|-----|------|---------------|------------|
| `quokkaq.users` | User[] | ~4KB | None |
| `quokkaq.authSession` | AuthSession | ~1KB | None |
| `quokkaq.courses` | Course[] | ~2KB | None |
| `quokkaq.enrollments` | Enrollment[] | ~9KB | None |
| `quokkaq.threads` | Thread[] | ~26KB | **AI answer IDs** |
| `quokkaq.posts` | Post[] | ~42KB | None |
| `quokkaq.notifications` | Notification[] | ~10KB | None |
| **`quokkaq.aiAnswers`** | AIAnswer[] | ~77KB | **CORE DATA** |
| `quokkaq.responseTemplates` | ResponseTemplate[] | Variable | None |
| `quokkaq.assignments` | Assignment[] | ~1KB | None |
| **`quokkaq.courseMaterials`** | CourseMaterial[] | ~39KB | **LLM CONTEXT** |
| `quokkaq.seedVersion` | string | <1KB | None |

**Total Storage:** ~211KB (well under 5-10MB localStorage limit)

#### Critical LLM Data Stores

**1. AI Answers Storage (lines 444-497)**

```typescript
export function getAIAnswers(): AIAnswer[]
export function getAIAnswerByThread(threadId: string): AIAnswer | null
export function getAIAnswerById(aiAnswerId: string): AIAnswer | null
export function addAIAnswer(aiAnswer: AIAnswer): void
export function updateAIAnswer(aiAnswerId: string, updates: Partial<AIAnswer>): void
```

**Status:** ✅ **Production-ready**

**Assessment:**
- ✅ CRUD operations complete
- ✅ Proper indexing (by ID and threadId)
- ✅ Type-safe updates
- ⚠️ No conversation storage yet (need to add)

**2. Course Materials Storage (lines 632-662)**

```typescript
export function getCourseMaterials(): CourseMaterial[]
export function getCourseMaterialsByCourse(courseId: string): CourseMaterial[]
export function getCourseMaterialById(materialId: string): CourseMaterial | null
```

**Status:** ✅ **Perfect for RAG**

**Assessment:**
- ✅ All materials pre-loaded (39KB)
- ✅ Indexed by course
- ✅ Full content available for LLM context
- ✅ Keywords pre-computed
- ✅ Metadata structure supports extensibility

**Mock Data Quality:**

Sample from `mocks/course-materials.json`:
```json
{
  "id": "mat-cs101-lecture-3",
  "courseId": "course-cs101",
  "type": "lecture",
  "title": "Lecture 3: Binary Search and Divide-and-Conquer",
  "content": "Binary search is an efficient algorithm for finding a target value in a sorted array. It uses the divide-and-conquer strategy to repeatedly halve the search space.\n\nHow binary search works:\n1. Start with the middle element of the sorted array\n2. If the target equals the middle element, return its position\n3. If the target is less than the middle element, search the left half\n4. If the target is greater than the middle element, search the right half\n5. Repeat until the target is found or the search space is empty\n\nTime complexity: O(log n) - much faster than linear search O(n) for large datasets\nSpace complexity: O(1) for iterative implementation, O(log n) for recursive (due to call stack)\n\nKey requirement: The array MUST be sorted first. If unsorted, you need to sort it first (O(n log n)) or use linear search.\n\nDivide-and-conquer is a powerful algorithmic paradigm where you:\n1. Divide the problem into smaller subproblems\n2. Conquer each subproblem recursively\n3. Combine solutions to solve the original problem\n\nBinary search is a simple example. More complex examples include merge sort, quicksort, and the FFT algorithm. This strategy often leads to efficient O(n log n) or O(log n) algorithms.",
  "keywords": ["binary search", "divide and conquer", "sorted array", "logarithmic", "efficiency", "search algorithm"],
  "metadata": {
    "week": 2,
    "date": "2025-09-09T10:00:00Z",
    "authorId": "user-instructor-1"
  }
}
```

**Quality Assessment:**
- ✅ Rich, detailed content (500-2000 chars per material)
- ✅ Well-structured keywords
- ✅ Multiple material types (lecture, slide, assignment, reading, lab, textbook)
- ✅ 18 materials for CS101, 18 for MATH221
- ✅ **Perfect for LLM context building**

### 4.2 Missing Storage for LLM Features

**Need to Add:**

1. **Conversation Storage:**
```typescript
export function getConversations(): AIConversation[]
export function getConversationsByUser(userId: string): AIConversation[]
export function addConversation(conversation: AIConversation): void
export function updateConversation(id: string, updates: Partial<AIConversation>): void
export function deleteConversation(id: string): void
```

2. **Context Cache Storage (Optional):**
```typescript
export function getCachedContext(courseId: string): CourseContext | null
export function setCachedContext(courseId: string, context: CourseContext): void
export function clearContextCache(): void
```

**Estimated Additional Storage:** 50-100KB for conversations

**Risk:** ✅ None - localStorage has plenty of headroom

---

## 5. Mock Data Integrity

### 5.1 Seed Data Analysis

**Seed Version:** `v2.1.0` (line 17)
**Seeding Strategy:** Idempotent (checks version before re-seed)

**Files:**
- `mocks/users.json` (3.8KB)
- `mocks/courses.json` (2.2KB)
- `mocks/enrollments.json` (8.9KB)
- `mocks/threads.json` (26KB)
- `mocks/posts.json` (42KB)
- `mocks/notifications.json` (10KB)
- `mocks/ai-answers.json` (77KB)
- `mocks/assignments.json` (1KB)
- **`mocks/course-materials.json` (39KB)** ← **Critical for LLM**

**Total Mock Data:** ~211KB

### 5.2 Template System Dependency Analysis

**Current Template Dependencies:**

| File | Dependency | Migration Plan |
|------|------------|----------------|
| `lib/api/client.ts` | CS_TEMPLATES (lines 268-352) | ❌ Remove - Replace with LLM |
| `lib/api/client.ts` | MATH_TEMPLATES (lines 357-410) | ❌ Remove - Replace with LLM |
| `lib/api/client.ts` | GENERAL_TEMPLATE (lines 415-433) | ❌ Remove - Fallback handled by LLM |
| `lib/api/client.ts` | `generateAIResponse()` | ⚠️ Refactor - Keep signature, replace logic |
| `lib/api/client.ts` | `generateCitations()` (lines 222-263) | ❌ Remove - LLM generates citations |
| `lib/api/client.ts` | `calculateMatchRatio()` | ❌ Remove - LLM does semantic matching |

**Hardcoded Material Citations (lines 223-238):**
```typescript
const courseMaterials: Record<string, Array<{ source: string; type: string; keywords: string[] }>> = {
  CS: [
    { source: "Lecture 5: Binary Search & Sorting Algorithms", type: "lecture", keywords: [...] },
    { source: "Introduction to Algorithms (CLRS) - Chapter 3", type: "textbook", keywords: [...] },
    // ... more hardcoded citations
  ],
  MATH: [ /* ... */ ]
};
```

**Status:** ⚠️ **MUST REMOVE** - Replaced by `getCourseMaterials()` (already implemented!)

**Breaking Change:** ❌ None - Internal implementation detail

### 5.3 Data Consistency Guarantees

**Referential Integrity:**

✅ **GOOD:** Threads reference AI answers via `aiAnswerId`
```typescript
interface Thread {
  hasAIAnswer?: boolean;
  aiAnswerId?: string;
}
```

✅ **GOOD:** AI answers reference threads via `threadId`
```typescript
interface AIAnswer {
  threadId: string;
  courseId: string;
}
```

✅ **GOOD:** Citations can reference materials via `id` (future enhancement)

**Orphaned Data Risk:** ❌ None - localStorage cleanup is simple

---

## 6. Component Dependencies

### 6.1 Frontend Component Analysis

**Components Using AI Answers:**

1. **Thread Detail Page** (`app/threads/[id]/page.tsx`)
   - Expects: `{ thread, posts, aiAnswer }`
   - **Breaking Change:** ❌ None (API returns same shape)

2. **Ask Page** (`app/ask/page.tsx`)
   - Uses: `useGenerateAIPreview()`
   - **Breaking Change:** ❌ None (same mutation signature)

3. **Course Threads List** (component TBD)
   - Uses: `useCourseThreads()` → `ThreadWithAIAnswer[]`
   - **Breaking Change:** ❌ None (type includes `aiAnswer?`)

4. **AI Answer Card** (`components/ai-answer-card.tsx`)
   - Props: `AIAnswer` type
   - **Breaking Change:** ❌ None (type is stable)

**Total Components:** ~4-6 components directly use AI data

**Risk Assessment:** ✅ **VERY LOW** - Components consume types, not implementation

### 6.2 Loading State Patterns

**Current Patterns:**

```typescript
const { data: thread, isLoading, error } = useThread(threadId);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!thread) return <NotFound />;

return <ThreadContent thread={thread} />;
```

**LLM Considerations:**

- ⚠️ LLM latency is longer (1-3s vs 200-500ms mock)
- ✅ Loading states already implemented
- ⚠️ Consider streaming UI for better UX
- ⚠️ Consider optimistic updates for AI generation

**Migration Impact:** ⚠️ **MEDIUM** - Need to handle longer waits gracefully

### 6.3 Error Handling Coverage

**Current Error Handling:**

1. **React Query Error Boundaries:** ✅ Implemented
2. **Graceful Degradation:** ✅ Returns `null` on failure
3. **Error Messages:** ✅ User-friendly via React Query
4. **Retry Logic:** ⚠️ Not implemented (React Query default)

**LLM-Specific Error Handling Needed:**

```typescript
// Need to add error types:
type LLMError =
  | { type: 'rate_limit'; retryAfter: number }
  | { type: 'context_too_long'; maxTokens: number }
  | { type: 'provider_error'; provider: string; message: string }
  | { type: 'timeout'; duration: number };
```

**Risk:** ⚠️ **MEDIUM** - Need comprehensive LLM error handling

---

## 7. Performance Implications

### 7.1 Current Performance Baselines

**Mock API Delays:**

| Operation | Current Delay | Real LLM Estimate | Impact |
|-----------|---------------|-------------------|--------|
| `getThread()` | 200-500ms | 200-500ms | ✅ No change |
| `createThread()` | 400-600ms | 400-600ms (thread only) | ✅ No change |
| **AI Generation** | **800-1200ms** | **1500-3000ms** | ⚠️ **2-3x slower** |
| `generateAIPreview()` | 800-1200ms | 1500-3000ms | ⚠️ **2-3x slower** |
| `getCourseMaterials()` | 200-500ms | 200-500ms | ✅ No change |
| `searchCourseMaterials()` | 200-300ms | 200-300ms (keyword) | ✅ No change |

**Critical Performance Issues:**

1. **AI Generation Latency:**
   - Mock: 800-1200ms (simulated)
   - OpenAI GPT-4o-mini: 1-2s typical
   - Anthropic Claude 3 Haiku: 1-3s typical
   - **Mitigation:** Async generation, streaming, optimistic updates

2. **Context Building Overhead:**
   - Current: Fetches materials from localStorage (<10ms)
   - LLM: Must build context string (50-100ms)
   - Token counting (10-20ms)
   - **Total Overhead:** +60-120ms (acceptable)

3. **Rate Limiting:**
   - OpenAI: 500 RPM (requests per minute) for GPT-4o-mini
   - Anthropic: 50 RPM for Claude 3 Haiku (free tier)
   - **Mitigation:** Request queuing, exponential backoff

### 7.2 Cache Strategy Implications

**Current React Query Cache:**

| Query | Stale Time | GC Time | LLM Impact |
|-------|------------|---------|------------|
| `courseMaterials` | 10min | 15min | ✅ Perfect (static data) |
| `thread` | 2min | 5min | ✅ Good (AI answer cached) |
| `courseThreads` | 2min | 5min | ✅ Good |
| `aiAnswer` | 10min | 15min | ✅ Perfect (immutable) |
| `aiPreview` | 30s | — | ⚠️ **Too long** (expensive LLM calls) |

**Cache Adjustments Needed:**

1. **AI Preview:** Reduce to 5-10s (line 476)
2. **Add debouncing:** 500ms for preview input
3. **Cost tracking:** Log cache hits to monitor savings

**Bundle Size Impact:**

- OpenAI SDK: ~50KB gzipped
- Anthropic SDK: ~30KB gzipped
- Code splitting: Load only on ask/thread pages
- **Total Increase:** ~50-80KB per route (under 200KB limit)

---

## 8. Migration Risk Assessment

### 8.1 High-Risk Areas

| Area | Risk Level | Impact | Mitigation |
|------|-----------|--------|------------|
| **AI Generation Latency** | 🔴 HIGH | UX degradation | Async generation, streaming, optimistic updates |
| **LLM Rate Limits** | 🔴 HIGH | Service unavailable | Queue, exponential backoff, fallback provider |
| **Context Size Limits** | 🟡 MEDIUM | Truncation errors | Token counting, material ranking, graceful degradation |
| **Cost Overruns** | 🟡 MEDIUM | Budget impact | Request throttling, cache aggressively, monitoring |
| **Template→LLM Quality** | 🟡 MEDIUM | Answer quality | Prompt engineering, testing, confidence scoring |
| **Type Mismatches** | 🟢 LOW | TypeScript errors | Add missing types, validate responses |
| **Cache Invalidation** | 🟢 LOW | Stale data | Existing patterns are solid |
| **Frontend Breaking Changes** | 🟢 LOW | UI breaks | None expected (API contracts stable) |

### 8.2 Zero-Breaking-Change Validation

**API Contracts Stability Check:**

✅ **`getThread(threadId)`**
- Returns: `{ thread: Thread; posts: Post[]; aiAnswer: AIAnswer | null }`
- Change: ❌ None (implementation only)

✅ **`createThread(input, authorId)`**
- Returns: `{ thread: Thread; aiAnswer: AIAnswer | null }`
- Change: ⚠️ May return `null` if async generation enabled
- Fix: Document that AI answer may be delayed

✅ **`generateAIAnswer(input)`**
- Returns: `AIAnswer`
- Change: ❌ None (internal generation logic swapped)

✅ **`generateAIPreview(input)`**
- Returns: `AIAnswer`
- Change: ❌ None (same return type)

✅ **`getCourseMaterials(courseId)`**
- Returns: `CourseMaterial[]`
- Change: ❌ None (already implemented and used)

**Conclusion:** ✅ **ZERO BREAKING CHANGES** if implementation is careful

### 8.3 Rollback Procedures

**Rollback Strategy:**

1. **Feature Flag:**
```typescript
const USE_LLM = process.env.NEXT_PUBLIC_USE_LLM === 'true';

async function generateAIResponse(...) {
  if (USE_LLM) {
    return await generateWithLLM(...);
  } else {
    return generateWithTemplates(...); // Fallback
  }
}
```

2. **Provider Fallback:**
```typescript
try {
  return await openAIProvider.generateAnswer(input);
} catch (error) {
  console.warn('OpenAI failed, falling back to Anthropic');
  return await anthropicProvider.generateAnswer(input);
}
```

3. **Template Fallback:**
```typescript
try {
  return await llmProvider.generateAnswer(input);
} catch (error) {
  console.error('LLM failed, using template fallback', error);
  return generateAIResponse(courseCode, title, content, tags); // Old template logic
}
```

**Rollback Triggers:**

- LLM error rate >10% for 5 minutes
- Response time >5s consistently
- Rate limit errors >5% of requests
- Cost overrun >$100/day

---

## 9. Dependencies on External Systems

### 9.1 Mock Data Sources

**Current Mock Files:**

| File | Size | Purpose | LLM Dependency |
|------|------|---------|----------------|
| `mocks/users.json` | 3.8KB | User accounts | None |
| `mocks/courses.json` | 2.2KB | Course catalog | None |
| `mocks/enrollments.json` | 8.9KB | User-course links | None |
| `mocks/threads.json` | 26KB | Q&A threads | AI answer IDs |
| `mocks/posts.json` | 42KB | Thread replies | None |
| `mocks/notifications.json` | 10KB | User notifications | None |
| **`mocks/ai-answers.json`** | **77KB** | **AI answers** | **REPLACED BY LLM** |
| `mocks/assignments.json` | 1KB | Assignment deadlines | None |
| **`mocks/course-materials.json`** | **39KB** | **LLM context** | **CRITICAL** |

**Migration Impact:**

1. **`ai-answers.json`:**
   - ❌ **DELETE** after LLM migration
   - Used only for initial seed data
   - LLM will generate new answers

2. **`course-materials.json`:**
   - ✅ **KEEP** - Critical for LLM context
   - Well-structured, rich content
   - May expand with more materials

### 9.2 Frontend-Only Constraints

**Current Architecture:**

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                 │
│  ┌────────────────────────────────────┐ │
│  │       Components (React)           │ │
│  └────────────────────────────────────┘ │
│               ↓                          │
│  ┌────────────────────────────────────┐ │
│  │    React Query Hooks               │ │
│  └────────────────────────────────────┘ │
│               ↓                          │
│  ┌────────────────────────────────────┐ │
│  │       API Client Layer             │ │
│  └────────────────────────────────────┘ │
│               ↓                          │
│  ┌────────────────────────────────────┐ │
│  │    localStorage (Mock Data)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**LLM Integration (Still Frontend-Only):**

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                 │
│  ┌────────────────────────────────────┐ │
│  │       Components (React)           │ │
│  └────────────────────────────────────┘ │
│               ↓                          │
│  ┌────────────────────────────────────┐ │
│  │    React Query Hooks               │ │
│  └────────────────────────────────────┘ │
│               ↓                          │
│  ┌────────────────────────────────────┐ │
│  │       API Client Layer             │ │
│  │  ┌──────────────┬───────────────┐  │ │
│  │  │ LLM Provider │ Context       │  │ │
│  │  │ (OpenAI/     │ Builder       │  │ │
│  │  │ Anthropic)   │               │  │ │
│  │  └──────────────┴───────────────┘  │ │
│  └────────────────────────────────────┘ │
│               ↓                          │
│  ┌────────────────────────────────────┐ │
│  │    localStorage (Mock Data +       │ │
│  │    Conversations)                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 ↓
         External LLM APIs
     (OpenAI, Anthropic via CORS)
```

**Constraints:**

✅ **Maintained:**
- Frontend-only architecture
- No backend required
- localStorage persistence
- Client-side routing

⚠️ **New Dependencies:**
- LLM API keys (client-side) - **SECURITY RISK** in production
- CORS for LLM API calls
- Browser environment variables

🔴 **Security Warning:**

```typescript
// ❌ NEVER expose API keys in client-side code for production
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// ✅ DEMO ONLY: Use placeholder keys, warn users
if (OPENAI_API_KEY?.includes('demo')) {
  console.warn('Using demo API key - replace with your own for production');
}
```

**Recommendation:** Document clearly that this is a **demo architecture** and production must move API calls to backend (Next.js API routes or separate backend).

---

## 10. Breaking Changes Catalog

### 10.1 Identified Breaking Changes

**SUMMARY:** ✅ **ZERO BREAKING CHANGES** to public API surface

### 10.2 Potential Compatibility Issues

| Issue | Severity | Workaround |
|-------|----------|------------|
| **AI generation slower** | 🟡 MEDIUM | Add loading states, streaming |
| **Preview cache shorter** | 🟢 LOW | Debounce input, reduce staleTime |
| **New env variables required** | 🟢 LOW | Document in README, provide defaults |
| **Bundle size increase** | 🟢 LOW | Code splitting, lazy loading |
| **Client-side API keys** | 🔴 HIGH | Document security warning |

### 10.3 Migration Checklist

**Pre-Migration:**
- [ ] Add LLM provider types to `lib/models/types.ts`
- [ ] Create `lib/llm/` directory structure
- [ ] Add environment variables to `.env.local`
- [ ] Update README with setup instructions

**Migration Phase 1: LLM Layer (No Breaking Changes)**
- [ ] Implement `lib/llm/provider.ts` interface
- [ ] Implement `lib/llm/openai.ts` provider
- [ ] Implement `lib/llm/anthropic.ts` provider
- [ ] Implement `lib/llm/prompts.ts` utilities
- [ ] Add unit tests for LLM providers

**Migration Phase 2: Context System (No Breaking Changes)**
- [ ] Implement `lib/context/builder.ts` (course context)
- [ ] Implement `lib/context/detector.ts` (course auto-detection)
- [ ] Implement `lib/context/ranking.ts` (material relevance)
- [ ] Test context building with real course materials

**Migration Phase 3: API Client Integration (Internal Changes)**
- [ ] Update `generateAIResponseWithMaterials()` to use LLM
- [ ] Keep same function signature (no breaking change)
- [ ] Add feature flag for LLM vs template
- [ ] Test with both providers

**Migration Phase 4: Conversation Storage (New Feature)**
- [ ] Add conversation types to `lib/models/types.ts`
- [ ] Add conversation storage to `lib/store/localStore.ts`
- [ ] Add conversation hooks to `lib/api/hooks.ts`
- [ ] No breaking changes (new feature only)

**Migration Phase 5: Testing & Validation**
- [ ] Test all affected hooks with real LLM
- [ ] Verify zero breaking changes to components
- [ ] Performance testing (latency, cost)
- [ ] Error handling testing

**Migration Phase 6: Documentation**
- [ ] Update README with LLM setup
- [ ] Document environment variables
- [ ] Add security warnings
- [ ] Update CLAUDE.md with LLM patterns

---

## 11. Summary & Recommendations

### 11.1 Readiness Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| **API Abstraction** | 9.5/10 | Excellent separation, clean interfaces |
| **Type Safety** | 9.5/10 | Comprehensive types, minor additions needed |
| **React Query Integration** | 9.0/10 | Solid patterns, cache strategies good |
| **Mock Data Quality** | 9.0/10 | Course materials perfect for RAG |
| **Component Decoupling** | 9.5/10 | Components consume types, not implementation |
| **Error Handling** | 7.5/10 | Good foundation, need LLM-specific errors |
| **Performance Readiness** | 7.0/10 | Need async patterns, streaming consideration |
| **Migration Ease** | 9.0/10 | Well-architected for backend swap |
| **Security Posture** | 6.0/10 | Client-side API keys are demo-only |

**Overall Readiness:** **8.5/10** ✅

### 11.2 Critical Path

**Recommended Migration Order:**

1. **Week 1: LLM Provider Layer** (8 hours)
   - Implement `lib/llm/` subsystem
   - Test OpenAI and Anthropic providers
   - Add error handling and retry logic

2. **Week 2: Context System** (6 hours)
   - Build course context builder
   - Implement material ranking
   - Test with course materials

3. **Week 3: API Integration** (8 hours)
   - Update `generateAIResponseWithMaterials()`
   - Add feature flag for A/B testing
   - Comprehensive testing

4. **Week 4: Conversation Storage** (4 hours)
   - Add conversation types and storage
   - Implement new hooks
   - Test conversation flows

5. **Week 5: Polish & Documentation** (4 hours)
   - Performance tuning
   - Error handling refinement
   - Documentation updates

**Total Estimated Time:** 30 hours over 5 weeks

### 11.3 Go/No-Go Decision

**GO ✅**

**Reasons:**
1. ✅ Zero breaking changes to public API
2. ✅ Excellent abstraction already in place
3. ✅ Course materials ready for LLM context
4. ✅ Type system extensible
5. ✅ Clear migration path
6. ✅ Rollback strategy defined

**Risks (Manageable):**
1. ⚠️ LLM latency - mitigate with async + streaming
2. ⚠️ Rate limits - mitigate with queuing + fallback
3. ⚠️ Cost - mitigate with caching + monitoring
4. 🔴 Client-side keys - document as demo-only

**Recommendation:** **PROCEED** with phased migration using feature flags.

---

## 12. Next Steps

1. **Immediate:**
   - Review this audit with stakeholders
   - Get approval for LLM provider choice (OpenAI vs Anthropic)
   - Set up API keys for development

2. **Short-term (Week 1):**
   - Read integration readiness plan (`plans/integration-readiness.md`)
   - Begin LLM provider implementation
   - Set up feature flag infrastructure

3. **Medium-term (Weeks 2-3):**
   - Implement context system
   - Update API client with LLM integration
   - Comprehensive testing

4. **Long-term (Weeks 4-5):**
   - Add conversation storage
   - Performance optimization
   - Documentation and handoff

---

## Appendix A: File Inventory

**Files Requiring Changes:**

| File | Changes | Breaking | Complexity |
|------|---------|----------|------------|
| `lib/api/client.ts` | Replace template logic | ❌ No | High |
| `lib/api/hooks.ts` | Update cache times | ❌ No | Low |
| `lib/models/types.ts` | Add LLM types | ❌ No | Low |
| `lib/store/localStore.ts` | Add conversations | ❌ No | Medium |

**New Files to Create:**

- `lib/llm/provider.ts` - LLM interface
- `lib/llm/openai.ts` - OpenAI implementation
- `lib/llm/anthropic.ts` - Anthropic implementation
- `lib/llm/prompts.ts` - Prompt engineering
- `lib/context/builder.ts` - Context builder
- `lib/context/detector.ts` - Course detection
- `lib/context/ranking.ts` - Material ranking

**Total New Files:** 7
**Total Modified Files:** 4
**Total Deleted Files:** 0

---

**End of Current API Audit**

*Generated by Integration Readiness Checker*
*Task: Backend LLM Transformation*
*Date: 2025-10-16*
