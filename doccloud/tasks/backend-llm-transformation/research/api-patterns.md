# API Patterns Research - Backend LLM Transformation

**Author:** Mock API Designer Sub-Agent
**Date:** 2025-10-16
**Task:** Backend LLM Transformation

---

## Executive Summary

Analyzed existing API implementation in `lib/api/client.ts` to understand patterns, conventions, and contracts. This document catalogs all current API methods, React Query hooks, and mock data structures to ensure zero breaking changes during LLM backend transformation.

**Key Findings:**
- 23 existing API methods follow RESTful naming conventions (getX, createX, updateX)
- Template-based AI generation in `generateAIResponseWithMaterials()` needs LLM replacement
- Course materials infrastructure already exists (`getCourseMaterials`, `searchCourseMaterials`)
- React Query hooks use consistent invalidation patterns
- Mock data stored in localStorage with seed versioning system

---

## 1. Existing API Methods Audit

### Authentication Methods (5)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `login` | `(input: LoginInput) => Promise<AuthResult>` | 300-500ms | Validates credentials, creates mock session |
| `signup` | `(input: SignupInput) => Promise<AuthResult>` | 400-600ms | Creates user, returns session |
| `logout` | `() => Promise<void>` | 50-100ms | Clears session from localStorage |
| `getCurrentUser` | `() => Promise<User \| null>` | 200-400ms | Returns user from session |
| `restoreSession` | `() => Promise<AuthSession \| null>` | 100-200ms | Loads session from localStorage |

**Status:** No changes needed for LLM integration.

---

### Course Methods (5)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `getAllCourses` | `() => Promise<Course[]>` | 200-500ms | Returns all active courses |
| `getUserCourses` | `(userId: string) => Promise<Course[]>` | 200-500ms | Filters by user enrollments |
| `getCourse` | `(courseId: string) => Promise<Course \| null>` | 200-500ms | Single course lookup |
| `getCourseThreads` | `(courseId: string) => Promise<ThreadWithAIAnswer[]>` | 200-500ms | Threads with embedded AI answers |
| `getCourseMetrics` | `(courseId: string) => Promise<CourseMetrics>` | 300-500ms | Aggregated course stats |

**Status:** No changes needed.

---

### Course Material Methods (2) - EXISTING INFRASTRUCTURE

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `getCourseMaterials` | `(courseId: string) => Promise<CourseMaterial[]>` | 200-500ms | **Already exists!** Returns materials from `mocks/course-materials.json` |
| `searchCourseMaterials` | `(input: SearchCourseMaterialsInput) => Promise<CourseMaterialSearchResult[]>` | 200-300ms | **Already exists!** Keyword search with relevance scoring |

**Key Insight:** Material infrastructure is ready. Just need to wire it into LLM context builders.

