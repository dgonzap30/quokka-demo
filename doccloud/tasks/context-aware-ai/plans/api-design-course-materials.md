# API Design Plan: Course Materials with Content-Aware AI

**Plan Date:** 2025-10-16
**Task:** Context-Aware AI with Course Content Access
**Planner:** Mock API Designer
**Status:** Ready for Implementation

---

## Overview

This plan defines the complete mock API implementation for course materials, enabling the AI assistant to access and reference actual course content. The design follows existing codebase patterns from `lib/api/client.ts`, maintains type safety with interfaces from Type Safety Guardian's plan, and integrates with existing AI response generation.

**Implementation Philosophy:**
- Frontend-only (no real backend)
- Deterministic mock data
- Backward compatible (no breaking changes)
- Realistic network delays
- Type-safe throughout
- Ready for backend swap

---

## 1. TypeScript Interfaces

### Location: `lib/models/types.ts`

**All types defined by Type Safety Guardian in `plans/type-design-context.md`.**

**Key Types Used in This Plan:**
```typescript
// Course material entity (lines ~170-100)
export interface CourseMaterial {
  id: string;
  courseId: string;
  type: CourseMaterialType;
  title: string;
  content: string;
  keywords: string[];
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

// Material type enum
export type CourseMaterialType =
  | "lecture"
  | "slide"
  | "assignment"
  | "reading"
  | "lab"
  | "textbook";

// Lightweight reference for AI responses
export interface MaterialReference {
  materialId: string;
  type: CourseMaterialType;
  title: string;
  excerpt: string;
  relevanceScore: number;
  link?: string;
}

// Search input/output types
export interface SearchCourseMaterialsInput {
  courseId: string;
  query: string;
  types?: CourseMaterialType[];
  limit?: number;
  minRelevance?: number;
}

export interface CourseMaterialSearchResult {
  material: CourseMaterial;
  relevanceScore: number;
  matchedKeywords: string[];
  snippet: string;
}
```

**No Changes Needed:** Type Safety Guardian already defined all required interfaces.

---

## 2. API Methods

### Location: `lib/api/client.ts`

#### 2.1 Method: `getCourseMaterials(courseId: string): Promise<CourseMaterial[]>`

**Purpose:** Fetch all course materials for a given course.

**Signature:**
```typescript
/**
 * Get all course materials for a course
 *
 * Returns all educational content (lectures, slides, assignments, readings, etc.)
 * for the specified course. Materials include full content for AI context.
 *
 * @param courseId - Course ID to fetch materials for
 * @returns Array of course materials, sorted by type then title
 * @throws Error if courseId is invalid
 */
async getCourseMaterials(courseId: string): Promise<CourseMaterial[]>
```

**Implementation Details:**
- **Delay:** 200-500ms (standard read operation)
- **Data Source:** `mocks/course-materials.json`
- **Filtering:** Return only materials matching courseId
- **Sorting:** Sort by type (lecture ’ slide ’ assignment ’ reading ’ lab ’ textbook), then title
- **Error Handling:** Return empty array `[]` if course has no materials (not throw)

**Implementation Pseudocode:**
```typescript
async getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  await delay(); // 200-500ms
  seedData(); // Ensure mock data loaded

  // Get materials from store (implemented in localStore.ts)
  const allMaterials = getCourseMaterialsFromStore();

  // Filter by courseId
  const courseMaterials = allMaterials.filter(m => m.courseId === courseId);

  // Sort by type order, then title
  const typeOrder = ["lecture", "slide", "assignment", "reading", "lab", "textbook"];
  return courseMaterials.sort((a, b) => {
    const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    if (typeComparison !== 0) return typeComparison;
    return a.title.localeCompare(b.title);
  });
}
```

**Usage Example:**
```typescript
const materials = await api.getCourseMaterials("course-cs101");
// Returns: [
//   { type: "lecture", title: "Lecture 1: Intro to Algorithms", ... },
//   { type: "lecture", title: "Lecture 2: Binary Search", ... },
//   { type: "slide", title: "Week 1 Slides", ... },
//   { type: "assignment", title: "Assignment 1: Sorting", ... },
//   ...
// ]
```

---

#### 2.2 Method: `searchCourseMaterials(input: SearchCourseMaterialsInput): Promise<CourseMaterialSearchResult[]>`

