# API Design Plan - AI-First Q&A System

**Date:** 2025-10-06
**Task:** AI-First Question Answering System
**Agent:** Mock API Designer

---

## Overview

This plan defines the complete mock API layer for automatic AI answer generation when threads are created. It includes API methods, React Query hooks, mock data generation algorithms, and localStorage storage patterns - all designed for easy backend swap while maintaining clean contract stability.

---

## 1. TypeScript Interfaces

All types defined in the Type Design Plan (`plans/type-design.md`) will be used:

- **AIAnswer** - Core AI answer entity with confidence scoring and citations
- **Citation** - Individual citation to course materials
- **ConfidenceLevel** - 'high' | 'medium' | 'low'
- **CitationSourceType** - 'lecture' | 'textbook' | 'slides' | etc.
- **GenerateAIAnswerInput** - Input for AI generation
- **EndorseAIAnswerInput** - Input for endorsement
- **ThreadWithAIAnswer** - Thread enriched with AI answer
- **Thread extension** - hasAIAnswer?: boolean, aiAnswerId?: string

See `plans/type-design.md` for exact interfaces and implementation details.

---

## 2. API Methods

### Location: `lib/api/client.ts`

All methods will be added to the `api` object (after existing methods, around line 855).

---

### Method 1: `generateAIAnswer()`

**Purpose:** Generate AI answer for a thread using template-based responses

**Signature:**
```typescript
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer>
```

**Parameters:**
```typescript
interface GenerateAIAnswerInput {
  threadId: string;
  courseId: string;
  questionTitle: string;
  questionContent: string;
  tags?: string[];
}
```

**Returns:** `Promise<AIAnswer>`

**Delay:** 800-1200ms (realistic LLM generation)
```typescript
await delay(800 + Math.random() * 400);
```

**Mock Data Generation Logic:**

1. **Determine Course Type** (based on courseId prefix)
   ```typescript
   const course = getCourseById(input.courseId);
   const courseCode = course?.code || '';
   const courseType = courseCode.startsWith('CS') ? 'computer-science'
     : courseCode.startsWith('MATH') ? 'mathematics'
     : courseCode.startsWith('PHYS') ? 'physics'
     : 'general';
   ```

2. **Extract Keywords** (from title and content)
   ```typescript
   const keywords = [
     ...input.questionTitle.toLowerCase().split(/\s+/),
     ...input.questionContent.toLowerCase().split(/\s+/),
     ...(input.tags || [])
   ].filter(w => w.length > 3); // Filter short words
   ```

3. **Match Template Response** (see Template Strategy section below)
   ```typescript
   const template = matchTemplate(courseType, keywords);
   const content = template.generateContent(input);
   ```

4. **Calculate Confidence Score**
   ```typescript
   const confidence = calculateConfidence(keywords, template);
   // Returns { score: number, level: ConfidenceLevel }
   ```

5. **Generate Citations** (3-5 relevant sources)
   ```typescript
   const citations = generateCitations(courseType, keywords, input.courseId);
   // Returns Citation[] with 3-5 items
   ```

6. **Create AIAnswer Object**
   ```typescript
   const aiAnswer: AIAnswer = {
     id: generateId('ai'),
     threadId: input.threadId,
     content: content,
     confidenceLevel: confidence.level,
     confidenceScore: confidence.score,
     citations: citations,
     studentEndorsements: 0,
     instructorEndorsements: 0,
     totalEndorsements: 0,
     currentUserEndorsed: false,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
   };
   ```

7. **Store in localStorage**
   ```typescript
   addAIAnswer(aiAnswer); // localStore function
   ```

8. **Update Thread**
   ```typescript
   updateThread(input.threadId, {
     hasAIAnswer: true,
     aiAnswerId: aiAnswer.id,
     updatedAt: new Date().toISOString(),
   });
   ```

**Error Handling:**
- Throws Error if threadId invalid
- Throws Error if courseId not found
- Gracefully handles empty keywords (uses fallback template)

