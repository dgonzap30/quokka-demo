# API Patterns Research: Instructor Dashboard Features

**Date:** 2025-10-12
**Task:** Instructor Dashboard Re-imagining
**Focus:** Mock API design for instructor-specific features

---

## Executive Summary

This document analyzes existing API patterns in `/lib/api/client.ts` and `/lib/store/localStore.ts` to establish a blueprint for new instructor dashboard endpoints. The goal is to extend the mock API with 6-8 new methods while maintaining backward compatibility and following established conventions.

---

## 1. Existing API Architecture Analysis

### 1.1 Core Patterns Observed

**API Method Structure:**
- All methods are async functions returning Promises
- Network delay simulation using `delay()` helper (200-500ms standard, 800ms AI operations, 100ms quick actions)
- Seed data check at method start: `seedData()`
- ID generation via `generateId(prefix)` helper
- Error handling via `throw new Error(message)`

**Delay Timing Convention:**
```typescript
delay(200 + Math.random() * 300)  // Standard: 200-500ms
delay(800 + Math.random() * 400)  // AI operations: 800-1200ms
delay(100)                         // Quick actions: 100ms fixed
delay(50 + Math.random() * 50)    // Ultra-fast: 50-100ms
```

**Data Access Patterns:**
- Read operations: Call `getThreads()`, `getCourses()`, etc. from localStore
- Write operations: Call `addThread()`, `updateThread()`, `addPost()` from localStore
- Join operations: Manually fetch related data and combine (e.g., threads + AI answers)
- Filtering: Always performed in-memory after fetch (no DB-style queries)

### 1.2 Naming Conventions

**API Method Names:**
- GET operations: `getThread`, `getCourse`, `getInstructorDashboard`
- CREATE operations: `createThread`, `createPost`, `addAIAnswer`
- UPDATE operations: `endorseAIAnswer`, `markNotificationRead`
- AGGREGATE operations: `getCourseMetrics`, `getCourseInsights`

**Parameter Patterns:**
- Primary keys passed directly: `getThread(threadId: string)`
- Input objects use `Input` suffix: `CreateThreadInput`, `GenerateAIAnswerInput`
- User context passed explicitly: `createThread(input, authorId)`

### 1.3 Return Type Patterns

**Single Entity:** `Promise<Thread | null>`
**Collection:** `Promise<Thread[]>`
**Composite:** `Promise<{ thread: Thread; posts: Post[]; aiAnswer: AIAnswer | null }>`
**Void (mutations):** `Promise<void>`

---

## 2. Data Generation & Mock Logic

### 2.1 Keyword Extraction Pattern

Found in `extractKeywords()` function (line 94):
```typescript
function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', ...]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}
```

**Usage:** AI answer generation, can be adapted for question clustering

### 2.2 Similarity Scoring Pattern

Found in `calculateMatchRatio()` function (line 107):
```typescript
function calculateMatchRatio(questionKeywords: string[], templateKeywords: string[]): number {
  const matches = questionKeywords.filter(k => templateKeywords.includes(k)).length;
  return questionKeywords.length > 0 ? matches / questionKeywords.length : 0;
}
```

**Application:** FAQ clustering can use this exact algorithm

### 2.3 Confidence Scoring Pattern

Found in `getConfidenceLevel()` function (line 115):
```typescript
function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
```

**Pattern:** Thresholds at 70% (high) and 40% (medium) for categorical classification

---

## 3. Dashboard Data Aggregation Patterns

### 3.1 Instructor Dashboard Structure

Current `getInstructorDashboard()` method (lines 1030-1208):

**Data Sources Combined:**
- Courses where user is instructor
- All threads across managed courses
- Unanswered threads queue (top 10)
- Recent activity feed (last 10 items)
- AI-generated insights per course
- Weekly stats with trends
- Goal progress tracking

**Key Operations:**
1. Filter courses by `instructorIds.includes(userId)`
2. Fetch all threads, filter by course IDs
3. Calculate metrics per course
4. Generate activity feed from threads
5. Compute week-over-week trends
6. Aggregate stats across courses

**Complexity:** O(n*m) where n=courses, m=threads per course

### 3.2 Metrics Calculation Patterns

**Current Week Range:**
```typescript
const currentWeek = getCurrentWeekRange();
const previousWeek = getPreviousWeekRange();
const currentThreads = countInDateRange(allManagedThreads, currentWeek);
```