**Purpose:** Search course materials by keywords with relevance scoring.

**Signature:**
```typescript
/**
 * Search course materials by keywords
 *
 * Performs keyword-based search across material titles and content.
 * Returns results scored by relevance with matched keywords highlighted.
 *
 * @param input - Search parameters (courseId, query, optional filters)
 * @returns Array of search results sorted by relevance (highest first)
 * @throws Error if query is too short (<3 characters)
 */
async searchCourseMaterials(
  input: SearchCourseMaterialsInput
): Promise<CourseMaterialSearchResult[]>
```

**Implementation Details:**
- **Delay:** 200-300ms (keyword search is fast, not ML)
- **Data Source:** Calls `getCourseMaterials()` internally
- **Algorithm:** Keyword matching with relevance scoring
- **Minimum Query Length:** 3 characters
- **Default Limit:** 20 results
- **Default Min Relevance:** 20% match ratio
- **Type Filtering:** Optional filter by material types

**Keyword Extraction (Reuse Existing Helper):**
```typescript
// Already exists in client.ts (lines 114-122)
function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}
```

**Implementation Pseudocode:**
```typescript
async searchCourseMaterials(
  input: SearchCourseMaterialsInput
): Promise<CourseMaterialSearchResult[]> {
  await delay(200 + Math.random() * 100); // 200-300ms
  seedData();

  const { courseId, query, types, limit = 20, minRelevance = 20 } = input;

  // Validate query length
  if (query.trim().length < 3) {
    throw new Error("Search query must be at least 3 characters");
  }

  // Extract keywords from query
  const queryKeywords = extractKeywords(query);

  // Get all materials for course
  const allMaterials = await this.getCourseMaterials(courseId);

  // Filter by type if specified
  const materialsToSearch = types && types.length > 0
    ? allMaterials.filter(m => types.includes(m.type))
    : allMaterials;

  // Score each material
  const results: CourseMaterialSearchResult[] = materialsToSearch.map(material => {
    // Combine title and content for matching
    const materialText = `${material.title} ${material.content}`.toLowerCase();
    const materialKeywords = material.keywords; // Pre-computed keywords

    // Count matches
    const matchedKeywords = queryKeywords.filter(k =>
      materialKeywords.includes(k) || materialText.includes(k)
    );

    // Calculate relevance score
    const relevanceScore = queryKeywords.length > 0
      ? Math.round((matchedKeywords.length / queryKeywords.length) * 100)
      : 0;

    // Generate snippet (first 150 chars with matched keywords)
    const snippet = generateSnippet(material.content, matchedKeywords, 150);

    return {
      material,
      relevanceScore,
      matchedKeywords,
      snippet,
    };
  });

  // Filter by minimum relevance and sort
  return results
    .filter(r => r.relevanceScore >= minRelevance)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

// Helper: Generate snippet with context
function generateSnippet(content: string, keywords: string[], maxLength: number): string {
  const lowerContent = content.toLowerCase();

  // Find first occurrence of any keyword
  let startIdx = -1;
  for (const keyword of keywords) {
    const idx = lowerContent.indexOf(keyword.toLowerCase());
    if (idx !== -1 && (startIdx === -1 || idx < startIdx)) {
      startIdx = idx;
    }
  }

  if (startIdx === -1) {
    // No keyword found, return beginning
    return content.slice(0, maxLength).trim() + (content.length > maxLength ? '...' : '');
  }

  // Extract context around keyword
  const start = Math.max(0, startIdx - 50);
  const end = Math.min(content.length, start + maxLength);
  let snippet = content.slice(start, end).trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}
```

**Usage Example:**
```typescript
const results = await api.searchCourseMaterials({
  courseId: "course-cs101",
  query: "binary search algorithm",
  types: ["lecture", "slide"], // Optional: only search lectures and slides
  limit: 10, // Optional: max 10 results
  minRelevance: 30, // Optional: at least 30% match
});
// Returns: [
//   {
//     material: { type: "lecture", title: "Lecture 5: Binary Search", ... },
//     relevanceScore: 85,
//     matchedKeywords: ["binary", "search", "algorithm"],
//     snippet: "...Binary search is an efficient algorithm that works on sorted arrays..."
//   },
//   ...
// ]
```