**Example Implementation:**
```typescript
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  await delay(800 + Math.random() * 400); // 800-1200ms
  seedData();

  const thread = getThreadById(input.threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${input.threadId}`);
  }

  const course = getCourseById(input.courseId);
  if (!course) {
    throw new Error(`Course not found: ${input.courseId}`);
  }

  // Generate AI answer using template system
  const { content, confidence, citations } = generateAIResponse({
    courseCode: course.code,
    questionTitle: input.questionTitle,
    questionContent: input.questionContent,
    tags: input.tags,
  });

  const aiAnswer: AIAnswer = {
    id: generateId('ai'),
    threadId: input.threadId,
    content,
    confidenceLevel: confidence.level,
    confidenceScore: confidence.score,
    citations,
    studentEndorsements: 0,
    instructorEndorsements: 0,
    totalEndorsements: 0,
    currentUserEndorsed: false,
    createdAt: new Date().toISOString(),
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

---

### Method 2: `getAIAnswer()`

**Purpose:** Fetch AI answer by thread ID

**Signature:**
```typescript
async getAIAnswer(threadId: string): Promise<AIAnswer | null>
```

**Parameters:**
- `threadId: string` - ID of the thread

**Returns:** `Promise<AIAnswer | null>`
- Returns AIAnswer if found
- Returns null if not found or thread has no AI answer

**Delay:** 200-400ms (standard read)
```typescript
await delay(200 + Math.random() * 200);
```

**Implementation:**
```typescript
async getAIAnswer(threadId: string): Promise<AIAnswer | null> {
  await delay(200 + Math.random() * 200);
  seedData();

  const thread = getThreadById(threadId);
  if (!thread || !thread.hasAIAnswer || !thread.aiAnswerId) {
    return null;
  }

  return getAIAnswerById(thread.aiAnswerId);
}
```

**Error Handling:**
- Returns null (no throws)
- Gracefully handles missing thread
- Handles threads without AI answers

---

### Method 3: `endorseAIAnswer()`

**Purpose:** Endorse an AI answer (tracks student vs instructor endorsements)

**Signature:**
```typescript
async endorseAIAnswer(input: EndorseAIAnswerInput): Promise<AIAnswer>
```

**Parameters:**
```typescript
interface EndorseAIAnswerInput {
  aiAnswerId: string;
  userId: string;
  userRole: UserRole; // 'student' | 'instructor' | 'ta'
}
```

**Returns:** `Promise<AIAnswer>` - Updated AI answer with new endorsement counts

**Delay:** 100ms (quick action)
```typescript
await delay(100);
```

**Endorsement Weight Logic:**
```typescript
const endorsementValue = input.userRole === 'instructor' ? 3 : 1;
// Instructor endorsements = 3 points
// Student/TA endorsements = 1 point
```

**Implementation:**
```typescript
async endorseAIAnswer(input: EndorseAIAnswerInput): Promise<AIAnswer> {
  await delay(100);
  seedData();

  const aiAnswer = getAIAnswerById(input.aiAnswerId);
  if (!aiAnswer) {
    throw new Error(`AI answer not found: ${input.aiAnswerId}`);
  }

  // Check if user already endorsed (prevent double endorsement)
  const endorsements = getAIAnswerEndorsements(input.aiAnswerId);
  const alreadyEndorsed = endorsements.some(e => e.userId === input.userId);

  if (alreadyEndorsed) {
    throw new Error('User has already endorsed this AI answer');
  }

  // Calculate endorsement value
  const endorsementValue = input.userRole === 'instructor' ? 3 : 1;

  // Update endorsement counts
  const updates: Partial<AIAnswer> = {
    totalEndorsements: aiAnswer.totalEndorsements + endorsementValue,
    updatedAt: new Date().toISOString(),
  };

  if (input.userRole === 'instructor') {
    updates.instructorEndorsements = aiAnswer.instructorEndorsements + 1;
  } else {
    updates.studentEndorsements = aiAnswer.studentEndorsements + 1;
  }

  // Store endorsement record
  addAIAnswerEndorsement({
    id: generateId('endorsement'),
    aiAnswerId: input.aiAnswerId,
    userId: input.userId,
    userRole: input.userRole,
    createdAt: new Date().toISOString(),
  });

  // Update AI answer
  const updatedAnswer = updateAIAnswer(input.aiAnswerId, updates);
  return updatedAnswer;
}
```

**Error Handling:**
- Throws Error if AI answer not found
- Throws Error if user already endorsed
- Validates userRole is valid

---

### Method 4: `createThread()` - MODIFIED

**Purpose:** Extend existing createThread to auto-generate AI answer

**Current Signature:**
```typescript
async createThread(input: CreateThreadInput, authorId: string): Promise<Thread>
```

**Modified Implementation:**
```typescript
async createThread(input: CreateThreadInput, authorId: string): Promise<Thread> {
  await delay(400 + Math.random() * 200); // 400-600ms (thread creation)
  seedData();

  const newThread: Thread = {
    id: generateId('thread'),
    courseId: input.courseId,
    title: input.title,
    content: input.content,
    authorId,
    status: 'open',
    tags: input.tags || [],
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // NEW: Initialize AI answer fields
    hasAIAnswer: false,
    aiAnswerId: undefined,
  };

  addThread(newThread);

  // AUTO-GENERATE AI ANSWER (synchronous for better UX)
  // Additional 800-1200ms delay will be added by generateAIAnswer
  try {
    const aiAnswer = await this.generateAIAnswer({
      threadId: newThread.id,
      courseId: input.courseId,
      questionTitle: input.title,
      questionContent: input.content,
      tags: input.tags,
    });

    // Thread already updated by generateAIAnswer
    // Return thread with AI answer fields populated
    return {
      ...newThread,
      hasAIAnswer: true,
      aiAnswerId: aiAnswer.id,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to generate AI answer:', error);
    // Return thread without AI answer (graceful degradation)
    return newThread;
  }
}
```

**Total Delay:** 1200-1800ms (400-600ms thread + 800-1200ms AI)

**Breaking Changes:** None
- Signature unchanged
- Return type unchanged (Thread)
- AI generation is transparent to caller

---

### Method 5: `getThread()` - MODIFIED

**Purpose:** Extend existing getThread to include AI answer

**Current Signature:**
```typescript
async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[] } | null>
```

**New Return Type:**
```typescript
async getThread(threadId: string): Promise<{
  thread: Thread;
  aiAnswer: AIAnswer | null;
  posts: Post[];
} | null>
```

**Modified Implementation:**
```typescript
async getThread(threadId: string): Promise<{ thread: Thread; aiAnswer: AIAnswer | null; posts: Post[] } | null> {
  await delay();
  seedData();

  const thread = getThreadById(threadId);
  if (!thread) return null;

  const posts = getPostsByThread(threadId);

  // NEW: Fetch AI answer if exists
  let aiAnswer: AIAnswer | null = null;
  if (thread.hasAIAnswer && thread.aiAnswerId) {
    aiAnswer = getAIAnswerById(thread.aiAnswerId);
  }

  // Increment view count
  updateThread(threadId, { views: thread.views + 1 });

  return {
    thread: { ...thread, views: thread.views + 1 },
    aiAnswer,
    posts: posts.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  };
}
```

**Breaking Changes:** POTENTIAL BREAKING
- Adds `aiAnswer` field to return object
- Existing code accessing return value must handle new field
- **Mitigation:** Optional chaining/defaults in consuming code

---

## 3. React Query Hooks

### Location: `lib/api/hooks.ts`

Add new hooks after existing hooks (around line 332).

---

### Hook 1: `useAIAnswer()`

**Purpose:** Fetch AI answer for a thread

**Signature:**
```typescript
function useAIAnswer(threadId: string | undefined)
```

**Query Key:**
```typescript
const queryKeys = {
  // ... existing keys
  aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,
};
```

**Implementation:**
```typescript
/**
 * Get AI answer for a thread
 */
export function useAIAnswer(threadId: string | undefined) {
  return useQuery({
    queryKey: threadId ? queryKeys.aiAnswer(threadId) : ["aiAnswer"],
    queryFn: () => (threadId ? api.getAIAnswer(threadId) : Promise.resolve(null)),
    enabled: !!threadId,
    staleTime: 2 * 60 * 1000, // 2 minutes (same as threads)
    gcTime: 5 * 60 * 1000,
  });
}
```

**Stale Time:** 2 minutes (AI answers rarely change except endorsements)

**Enabled:** Only when threadId exists

**Invalidated By:**
- `useCreateThread()` (new AI answer generated)
- `useEndorseAIAnswer()` (endorsement count changes)

---

### Hook 2: `useEndorseAIAnswer()`

**Purpose:** Endorse an AI answer (mutation)

**Signature:**
```typescript
function useEndorseAIAnswer()
```

**Implementation:**
```typescript
/**
 * Endorse AI answer mutation
 */
export function useEndorseAIAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EndorseAIAnswerInput) => api.endorseAIAnswer(input),
    onSuccess: (updatedAnswer) => {
      // Invalidate AI answer query
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiAnswer(updatedAnswer.threadId)
      });

      // Invalidate thread query (thread view shows endorsement change)
      queryClient.invalidateQueries({
        queryKey: queryKeys.thread(updatedAnswer.threadId)
      });

      // NO need to invalidate courseThreads (endorsements don't affect list view)
    },
  });
}
```

**Optimistic Update Strategy:**
```typescript
// Optional enhancement (not required for MVP)
onMutate: async (input) => {
  await queryClient.cancelQueries({
    queryKey: queryKeys.aiAnswer(input.aiAnswerId)
  });

  const previousAnswer = queryClient.getQueryData(
    queryKeys.aiAnswer(input.aiAnswerId)
  );

  // Optimistically update endorsement count
  queryClient.setQueryData(
    queryKeys.aiAnswer(input.aiAnswerId),
    (old: AIAnswer | undefined) => {
      if (!old) return old;
      const endorsementValue = input.userRole === 'instructor' ? 3 : 1;
      return {
        ...old,
        totalEndorsements: old.totalEndorsements + endorsementValue,
        studentEndorsements: input.userRole === 'student'
          ? old.studentEndorsements + 1
          : old.studentEndorsements,
        instructorEndorsements: input.userRole === 'instructor'
          ? old.instructorEndorsements + 1
          : old.instructorEndorsements,
      };
    }
  );

  return { previousAnswer };
},
onError: (_err, _input, context) => {
  // Rollback on error
  if (context?.previousAnswer) {
    queryClient.setQueryData(
      queryKeys.aiAnswer(input.aiAnswerId),
      context.previousAnswer
    );
  }
},
```

**Invalidation Triggers:**
- Endorsement success → invalidates `aiAnswer(threadId)` and `thread(threadId)`

---

### Hook 3: `useCreateThread()` - MODIFIED

**Current Implementation:**
```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(newThread.courseId) });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
    },
  });
}
```

**Modified Implementation (add AI answer invalidation):**
```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (newThread) => {
      // Existing invalidations
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(newThread.courseId) });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });

      // NEW: Invalidate AI answer for the new thread
      if (newThread.hasAIAnswer && newThread.aiAnswerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.aiAnswer(newThread.id)
        });
      }

      // NEW: Invalidate course metrics (AI coverage % changes)
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseMetrics(newThread.courseId)
      });
    },
  });
}
```

**Breaking Changes:** None (only adds invalidations)

---

### Hook 4: `useThread()` - NO CHANGES NEEDED

**Current Implementation:**
```typescript
export function useThread(threadId: string | undefined) {
  return useQuery({
    queryKey: threadId ? queryKeys.thread(threadId) : ["thread"],
    queryFn: () => (threadId ? api.getThread(threadId) : Promise.resolve(null)),
    enabled: !!threadId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
```

**Why No Changes:**
- Return type of `api.getThread()` now includes `aiAnswer` field
- React Query automatically handles new field in data
- Components will receive `data.aiAnswer` without hook changes

**Type Safety:**
```typescript
const { data } = useThread(threadId);
// data is now { thread: Thread; aiAnswer: AIAnswer | null; posts: Post[] } | null
```

---

## 4. Mock Data Structure

### New File: `mocks/course-materials.json`

**Purpose:** Seed data for course materials used in citations

**Structure:**
```json
{
  "course-cs101": [
    {
      "id": "material-cs101-1",
      "courseId": "course-cs101",
      "type": "lecture",
      "title": "Week 2: Arrays and Sorting",
      "excerpt": "Arrays are contiguous memory blocks storing elements of the same type. Sorting algorithms like quicksort and mergesort are fundamental to computer science.",
      "url": "/courses/cs101/lectures/2",
      "keywords": ["array", "sort", "quicksort", "mergesort", "data structure"]
    },
    {
      "id": "material-cs101-2",
      "courseId": "course-cs101",
      "type": "textbook",
      "title": "Chapter 3: Binary Search Trees",
      "excerpt": "Binary search requires sorted data and achieves O(log n) time complexity by repeatedly dividing the search space in half.",
      "reference": "Page 45-52",
      "keywords": ["binary search", "bst", "tree", "logarithmic", "complexity"]
    },
    {
      "id": "material-cs101-3",
      "courseId": "course-cs101",
      "type": "slides",
      "title": "Lecture 4: Algorithm Complexity",
      "excerpt": "Big O notation describes the upper bound of an algorithm's time or space complexity. O(n) is linear, O(log n) is logarithmic, O(n²) is quadratic.",
      "url": "/courses/cs101/lectures/4/slides",
      "keywords": ["big o", "complexity", "time", "space", "analysis"]
    }
  ],
  "course-math221": [
    {
      "id": "material-math221-1",
      "courseId": "course-math221",
      "type": "textbook",
      "title": "Chapter 7: Integration Techniques",
      "excerpt": "Integration by parts follows the formula ∫u dv = uv - ∫v du. Choose u using LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.",
      "reference": "Section 7.1",
      "keywords": ["integration", "by parts", "liate", "calculus", "derivative"]
    },
    {
      "id": "material-math221-2",
      "courseId": "course-math221",
      "type": "lecture",
      "title": "Week 8: Advanced Integration",
      "excerpt": "When choosing u and dv for integration by parts, prioritize functions that simplify when differentiated (u) and those easy to integrate (dv).",
      "url": "/courses/math221/lectures/8",
      "keywords": ["integration", "derivative", "antiderivative", "technique"]
    }
  ]
}
```

**Key Characteristics:**
- Organized by courseId
- 5-10 materials per course
- Rich keyword arrays for matching
- Mix of source types (lecture, textbook, slides)
- Realistic excerpts with technical content

---

### New localStorage Key: `quokkaq.aiAnswers`

**Storage Pattern:**
```typescript
// lib/store/localStore.ts additions

const KEYS = {
  // ... existing keys
  aiAnswers: "quokkaq.aiAnswers",
  aiAnswerEndorsements: "quokkaq.aiAnswerEndorsements",
  courseMaterials: "quokkaq.courseMaterials",
} as const;

/**
 * Get all AI answers
 */
export function getAIAnswers(): AIAnswer[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.aiAnswers);
  if (!data) return [];
  try {
    return JSON.parse(data) as AIAnswer[];
  } catch {
    return [];
  }
}

/**
 * Get AI answer by ID
 */
export function getAIAnswerById(id: string): AIAnswer | null {
  const answers = getAIAnswers();
  return answers.find((a) => a.id === id) ?? null;
}

/**
 * Get AI answer by thread ID
 */
export function getAIAnswerByThreadId(threadId: string): AIAnswer | null {
  const answers = getAIAnswers();
  return answers.find((a) => a.threadId === threadId) ?? null;
}

/**
 * Add new AI answer
 */
export function addAIAnswer(answer: AIAnswer): void {
  if (typeof window === "undefined") return;
  const answers = getAIAnswers();
  answers.push(answer);
  localStorage.setItem(KEYS.aiAnswers, JSON.stringify(answers));
}

/**
 * Update AI answer
 */
export function updateAIAnswer(
  answerId: string,
  updates: Partial<AIAnswer>
): AIAnswer {
  if (typeof window === "undefined") {
    throw new Error("Cannot update AI answer on server");
  }

  const answers = getAIAnswers();
  const answer = answers.find((a) => a.id === answerId);

  if (!answer) {
    throw new Error(`AI answer not found: ${answerId}`);
  }

  Object.assign(answer, updates);
  localStorage.setItem(KEYS.aiAnswers, JSON.stringify(answers));

  return answer;
}

/**
 * Get course materials
 */
export function getCourseMaterials(courseId: string): CourseMaterial[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.courseMaterials);
  if (!data) return [];

  try {
    const allMaterials = JSON.parse(data) as Record<string, CourseMaterial[]>;
    return allMaterials[courseId] || [];
  } catch {
    return [];
  }
}

/**
 * Get AI answer endorsements
 */
export function getAIAnswerEndorsements(aiAnswerId: string): AIAnswerEndorsement[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.aiAnswerEndorsements);
  if (!data) return [];

  try {
    const allEndorsements = JSON.parse(data) as AIAnswerEndorsement[];
    return allEndorsements.filter((e) => e.aiAnswerId === aiAnswerId);
  } catch {
    return [];
  }
}

/**
 * Add AI answer endorsement
 */
export function addAIAnswerEndorsement(endorsement: AIAnswerEndorsement): void {
  if (typeof window === "undefined") return;

  const data = localStorage.getItem(KEYS.aiAnswerEndorsements);
  const endorsements = data ? JSON.parse(data) as AIAnswerEndorsement[] : [];

  endorsements.push(endorsement);
  localStorage.setItem(KEYS.aiAnswerEndorsements, JSON.stringify(endorsements));
}
```

**New Type for Endorsement Tracking:**
```typescript
interface AIAnswerEndorsement {
  id: string;
  aiAnswerId: string;
  userId: string;
  userRole: UserRole;
  createdAt: string;
}
```

---

## 5. Template Response Generation

### New File: `lib/utils/ai-templates.ts`

**Purpose:** Template-based AI response generation with keyword matching

**Core Functions:**

```typescript
import type { AIAnswer, Citation, ConfidenceLevel } from '@/lib/models/types';
import { getCourseMaterials } from '@/lib/store/localStore';

/**
 * Generate AI response using template system
 */
export function generateAIResponse(input: {
  courseCode: string;
  questionTitle: string;
  questionContent: string;
  tags?: string[];
}): {
  content: string;
  confidence: { score: number; level: ConfidenceLevel };
  citations: Citation[];
} {
  // Extract keywords
  const keywords = extractKeywords(input.questionTitle, input.questionContent, input.tags);

  // Determine course type
  const courseType = determineCourseType(input.courseCode);

  // Match template
  const template = matchTemplate(courseType, keywords);

  // Generate content
  const content = template.generateContent(input);

  // Calculate confidence
  const confidence = calculateConfidence(keywords, template);

  // Generate citations
  const citations = generateCitations(courseType, keywords, input.courseCode);

  return { content, confidence, citations };
}

/**
 * Extract keywords from question
 */
function extractKeywords(
  title: string,
  content: string,
  tags?: string[]
): string[] {
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but']);

  const words = [
    ...title.toLowerCase().split(/\s+/),
    ...content.toLowerCase().split(/\s+/),
    ...(tags || [])
  ];

  return [...new Set(words)]
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 10); // Top 10 keywords
}

/**
 * Determine course type from code
 */
function determineCourseType(courseCode: string): string {
  const prefix = courseCode.toUpperCase().substring(0, 2);

  const typeMap: Record<string, string> = {
    CS: 'computer-science',
    MA: 'mathematics',
    PH: 'physics',
    CH: 'chemistry',
    BI: 'biology',
  };

  return typeMap[prefix] || 'general';
}

/**
 * Match best template for question
 */
function matchTemplate(courseType: string, keywords: string[]): Template {
  const templates = getTemplatesForCourseType(courseType);

  let bestMatch = templates[0]; // Fallback
  let bestScore = 0;

  for (const template of templates) {
    const score = template.keywords.filter(k => keywords.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  return bestMatch;
}

/**
 * Calculate confidence score and level
 */
function calculateConfidence(
  keywords: string[],
  template: Template
): { score: number; level: ConfidenceLevel } {
  const matchedKeywords = template.keywords.filter(k => keywords.includes(k));
  const matchRatio = matchedKeywords.length / template.keywords.length;

  // Score ranges: 55-95 (never 100%, always some confidence)
  const baseScore = 55;
  const bonusScore = Math.floor(matchRatio * 40);
  const score = baseScore + bonusScore;

  const level: ConfidenceLevel =
    score >= 80 ? 'high' :
    score >= 60 ? 'medium' :
    'low';

  return { score, level };
}

/**
 * Generate citations from course materials
 */
function generateCitations(
  courseType: string,
  keywords: string[],
  courseId: string
): Citation[] {
  const materials = getCourseMaterials(courseId);

  if (materials.length === 0) {
    // Fallback: generate generic citations
    return generateFallbackCitations(courseType);
  }

  // Score materials by keyword match
  const scored = materials.map(m => ({
    material: m,
    score: m.keywords.filter(k => keywords.includes(k)).length
  }));

  // Sort by score, take top 3-5
  const topMaterials = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 citations

  return topMaterials.map((sm, index) => ({
    id: `cite-${Date.now()}-${index}`,
    sourceType: sm.material.type,
    sourceTitle: sm.material.title,
    excerpt: sm.material.excerpt,
    relevanceScore: Math.min(95, 60 + sm.score * 10), // 60-95 range
    url: sm.material.url,
    reference: sm.material.reference,
  }));
}

/**
 * Fallback citations when no course materials
 */
function generateFallbackCitations(courseType: string): Citation[] {
  const fallbacks: Record<string, Citation[]> = {
    'computer-science': [
      {
        id: 'cite-fallback-cs-1',
        sourceType: 'textbook',
        sourceTitle: 'Introduction to Algorithms',
        excerpt: 'Core concepts in algorithm design and analysis.',
        relevanceScore: 70,
      }
    ],
    'mathematics': [
      {
        id: 'cite-fallback-math-1',
        sourceType: 'textbook',
        sourceTitle: 'Calculus: Early Transcendentals',
        excerpt: 'Fundamental calculus techniques and applications.',
        relevanceScore: 70,
      }
    ],
  };

  return fallbacks[courseType] || [];
}

/**
 * Template interface
 */
interface Template {
  id: string;
  keywords: string[];
  generateContent: (input: {
    questionTitle: string;
    questionContent: string;
  }) => string;
}

/**
 * Get templates for course type
 */
function getTemplatesForCourseType(courseType: string): Template[] {
  const templates: Record<string, Template[]> = {
    'computer-science': [
      {
        id: 'cs-algorithm',
        keywords: ['algorithm', 'sort', 'search', 'complexity', 'time', 'space'],
        generateContent: (input) => `
Based on your question about "${input.questionTitle}", here's an explanation:

**Algorithm Overview:**
The algorithm you're asking about is a fundamental concept in computer science. It works by systematically processing data to achieve a specific outcome.

**Key Steps:**
1. **Input Processing**: The algorithm accepts input data
2. **Core Logic**: Applies specific operations based on the problem domain
3. **Output Generation**: Produces results in the expected format

**Time Complexity:**
The time complexity is typically expressed in Big O notation, which describes how the algorithm scales with input size.

**Common Applications:**
This type of algorithm is widely used in software development, data processing, and system optimization.

**Tips for Understanding:**
- Break down the problem into smaller steps
- Consider edge cases and boundary conditions
- Practice implementing the algorithm in code
- Analyze how input size affects performance
        `.trim(),
      },
      {
        id: 'cs-data-structure',
        keywords: ['array', 'list', 'tree', 'graph', 'hash', 'stack', 'queue'],
        generateContent: (input) => `
Regarding "${input.questionTitle}":

**Data Structure Explanation:**
This data structure is designed to organize and store data efficiently for specific access patterns and operations.

**Key Characteristics:**
- **Storage**: How elements are physically stored in memory
- **Access Patterns**: How quickly you can retrieve elements
- **Modification**: Efficiency of insertions, deletions, and updates
- **Space Complexity**: Memory overhead required

**Common Operations:**
1. **Insert**: Adding new elements
2. **Delete**: Removing elements
3. **Search**: Finding specific elements
4. **Traverse**: Visiting all elements

**When to Use:**
Choose this data structure when you need specific performance characteristics for your use case.

**Implementation Considerations:**
- Memory constraints
- Access frequency patterns
- Modification frequency
- Ordering requirements
        `.trim(),
      },
      {
        id: 'cs-fallback',
        keywords: [],
        generateContent: (input) => `
Thank you for your question: "${input.questionTitle}"

**General Approach:**
This is a fundamental computer science concept that requires understanding core principles.

**Key Concepts:**
- Problem decomposition
- Algorithmic thinking
- Data organization
- Efficiency analysis

**Recommended Steps:**
1. Review the relevant course materials
2. Break down the problem into smaller parts
3. Consider examples and edge cases
4. Practice with similar problems

**Additional Resources:**
Check the textbook chapter and lecture notes for detailed explanations and examples.
        `.trim(),
      }
    ],
    'mathematics': [
      {
        id: 'math-calculus',
        keywords: ['derivative', 'integral', 'limit', 'continuity', 'differentiation', 'integration'],
        generateContent: (input) => `
For "${input.questionTitle}":

**Mathematical Concept:**
This involves fundamental calculus operations that describe rates of change and accumulation.

**Key Principles:**
1. **Definition**: Core mathematical definition
2. **Properties**: Important properties and theorems
3. **Techniques**: Standard solution methods
4. **Applications**: Real-world uses

**Solution Strategy:**
- Identify the type of problem
- Apply relevant formulas and theorems
- Simplify step by step
- Verify your answer

**Common Pitfalls:**
- Sign errors in calculations
- Incorrect application of rules
- Forgetting constants of integration
- Boundary condition mistakes

**Practice Tips:**
Work through examples systematically and check each step carefully.
        `.trim(),
      },
      {
        id: 'math-fallback',
        keywords: [],
        generateContent: (input) => `
Regarding your question: "${input.questionTitle}"

**Mathematical Approach:**
This problem requires careful application of mathematical principles and techniques.

**Steps to Solve:**
1. Identify what you're asked to find
2. Write down known information
3. Choose appropriate formulas/theorems
4. Apply step-by-step calculations
5. Verify your solution

**General Tips:**
- Show all work clearly
- Check units and dimensions
- Verify with alternate methods
- Review related examples

Refer to the textbook and lecture notes for detailed explanations.
        `.trim(),
      }
    ],
    'general': [
      {
        id: 'general-fallback',
        keywords: [],
        generateContent: (input) => `
Thank you for your question: "${input.questionTitle}"

**Approach:**
This topic requires understanding core concepts from the course materials.

**Key Steps:**
1. Review relevant lecture notes
2. Study textbook chapters
3. Work through examples
4. Practice similar problems

**Recommendations:**
- Break complex problems into smaller parts
- Relate new concepts to what you already know
- Ask clarifying questions if needed
- Practice regularly

Check the course materials for detailed explanations and examples specific to this topic.
        `.trim(),
      }
    ],
  };

  return templates[courseType] || templates['general'];
}
```

**Key Features:**
- Template-based responses (deterministic, repeatable)
- Keyword matching for best template selection
- Confidence scoring based on keyword match ratio
- Citation generation from course materials
- Fallback templates for unmatched questions
- Course-specific content (CS vs MATH vs general)

---

## 6. Implementation Checklist

### Phase 1: Types & Interfaces (15 minutes)
- [ ] Add type definitions to `lib/models/types.ts` (see `plans/type-design.md`)
- [ ] Update imports in `lib/api/client.ts`
- [ ] Update imports in `lib/api/hooks.ts`
- [ ] Run `npx tsc --noEmit` to verify

### Phase 2: localStorage Functions (10 minutes)
- [ ] Add AI answer storage functions to `lib/store/localStore.ts`
- [ ] Add `KEYS.aiAnswers` constant
- [ ] Add `KEYS.aiAnswerEndorsements` constant
- [ ] Add `KEYS.courseMaterials` constant
- [ ] Implement: `getAIAnswers()`, `getAIAnswerById()`, `addAIAnswer()`, `updateAIAnswer()`
- [ ] Implement: `getAIAnswerEndorsements()`, `addAIAnswerEndorsement()`
- [ ] Implement: `getCourseMaterials()`
- [ ] Run `npx tsc --noEmit` to verify

### Phase 3: Template System (20 minutes)
- [ ] Create `lib/utils/ai-templates.ts`
- [ ] Implement: `generateAIResponse()`
- [ ] Implement: `extractKeywords()`
- [ ] Implement: `determineCourseType()`
- [ ] Implement: `matchTemplate()`
- [ ] Implement: `calculateConfidence()`
- [ ] Implement: `generateCitations()`
- [ ] Implement: `getTemplatesForCourseType()`
- [ ] Add CS templates (algorithm, data structure, fallback)
- [ ] Add MATH templates (calculus, fallback)
- [ ] Add general fallback template
- [ ] Run `npx tsc --noEmit` to verify

### Phase 4: API Methods (20 minutes)
- [ ] Add `generateAIAnswer()` to `lib/api/client.ts`
- [ ] Add `getAIAnswer()` to `lib/api/client.ts`
- [ ] Add `endorseAIAnswer()` to `lib/api/client.ts`
- [ ] Modify `createThread()` to auto-generate AI answer
- [ ] Modify `getThread()` to include AI answer in return
- [ ] Run `npx tsc --noEmit` to verify

### Phase 5: React Query Hooks (15 minutes)
- [ ] Add query key for AI answers to `lib/api/hooks.ts`
- [ ] Implement `useAIAnswer()` hook
- [ ] Implement `useEndorseAIAnswer()` hook
- [ ] Modify `useCreateThread()` to invalidate AI queries
- [ ] Run `npx tsc --noEmit` to verify

### Phase 6: Mock Data (10 minutes)
- [ ] Create `mocks/course-materials.json`
- [ ] Add 5-10 materials for CS101
- [ ] Add 5-10 materials for MATH221
- [ ] Add 5-10 materials for other courses
- [ ] Seed course materials in `localStore.seedData()`

### Phase 7: Testing (15 minutes)
- [ ] Test: Create thread → AI answer generated
- [ ] Test: View thread → AI answer displayed
- [ ] Test: Endorse AI answer → count updates
- [ ] Test: Confidence scores (high/medium/low)
- [ ] Test: Citations (3-5 per answer)
- [ ] Test: localStorage persistence
- [ ] Test: Query invalidation works
- [ ] Run `npm run lint` to verify
- [ ] Run `npm run build` to verify

**Total Estimated Time:** 105 minutes (1.75 hours)

---

## 7. Backend Integration Notes

### What Will Change:

1. **Replace `generateAIAnswer()` with real LLM call**
   ```typescript
   // Mock:
   const { content, confidence, citations } = generateAIResponse(input);

   // Production:
   const response = await fetch('/api/ai/generate', {
     method: 'POST',
     body: JSON.stringify({
       threadId: input.threadId,
       courseId: input.courseId,
       question: { title: input.questionTitle, content: input.questionContent },
     }),
   });
   const { content, confidence, citations } = await response.json();
   ```

2. **Replace localStorage with API calls**
   ```typescript
   // Mock:
   addAIAnswer(aiAnswer);

   // Production:
   await fetch('/api/ai-answers', {
     method: 'POST',
     body: JSON.stringify(aiAnswer),
   });
   ```

3. **Add authentication headers**
   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json',
   }
   ```

4. **Handle real errors**
   ```typescript
   if (!response.ok) {
     throw new Error(`AI generation failed: ${response.statusText}`);
   }
   ```

5. **Add pagination for large datasets**
   - Citations might be paginated
   - Course materials need pagination

### What Won't Change:

- Hook signatures remain identical
- Query keys remain the same
- Component interfaces unchanged
- Type definitions unchanged
- Invalidation strategy unchanged

### Environment Variables:

```bash
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.quokkaq.com
AI_API_KEY=sk-xxxxx
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7
```

---

## 8. Test Scenarios

### Scenario 1: Thread Creation with AI Answer
```typescript
// User creates thread
const thread = await api.createThread({
  courseId: 'course-cs101',
  title: 'How does binary search work?',
  content: 'I need help understanding binary search algorithm.',
  tags: ['algorithms', 'binary-search'],
}, 'user-student-1');