**Material Structure:**
```typescript
interface CourseMaterial {
  id: string;
  courseId: string;
  type: "lecture" | "slide" | "assignment" | "reading" | "lab" | "textbook";
  title: string;
  content: string;          // Full text for AI context
  keywords: string[];       // Pre-computed for fast matching
  metadata: {
    week?: number;
    date?: string;
    chapter?: string;
    pageRange?: string;
    authorId?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### Thread Methods (2)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `getThread` | `(threadId: string) => Promise<{thread, posts, aiAnswer} \| null>` | 200-500ms | Returns thread with embedded AI answer |
| `createThread` | `(input: CreateThreadInput, authorId: string) => Promise<{thread, aiAnswer}>` | 400-600ms | **Auto-generates AI answer** using `generateAIResponseWithMaterials()` |

**Status:** `createThread` needs LLM integration (currently uses template matching).

---

### Post Methods (1)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `createPost` | `(input: CreatePostInput, authorId: string) => Promise<Post>` | 300-500ms | Adds reply to thread |

**Status:** No changes needed.

---

### AI Answer Methods (3) - PRIMARY LLM INTEGRATION POINTS

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `generateAIAnswer` | `(input: GenerateAIAnswerInput) => Promise<AIAnswer>` | 800-1200ms | **Uses template matching** - needs LLM replacement |
| `generateAIPreview` | `(input: GenerateAIAnswerInput) => Promise<AIAnswer>` | 800-1200ms | **Uses template matching** - needs LLM replacement |
| `getAIAnswer` | `(threadId: string) => Promise<AIAnswer \| null>` | 200-400ms | Lookup only - no changes needed |
| `endorseAIAnswer` | `(input: EndorseAIAnswerInput) => Promise<AIAnswer>` | 100ms | Updates endorsement countsno changes needed |

**Current Template Logic (TO BE REPLACED):**

```typescript
// In generateAIResponseWithMaterials() - lines 494-579
async function generateAIResponseWithMaterials(
  courseId: string,
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): Promise<{content, confidence, citations}> {
  // 1. Extract keywords from question
  const keywords = extractKeywords(questionText);

  // 2. Select template based on course type (CS vs MATH)
  let templateList: Template[] = courseCode.startsWith('CS') ? CS_TEMPLATES : MATH_TEMPLATES;

  // 3. Find best matching template by keyword overlap
  let bestMatch = GENERAL_TEMPLATE;
  let bestMatchRatio = 0;
  for (const template of templateList) {
    const ratio = calculateMatchRatio(keywords, template.keywords);
    if (ratio > bestMatchRatio) {
      bestMatch = template;
      bestMatchRatio = ratio;
    }
  }

  // 4. Calculate confidence (55% base + 40% from match ratio)
  const confidenceScore = 55 + (bestMatchRatio * 40);

  // 5. Fetch course materials and score by keyword matches
  const materials = await api.getCourseMaterials(courseId);
  const scoredMaterials = materials.map(m => {
    const matches = keywords.filter(k => m.keywords.includes(k)).length;
    return { material: m, relevance: Math.min(95, 60 + matches * 10) };
  });

  // 6. Take top 2-3 materials for citations
  const topMaterials = scoredMaterials.sort((a,b) => b.relevance - a.relevance).slice(0, 2-3);

  return { content: bestMatch.content, confidence, citations };
}
```

**LLM Replacement Strategy:**
- Replace template matching with LLM API call (OpenAI/Anthropic)
- Keep material fetching and keyword extraction logic
- Use top materials as LLM context
- Stream LLM response instead of returning hardcoded text
- Calculate confidence from LLM metadata (e.g., token probabilities)

---

### Dashboard Methods (2)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `getStudentDashboard` | `(userId: string) => Promise<StudentDashboardData>` | 200-400ms | Aggregates enrollments, activity, points |
| `getInstructorDashboard` | `(userId: string) => Promise<InstructorDashboardData>` | 300-500ms | Aggregates managed courses, metrics, queue |

**Status:** No changes needed.

---

### Instructor-Specific Methods (8)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `getInstructorInsights` | `(userId: string) => Promise<InstructorInsight[]>` | 200-300ms | Priority-ranked threads |
| `getFrequentlyAskedQuestions` | `(courseId: string) => Promise<FrequentlyAskedQuestion[]>` | 400-600ms | Clusters similar threads by keywords |
| `getTrendingTopics` | `(courseId, timeRange) => Promise<TrendingTopic[]>` | 300-500ms | Tag frequency analysis |
| `searchQuestions` | `(input: SearchQuestionsInput) => Promise<QuestionSearchResult[]>` | 200-300ms | Keyword-based search with relevance |
| `getResponseTemplates` | `(userId: string) => Promise<ResponseTemplate[]>` | 100-150ms | User's saved templates |
| `saveResponseTemplate` | `(input, userId) => Promise<ResponseTemplate>` | 100-150ms | Creates new template |
| `deleteResponseTemplate` | `(templateId: string) => Promise<void>` | 50ms | Removes template |
| `bulkEndorseAIAnswers` | `(input: BulkEndorseInput) => Promise<BulkActionResult>` | 200-300ms | Batch endorsement operation |

**Status:** No changes needed.

---

### Notification Methods (3)

| Method | Signature | Delay | Current Implementation |
|--------|-----------|-------|------------------------|
| `getNotifications` | `(userId, courseId?) => Promise<Notification[]>` | 200-400ms | Fetches user notifications |
| `markNotificationRead` | `(notificationId: string) => Promise<void>` | 50ms | Quick action |
| `markAllNotificationsRead` | `(userId, courseId?) => Promise<void>` | 100ms | Batch mark |

**Status:** No changes needed.

---

## 2. React Query Hook Patterns

### Query Key Structure

All hooks use array format with consistent naming:

```typescript
const queryKeys = {
  // Single resource: ['resource', id]
  course: (courseId: string) => ['course', courseId],
  thread: (threadId: string) => ['thread', threadId],

  // Collection: ['resource', ...filters]
  courseThreads: (courseId: string) => ['courseThreads', courseId],
  notifications: (userId: string, courseId?: string) =>
    courseId ? ['notifications', userId, courseId] : ['notifications', userId],

  // Parameterized queries: ['resource', params]
  searchCourseMaterials: (input: SearchCourseMaterialsInput) => ['searchCourseMaterials', input],
  trendingTopics: (courseId: string, timeRange: string) => ['trendingTopics', courseId, timeRange],
};
```

**Pattern:** Array keys ensure proper cache isolation and invalidation.

---

### Invalidation Patterns

| Mutation | Invalidates |
|----------|-------------|
| `useCreateThread` | `courseThreads(courseId)`, `studentDashboard`, `instructorDashboard` |
| `useCreatePost` | `thread(threadId)`, `studentDashboard`, `instructorDashboard` |
| `useEndorseAIAnswer` | `thread(threadId)`, `courseThreads(courseId)`, `instructorDashboard` |
| `useLogin` / `useSignup` | `currentUser` |
| `useLogout` | All queries (full cache clear) |
| `useBulkEndorseAIAnswers` | `instructorInsights`, `courseThreads`, `instructorDashboard` |

**Pattern:** Mutations invalidate:
1. Direct resource (e.g., `thread` after `createPost`)
2. Parent collection (e.g., `courseThreads` after `createThread`)
3. Dashboards (activity feeds)

---

### Optimistic Updates

Two hooks use optimistic updates for instant UX:

1. **`useEndorseAIAnswer`** - Updates cached AI answer immediately
2. **`useSaveResponseTemplate`** - Adds template with temporary ID

**Pattern:**
```typescript
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, (old) => /* optimistic update */);
  return { previous }; // For rollback
},
onError: (err, vars, context) => {
  queryClient.setQueryData(queryKey, context.previous); // Rollback
},
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey }); // Refetch truth
}
```

---

### Stale Time Strategy

| Hook | Stale Time | Rationale |
|------|------------|-----------|
| `useCurrentUser` | 5 min | Session data changes rarely |
| `useCourseThreads` | 2 min | Moderate update frequency |
| `useCourseMaterials` | 10 min | Materials are static |
| `useAIAnswer` | 10 min | AI content is immutable |
| `useNotifications` | 30 sec | Near-real-time updates |
| `useResponseTemplates` | Infinity | User-owned, immutable until edited |

**Pattern:** Longer stale time for immutable/slow-changing data.

---

## 3. Mock Data Structure Analysis

### localStorage Keys

```typescript
const KEYS = {
  users: "quokkaq.users",
  authSession: "quokkaq.authSession",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  threads: "quokkaq.threads",
  posts: "quokkaq.posts",
  notifications: "quokkaq.notifications",
  aiAnswers: "quokkaq.aiAnswers",
  responseTemplates: "quokkaq.responseTemplates",
  assignments: "quokkaq.assignments",
  courseMaterials: "quokkaq.courseMaterials",  // NEW: Already exists!
  seedVersion: "quokkaq.seedVersion",
  initialized: "quokkaq.initialized",
};
```

### Seed Versioning System

```typescript
const SEED_VERSION = 'v2.1.0';