---

#### 2.3 Enhanced Method: Integrate Materials into AI Generation

**Current Method:** `generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer>`

**Enhancement:** Replace hardcoded material references with database lookup.

**Current Implementation (lines 360-408):**
```typescript
function generateAIResponse(
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): { content: string; confidence: { level: ConfidenceLevel; score: number }; citations: Citation[] }
```

**Enhanced Internal Helper:**
```typescript
/**
 * Generate AI response with course material references
 *
 * INTERNAL HELPER - Called by generateAIAnswer()
 */
async function generateAIResponseWithMaterials(
  courseId: string,
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): Promise<{
  content: string;
  confidence: { level: ConfidenceLevel; score: number };
  citations: Citation[];
  materialReferences: MaterialReference[];
}> {
  const questionText = `${title} ${content} ${tags.join(' ')}`;
  const keywords = extractKeywords(questionText);

  // 1. Select template based on course type (EXISTING LOGIC)
  let templateList = [];
  if (courseCode.startsWith('CS')) {
    templateList = CS_TEMPLATES;
  } else if (courseCode.startsWith('MATH')) {
    templateList = MATH_TEMPLATES;
  }

  // 2. Find best matching template (EXISTING LOGIC)
  let bestMatch = GENERAL_TEMPLATE;
  let bestMatchRatio = 0;

  if (templateList.length > 0) {
    for (const template of templateList) {
      const ratio = calculateMatchRatio(keywords, template.keywords);
      if (ratio > bestMatchRatio) {
        bestMatchRatio = ratio;
        bestMatch = template;
      }
    }
  }

  // 3. Calculate confidence (EXISTING LOGIC)
  const confidenceScore = Math.round(55 + (bestMatchRatio * 40));
  const confidenceLevel = getConfidenceLevel(confidenceScore);

  // 4. NEW: Get materials from database instead of hardcoded
  let materials: CourseMaterial[] = [];
  try {
    materials = await api.getCourseMaterials(courseId);
  } catch (error) {
    console.warn('Failed to load course materials:', error);
    // Fall back to existing hardcoded citation logic
    const citations = generateCitations(courseCode, keywords);
    return {
      content: bestMatch.content,
      confidence: { level: confidenceLevel, score: confidenceScore },
      citations,
      materialReferences: [],
    };
  }

  // 5. NEW: Score materials by keyword matches
  const scoredMaterials = materials.map(material => {
    const materialKeywords = material.keywords;
    const matches = keywords.filter(k => materialKeywords.includes(k)).length;
    const relevance = Math.min(95, 60 + (matches * 10)); // Same formula as old citations
    return { material, relevance, matches };
  });

  // 6. NEW: Sort by relevance and take top 2-3
  const topMaterials = scoredMaterials
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3 materials

  // 7. NEW: Generate Citation[] for backward compatibility
  const citations: Citation[] = topMaterials.map(({ material, relevance }) => ({
    id: generateId('cite'),
    sourceType: material.type,
    source: material.title,
    excerpt: generateExcerpt(material.content, keywords),
    relevance,
    link: undefined, // Mock
  }));

  // 8. NEW: Generate MaterialReference[] for enhanced responses
  const materialReferences: MaterialReference[] = topMaterials.map(({ material, relevance }) => ({
    materialId: material.id,
    type: material.type,
    title: material.title,
    excerpt: generateExcerpt(material.content, keywords),
    relevanceScore: relevance,
    link: undefined, // Mock
  }));

  return {
    content: bestMatch.content,
    confidence: { level: confidenceLevel, score: confidenceScore },
    citations,
    materialReferences,
  };
}

// Helper: Generate relevant excerpt from material content
function generateExcerpt(content: string, keywords: string[]): string {
  const lowerContent = content.toLowerCase();

  // Find first occurrence of any keyword
  let startIdx = -1;
  for (const keyword of keywords) {
    const idx = lowerContent.indexOf(keyword.toLowerCase());
    if (idx !== -1 && (startIdx === -1 || idx < startIdx)) {
      startIdx = idx;
    }
  }

  if (startIdx === -1) {
    // No keyword found, return beginning
    return content.slice(0, 150).trim() + '...';
  }

  // Extract context around keyword (150 chars)
  const start = Math.max(0, startIdx - 40);
  const end = Math.min(content.length, start + 150);
  let excerpt = content.slice(start, end).trim();

  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt;
}
```