**Trend Calculation:**
```typescript
const stats = {
  totalThreads: createStatWithTrend(currentThreads, previousThreads, "Threads", sparkline),
  unansweredThreads: createStatWithTrend(currentUnanswered, previousUnanswered, "Unanswered", sparkline),
};
```

---

## 4. React Query Integration Patterns

### 4.1 Query Key Structure

From `/lib/api/hooks.ts` (lines 19-35):

**Flat Keys:** `['currentUser']`, `['courses']`
**Parameterized Keys:** `['courseThreads', courseId]`, `['notifications', userId, courseId]`
**Pattern:** Always return `as const` for type safety

### 4.2 Stale Time Strategy

**User/Session Data:** 5 minutes (`staleTime: 5 * 60 * 1000`)
**Course Data:** 10 minutes (rarely changes)
**Thread Data:** 2 minutes (frequently updated)
**AI Content:** 10 minutes (immutable after generation)
**Notifications:** 30 seconds (real-time feel)

### 4.3 Invalidation Patterns

**Mutation Success Handlers:**
```typescript
onSuccess: (result) => {
  // Invalidate affected queries
  queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(thread.courseId) });
  queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
  queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
}
```

**Pattern:** Invalidate all related views, not just direct dependencies

---

## 5. localStorage Schema

### 5.1 Storage Keys

From `/lib/store/localStore.ts` (lines 17-28):
```typescript
const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  posts: "quokkaq.posts",
  aiAnswers: "quokkaq.aiAnswers",
  // ... etc
} as const;
```

**Convention:** Prefix `quokkaq.` + lowercase entity name

### 5.2 Data Mutation Pattern

**Read-Modify-Write:**
```typescript
export function updateThread(threadId: string, updates: Partial<Thread>): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (thread) {
    Object.assign(thread, updates);
    localStorage.setItem(KEYS.threads, JSON.stringify(threads));
  }
}
```

**Thread Safety:** None (frontend-only, no concurrency)

---

## 6. Mock Data Structure Analysis

### 6.1 Thread Schema (from mocks/threads.json)

```json
{
  "id": "thread-1",
  "courseId": "course-cs101",
  "title": "...",
  "content": "...",
  "authorId": "user-student-2",
  "status": "open" | "answered" | "resolved",
  "tags": ["algorithms", "binary-search"],
  "views": 52,
  "createdAt": "2025-09-13T17:12:26.013Z",
  "updatedAt": "2025-09-14T19:12:26.013Z",
  "hasAIAnswer": true,
  "aiAnswerId": "ai-answer-1"
}
```

**Key Properties for Instructor Features:**
- `status`: Filterable for unanswered queue
- `tags`: Basis for topic clustering
- `views`: Priority ranking factor
- `createdAt`/`updatedAt`: Time-open calculation, trending
- `courseId`: Grouping by course

### 6.2 AI Answer Schema (from mocks/ai-answers.json)

```json
{
  "id": "ai-answer-1",
  "threadId": "thread-1",
  "courseId": "course-cs101",
  "content": "...",
  "confidenceLevel": "high" | "medium" | "low",
  "confidenceScore": 92,
  "citations": [...],
  "studentEndorsements": 2,
  "instructorEndorsements": 0,
  "totalEndorsements": 2,
  "endorsedBy": [],
  "instructorEndorsed": false,
  "generatedAt": "...",
  "updatedAt": "..."
}
```

**Key Properties:**
- `instructorEndorsed`: Filter for quality monitoring
- `confidenceScore`: Priority ranking factor
- `endorsedBy`: Prevents duplicate endorsements

---

## 7. Extension Strategy for New Methods

### 7.1 Clustering Algorithm (FAQ Identification)

**Approach:** Keyword-based similarity clustering

```typescript
// Pseudo-algorithm
function clusterSimilarQuestions(threads: Thread[]): QuestionCluster[] {
  1. Extract keywords from each thread title+content+tags
  2. For each pair of threads, calculate similarity ratio
  3. Group threads with similarity > threshold (e.g., 0.4)
  4. Rank clusters by size (descending)
  5. Return top N clusters with representative question
}
```

**Similarity Threshold:** 40% keyword overlap (matches existing confidence thresholds)

**Performance:** O(n²) acceptable for mock (n < 100 threads per course)

### 7.2 Priority Ranking Algorithm

**Approach:** Weighted scoring formula