export function seedData(): void {
  const currentVersion = localStorage.getItem(KEYS.seedVersion);
  if (currentVersion === SEED_VERSION) return; // Skip if same version

  // Load from JSON files
  const users = usersData as User[];
  const courseMaterials = courseMaterialsData as CourseMaterial[];
  // ... etc

  // Save to localStorage
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  localStorage.setItem(KEYS.courseMaterials, JSON.stringify(courseMaterials));
  localStorage.setItem(KEYS.seedVersion, SEED_VERSION);
}
```

**Pattern:** Increment `SEED_VERSION` to force re-seed when mock data changes.

---

### Existing Mock Data Files

| File | Purpose | Sample Data |
|------|---------|-------------|
| `mocks/course-materials.json` | **Course content for AI** | Lectures, slides, assignments, readings |
| `mocks/threads.json` | Q&A threads | 10+ threads with tags, status |
| `mocks/ai-answers.json` | AI responses | Pre-generated answers with citations |
| `mocks/users.json` | User accounts | Students, instructors, TAs |
| `mocks/courses.json` | Course catalog | CS101, MATH221, etc. |
| `mocks/posts.json` | Thread replies | Student/instructor responses |
| `mocks/notifications.json` | User notifications | Activity alerts |
| `mocks/assignments.json` | Course assignments | Assignment metadata |
| `mocks/enrollments.json` | User-course links | Enrollment records |

**Key Finding:** `course-materials.json` already exists with rich content for AI context!

---

## 4. AI Generation Current Flow

### Flow Diagram

```
User creates thread
       ↓