**Integration into Existing `generateAIAnswer()`:**
```typescript
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  await delay(800 + Math.random() * 400); // 800-1200ms (UNCHANGED)
  seedData();

  const thread = getThreadById(input.threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${input.threadId}`);
  }

  const course = getCourseById(input.courseId);
  if (!course) {
    throw new Error(`Course not found: ${input.courseId}`);
  }

  // NEW: Use enhanced helper with materials
  const { content, confidence, citations } = await generateAIResponseWithMaterials(
    input.courseId, // NEW: Pass courseId
    course.code,
    input.title,
    input.content,
    input.tags || []
  );

  // Rest of method UNCHANGED
  const aiAnswer: AIAnswer = {
    id: generateId("ai"),
    threadId: input.threadId,
    courseId: input.courseId,
    content,
    confidenceLevel: confidence.level,
    confidenceScore: confidence.score,
    citations,
    studentEndorsements: 0,
    instructorEndorsements: 0,
    totalEndorsements: 0,
    endorsedBy: [],
    instructorEndorsed: false,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  addAIAnswer(aiAnswer);
  updateThread(input.threadId, {
    hasAIAnswer: true,
    aiAnswerId: aiAnswer.id,
    updatedAt: new Date().toISOString(),
  });

  return aiAnswer;
}
```

**Backward Compatibility:** Existing code using `generateAIAnswer()` works without changes. Citations are still populated using material data.

---

#### 2.4 Optional Helper: `getMaterialReferences(courseId: string, keywords: string[], limit?: number): Promise<MaterialReference[]>`

**Purpose:** Lightweight method to get material references without full search results.

**Signature:**
```typescript
/**
 * Get material references for keywords (lightweight)
 *
 * Returns lightweight MaterialReference objects for AI responses.
 * Faster than full search since it skips snippet generation.
 *
 * @param courseId - Course to search in
 * @param keywords - Pre-extracted keywords
 * @param limit - Max references to return (default: 3)
 * @returns Array of material references sorted by relevance
 */
async getMaterialReferences(
  courseId: string,
  keywords: string[],
  limit: number = 3
): Promise<MaterialReference[]>
```

**Implementation Pseudocode:**
```typescript
async getMaterialReferences(
  courseId: string,
  keywords: string[],
  limit: number = 3
): Promise<MaterialReference[]> {
  await delay(100 + Math.random() * 100); // 100-200ms (very fast, no snippet generation)
  seedData();

  const materials = await this.getCourseMaterials(courseId);

  // Score materials
  const scoredMaterials = materials.map(material => {
    const matches = keywords.filter(k => material.keywords.includes(k)).length;
    const relevance = Math.min(95, 60 + (matches * 10));
    return { material, relevance };
  });

  // Return top N as MaterialReferences
  return scoredMaterials
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(({ material, relevance }) => ({
      materialId: material.id,
      type: material.type,
      title: material.title,
      excerpt: generateExcerpt(material.content, keywords),
      relevanceScore: relevance,
      link: undefined,
    }));
}
```

**Usage:** Internal use by AI generation. Not exposed in hooks (optional).

---

## 3. React Query Hooks

### Location: `lib/api/hooks.ts`

#### 3.1 Hook: `useCourseMaterials(courseId: string | undefined)`

**Purpose:** Fetch all materials for a course.

**Implementation:**
```typescript
import type { CourseMaterial } from "@/lib/models/types";

/**
 * Hook to fetch all course materials
 *
 * Returns all educational content for a course. Materials are cached
 * for 10 minutes since they change infrequently.
 *
 * @param courseId - Course ID to fetch materials for (undefined disables query)
 * @returns React Query result with materials array
 */
export function useCourseMaterials(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courseMaterials", courseId],
    queryFn: () => {
      if (!courseId) throw new Error("Course ID required");
      return api.getCourseMaterials(courseId);
    },
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // 10 minutes (materials are static)
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });
}
```

**Query Key Structure:** `["courseMaterials", courseId]`

**Invalidation Triggers:**
- None (materials are read-only in demo)
- Future: When instructor updates course content

**Usage Example:**
```typescript
const { data: materials, isLoading, error } = useCourseMaterials(courseId);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage />;