// Expect:
// - thread.hasAIAnswer === true
// - thread.aiAnswerId is set
// - AI answer exists in localStorage
// - AI answer has 3-5 citations
// - Confidence is 'high' (binary search is common topic)
// - Total delay: 1200-1800ms
```

### Scenario 2: View Thread with AI Answer
```typescript
// User views thread
const data = await api.getThread('thread-1');

// Expect:
// - data.thread exists
// - data.aiAnswer exists (not null)
// - data.posts is array
// - aiAnswer.confidenceLevel in ['high', 'medium', 'low']
// - aiAnswer.citations.length >= 3
// - Delay: 200-500ms
```

### Scenario 3: Endorse AI Answer (Student)
```typescript
// Student endorses
const updated = await api.endorseAIAnswer({
  aiAnswerId: 'ai-123',
  userId: 'user-student-1',
  userRole: 'student',
});

// Expect:
// - updated.studentEndorsements += 1
// - updated.totalEndorsements += 1 (1x weight)
// - updated.currentUserEndorsed === true
// - Delay: 100ms
```

### Scenario 4: Endorse AI Answer (Instructor)
```typescript
// Instructor endorses
const updated = await api.endorseAIAnswer({
  aiAnswerId: 'ai-123',
  userId: 'user-instructor-1',
  userRole: 'instructor',
});