createThread(input, authorId)
       ↓
addThread(newThread) → localStorage
       ↓
generateAIAnswer(input) [AUTO-TRIGGERED]
       ↓
generateAIResponseWithMaterials(courseId, courseCode, title, content, tags)
       ↓
┌──────────────────────────────────────────────────────┐
│ 1. extractKeywords(questionText)                     │
│ 2. Select template (CS_TEMPLATES vs MATH_TEMPLATES)  │
│ 3. calculateMatchRatio for each template             │
│ 4. Pick bestMatch template                           │
│ 5. Calculate confidence (55% + matchRatio * 40%)     │
│ 6. getCourseMaterials(courseId)                      │
│ 7. Score materials by keyword matches                │
│ 8. Take top 2-3 materials for citations              │
│ 9. Return {content, confidence, citations}           │
└──────────────────────────────────────────────────────┘
       ↓
addAIAnswer(aiAnswer) → localStorage
       ↓
updateThread(threadId, {hasAIAnswer: true, aiAnswerId})
       ↓
Return {thread, aiAnswer}
```

### Template Types (TO BE REMOVED)

```typescript
// CS Templates (lines 268-351)
const CS_TEMPLATES = [
  {
    keywords: ['binary', 'search', 'algorithm', 'sorted', 'array'],
    content: `Binary search explanation with code...`
  },
  {
    keywords: ['linked', 'list', 'array', 'data', 'structure'],
    content: `Arrays vs Linked Lists comparison...`
  },
  {
    keywords: ['big', 'notation', 'complexity', 'time', 'space'],
    content: `Big O notation explanation...`
  },
];

// MATH Templates (lines 357-410)
const MATH_TEMPLATES = [
  {
    keywords: ['integration', 'integral', 'techniques'],
    content: `Integration techniques explanation...`
  },
  {
    keywords: ['derivative', 'differentiation', 'chain', 'rule'],
    content: `Derivative rules explanation...`
  },
];