return (
  <div>
    {materials?.map(material => (
      <MaterialCard key={material.id} material={material} />
    ))}
  </div>
);
```

---

#### 3.2 Hook: `useMultiCourseMaterials(courseIds: string[])`

**Purpose:** Fetch materials for multiple courses in parallel (for multi-course AI context).

**Implementation:**
```typescript
import type { CourseMaterial } from "@/lib/models/types";
import { useQueries } from "@tanstack/react-query";

/**
 * Hook to fetch materials for multiple courses in parallel
 *
 * Useful when AI needs context from all enrolled courses.
 * Executes queries in parallel for better performance.
 *
 * @param courseIds - Array of course IDs to fetch materials for
 * @returns Array of query results, one per course
 */
export function useMultiCourseMaterials(courseIds: string[]) {
  return useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ["courseMaterials", courseId],
      queryFn: () => api.getCourseMaterials(courseId),
      enabled: !!courseId,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    })),
  });
}
```

**Usage Example:**
```typescript
const enrolledCourseIds = ["course-cs101", "course-math221"];
const materialQueries = useMultiCourseMaterials(enrolledCourseIds);

// Check if all queries loaded
const allLoaded = materialQueries.every(q => !q.isLoading);
const anyError = materialQueries.some(q => q.error);

// Flatten all materials
const allMaterials = materialQueries
  .filter(q => q.data)
  .flatMap(q => q.data!);
```

**Performance:** Parallel fetching (300ms total) vs sequential (600ms for 2 courses).

---

#### 3.3 Hook: `useSearchCourseMaterials(input: SearchCourseMaterialsInput | null)`

**Purpose:** Search materials with debouncing (optional, Phase 2).

**Implementation:**
```typescript
import type { SearchCourseMaterialsInput, CourseMaterialSearchResult } from "@/lib/models/types";
import { useDebounce } from "@/lib/hooks/useDebounce"; // Assuming this exists

/**
 * Hook to search course materials (debounced)
 *
 * Debounces query input to avoid excessive API calls during typing.
 * Disabled if query is too short (<3 chars).
 *
 * @param input - Search parameters (null disables query)
 * @param debounceMs - Debounce delay in ms (default: 300)
 * @returns React Query result with search results
 */
export function useSearchCourseMaterials(
  input: SearchCourseMaterialsInput | null,
  debounceMs: number = 300
) {
  const debouncedInput = useDebounce(input, debounceMs);

  return useQuery({
    queryKey: ["searchCourseMaterials", debouncedInput],
    queryFn: () => {
      if (!debouncedInput) throw new Error("Search input required");
      return api.searchCourseMaterials(debouncedInput);
    },
    enabled: !!debouncedInput && debouncedInput.query.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes (search results change slowly)
  });
}
```

**Query Key Structure:** `["searchCourseMaterials", { courseId, query, types, limit, minRelevance }]`

**Invalidation Triggers:** None (deterministic search)

**Usage Example:**
```typescript
const [searchQuery, setSearchQuery] = useState("");

const { data: results, isLoading } = useSearchCourseMaterials(
  searchQuery.length >= 3
    ? { courseId: "course-cs101", query: searchQuery }
    : null
);

