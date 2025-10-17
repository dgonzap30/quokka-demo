# Research: API Patterns for Course Materials

**Date:** 2025-10-16
**Task:** Context-Aware AI with Course Content Access
**Focus:** Mock API design for course materials and AI content search

---

## Objective

Research existing API patterns in `lib/api/client.ts`, data models in `lib/models/types.ts`, React Query hooks in `lib/api/hooks.ts`, and mock data structures to inform the design of:

1. Course materials API (lectures, slides, assignments, readings)
2. Material search API (keyword-based content retrieval for AI context)
3. TypeScript interfaces for course materials
4. Mock data structure and seeding strategy

---

## Existing API Patterns Analysis

### 1. API Method Conventions (lib/api/client.ts)

**Pattern Observations:**

- **Naming Convention:** `get<Resource>` for reads, `create<Resource>` for writes
- **Async/Promise Pattern:** All methods return `Promise<T>`
- **Network Delay Simulation:**
  - Standard queries: `200-500ms` (via `delay()` helper)
  - Quick actions: `50-100ms` (mark read, endorse)
  - AI operations: `600-1200ms` (generate AI answer, insights)
- **Error Handling:** Throw `Error` with descriptive messages
- **Data Enrichment:** Methods often hydrate related data (e.g., `getThread` returns thread + posts + aiAnswer)

**Examples:**
```typescript
// Standard GET pattern
async getAllCourses(): Promise<Course[]> {
  await delay(); // 200-500ms
  seedData();
  const courses = getCourses();
  return courses.filter((c) => c.status === "active");
}

// GET with enrichment
async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[]; aiAnswer: AIAnswer | null } | null> {
  await delay();
  seedData();
  const thread = getThreadById(threadId);
  if (!thread) return null;
  const posts = getPostsByThread(threadId);
  const aiAnswer = thread.aiAnswerId ? getAIAnswerById(thread.aiAnswerId) : null;
  return { thread, posts, aiAnswer };
}

// AI operation (longer delay)
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  await delay(800 + Math.random() * 400); // 800-1200ms
  seedData();
  // ... AI generation logic
}
```

**Key Insight:** Methods returning aggregated data (like `getThread` with posts + AI answer) enable efficient React Query caching and reduce round trips.

---

### 2. Data Model Patterns (lib/models/types.ts)

**Pattern Observations:**

- **Interface Naming:** PascalCase, descriptive (e.g., `CourseWithMetrics`, `ThreadWithAIAnswer`)
- **ID Convention:** String IDs with prefixes (e.g., `"course-cs101"`, `"thread-1"`)
- **Timestamps:** ISO 8601 strings (`createdAt`, `updatedAt`)
- **Optional Fields:** Marked with `?` (e.g., `tags?: string[]`, `link?: string`)
- **Embedded vs Referenced:**
  - Simple references use IDs (`courseId: string`)
  - Enriched types embed full objects (`thread: Thread`)
- **Enums:** Union types for constrained values (`type CitationSourceType = 'lecture' | 'textbook' | 'slides' | 'lab' | 'assignment' | 'reading'`)

**Relevant Existing Types:**

```typescript
// Course structure
export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  description: string;
  instructorIds: string[];
  enrollmentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

// Citations in AI answers (closest analog to course materials)
export interface Citation {
  id: string;
  sourceType: CitationSourceType; // 'lecture' | 'textbook' | 'slides' | 'lab' | 'assignment' | 'reading'
  source: string;
  excerpt: string;
  relevance: number;
  link?: string;
}

// AI Answer structure (uses citations)
export interface AIAnswer {
  id: string;
  threadId: string;
  courseId: string;
  content: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  citations: Citation[]; // Array of course material references
  // ... endorsement fields
}
```

**Key Insight:** The existing `Citation` type is **already designed for course materials** but doesn't provide access to full material content. We need a `CourseMaterial` type that extends this concept.

---

### 3. React Query Hook Patterns (lib/api/hooks.ts)

**Pattern Observations:**