// Fallback (lines 415-432)
const GENERAL_TEMPLATE = {
  keywords: [],
  content: `Generic guidance response...`
};
```

**Problem:** Hardcoded responses don't scale. Need LLM flexibility.

---

### Material Scoring Logic (TO BE KEPT)

```typescript
// Current implementation (lines 552-562)
const scoredMaterials = materials.map(material => {
  const materialKeywords = material.keywords;
  const matches = keywords.filter(k => materialKeywords.includes(k)).length;
  const relevance = Math.min(95, 60 + (matches * 10)); // 60% base + 10% per match
  return { material, relevance, matches };
});

const topMaterials = scoredMaterials
  .sort((a, b) => b.relevance - a.relevance)
  .slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3 materials
```

**Keep This:** Good heuristic for material selection. Can be used as pre-filter before LLM context.

---

## 5. Identified Extension Points for LLM Integration

### 5.1 New Methods Needed

| Method | Signature | Purpose |
|--------|-----------|---------|
| `createConversation` | `(userId: string, courseId?: string) => Promise<Conversation>` | Start new AI conversation |
| `sendConversationMessage` | `(conversationId: string, message: Message) => Promise<Message>` | Send user message, get AI response |
| `getConversationHistory` | `(conversationId: string) => Promise<Message[]>` | Retrieve full conversation |
| `getUserConversations` | `(userId: string) => Promise<Conversation[]>` | List user's conversations |
| `deleteConversation` | `(conversationId: string) => Promise<void>` | Remove conversation |
| `convertConversationToThread` | `(conversationId: string, input: ConvertInput) => Promise<Thread>` | Publish conversation as public thread |

### 5.2 New React Query Hooks Needed

| Hook | Invalidated By |
|------|----------------|
| `useConversations(userId)` | `useCreateConversation`, `useDeleteConversation` |
| `useConversationMessages(conversationId)` | `useSendMessage` |
| `useSendMessage()` | (optimistic update pattern) |
| `useConvertConversation()` | Invalidates: `courseThreads`, `conversations`, `dashboards` |

### 5.3 Modified Methods

| Method | Changes Required |
|--------|------------------|
| `generateAIAnswer` | Replace template matching with LLM API call |
| `generateAIPreview` | Replace template matching with LLM API call |

**Signature Stability:** No signature changes! Just internal implementation swap.

---

## 6. Backend Integration Readiness

### What's Ready

✅ **Course materials infrastructure** - `getCourseMaterials()` and `searchCourseMaterials()` exist
✅ **Material scoring logic** - Keyword matching for relevance ranking
✅ **TypeScript types** - `CourseMaterial`, `MaterialReference`, `Citation` fully typed
✅ **React Query integration** - Hooks with proper caching/invalidation
✅ **Mock data structure** - `mocks/course-materials.json` with rich content
✅ **API contracts stable** - All method signatures remain unchanged

### What's Missing

❌ **LLM provider layer** - No OpenAI/Anthropic integration yet
❌ **Conversation storage** - Need `ai_conversations` and `ai_messages` tables/localStorage
❌ **LMS sync** - No course material ingestion from Canvas/LMS
❌ **Context builder** - No multi-course context aggregation
❌ **Course auto-detection** - No query → course mapping
❌ **Streaming support** - Current API is request/response, no SSE/WebSocket

---

## 7. Breaking Change Analysis

### Zero Breaking Changes Confirmed

All existing endpoints maintain signatures:

```typescript
// BEFORE (template-based)
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  const { content, confidence, citations } = await generateAIResponseWithMaterials(...);
  return { id, threadId, content, confidenceLevel, confidenceScore, citations, ... };
}