return (
  <div>
    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
    {isLoading && <Spinner />}
    {results?.map(result => (
      <SearchResultCard key={result.material.id} result={result} />
    ))}
  </div>
);
```

---

## 4. Mock Data Structure

### File: `mocks/course-materials.json`

**Structure:**
```json
[
  {
    "id": "mat-cs101-lecture-1",
    "courseId": "course-cs101",
    "type": "lecture",
    "title": "Lecture 1: Introduction to Algorithms",
    "content": "An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. In computer science, algorithms are the foundation of all programs and data processing. This lecture introduces key concepts including algorithm correctness, efficiency, and analysis.\n\nKey topics covered:\n- What is an algorithm?\n- Algorithm properties: finiteness, definiteness, input, output, effectiveness\n- Algorithm representation: pseudocode and flowcharts\n- Introduction to time complexity and Big O notation\n- Examples: linear search, finding maximum element\n\nBy the end of this lecture, you should understand the fundamental characteristics that make a procedure an algorithm and be able to analyze simple algorithms for correctness.",
    "keywords": ["algorithm", "introduction", "complexity", "correctness", "pseudocode", "analysis"],
    "metadata": {
      "week": 1,
      "date": "2025-09-02T10:00:00Z",
      "authorId": "user-instructor-1"
    },
    "createdAt": "2025-08-20T00:00:00Z",
    "updatedAt": "2025-08-20T00:00:00Z"
  },
  {
    "id": "mat-cs101-lecture-5",
    "courseId": "course-cs101",
    "type": "lecture",
    "title": "Lecture 5: Binary Search and Divide-and-Conquer",
    "content": "Binary search is an efficient algorithm for finding a target value in a sorted array. It uses the divide-and-conquer strategy to repeatedly halve the search space.\n\nHow binary search works:\n1. Start with the middle element of the sorted array\n2. If the target equals the middle element, return its position\n3. If the target is less than the middle element, search the left half\n4. If the target is greater than the middle element, search the right half\n5. Repeat until the target is found or the search space is empty\n\nTime complexity: O(log n) - much faster than linear search O(n) for large datasets\n\nSpace complexity: O(1) for iterative implementation, O(log n) for recursive (due to call stack)\n\nKey requirement: The array MUST be sorted first. If unsorted, you need to sort it first (O(n log n)) or use linear search.\n\nPython implementation:\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return -1  # Not found\n```\n\nDivide-and-conquer is a powerful algorithmic paradigm where you:\n1. Divide the problem into smaller subproblems\n2. Conquer each subproblem recursively\n3. Combine solutions to solve the original problem\n\nBinary search is a simple example. More complex examples include merge sort, quicksort, and the FFT algorithm.",
    "keywords": ["binary", "search", "divide", "conquer", "sorted", "array", "logarithmic", "efficiency"],
    "metadata": {
      "week": 3,
      "date": "2025-09-16T10:00:00Z",
      "authorId": "user-instructor-1"
    },
    "createdAt": "2025-08-20T00:00:00Z",
    "updatedAt": "2025-08-20T00:00:00Z"
  }
]
```

**Seed Data Requirements:**

**For CS 101 (course-cs101):**
- 5-6 lectures covering:
  - Intro to algorithms
  - Big O notation and complexity
  - Binary search and divide-and-conquer
  - Data structures (arrays, linked lists)
  - Sorting algorithms (bubble, merge, quick)
  - Recursion basics
- 3-4 slide decks summarizing lecture content
- 2-3 assignments on algorithm implementation
- 2 readings (e.g., "How to Think Like a Computer Scientist", "Algorithm Design Patterns")

**For MATH 221 (course-math221):**
- 5-6 lectures covering:
  - Integration techniques (u-substitution)
  - Integration by parts (LIATE rule)
  - Partial fractions decomposition
  - Trigonometric substitution
  - Sequences and series
  - Convergence tests
- 3-4 slide decks with formulas and examples
- 2-3 assignments on integration practice
- 2 readings (e.g., "Calculus Made Easy", "The Fundamental Theorem of Calculus")

**Keyword Guidelines:**
- 5-10 keywords per material
- Include technical terms (e.g., "binary search", "integration", "recursion")
- Include common student query terms (e.g., "how to", "what is", "example")
- Match keywords in existing AI answer templates

**Content Length:**
- Lectures: 400-600 words (detailed explanation)
- Slides: 200-300 words (summary + bullet points)
- Assignments: 150-250 words (problem statement)
- Readings: 300-500 words (article excerpt or summary)

**Deterministic IDs:**
- Format: `mat-{courseCode}-{type}-{number}`
- Examples: `mat-cs101-lecture-1`, `mat-math221-assignment-2`

---

## 5. Implementation Checklist

### Phase 1: Type Definitions (Already Complete)
- [x] CourseMaterial interface defined
- [x] MaterialReference interface defined
- [x] SearchCourseMaterialsInput defined
- [x] CourseMaterialSearchResult defined
- [x] Type guards implemented

### Phase 2: Mock Data Creation
- [ ] Create `mocks/course-materials.json`
- [ ] Add 5-6 lectures for CS 101
- [ ] Add 3-4 slide decks for CS 101
- [ ] Add 2-3 assignments for CS 101
- [ ] Add 2 readings for CS 101
- [ ] Add 5-6 lectures for MATH 221
- [ ] Add 3-4 slide decks for MATH 221
- [ ] Add 2-3 assignments for MATH 221
- [ ] Add 2 readings for MATH 221
- [ ] Verify JSON structure matches CourseMaterial interface
- [ ] Ensure keywords align with AI templates

### Phase 3: Local Store Integration
- [ ] Add `getCourseMaterialsFromStore()` to `lib/store/localStore.ts`
- [ ] Import course-materials.json in seedData()
- [ ] Add materials to in-memory store

### Phase 4: API Methods (lib/api/client.ts)
- [ ] Implement `getCourseMaterials(courseId)`
- [ ] Implement `searchCourseMaterials(input)`
- [ ] Implement `generateExcerpt(content, keywords)` helper
- [ ] Implement `generateSnippet(content, keywords, maxLength)` helper
- [ ] Enhance `generateAIResponseWithMaterials()` helper
- [ ] Update `generateAIAnswer()` to use materials
- [ ] Test: Verify delay times (200-500ms reads, 800ms AI)
- [ ] Test: Verify sorting (type ’ title)
- [ ] Test: Verify search relevance scoring
- [ ] Test: Verify backward compatibility (existing citations still work)

### Phase 5: React Query Hooks (lib/api/hooks.ts)
- [ ] Implement `useCourseMaterials(courseId)`
- [ ] Implement `useMultiCourseMaterials(courseIds)`
- [ ] Implement `useSearchCourseMaterials(input)` (optional, Phase 2)
- [ ] Verify query keys follow convention
- [ ] Verify stale time = 10 minutes
- [ ] Verify enabled conditions work
- [ ] Test: Parallel queries with useMultiCourseMaterials

### Phase 6: Integration Testing
- [ ] Test: Load materials for CS 101
- [ ] Test: Load materials for MATH 221
- [ ] Test: Search with keywords "binary search"
- [ ] Test: AI generation uses actual materials
- [ ] Test: Citations reference real material IDs
- [ ] Test: Empty course returns []
- [ ] Test: Invalid courseId returns []
- [ ] Test: Short query (<3 chars) throws error

### Phase 7: Type Safety Verification
- [ ] Run `npx tsc --noEmit` - no errors
- [ ] Verify all imports use `import type` for types
- [ ] Verify no `any` types in implementation
- [ ] Verify all Promises typed correctly

### Phase 8: Performance Testing
- [ ] Measure API delay times (200-500ms expected)
- [ ] Measure search time (200-300ms expected)
- [ ] Verify React Query caching works (second load instant)
- [ ] Test parallel queries (useMultiCourseMaterials)

---

## 6. Backend Integration Notes

### What Will Change When Connecting to Real Backend

1. **API Methods:**
   - Replace `await delay()` with `fetch()` calls
   - Add authentication headers (JWT tokens)
   - Handle HTTP status codes (404, 403, 500)
   - Parse JSON responses with error handling

2. **Error Handling:**
   - Network timeouts and offline errors
   - 404 Not Found (missing course/material)
   - 403 Forbidden (permission denied)
   - 500 Server Error (backend issues)

3. **Search Implementation:**
   - Replace keyword matching with full-text search
   - Use search engine (Elasticsearch, Algolia)
   - Semantic search with embeddings (OpenAI, Cohere)
   - Faceted filtering (type, date range, author)
   - Pagination for large result sets

4. **Data Format:**
   - Pagination metadata (page, limit, total)
   - Cursor-based navigation for infinite scroll
   - ETag headers for caching
   - Rate limiting headers

5. **AI Generation:**
   - Real LLM API calls (OpenAI, Anthropic)
   - Streaming responses for progressive display
   - Token usage tracking and limits
   - Cost optimization (caching, prompt engineering)

### What Stays the Same

1. **Type Signatures:** All interfaces remain valid
2. **Hook APIs:** React Query patterns unchanged
3. **Component Integration:** No prop changes needed
4. **Query Keys:** Same invalidation logic works
5. **Error Boundaries:** React Query handles errors

---

## 7. Quality Checklist

Before marking this plan complete, verify:

- [x] All API method signatures defined with exact types
- [x] All delays specified (200-500ms reads, 800ms AI)
- [x] Return types specified for all methods
- [x] Error handling defined (throw vs return null)
- [x] Mock data structure matches interfaces
- [x] React Query hooks follow existing patterns
- [x] Query keys hierarchical and consistent
- [x] Stale time appropriate (10min for materials)
- [x] Backward compatibility maintained
- [x] No breaking changes to existing code
- [x] Integration with AI generation designed
- [x] Backend swap path documented

---

## 8. Risk Assessment

### Low Risk
- Adding new API methods (purely additive)
- Adding new mock data file (isolated change)
- Adding new React Query hooks (no breaking changes)

### Medium Risk
- Modifying AI generation logic (potential regression)
- Keyword search performance (O(n*m) complexity)

### Mitigation
- Keep old citation generation as fallback
- Thorough testing of AI responses
- Performance testing with realistic data volumes
- Gradual rollout (add methods ’ integrate ’ deprecate old)

---

## 9. Performance Impact

### Compile Time
- **Negligible:** ~200 lines of new code, <100ms compile time increase

### Runtime
- **Material Loading:** 200-500ms initial load, then cached for 10min
- **Search:** 200-300ms per search, deterministic results
- **AI Generation:** +0ms (materials cached), same 800ms AI delay
- **Memory:** ~50-75KB per course in cache, ~300-450KB total for 6 courses

### Bundle Size
- **Zero:** Type-only imports stripped at compile time
- **API Methods:** ~5KB minified (new functions)
- **Hooks:** ~2KB minified

---

## 10. Success Criteria

This plan is successful when:

1.  All API methods compile without errors
2.  Mock data loads successfully
3.  AI generation uses real materials
4.  Search returns relevant results
5.  React Query caching works (second load instant)
6.  No breaking changes to existing code
7.  `npx tsc --noEmit` passes
8.  `npm run lint` passes
9.  No console errors in dev mode
10.  Manual testing confirms correct behavior

---

## 11. Implementation Order

1. **First:** Create mock data file (`mocks/course-materials.json`)
2. **Second:** Add localStore methods for materials
3. **Third:** Implement API methods in `lib/api/client.ts`
4. **Fourth:** Implement React Query hooks in `lib/api/hooks.ts`
5. **Fifth:** Enhance AI generation to use materials
6. **Sixth:** Run type checks and verify compilation
7. **Seventh:** Test all methods manually
8. **Eighth:** Verify backward compatibility

---

## 12. Estimated Effort

- **Mock Data Creation:** ~2 hours (write realistic content)
- **API Methods:** ~1.5 hours (implement 3 methods + helpers)
- **React Query Hooks:** ~45 minutes (follow existing patterns)
- **AI Generation Integration:** ~1 hour (careful modification)
- **Testing:** ~1 hour (manual testing + verification)

**Total:** ~6 hours for complete implementation

---

## 13. Related Plans

This API design plan depends on:
- **Type Design Plan** (complete) - Provides all interface definitions

This plan enables:
- **Component Design Plan** - AI modal can use course materials
- **Data Fetching Plan** - React Query hooks ready for use

---

## 14. Decision Summary

**Key Design Decisions:**

1. **Load All Materials:** Chose to load all materials per course (not lazy load) for better AI context
2. **Keyword Search:** Chose simple keyword matching over semantic search (realistic for mock)
3. **Backward Compatible:** Enhanced AI generation maintains existing citation logic as fallback
4. **Deterministic IDs:** Use `mat-{courseCode}-{type}-{number}` format for consistency
5. **Parallel Queries:** Added `useMultiCourseMaterials()` for multi-course AI context
6. **10-Minute Cache:** Materials are static, long cache reduces API calls

---

## Conclusion

This plan provides a complete, implementable mock API for course materials with full integration into AI response generation. All methods follow existing codebase patterns, maintain type safety, and are ready for backend swap.

**Ready for parent approval and implementation.**

---

**File Path Summary:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts` - API methods
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts` - React Query hooks
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts` - Store methods
- `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/course-materials.json` - Mock data (NEW)
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` - Types (already defined)

**Next Step:** Update Decisions section in `context.md` with summary.