- **Hook Naming:** `use<Resource>` for queries, `use<Action>` for mutations
- **Query Keys:** Organized by resource hierarchy, include all identifiers
  - Example: `courseThreads: (courseId: string) => ["courseThreads", courseId]`
- **Stale Time Strategy:**
  - Fast-changing data (notifications): `30s - 2min`
  - Moderate (threads, courses): `2-10min`
  - Immutable (AI answers, templates): `10min - Infinity`
  - Expensive operations (FAQs, insights): `5-10min`
- **Invalidation Patterns:** Mutations invalidate related queries
  - Example: `useCreateThread` invalidates `courseThreads` and dashboard queries
- **Optional Parameters:** Use `enabled: !!param` for conditional fetching

**Examples:**
```typescript
// Query pattern
export function useCourseThreads(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseThreads(courseId) : ["courseThreads"],
    queryFn: () => (courseId ? api.getCourseThreads(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

// Mutation with invalidation
export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(result.thread.courseId) });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
  });
}
```

**Key Insight:** Course materials will be relatively static (stale time ~10min), and search results should be cached per query (2-5min).

---

### 4. Mock Data Structure (mocks/*.json)

**Pattern Observations:**

- **JSON Array Format:** Top-level array of objects
- **Deterministic IDs:** Sequential or course-specific (e.g., `"course-cs101"`)
- **Realistic Data:** Production-like content, not placeholder text
- **Relationships:** Foreign keys reference other mock data (e.g., `courseId` in threads)
- **Seed Size:** ~5-10 items per resource for demo purposes

**Example from mocks/courses.json:**
```json
[
  {
    "id": "course-cs101",
    "code": "CS 101",
    "name": "Introduction to Computer Science",
    "term": "Fall 2025",
    "description": "Fundamental concepts of computer science...",
    "instructorIds": ["user-instructor-1"],
    "enrollmentCount": 52,
    "status": "active",
    "createdAt": "2025-08-15T09:00:00Z"
  }
]
```

**Example from mocks/ai-answers.json (relevant):**
```json
{
  "id": "ai-answer-1",
  "threadId": "thread-1",
  "courseId": "course-cs101",
  "content": "The issue in your binary search implementation...",
  "confidenceLevel": "high",
  "confidenceScore": 92,
  "citations": [
    {
      "id": "cite-1-1",
      "sourceType": "lecture",
      "source": "Lecture 4: Binary Search Algorithm",
      "excerpt": "Binary search maintains two pointers...",
      "relevance": 95,
      "link": null
    }
  ]
}
```

**Key Insight:** Citations already reference course materials by name, but **we need full material objects** to enable AI content search.

---

## Existing Course Data Analysis

### Current Course Structure

**Courses available in mocks/courses.json:**
- `course-cs101`: CS 101 (Intro to CS)
- `course-cs201`: CS 201 (Data Structures & Algorithms)
- `course-math221`: MATH 221 (Calculus II)
- `course-cs301`: CS 301 (Advanced Algorithms)
- `course-phys201`: PHYS 201 (Physics II)
- `course-eng101`: ENG 101 (Academic Writing)

**Key Observation:** The existing `generateCitations()` function in `client.ts` (lines 144-185) **already generates mock course materials** with:
- Material names (e.g., "Lecture 5: Binary Search & Sorting Algorithms")
- Material types (`lecture`, `textbook`, `slides`, `lab`, `assignment`, `reading`)
- Keywords for matching
- Course-specific material sets (CS templates, MATH templates)

**Hardcoded Material Examples from client.ts:**
```typescript
const courseMaterials: Record<string, Array<{ source: string; type: CitationSourceType; keywords: string[] }>> = {
  CS: [
    { source: "Lecture 5: Binary Search & Sorting Algorithms", type: "lecture", keywords: ['binary', 'search', 'sorting', 'algorithm'] },
    { source: "Introduction to Algorithms (CLRS) - Chapter 3", type: "textbook", keywords: ['algorithm', 'analysis', 'notation'] },
    { source: "Lab 3: Implementing Search Algorithms", type: "lab", keywords: ['binary', 'search', 'linear', 'implementation'] }
  ],
  MATH: [
    { source: "Lecture 10: Integration Techniques", type: "lecture", keywords: ['integration', 'integral', 'substitution'] },
    { source: "Calculus: Early Transcendentals - Chapter 5", type: "textbook", keywords: ['derivative', 'differentiation'] }
  ]
};
```