```typescript
// Priority score components
score =
  (views * 0.3) +                    // Engagement
  (timeOpen * 0.4) +                 // Urgency (hours since created)
  (hasAIAnswer && !instructorEndorsed ? 10 : 0) +  // Needs review
  (status === 'open' ? 20 : 0)       // Unanswered boost
```

**Rationale:**
- Views indicate student interest
- Time open indicates neglect
- Unendorsed AI answers need instructor validation
- Open questions highest priority

### 7.3 Natural Language Search

**Approach:** Fuzzy keyword matching

```typescript
// Pseudo-algorithm
function searchQuestions(query: string, threads: Thread[]): ScoredThread[] {
  const queryKeywords = extractKeywords(query);
  return threads.map(thread => ({
    thread,
    score: calculateMatchRatio(queryKeywords, extractKeywords(thread.title + thread.content))
  }))
  .filter(item => item.score > 0.2)  // Minimum relevance threshold
  .sort((a, b) => b.score - a.score);
}
```

**Threshold:** 20% keyword overlap for search results (lower than clustering)

---

## 8. Backward Compatibility Analysis

### 8.1 Non-Breaking Changes

**Safe:**
- Adding new API methods
- Adding new query keys
- Adding new localStorage keys
- Adding optional fields to existing types

**Unsafe:**
- Modifying existing method signatures
- Changing return types
- Removing fields from existing types
- Changing validation logic

### 8.2 Impact Assessment

**New Methods Impact:**
- Zero impact on existing components
- Existing dashboard still works without new methods
- New hooks can coexist with old hooks

**Data Model Impact:**
- New response templates need new localStorage key
- Existing Thread/AIAnswer types unchanged
- New types extend, not replace

---

## 9. Performance Considerations

### 9.1 Data Volume Estimates

**Typical Course:**
- 50-100 threads
- 10-20 threads/week active
- 5-10 unanswered at any time

**Clustering Cost:**
- O(n²) similarity calculation
- For 100 threads: 4,950 comparisons
- Mock acceptable (<100ms)

**Ranking Cost:**
- O(n log n) sort
- For 100 threads: ~700 comparisons
- Negligible

### 9.2 Caching Strategy

**Pre-computed:**
- FAQ clusters (cache for 15 minutes)
- Priority rankings (cache for 2 minutes)
- Topic frequency (cache for 10 minutes)

**On-demand:**
- Search results (no cache, query-dependent)
- Bulk endorsements (mutation, no cache)

---

## 10. Testing Scenarios

### 10.1 Edge Cases to Handle

**Empty States:**
- No unanswered questions (return empty array)
- No AI answers to endorse (return early)
- No response templates saved (return empty array)
- No topics/tags in threads (return generic insights)

**Boundary Conditions:**
- Single-thread cluster (still valid FAQ)
- Zero-keyword question (fallback to title-only search)
- All questions already endorsed (filter out)

