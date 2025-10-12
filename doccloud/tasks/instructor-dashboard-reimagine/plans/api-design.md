# API Design Plan: Instructor Dashboard Features

**Date:** 2025-10-12
**Task:** Instructor Dashboard Re-imagining
**Dependencies:** `research/api-patterns.md`

---

## Table of Contents

1. [TypeScript Interfaces](#1-typescript-interfaces)
2. [API Methods](#2-api-methods)
3. [React Query Hooks](#3-react-query-hooks)
4. [Mock Data Structure](#4-mock-data-structure)
5. [Implementation Checklist](#5-implementation-checklist)
6. [Backend Integration Notes](#6-backend-integration-notes)
7. [Testing Scenarios](#7-testing-scenarios)

---

## 1. TypeScript Interfaces

### Location: `lib/models/types.ts`

Add these interfaces after the existing `InstructorDashboardData` interface (around line 455):

```typescript
// ============================================
// Instructor-Specific Feature Types
// ============================================

/**
 * Cluster of similar questions identified by keyword matching
 * Used for FAQ identification
 */
export interface QuestionCluster {
  /** Unique identifier for the cluster */
  id: string;

  /** The most representative question in the cluster */
  representativeQuestion: Thread;

  /** Other similar questions in this cluster */
  similarQuestions: Thread[];

  /** Keywords common across questions in cluster */
  commonKeywords: string[];

  /** Total views across all questions in cluster */
  totalViews: number;

  /** Number of questions in this cluster */
  frequency: number;

  /** Average similarity score (0-1) within cluster */
  averageSimilarity: number;
}

/**
 * Thread with priority scoring for instructor queue
 */
export interface PriorityQuestion extends Thread {
  /** Calculated priority score (higher = more urgent) */
  priorityScore: number;

  /** Primary reason for high priority */
  urgencyReason: 'time_open' | 'high_views' | 'needs_review' | 'unanswered';

  /** Hours since thread was created */
  timeOpenHours: number;

  /** Whether AI answer needs instructor review */
  needsReview: boolean;
}

/**
 * Trending topic with frequency analysis
 */
export interface TrendingTopic {
  /** Topic name (tag or keyword) */
  topic: string;

  /** Count of threads with this topic */
  frequency: number;

  /** Trend direction compared to previous period */
  trend: 'rising' | 'stable' | 'falling';

  /** Week-over-week percentage change */
  weekOverWeekChange: number;

  /** Sample thread IDs featuring this topic */
  sampleThreadIds: string[];
}

/**
 * Saved response template for common replies
 */
export interface ResponseTemplate {
  /** Unique identifier */
  id: string;

  /** Owner user ID (instructor) */
  userId: string;

  /** Template display name */
  title: string;

  /** Template content (markdown supported) */
  content: string;

  /** Suggested use case tags */
  tags: string[];

  /** Number of times used */
  usageCount: number;

  /** When template was created */
  createdAt: string;

  /** When template was last modified */
  updatedAt: string;
}

/**
 * Search result with relevance scoring
 */
export interface SearchResult {
  /** The matched thread */
  thread: Thread;

  /** Relevance score (0-1, higher = more relevant) */
  relevanceScore: number;

  /** Keywords from query that matched */
  matchedKeywords: string[];

  /** Position in results (1-indexed) */
  rank: number;
}

/**
 * Instructor insights with AI answer quality metrics
 */
export interface InstructorInsights {
  /** Course ID */
  courseId: string;

  /** Priority-ranked questions needing attention */
  priorityQueue: PriorityQuestion[];

  /** FAQ clusters */
  faqClusters: QuestionCluster[];

  /** Trending topics */
  trendingTopics: TrendingTopic[];

  /** AI answer quality metrics */
  aiQualityMetrics: {
    /** Total AI answers generated */
    totalAIAnswers: number;

    /** AI answers endorsed by instructor */
    instructorEndorsed: number;

    /** AI answers endorsed by students */
    studentEndorsed: number;

    /** AI answers not yet reviewed */
    needsReview: number;

    /** Average confidence score */
    averageConfidence: number;
  };

  /** When insights were generated */
  generatedAt: string;
}

/**
 * Input for bulk endorsing AI answers
 */
export interface BulkEndorseAIAnswersInput {
  /** Array of AI answer IDs to endorse */
  aiAnswerIds: string[];

  /** User ID of endorser */
  userId: string;

  /** Whether endorser is instructor */
  isInstructor: boolean;
}

/**
 * Input for saving response template
 */
export interface SaveResponseTemplateInput {
  /** Template display name */
  title: string;

  /** Template content */
  content: string;

  /** Optional tags for categorization */
  tags?: string[];
}

/**
 * Input for searching questions
 */
export interface SearchQuestionsInput {
  /** Course to search in */
  courseId: string;

  /** Natural language search query */
  query: string;

  /** Maximum results to return (default 20) */
  limit?: number;
}

/**
 * Time range for trending analysis
 */
export type TrendingTimeRange = 'week' | 'month' | 'quarter';
```

**Rationale:**
- **QuestionCluster**: Captures FAQ identification with similarity metrics
- **PriorityQuestion**: Extends Thread with urgency scoring for triage
- **TrendingTopic**: Tracks topic frequency with trend direction
- **ResponseTemplate**: Reusable snippets for common instructor replies
- **SearchResult**: Wraps Thread with relevance scoring
- **InstructorInsights**: Aggregate view for instructor dashboard
- **Input types**: Clean, type-safe mutation parameters

---

## 2. API Methods

### Location: `lib/api/client.ts`

Add these methods at the end of the `api` object (after `endorseAIAnswer`, line 1366):

```typescript
  // ============================================
  // Instructor Insights API Methods
  // ============================================

  /**
   * Get frequently asked questions (FAQ clusters)
   * Clusters similar questions by keyword matching
   */
  async getFrequentlyAskedQuestions(courseId: string): Promise<QuestionCluster[]> {
    await delay(400 + Math.random() * 200); // 400-600ms (complex calculation)
    seedData();

    const threads = getThreadsByCourse(courseId);

    // Helper: Extract keywords from thread
    const getThreadKeywords = (thread: Thread): string[] => {
      const text = `${thread.title} ${thread.content} ${thread.tags?.join(' ') || ''}`;
      return extractKeywords(text);
    };

    // Build keyword map for each thread
    const threadKeywords = new Map<string, string[]>();
    threads.forEach((thread) => {
      threadKeywords.set(thread.id, getThreadKeywords(thread));
    });

    // Calculate pairwise similarity
    const similarities = new Map<string, Map<string, number>>();
    threads.forEach((thread1) => {
      const keywords1 = threadKeywords.get(thread1.id)!;
      const simMap = new Map<string, number>();

      threads.forEach((thread2) => {
        if (thread1.id === thread2.id) return;
        const keywords2 = threadKeywords.get(thread2.id)!;
        const ratio = calculateMatchRatio(keywords1, keywords2);
        if (ratio > 0.4) { // Similarity threshold
          simMap.set(thread2.id, ratio);
        }
      });

      similarities.set(thread1.id, simMap);
    });

    // Build clusters (greedy algorithm)
    const clustered = new Set<string>();
    const clusters: QuestionCluster[] = [];

    threads
      .sort((a, b) => b.views - a.views) // Process high-view threads first
      .forEach((thread) => {
        if (clustered.has(thread.id)) return;

        const simMap = similarities.get(thread.id)!;
        const similarThreads = Array.from(simMap.entries())
          .filter(([id]) => !clustered.has(id))
          .sort((a, b) => b[1] - a[1]) // Sort by similarity
          .map(([id]) => threads.find((t) => t.id === id)!);

        if (similarThreads.length > 0) {
          // Mark as clustered
          clustered.add(thread.id);
          similarThreads.forEach((t) => clustered.add(t.id));

          // Extract common keywords
          const allKeywords = [
            ...threadKeywords.get(thread.id)!,
            ...similarThreads.flatMap((t) => threadKeywords.get(t.id)!),
          ];
          const keywordCounts = allKeywords.reduce((acc, kw) => {
            acc[kw] = (acc[kw] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const commonKeywords = Object.entries(keywordCounts)
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([kw]) => kw);

          // Calculate metrics
          const totalViews = thread.views + similarThreads.reduce((sum, t) => sum + t.views, 0);
          const frequency = 1 + similarThreads.length;
          const avgSim =
            Array.from(simMap.values()).reduce((sum, val) => sum + val, 0) / simMap.size;

          clusters.push({
            id: generateId('cluster'),
            representativeQuestion: thread,
            similarQuestions: similarThreads,
            commonKeywords,
            totalViews,
            frequency,
            averageSimilarity: avgSim,
          });
        }
      });

    // Sort clusters by frequency descending
    return clusters.sort((a, b) => b.frequency - a.frequency);
  },

  /**
   * Get trending topics for a course in a time range
   */
  async getTrendingTopics(
    courseId: string,
    timeRange: TrendingTimeRange = 'week'
  ): Promise<TrendingTopic[]> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const allThreads = getThreadsByCourse(courseId);

    // Calculate time boundaries
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const rangeDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const currentStart = new Date(now - rangeDays * msPerDay);
    const previousStart = new Date(now - 2 * rangeDays * msPerDay);
    const previousEnd = currentStart;

    // Get threads in current and previous periods
    const currentThreads = allThreads.filter(
      (t) => new Date(t.createdAt) >= currentStart
    );
    const previousThreads = allThreads.filter(
      (t) => new Date(t.createdAt) >= previousStart && new Date(t.createdAt) < previousEnd
    );

    // Count tag frequency
    const countTags = (threads: Thread[]): Record<string, string[]> => {
      const tagThreads: Record<string, string[]> = {};
      threads.forEach((thread) => {
        thread.tags?.forEach((tag) => {
          if (!tagThreads[tag]) tagThreads[tag] = [];
          tagThreads[tag].push(thread.id);
        });
      });
      return tagThreads;
    };

    const currentTags = countTags(currentThreads);
    const previousTags = countTags(previousThreads);

    // Build trending topics
    const topics: TrendingTopic[] = Object.entries(currentTags).map(([topic, threadIds]) => {
      const currentCount = threadIds.length;
      const previousCount = previousTags[topic]?.length || 0;

      // Calculate trend
      let trend: 'rising' | 'stable' | 'falling' = 'stable';
      let weekOverWeekChange = 0;
      if (previousCount > 0) {
        weekOverWeekChange = ((currentCount - previousCount) / previousCount) * 100;
        if (weekOverWeekChange > 20) trend = 'rising';
        else if (weekOverWeekChange < -20) trend = 'falling';
      } else if (currentCount > 0) {
        trend = 'rising';
        weekOverWeekChange = 100;
      }

      return {
        topic,
        frequency: currentCount,
        trend,
        weekOverWeekChange: Math.round(weekOverWeekChange),
        sampleThreadIds: threadIds.slice(0, 3),
      };
    });

    // Sort by frequency descending
    return topics.sort((a, b) => b.frequency - a.frequency);
  },

  /**
   * Bulk endorse multiple AI answers at once
   */
  async bulkEndorseAIAnswers(input: BulkEndorseAIAnswersInput): Promise<void> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const { aiAnswerIds, userId, isInstructor } = input;

    // Validate all AI answers exist
    const aiAnswers = aiAnswerIds.map((id) => getAIAnswerById(id)).filter(Boolean) as AIAnswer[];
    if (aiAnswers.length !== aiAnswerIds.length) {
      throw new Error('Some AI answer IDs not found');
    }

    // Check for already-endorsed answers
    const alreadyEndorsed = aiAnswers.filter((a) => a.endorsedBy.includes(userId));
    if (alreadyEndorsed.length > 0) {
      throw new Error(
        `User has already endorsed ${alreadyEndorsed.length} of these answers`
      );
    }

    // Endorse each answer
    const weight = isInstructor ? 3 : 1;
    aiAnswers.forEach((aiAnswer) => {
      const updates: Partial<AIAnswer> = {
        endorsedBy: [...aiAnswer.endorsedBy, userId],
        totalEndorsements: aiAnswer.totalEndorsements + weight,
        updatedAt: new Date().toISOString(),
      };

      if (isInstructor) {
        updates.instructorEndorsements = aiAnswer.instructorEndorsements + 1;
        updates.instructorEndorsed = true;
      } else {
        updates.studentEndorsements = aiAnswer.studentEndorsements + 1;
      }

      updateAIAnswer(aiAnswer.id, updates);
    });
  },

  /**
   * Get instructor insights with priority queue and metrics
   */
  async getInstructorInsights(userId: string): Promise<InstructorInsights[]> {
    await delay(400 + Math.random() * 200); // 400-600ms (aggregate operation)
    seedData();

    const allCourses = getCourses();
    const managedCourses = allCourses.filter((c) => c.instructorIds.includes(userId));
    const allThreads = getThreads();
    const allAIAnswers = getAIAnswers();

    const insights: InstructorInsights[] = [];

    for (const course of managedCourses) {
      const courseThreads = allThreads.filter((t) => t.courseId === course.id);

      // Build priority queue
      const now = Date.now();
      const priorityQueue: PriorityQuestion[] = courseThreads
        .map((thread) => {
          const timeOpenHours = (now - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60);
          const aiAnswer = thread.aiAnswerId ? getAIAnswerById(thread.aiAnswerId) : null;
          const needsReview =
            !!aiAnswer && !aiAnswer.instructorEndorsed && aiAnswer.confidenceScore < 70;

          // Calculate priority score
          let score = 0;
          score += thread.views * 0.3; // Engagement
          score += timeOpenHours * 0.4; // Urgency
          if (needsReview) score += 10; // Needs review
          if (thread.status === 'open') score += 20; // Unanswered

          // Determine primary urgency reason
          let urgencyReason: PriorityQuestion['urgencyReason'] = 'unanswered';
          if (thread.status === 'open') urgencyReason = 'unanswered';
          else if (needsReview) urgencyReason = 'needs_review';
          else if (timeOpenHours > 48) urgencyReason = 'time_open';
          else if (thread.views > 50) urgencyReason = 'high_views';

          return {
            ...thread,
            priorityScore: score,
            urgencyReason,
            timeOpenHours: Math.round(timeOpenHours),
            needsReview,
          };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 20); // Top 20

      // Get FAQ clusters
      const faqClusters = await this.getFrequentlyAskedQuestions(course.id);

      // Get trending topics
      const trendingTopics = await this.getTrendingTopics(course.id, 'week');

      // Calculate AI quality metrics
      const courseAIAnswers = allAIAnswers.filter((a) => a.courseId === course.id);
      const aiQualityMetrics = {
        totalAIAnswers: courseAIAnswers.length,
        instructorEndorsed: courseAIAnswers.filter((a) => a.instructorEndorsed).length,
        studentEndorsed: courseAIAnswers.filter((a) => a.studentEndorsements > 0).length,
        needsReview: courseAIAnswers.filter(
          (a) => !a.instructorEndorsed && a.confidenceScore < 70
        ).length,
        averageConfidence:
          courseAIAnswers.length > 0
            ? Math.round(
                courseAIAnswers.reduce((sum, a) => sum + a.confidenceScore, 0) /
                  courseAIAnswers.length
              )
            : 0,
      };

      insights.push({
        courseId: course.id,
        priorityQueue,
        faqClusters: faqClusters.slice(0, 5), // Top 5 clusters
        trendingTopics: trendingTopics.slice(0, 10), // Top 10 topics
        aiQualityMetrics,
        generatedAt: new Date().toISOString(),
      });
    }

    return insights;
  },

  /**
   * Search questions using natural language query
   */
  async searchQuestions(input: SearchQuestionsInput): Promise<SearchResult[]> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const { courseId, query, limit = 20 } = input;
    const threads = getThreadsByCourse(courseId);
    const queryKeywords = extractKeywords(query);

    if (queryKeywords.length === 0) {
      // Fallback: return most recent threads
      return threads
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map((thread, index) => ({
          thread,
          relevanceScore: 0,
          matchedKeywords: [],
          rank: index + 1,
        }));
    }

    // Score each thread by keyword match
    const scoredResults = threads
      .map((thread) => {
        const threadText = `${thread.title} ${thread.content} ${thread.tags?.join(' ') || ''}`;
        const threadKeywords = extractKeywords(threadText);
        const matchRatio = calculateMatchRatio(queryKeywords, threadKeywords);
        const matchedKeywords = queryKeywords.filter((kw) => threadKeywords.includes(kw));

        return {
          thread,
          relevanceScore: matchRatio,
          matchedKeywords,
        };
      })
      .filter((result) => result.relevanceScore > 0.2) // Minimum threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Add rank
    return scoredResults.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
  },

  /**
   * Get response templates for a user
   */
  async getResponseTemplates(userId: string): Promise<ResponseTemplate[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const templates = getResponseTemplates(userId);
    return templates.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /**
   * Save a new response template
   */
  async saveResponseTemplate(
    input: SaveResponseTemplateInput,
    userId: string
  ): Promise<ResponseTemplate> {
    await delay(100); // Quick action
    seedData();

    const newTemplate: ResponseTemplate = {
      id: generateId('template'),
      userId,
      title: input.title,
      content: input.content,
      tags: input.tags || [],
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addResponseTemplate(newTemplate);
    return newTemplate;
  },

  /**
   * Delete a response template
   */
  async deleteResponseTemplate(templateId: string): Promise<void> {
    await delay(50); // Ultra-fast
    seedData();

    deleteResponseTemplate(templateId);
  },
```

**Method Summary:**
1. **getFrequentlyAskedQuestions**: O(n²) clustering, 400-600ms delay
2. **getTrendingTopics**: O(n) with sorting, 300-500ms delay
3. **bulkEndorseAIAnswers**: O(n) mutation, 200-300ms delay
4. **getInstructorInsights**: Aggregates priority + FAQs + topics, 400-600ms
5. **searchQuestions**: O(n) keyword matching, 300-500ms delay
6. **getResponseTemplates**: O(n log n) sort, 200-300ms delay
7. **saveResponseTemplate**: O(1) append, 100ms delay
8. **deleteResponseTemplate**: O(n) find+remove, 50ms delay

---

## 3. React Query Hooks

### Location: `lib/api/hooks.ts`

Add query keys after line 35:

```typescript
const queryKeys = {
  // ... existing keys
  faqClusters: (courseId: string) => ['faqClusters', courseId] as const,
  trendingTopics: (courseId: string, timeRange: TrendingTimeRange) =>
    ['trendingTopics', courseId, timeRange] as const,
  instructorInsights: (userId: string) => ['instructorInsights', userId] as const,
  searchResults: (courseId: string, query: string) =>
    ['searchResults', courseId, query] as const,
  responseTemplates: (userId: string) => ['responseTemplates', userId] as const,
};
```

Add hooks at the end of the file (after `useEndorseAIAnswer`, line 494):

```typescript
// ============================================
// Instructor Insights Hooks
// ============================================

/**
 * Get frequently asked questions for a course
 */
export function useFrequentlyAskedQuestions(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.faqClusters(courseId) : ['faqClusters'],
    queryFn: () => (courseId ? api.getFrequentlyAskedQuestions(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 15 * 60 * 1000, // 15 minutes (expensive operation)
    gcTime: 30 * 60 * 1000,     // 30 minutes cache
  });
}

/**
 * Get trending topics for a course
 */
export function useTrendingTopics(
  courseId: string | undefined,
  timeRange: TrendingTimeRange = 'week'
) {
  return useQuery({
    queryKey: courseId ? queryKeys.trendingTopics(courseId, timeRange) : ['trendingTopics'],
    queryFn: () =>
      courseId ? api.getTrendingTopics(courseId, timeRange) : Promise.resolve([]),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get instructor insights with priority queue
 */
export function useInstructorInsights(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.instructorInsights(userId) : ['instructorInsights'],
    queryFn: () => (userId ? api.getInstructorInsights(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes (same as dashboard)
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Search questions with natural language query
 */
export function useSearchQuestions(courseId: string | undefined, query: string) {
  return useQuery({
    queryKey: courseId && query ? queryKeys.searchResults(courseId, query) : ['searchResults'],
    queryFn: () =>
      courseId && query
        ? api.searchQuestions({ courseId, query })
        : Promise.resolve([]),
    enabled: !!courseId && !!query && query.length >= 3, // Min 3 chars
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get response templates for current user
 */
export function useResponseTemplates(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.responseTemplates(userId) : ['responseTemplates'],
    queryFn: () => (userId ? api.getResponseTemplates(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Bulk endorse AI answers
 */
export function useBulkEndorseAIAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkEndorseAIAnswersInput) => api.bulkEndorseAIAnswers(input),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['instructorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['instructorInsights'] });
      queryClient.invalidateQueries({ queryKey: ['courseThreads'] });
      // Note: Cannot invalidate specific threads without knowing which courses
      // This is acceptable trade-off for mock API
    },
  });
}

/**
 * Save new response template
 */
export function useSaveResponseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, userId }: { input: SaveResponseTemplateInput; userId: string }) =>
      api.saveResponseTemplate(input, userId),
    onSuccess: (newTemplate) => {
      // Invalidate templates query for this user
      queryClient.invalidateQueries({
        queryKey: queryKeys.responseTemplates(newTemplate.userId),
      });
    },
  });
}

/**
 * Delete response template
 */
export function useDeleteResponseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => api.deleteResponseTemplate(templateId),
    onSuccess: () => {
      // Invalidate all template queries (we don't know userId here)
      queryClient.invalidateQueries({ queryKey: ['responseTemplates'] });
    },
  });
}
```

**Hook Summary:**
- **useFrequentlyAskedQuestions**: 15min stale time (expensive)
- **useTrendingTopics**: 5min stale time, parameterized by timeRange
- **useInstructorInsights**: 3min stale time (same as dashboard)
- **useSearchQuestions**: 2min stale time, min 3-char query
- **useResponseTemplates**: 10min stale time
- **useBulkEndorseAIAnswers**: Invalidates dashboard + insights + threads
- **useSaveResponseTemplate**: Invalidates user templates
- **useDeleteResponseTemplate**: Invalidates all templates

---

## 4. Mock Data Structure

### Location: `lib/store/localStore.ts`

#### 4.1 Add Storage Key

Insert after line 27:

```typescript
const KEYS = {
  // ... existing keys
  responseTemplates: "quokkaq.responseTemplates",
} as const;
```

#### 4.2 Add Seed Function

Insert after `seedData()` function (around line 64):

```typescript
/**
 * Get response templates from localStorage
 */
export function getResponseTemplates(userId: string): ResponseTemplate[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.responseTemplates);
  if (!data) return [];

  try {
    const allTemplates = JSON.parse(data) as ResponseTemplate[];
    return allTemplates.filter((t) => t.userId === userId);
  } catch {
    return [];
  }
}

/**
 * Add new response template
 */
export function addResponseTemplate(template: ResponseTemplate): void {
  if (typeof window === "undefined") return;

  const templates = getAllResponseTemplates();
  templates.push(template);
  localStorage.setItem(KEYS.responseTemplates, JSON.stringify(templates));
}

/**
 * Delete response template
 */
export function deleteResponseTemplate(templateId: string): void {
  if (typeof window === "undefined") return;

  const templates = getAllResponseTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  localStorage.setItem(KEYS.responseTemplates, JSON.stringify(filtered));
}

/**
 * Get all response templates (helper)
 */
function getAllResponseTemplates(): ResponseTemplate[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.responseTemplates);
  if (!data) {
    // Initialize with empty array
    localStorage.setItem(KEYS.responseTemplates, JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(data) as ResponseTemplate[];
  } catch {
    return [];
  }
}
```

#### 4.3 Seed Data File (Optional)

Create `mocks/response-templates.json` (empty initially):

```json
[]
```

**Rationale:** Templates are user-generated, so seed with empty array. Users create templates via UI.

---

## 5. Implementation Checklist

### Phase 1: Type Definitions
- [ ] Add new interfaces to `lib/models/types.ts` (lines ~455+)
  - QuestionCluster
  - PriorityQuestion
  - TrendingTopic
  - ResponseTemplate
  - SearchResult
  - InstructorInsights
  - BulkEndorseAIAnswersInput
  - SaveResponseTemplateInput
  - SearchQuestionsInput
  - TrendingTimeRange
- [ ] Run `npx tsc --noEmit` to verify types compile
- [ ] Commit: `feat: add instructor insights type definitions`

### Phase 2: localStorage Extensions
- [ ] Add `responseTemplates` key to KEYS constant in `lib/store/localStore.ts`
- [ ] Implement `getResponseTemplates(userId)` function
- [ ] Implement `addResponseTemplate(template)` function
- [ ] Implement `deleteResponseTemplate(templateId)` function
- [ ] Implement `getAllResponseTemplates()` helper
- [ ] Create `mocks/response-templates.json` with empty array
- [ ] Run `npx tsc --noEmit` to verify types
- [ ] Commit: `feat: add response template storage functions`

### Phase 3: API Methods
- [ ] Import new types in `lib/api/client.ts`
- [ ] Implement `getFrequentlyAskedQuestions(courseId)` method
  - Test with CS101 course (should cluster binary search questions)
- [ ] Implement `getTrendingTopics(courseId, timeRange)` method
  - Test with different time ranges
- [ ] Implement `bulkEndorseAIAnswers(input)` method
  - Test with multiple AI answer IDs
  - Verify error handling for already-endorsed answers
- [ ] Implement `getInstructorInsights(userId)` method
  - Test with instructor user
  - Verify all metrics calculate correctly
- [ ] Implement `searchQuestions(input)` method
  - Test with various queries ("binary search", "recursion", etc.)
- [ ] Implement `getResponseTemplates(userId)` method
- [ ] Implement `saveResponseTemplate(input, userId)` method
- [ ] Implement `deleteResponseTemplate(templateId)` method
- [ ] Run `npx tsc --noEmit` after each method
- [ ] Test each method in isolation (console.log results)
- [ ] Commit: `feat: implement instructor insights API methods`

### Phase 4: React Query Hooks
- [ ] Add new query keys to queryKeys object in `lib/api/hooks.ts`
- [ ] Implement `useFrequentlyAskedQuestions(courseId)` hook
- [ ] Implement `useTrendingTopics(courseId, timeRange)` hook
- [ ] Implement `useInstructorInsights(userId)` hook
- [ ] Implement `useSearchQuestions(courseId, query)` hook
- [ ] Implement `useResponseTemplates(userId)` hook
- [ ] Implement `useBulkEndorseAIAnswers()` mutation hook
- [ ] Implement `useSaveResponseTemplate()` mutation hook
- [ ] Implement `useDeleteResponseTemplate()` mutation hook
- [ ] Run `npx tsc --noEmit` after each hook
- [ ] Verify invalidation logic is correct
- [ ] Commit: `feat: add React Query hooks for instructor insights`

### Phase 5: Integration Testing
- [ ] Test FAQ clustering with real thread data
  - Verify similar questions group correctly
  - Check edge case: no similar questions (no clusters)
- [ ] Test trending topics across time ranges
  - Week, month, quarter
  - Verify trend direction (rising/falling/stable)
- [ ] Test bulk endorsement
  - Endorse multiple AI answers
  - Verify endorsement counts update
  - Test error: already endorsed
- [ ] Test instructor insights aggregation
  - Priority queue sorting
  - AI quality metrics accuracy
- [ ] Test search with various queries
  - Relevant results appear first
  - Irrelevant results filtered out
- [ ] Test response template CRUD
  - Save template
  - List templates
  - Delete template
- [ ] Run `npm run lint` and fix any issues
- [ ] Run `npx tsc --noEmit` final check
- [ ] Commit: `test: verify instructor insights API integration`

### Phase 6: Performance Validation
- [ ] Profile FAQ clustering with 100 threads (should be <1s)
- [ ] Check trending topics calculation speed
- [ ] Verify search responds within 500ms
- [ ] Monitor React Query cache behavior
- [ ] Commit: `perf: validate instructor insights performance`

### Phase 7: Documentation
- [ ] Update context.md with design decisions
- [ ] Document query key structure
- [ ] Document invalidation strategy
- [ ] Add JSDoc comments to any missing functions
- [ ] Commit: `docs: document instructor insights API design`

---

## 6. Backend Integration Notes

### 6.1 What Will Change

**Clustering:**
- Replace keyword matching with ML-based semantic similarity (e.g., sentence embeddings)
- Move computation to backend (too expensive for frontend)
- Cache cluster results aggressively

**Trending Topics:**
- Use database GROUP BY queries for efficiency
- Add time-series data for sparklines
- Consider Redis caching for hot topics

**Search:**
- Replace keyword matching with full-text search (Elasticsearch, PostgreSQL FTS)
- Add fuzzy matching, stemming, synonym support
- Paginate results (current mock returns all)

**Bulk Endorsements:**
- Wrap in database transaction (all-or-nothing)
- Add optimistic locking to prevent race conditions
- Consider job queue for large batches

**Response Templates:**
- Store in database with proper indexing
- Add soft delete (deleted flag instead of removal)
- Track usage analytics per template

### 6.2 Environment Variables Needed

```bash
# Example .env
DATABASE_URL=postgresql://...
ELASTICSEARCH_URL=http://...
REDIS_URL=redis://...
```

### 6.3 Authentication

All methods assume `userId` is authenticated via session/JWT.

Backend must:
- Verify user is instructor for course
- Check authorization before returning data
- Rate-limit search/clustering endpoints

### 6.4 Real-Time Considerations

Current mock is request/response only.

For production:
- Consider WebSocket for live priority queue updates
- Push notifications when FAQs emerge
- Real-time trending topic updates

---

## 7. Testing Scenarios

### 7.1 FAQ Clustering

**Test Case 1: Similar Questions Cluster**
- Input: 5 threads about binary search with keyword overlap >40%
- Expected: 1 cluster with 5 questions, common keywords: ['binary', 'search', 'algorithm']

**Test Case 2: No Similar Questions**
- Input: 10 threads with unique topics
- Expected: 0 clusters (each thread too dissimilar)

**Test Case 3: Multiple Clusters**
- Input: 3 threads about recursion, 3 about arrays, 3 about sorting
- Expected: 3 clusters, each with 3 questions

**Test Case 4: Edge Case - Empty Course**
- Input: courseId with no threads
- Expected: Empty array []

### 7.2 Trending Topics

**Test Case 1: Rising Topic**
- Input: 'recursion' tag appears 10 times this week, 2 times last week
- Expected: trend='rising', weekOverWeekChange=400%

**Test Case 2: Falling Topic**
- Input: 'loops' tag appears 2 times this week, 10 times last week
- Expected: trend='falling', weekOverWeekChange=-80%

**Test Case 3: Stable Topic**
- Input: 'algorithms' tag appears 8 times this week, 7 times last week
- Expected: trend='stable', weekOverWeekChange=14%

**Test Case 4: New Topic**
- Input: 'avl-trees' tag appears 5 times this week, 0 times last week
- Expected: trend='rising', weekOverWeekChange=100%

### 7.3 Bulk Endorsement

**Test Case 1: Successful Bulk Endorse**
- Input: 3 valid AI answer IDs, instructor userId
- Expected: All 3 answers endorsed, instructorEndorsements incremented

**Test Case 2: Already Endorsed**
- Input: AI answer already endorsed by this user
- Expected: Error thrown, no changes made

**Test Case 3: Invalid ID**
- Input: AI answer ID that doesn't exist
- Expected: Error thrown, no changes made

### 7.4 Search

**Test Case 1: Exact Keyword Match**
- Input: query='binary search', courseId='CS101'
- Expected: Threads with 'binary' and 'search' keywords ranked highest

**Test Case 2: Partial Match**
- Input: query='recursive function', courseId='CS101'
- Expected: Threads with either 'recursive' or 'function' keywords, ranked by overlap

**Test Case 3: No Matches**
- Input: query='quantum computing', courseId='CS101'
- Expected: Empty array (no threads match)

**Test Case 4: Query Too Short**
- Input: query='ab' (< 3 chars)
- Expected: Query disabled (hook returns empty, doesn't call API)

### 7.5 Response Templates

**Test Case 1: Save New Template**
- Input: title='Debugging Tips', content='Try print debugging...', userId
- Expected: Template created with usageCount=0, sorted by updatedAt

**Test Case 2: Delete Template**
- Input: valid templateId
- Expected: Template removed from storage

**Test Case 3: List User Templates**
- Input: userId with 3 saved templates
- Expected: 3 templates returned, sorted by updatedAt desc

**Test Case 4: Empty Templates**
- Input: userId with no templates
- Expected: Empty array []

---

## Summary

This design plan provides:

1. **Complete type definitions** for all new features
2. **8 new API methods** with realistic mock implementations
3. **8 React Query hooks** with proper invalidation
4. **localStorage extensions** for response templates
5. **Detailed implementation checklist** with verification steps
6. **Backend integration guidance** for production transition
7. **Comprehensive test scenarios** covering edge cases

**Key Design Decisions:**
- **Clustering**: Keyword-based (simple, deterministic) with O(n²) complexity acceptable for mock
- **Ranking**: Weighted formula balancing views, time-open, and review status
- **Search**: Fuzzy keyword matching with 20% threshold
- **Templates**: User-owned, localStorage-backed, no seed data
- **Caching**: Aggressive stale times (5-15 min) for expensive operations

**Backward Compatibility:** All changes are additive. No existing methods modified.

**Next Step:** Update `context.md` with key decisions, then await parent approval before implementation.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Lines:** 700+