// Expect:
// - updated.instructorEndorsements += 1
// - updated.totalEndorsements += 3 (3x weight)
// - Special instructor badge shown in UI
// - Delay: 100ms
```

### Scenario 5: AI Answer Not Found
```typescript
// Thread without AI answer
const data = await api.getThread('thread-no-ai');

// Expect:
// - data.thread exists
// - data.aiAnswer === null
// - data.posts exists
// - No errors thrown
```

### Scenario 6: Template Matching
```typescript
// CS algorithm question
const response = generateAIResponse({
  courseCode: 'CS101',
  questionTitle: 'Explain quicksort algorithm',
  questionContent: 'I need help with quicksort time complexity',
  tags: ['sorting', 'algorithms'],
});

// Expect:
// - Template: 'cs-algorithm'
// - Confidence: 'high' (85-95%)
// - Citations: 3-5 with algorithm keywords
// - Content: Discusses time complexity, steps, applications
```

### Scenario 7: Confidence Score Edge Cases
```typescript
// No keyword matches
const response = generateAIResponse({
  courseCode: 'CS101',
  questionTitle: 'Random unrelated question',
  questionContent: 'This has nothing to do with CS',
  tags: [],
});

// Expect:
// - Template: 'cs-fallback'
// - Confidence: 'low' (55-60%)
// - Citations: Generic CS materials
// - Content: Fallback template
```

---

## 9. Accessibility Considerations

### Screen Reader Announcements:
```typescript
// AIAnswerCard should have:
<section aria-labelledby="ai-answer-heading">
  <h2 id="ai-answer-heading">AI-Generated Answer</h2>
  <div aria-label={`Confidence level: ${confidenceLevel}, score: ${confidenceScore}%`}>
    <ConfidenceMeter />
  </div>