**Error Conditions:**
- Invalid course ID (return null or empty)
- Invalid user ID (throw error)
- Malformed query string (sanitize, extract what's possible)

### 10.2 Validation Requirements

**Input Validation:**
- Course ID exists
- User ID exists and is instructor
- Template content non-empty
- AI answer IDs exist and not already endorsed

**Data Integrity:**
- Endorsement list doesn't duplicate
- Template IDs unique
- Cluster groups non-overlapping

---

## 11. TypeScript Type Requirements

### 11.1 New Types Needed

**Question Cluster:**
```typescript
interface QuestionCluster {
  id: string;
  representativeQuestion: Thread;
  similarQuestions: Thread[];
  commonKeywords: string[];
  totalViews: number;
  frequency: number;  // How many questions in cluster
}
```

**Priority Question:**
```typescript
interface PriorityQuestion extends Thread {
  priorityScore: number;
  urgencyReason: 'time_open' | 'high_views' | 'needs_review' | 'unanswered';
  timeOpenHours: number;
}
```

**Trending Topic:**
```typescript
interface TrendingTopic {
  topic: string;         // Tag or keyword
  frequency: number;     // Count in time range
  trend: 'rising' | 'stable' | 'falling';
  weekOverWeekChange: number;  // Percentage
}
```

**Response Template:**
```typescript
interface ResponseTemplate {
  id: string;
  userId: string;        // Owner
  title: string;         // Template name
  content: string;       // Template body
  tags: string[];        // When to suggest
  usageCount: number;    // How often used
  createdAt: string;
  updatedAt: string;
}
```

**Search Result:**
```typescript
interface SearchResult {
  thread: Thread;
  relevanceScore: number;  // 0-1
  matchedKeywords: string[];
}
```

### 11.2 Input Types Needed

```typescript
interface BulkEndorseInput {
  aiAnswerIds: string[];
  userId: string;
  isInstructor: boolean;
}

interface SaveTemplateInput {
  title: string;
  content: string;
  tags?: string[];
}

interface SearchQuestionsInput {
  courseId: string;
  query: string;
  limit?: number;
}
```

---

## 12. localStorage Extension Plan

### 12.1 New Storage Keys

```typescript
const KEYS = {
  // ... existing keys
  responseTemplates: "quokkaq.responseTemplates",
};
```

**Seed Data:** Empty array initially, populated by user actions

### 12.2 Access Functions Needed

```typescript
export function getResponseTemplates(userId: string): ResponseTemplate[];
export function addResponseTemplate(template: ResponseTemplate): void;
export function deleteResponseTemplate(templateId: string): void;
export function updateResponseTemplate(templateId: string, updates: Partial<ResponseTemplate>): void;
```

---

## 13. Deterministic Mock Data Strategy

### 13.1 Clustering Determinism

**Challenge:** Same input threads should always produce same clusters

**Solution:**
1. Sort threads by ID before clustering (stable order)
2. Use consistent similarity threshold
3. Break ties by thread ID lexicographically

### 13.2 Ranking Determinism

**Challenge:** Priority scores should be reproducible

**Solution:**
1. Calculate timeOpen from createdAt (stable)
2. Use exact formula with no random factors
3. Sort by score DESC, then by thread ID (stable)

### 13.3 Search Determinism

**Challenge:** Same query should return same results

**Solution:**
1. Keyword extraction is deterministic
2. Similarity calculation is deterministic
3. Sort by score DESC, then by thread ID

---

## 14. React Query Hook Design Patterns

### 14.1 Query Hooks

**Naming:** `use` + EntityName (plural for lists)

Examples:
- `useFrequentlyAskedQuestions(courseId)`
- `useTrendingTopics(courseId, timeRange)`
- `useInstructorInsights(userId)`
- `useResponseTemplates(userId)`

**Stale Times:**
- FAQ clusters: 15 minutes (expensive, rarely changes)
- Trending topics: 5 minutes (changes weekly)
- Instructor insights: 3 minutes (same as dashboard)
- Response templates: 10 minutes (user rarely edits)

### 14.2 Mutation Hooks

**Naming:** `use` + VerbNoun

Examples:
- `useBulkEndorseAIAnswers()`
- `useSaveResponseTemplate()`
- `useDeleteResponseTemplate()`

**Invalidation:**
- Bulk endorse → invalidate `instructorDashboard`, `courseThreads`, affected `thread` queries
- Save template → invalidate `responseTemplates`
- Delete template → invalidate `responseTemplates`

---

## 15. Summary & Recommendations

### 15.1 Key Findings

1. **Existing patterns are consistent:** All methods follow delay → seedData → fetch → process → return
2. **Keyword extraction is reusable:** Can power clustering, search, and topic analysis
3. **Similarity algorithm exists:** `calculateMatchRatio()` ready for clustering
4. **Dashboard aggregation complex:** O(n*m) but acceptable for mock scale
5. **React Query well-structured:** Clear key hierarchy, intelligent stale times

### 15.2 Recommended Approach

**Phase 1:** Implement core data methods
- `getFrequentlyAskedQuestions()`
- `getTrendingTopics()`
- `getInstructorInsights()`

**Phase 2:** Implement mutation methods
- `bulkEndorseAIAnswers()`
- `saveResponseTemplate()`
- `deleteResponseTemplate()`

**Phase 3:** Implement utility methods
- `searchQuestions()`
- `getResponseTemplates()`

**Phase 4:** Wire up React Query hooks
- Create query keys
- Implement hooks
- Set up invalidation

### 15.3 Risk Mitigation

**Performance Risk:** O(n²) clustering could be slow
- Mitigation: Limit to 100 threads max, cache aggressively

**Complexity Risk:** Too many features at once
- Mitigation: Implement incrementally, test each method

**Data Integrity Risk:** Mock data inconsistencies
- Mitigation: Validate inputs, handle edge cases, use TypeScript strictly

---

## 16. Next Steps

1. **Review this document** with parent agent
2. **Create detailed API design plan** in `plans/api-design.md`
3. **Update context.md** with design decisions
4. **Get approval** before implementation begins

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Lines:** 520+