**Critical Finding:** This data is **embedded in the AI generation function** and should be **externalized to mock data files** for:
1. API access by AI assistant
2. Consistency across AI generation and search
3. Ability to add full content (not just titles)

---

## Gap Analysis

### What's Missing for Context-Aware AI

1. **CourseMaterial Interface:** No type definition for full course materials (title + content + metadata)
2. **Material Storage:** No `mocks/course-materials.json` file with actual material content
3. **Material API Methods:**
   - `getCourseMaterials(courseId)` - Get all materials for a course
   - `searchCourseMaterials(courseId, keywords[])` - Search by keywords
4. **Material Hooks:**
   - `useCourseMaterials(courseId)` - Fetch materials for a course
   - `useSearchCourseMaterials(courseId, query)` - Search materials
5. **AI Context Integration:** How to pass course materials to AI assistant modal

---

## Material Type Taxonomy (from Citations)

Based on existing `CitationSourceType`:

| Type | Description | Example |
|------|-------------|---------|
| `lecture` | Lecture slides/notes | "Lecture 5: Binary Search" |
| `textbook` | Textbook chapters | "CLRS Chapter 3" |
| `slides` | Presentation slides | "Week 4 Slides: Recursion" |
| `lab` | Lab exercises | "Lab 3: Search Algorithms" |
| `assignment` | Homework/projects | "Assignment 2: Dynamic Programming" |
| `reading` | Supplementary readings | "PEP 8 Style Guide" |

**Key Insight:** These 6 types cover all academic materials needed. No expansion required.

---

## Performance Considerations

### Material Loading Strategy

**Option 1: Load all materials per course**
- **Pros:** Single query, full content available for search
- **Cons:** Large payload (~50-200 KB per course)
- **Use case:** AI assistant needs to search across all materials

**Option 2: Lazy load materials on search**
- **Pros:** Smaller initial payload
- **Cons:** Requires search API, multiple round trips
- **Use case:** User-initiated searches only

**Recommendation:** **Option 1** - Load all materials when AI assistant is opened. Reasons:
1. Course materials are static (high cache hit rate)
2. AI needs full context immediately (no search latency)
3. Typical course has ~20-30 materials (~100 KB, acceptable)
4. React Query caching prevents repeated fetches

### Caching Strategy

- **Stale Time:** `10 minutes` (materials change infrequently)
- **GC Time:** `15 minutes` (keep in memory longer)
- **Invalidation:** Only when course is updated (rare in demo)

---

## Material Content Strategy

### Content Sources

For mock data, generate realistic excerpts that:
1. Match the material title (e.g., lecture on binary search includes algorithm explanation)
2. Include keywords used for search matching
3. Provide enough context for AI to reference (~200-500 words per material)
4. Match the existing AI answer templates (CS, MATH patterns)

### Material-to-Template Alignment

**CS Materials Should Cover:**
- Binary search, sorting algorithms
- Data structures (arrays, linked lists, stacks, queues, trees, graphs)
- Big O notation, complexity analysis
- Recursion, dynamic programming
- Graph algorithms (DFS, BFS, shortest path)

**MATH Materials Should Cover:**
- Integration techniques (u-substitution, integration by parts, partial fractions)
- Differentiation rules (chain rule, product rule, quotient rule)
- Series convergence tests
- Limits and continuity

**Key Insight:** Align mock material content with existing AI answer templates for consistency.

---

## Search Algorithm Design

### Keyword-Based Search