// AFTER (LLM-based) - SAME SIGNATURE
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  const { content, confidence, citations } = await callLLMWithContext(...);
  return { id, threadId, content, confidenceLevel, confidenceScore, citations, ... };
}
```

**Frontend components see no difference!**

---

## 8. Recommendations for API Design Plan

### Priority 1: Replace Template System with LLM

**Files to modify:**
- `lib/api/client.ts` - `generateAIResponseWithMaterials()` function (lines 494-579)
- New file: `lib/llm/provider.ts` - Generic LLM interface
- New file: `lib/llm/openai.ts` - OpenAI implementation
- New file: `lib/llm/anthropic.ts` - Anthropic fallback

**Keep existing:**
- Material fetching logic (`getCourseMaterials`)
- Keyword extraction (`extractKeywords`)
- Material scoring (`scoredMaterials`)
- Citation generation (adapt to use LLM context)

---

### Priority 2: Add Conversation System

**New types needed:**
```typescript
interface Conversation {
  id: string;
  userId: string;
  courseId?: string;          // Optional: may be cross-course
  title?: string;             // Auto-generated from first message
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  materials?: MaterialReference[]; // Optional: materials cited in response
  timestamp: string;
}
```

**Storage strategy:**
- Mock: localStorage with key `quokkaq.conversations` and `quokkaq.messages`
- Production: Database tables `ai_conversations` and `ai_messages`

---

### Priority 3: LMS Integration (Simulated)

**New methods:**
```typescript
syncCourseMaterials(courseId: string): Promise<SyncResult>
// Simulates fetching from Canvas LMS API
// In mock: adds predefined materials to localStorage
// In production: Calls real LMS endpoints
```

**No immediate implementation needed** - can defer to v2.

---

## 9. Implementation Risks

### Risk: API Rate Limits

**Current delay simulation:** 800-1200ms for AI operations
**Real LLM latency:** OpenAI GPT-4o-mini: 500-2000ms (95th percentile)
**Mitigation:** Implement exponential backoff, fallback to Anthropic, show loading states

---

### Risk: Context Size Limits

**Current:** No limit (templates are tiny)
**LLM limits:** OpenAI: 128k tokens, Anthropic: 200k tokens
**Mitigation:**
- Truncate to top 5 most relevant materials
- Implement token counting before API call
- Fallback to single-course context if multi-course exceeds limit

---

### Risk: Cost Overruns

**Current:** $0 (mock data)
**Estimated:** $0.05-0.15 per AI answer (GPT-4o-mini)
**Mitigation:**
- Use GPT-4o-mini (cheapest model)
- Cache AI responses aggressively (10 min stale time)
- Implement daily cost cap ($100/day for demo)

---

## 10. Next Steps

1. **Read this document** before proceeding with implementation
2. **Review `plans/api-design.md`** for complete endpoint specifications
3. **Validate types** with Type Safety Guardian's plan
4. **Check integration readiness** with Integration Readiness Checker's plan
5. **Implement in order:** Database → LLM → Context → API → Hooks

---

## Appendices

### A. Helper Functions (Reusable)

```typescript
// Keep these - they're production-ready
extractKeywords(text: string): string[]
calculateMatchRatio(keywords1: string[], keywords2: string[]): number
generateExcerpt(content: string, keywords: string[]): string
mapMaterialTypeToCitationType(materialType: CourseMaterialType): CitationSourceType
getConfidenceLevel(score: number): ConfidenceLevel
```

### B. Material Data Sample

From `mocks/course-materials.json`:
```json
{
  "id": "mat-cs101-lec5",
  "courseId": "course-cs101",
  "type": "lecture",
  "title": "Lecture 5: Binary Search Trees",
  "content": "A binary search tree (BST) is a data structure...",
  "keywords": ["binary", "search", "tree", "bst", "algorithms", "data-structures"],
  "metadata": {
    "week": 5,
    "date": "2025-10-15",
    "authorId": "user-instructor-1"
  },
  "createdAt": "2025-09-01T00:00:00Z",
  "updatedAt": "2025-10-01T00:00:00Z"
}
```

---

**End of API Patterns Research**