</section>
```

### Focus Management:
- AI answer card should be tabbable
- Endorse button should have clear label
- Citations should be keyboard accessible
- Focus order: AI answer → Endorsement → Citations → Human replies

### ARIA Labels:
- Endorsement button: "Endorse this AI answer, currently endorsed by X students and Y instructors"
- Citation links: "View source: {sourceTitle}"
- Confidence meter: "AI confidence: {level}, {score}%"

---

## 10. Performance Implications

### Network Delays:
- Thread creation: +800-1200ms (AI generation)
- Total thread creation: 1200-1800ms
- Acceptable for "instant AI" feature

### localStorage Impact:
- Each AI answer: ~1-2KB
- 100 threads: ~100-200KB
- Well within 5-10MB localStorage limit

### React Query Cache:
- AI answers cached separately from threads
- 2-minute stale time (same as threads)
- Independent invalidation reduces refetches

### Bundle Size Impact:
- `ai-templates.ts`: ~5KB (templates + logic)
- Type definitions: ~2KB
- Minimal impact on bundle size

---

## 11. Files Modified Summary

| File | Type | Changes | Lines Added | Lines Modified |
|------|------|---------|-------------|----------------|
| `lib/models/types.ts` | Types | Add AI answer types | ~150 | ~10 |
| `lib/api/client.ts` | API | Add AI methods | ~200 | ~50 |
| `lib/api/hooks.ts` | Hooks | Add AI hooks | ~80 | ~20 |
| `lib/store/localStore.ts` | Storage | Add AI storage | ~100 | ~10 |
| `lib/utils/ai-templates.ts` | NEW | Template system | ~300 | 0 |
| `mocks/course-materials.json` | NEW | Seed data | ~200 | 0 |

**Total:** ~1030 lines added, ~90 lines modified, 2 new files

---

## 12. Risk Mitigation

### Risk 1: Slow Thread Creation
**Issue:** 1200-1800ms total delay might feel slow
**Mitigation:**
- Show loading indicator
- Optimistic UI update (show thread immediately, AI answer "generating")
- Consider async generation (return thread first, AI answer later)
**Decision:** Synchronous for MVP (better UX despite delay)

### Risk 2: Template Quality
**Issue:** Template responses might not match question quality
**Mitigation:**
- Seed realistic course materials
- Add more templates over time
- Show confidence score transparently
**Decision:** Acceptable for demo, backend will use real LLM

### Risk 3: Citation Relevance
**Issue:** Citations might not always be relevant
**Mitigation:**
- Keyword matching algorithm
- Relevance scores visible in UI
- Users can see citations before trusting answer
**Decision:** Good enough for mock, backend will have better retrieval

### Risk 4: localStorage Limits
**Issue:** Too many AI answers might exceed localStorage
**Mitigation:**
- Monitor localStorage size
- Implement cleanup of old answers (LRU)
- Warn users if approaching limit
**Decision:** Not needed for demo scale

---

## Status

**Plan Status:** Complete ✓
**Review Required:** Yes (before implementation)
**Estimated Implementation Time:** 1.75 hours
**Breaking Changes:** 1 (getThread return type - mitigable)
**Backend-Ready:** Yes (clean swap points identified)

---

## Next Steps for Parent Agent

1. **Review this plan** with context.md for alignment
2. **Verify type design** is compatible (already exists in plans/)
3. **Implement in phases** following checklist order
4. **Test each phase** before moving to next
5. **Commit incrementally** with clear messages
6. **Update context.md** with decisions and changelog

---

**Files Created:**
- `doccloud/tasks/ai-first-qa/plans/api-design.md`

**Dependencies:**
- Requires: `plans/type-design.md` (already complete)
- Blocks: Component implementation, React Query integration
- Related: `research/api-patterns.md` (research complete)