**Current Implementation (from client.ts):**
```typescript
function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', ...]);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

function calculateMatchRatio(questionKeywords: string[], templateKeywords: string[]): number {
  const matches = questionKeywords.filter(k => templateKeywords.includes(k)).length;
  return questionKeywords.length > 0 ? matches / questionKeywords.length : 0;
}
```

**Adaptation for Material Search:**
```typescript
function searchCourseMaterials(courseId: string, keywords: string[]): CourseMaterial[] {
  const materials = getCourseMaterials(courseId);

  // Score each material by keyword match
  const scoredMaterials = materials.map(material => {
    const materialText = `${material.title} ${material.content}`;
    const materialKeywords = extractKeywords(materialText);
    const relevance = calculateMatchRatio(keywords, materialKeywords);
    return { material, relevance: Math.round(relevance * 100) };
  });

  // Return materials with relevance >= 20%, sorted by relevance
  return scoredMaterials
    .filter(m => m.relevance >= 20)
    .sort((a, b) => b.relevance - a.relevance)
    .map(m => ({ ...m.material, relevance: m.relevance }));
}
```

**Key Insight:** Reuse existing keyword extraction and matching logic for consistency.

---

## Integration Points

### 1. AI Answer Generation (client.ts)

**Current:** Uses hardcoded courseMaterials map
**Future:** Call `getCourseMaterials(courseId)` instead

### 2. AI Assistant Modal (components/ai/quokka-assistant-modal.tsx)

**Current:** No context awareness
**Future:**
- Accept `courseId?` prop for context narrowing
- Load materials via `useCourseMaterials(courseId)`
- Pass materials to AI response generation

### 3. Citation Generation

**Current:** Generates Citation objects with excerpt
**Future:** Citations reference full CourseMaterial IDs

---

## Findings Summary

1. **Existing Patterns:**
   - API methods follow `get<Resource>` async pattern with 200-500ms delay
   - TypeScript interfaces use PascalCase, optional fields marked with `?`
   - React Query hooks use `use<Resource>` with query key hierarchies
   - Mock data stored as JSON arrays with deterministic IDs

2. **Material Data Exists But Is Scattered:**
   - Material metadata (title, type, keywords) embedded in `generateCitations()`
   - No full material content available for AI to reference
   - Citations already use correct `sourceType` taxonomy

3. **Search Infrastructure Exists:**
   - `extractKeywords()` and `calculateMatchRatio()` functions ready to reuse
   - Keyword-based search pattern proven in FAQ clustering

4. **Performance Is Acceptable:**
   - ~100 KB per course for 20-30 materials
   - 10-minute stale time for static content
   - No real-time updates needed

5. **Integration Is Straightforward:**
   - Replace hardcoded courseMaterials with API call
   - Add courseId context to AI assistant
   - Use existing hook patterns

---

## Recommendations for API Design

1. **Create CourseMaterial Interface:**
   - Extends existing Citation pattern
   - Adds full `content` field (markdown string)
   - Includes `keywords` for search (derived from content)

2. **Extract Material Data:**
   - Move hardcoded materials from client.ts to mocks/course-materials.json
   - Add realistic content (200-500 words per material)
   - Organize by courseId

3. **Implement Two API Methods:**
   - `getCourseMaterials(courseId)` - Return all materials (200-500ms delay)
   - `searchCourseMaterials(courseId, keywords[])` - Return filtered/scored materials (200-500ms delay)

4. **Create React Query Hooks:**
   - `useCourseMaterials(courseId)` - 10min stale time
   - No search hook needed (search is deterministic, can be done client-side)

5. **Maintain Backward Compatibility:**
   - Keep generateCitations() working
   - Update it to use getCourseMaterials() internally

---

## Next Steps

See **plans/api-design-course-materials.md** for detailed implementation plan.

---

**Research completed:** 2025-10-16
**Files analyzed:**
- `lib/api/client.ts` (1822 lines)
- `lib/models/types.ts` (1327 lines)
- `lib/api/hooks.ts` (768 lines)
- `mocks/courses.json` (68 lines)
- `mocks/ai-answers.json` (682 lines)
