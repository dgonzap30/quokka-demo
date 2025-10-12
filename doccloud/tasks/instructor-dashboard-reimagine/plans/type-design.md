# Type Design Plan - Instructor Dashboard Features

**Plan Date:** 2025-10-12
**Agent:** Type Safety Guardian
**Task:** Design TypeScript types for instructor-specific features
**Status:** Ready for Implementation

---

## Executive Summary

This plan defines 8 new TypeScript interfaces and 6 type guards for the instructor dashboard reimagining. All types follow strict mode compliance, use discriminated unions where appropriate, and maintain backward compatibility through optional properties.

**New Types:** 8 interfaces + 6 type guards
**Modified Types:** 1 (InstructorDashboardData - additive only)
**Breaking Changes:** None
**File Modified:** `lib/models/types.ts`

---

## Table of Contents

1. [New Type Definitions](#new-type-definitions)
2. [Enhanced Existing Types](#enhanced-existing-types)
3. [Type Guards](#type-guards)
4. [Input & Result Types](#input--result-types)
5. [Usage Examples](#usage-examples)
6. [Implementation Steps](#implementation-steps)
7. [Test Scenarios](#test-scenarios)

---

## New Type Definitions

### 1. FrequentlyAskedQuestion

**Purpose:** Represents a cluster of similar questions with metadata for instructor triage.

**Location:** `lib/models/types.ts` (after line 519, in Dashboard Analytics section)

```typescript
/**
 * Frequently asked question cluster
 *
 * Groups similar questions together based on keyword analysis.
 * Helps instructors identify common pain points and create
 * comprehensive answers or course material improvements.
 *
 * @example
 * {
 *   id: "faq-binary-search",
 *   questions: [thread1, thread2, thread3],
 *   commonKeywords: ["binary", "search", "sorted", "array"],
 *   frequency: 8,
 *   avgConfidence: 72,
 *   lastOccurred: "2025-10-12T14:30:00Z"
 * }
 */
export interface FrequentlyAskedQuestion {
  /** Unique identifier for this FAQ cluster */
  id: string;

  /** Array of similar thread questions */
  questions: Thread[];

  /** Keywords common across all questions in cluster */
  commonKeywords: string[];

  /** Number of times this topic has been asked */
  frequency: number;

  /** Average AI answer confidence across all questions (0-100) */
  avgConfidence: number;

  /** ISO 8601 timestamp of most recent question in cluster */
  lastOccurred: string;
}
```

**Design Rationale:**
- Embeds `Thread[]` rather than IDs for immediate access (avoids additional lookups)
- `avgConfidence` helps instructors prioritize low-confidence clusters
- `lastOccurred` enables "trending now" vs. "historical FAQ" filtering

---

### 2. TrendingTopic

**Purpose:** Tracks topic popularity over time with growth metrics.

**Location:** `lib/models/types.ts` (after `FrequentlyAskedQuestion`)

```typescript
/**
 * Trending topic with frequency and growth metrics
 *
 * Identifies topics gaining traction among students.
 * Uses keyword/tag analysis from thread data.
 *
 * @example
 * {
 *   id: "trend-algorithms",
 *   topic: "sorting algorithms",
 *   count: 12,
 *   threads: [...],
 *   recentGrowth: 45.5,
 *   timeRange: { start: "2025-10-05T00:00:00Z", end: "2025-10-12T00:00:00Z" }
 * }
 */
export interface TrendingTopic {
  /** Unique identifier for this trending topic */
  id: string;

  /** Topic name (tag or keyword) */
  topic: string;

  /** Total number of threads about this topic */
  count: number;

  /** Array of threads tagged with this topic */
  threads: Thread[];

  /** Percentage growth compared to previous period (e.g., 45.5 = +45.5%) */
  recentGrowth: number;

  /** Time range for trend calculation */
  timeRange: {
    /** ISO 8601 start of period */
    start: string;
    /** ISO 8601 end of period */
    end: string;
  };
}
```

**Design Rationale:**
- `recentGrowth` percentage enables "hot topic" detection
- Embedded `timeRange` makes trend period explicit
- `threads` array supports drill-down UI (clicking shows all related threads)

---

### 3. InstructorInsight

**Purpose:** Priority-ranked thread for instructor triage queue.

**Location:** `lib/models/types.ts` (after `TrendingTopic`)

```typescript
/**
 * Urgency level for instructor insights (literal union type)
 */
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Engagement metrics for a thread
 */
export interface ThreadEngagement {
  /** Number of views */
  views: number;

  /** Number of replies/posts */
  replies: number;

  /** ISO 8601 timestamp of last activity */
  lastActivity: string;
}

/**
 * Priority-ranked thread insight for instructor triage
 *
 * Combines multiple signals (time since creation, engagement,
 * AI confidence) into a single priority score. Helps instructors
 * focus on questions needing immediate attention.
 *
 * @example
 * {
 *   id: "insight-thread-123",
 *   thread: {...},
 *   priorityScore: 87,
 *   urgency: 'high',
 *   engagement: { views: 45, replies: 2, lastActivity: "..." },
 *   reasonFlags: ['low_ai_confidence', 'high_views'],
 *   calculatedAt: "2025-10-12T15:00:00Z"
 * }
 */
export interface InstructorInsight {
  /** Unique identifier for this insight */
  id: string;

  /** The thread requiring attention */
  thread: Thread;

  /** Priority score (0-100, higher = more urgent) */
  priorityScore: number;

  /** Human-readable urgency level */
  urgency: UrgencyLevel;

  /** Engagement metrics for the thread */
  engagement: ThreadEngagement;

  /** Array of reason codes explaining priority (for UI tooltips) */
  reasonFlags: string[];

  /** ISO 8601 timestamp when priority was calculated */
  calculatedAt: string;
}
```

**Design Rationale:**
- Separates `priorityScore` (numeric for sorting) from `urgency` (categorical for UI)
- `ThreadEngagement` interface enables reuse in other contexts
- `reasonFlags` provides explainability ("Why is this urgent?")
- `calculatedAt` enables staleness detection (recalculate if old)

---

### 4. ResponseTemplate

**Purpose:** Saved instructor reply templates for common questions.

**Location:** `lib/models/types.ts` (after `InstructorInsight`)

```typescript
/**
 * Response template category (for filtering/organization)
 */
export type TemplateCategory =
  | 'technical-help'
  | 'course-policy'
  | 'assignment-clarification'
  | 'exam-prep'
  | 'general';

/**
 * Saved response template for common instructor replies
 *
 * Allows instructors to save frequently used responses and
 * reuse them with one click. Includes usage tracking for
 * identifying most valuable templates.
 *
 * @example
 * {
 *   id: "template-office-hours",
 *   userId: "instructor-1",
 *   title: "Office Hours Reminder",
 *   content: "Remember, I hold office hours...",
 *   category: 'course-policy',
 *   tags: ["office-hours", "availability"],
 *   usageCount: 23,
 *   lastUsed: "2025-10-11T10:30:00Z",
 *   createdAt: "2025-09-01T08:00:00Z"
 * }
 */
export interface ResponseTemplate {
  /** Unique identifier for this template */
  id: string;

  /** ID of instructor who created the template */
  userId: string;

  /** Short title for template picker UI */
  title: string;

  /** Template content (supports markdown) */
  content: string;

  /** Category for organization */
  category: TemplateCategory;

  /** Searchable tags for filtering */
  tags: string[];

  /** Number of times this template has been used */
  usageCount: number;

  /** ISO 8601 timestamp of last usage (undefined if never used) */
  lastUsed?: string;

  /** ISO 8601 timestamp when template was created */
  createdAt: string;
}
```

**Design Rationale:**
- `TemplateCategory` enables organized UI (tabs/filters)
- `usageCount` helps surface most valuable templates
- `lastUsed` optional (new templates haven't been used yet)
- `tags` array for flexible filtering beyond categories

---

### 5. BulkActionResult

**Purpose:** Result of batch operations (e.g., endorsing multiple AI answers).

**Location:** `lib/models/types.ts` (after `ResponseTemplate`)

```typescript
/**
 * Type of bulk action performed
 */
export type BulkActionType =
  | 'endorse_ai_answers'
  | 'resolve_threads'
  | 'flag_posts'
  | 'tag_threads'
  | 'delete_posts';

/**
 * Error detail for a failed bulk action item
 */
export interface BulkActionError {
  /** ID of item that failed */
  itemId: string;

  /** Human-readable error reason */
  reason: string;

  /** Optional error code for programmatic handling */
  code?: string;
}

/**
 * Result of a bulk action operation
 *
 * Provides success/failure counts and detailed error information
 * for failed items. Supports optimistic UI updates with rollback.
 *
 * @example
 * {
 *   actionType: 'endorse_ai_answers',
 *   successCount: 8,
 *   failedCount: 2,
 *   errors: [
 *     { itemId: "ai-123", reason: "Already endorsed by user" },
 *     { itemId: "ai-456", reason: "AI answer not found" }
 *   ],
 *   timestamp: "2025-10-12T16:00:00Z"
 * }
 */
export interface BulkActionResult {
  /** Type of bulk action performed */
  actionType: BulkActionType;

  /** Number of items successfully processed */
  successCount: number;

  /** Number of items that failed */
  failedCount: number;

  /** Array of error details for failed items */
  errors: BulkActionError[];

  /** ISO 8601 timestamp when action completed */
  timestamp: string;
}
```

**Design Rationale:**
- Separate `BulkActionError` interface for error details (reusable)
- `actionType` discriminator enables type-specific handling
- Counts enable progress UI ("8 of 10 succeeded")
- `errors` array supports detailed error UI (show failures to user)

---

### 6. QuestionSearchResult

**Purpose:** Enhanced search result with relevance scoring and matched keywords.

**Location:** `lib/models/types.ts` (after `BulkActionResult`)

```typescript
/**
 * Enhanced question search result with relevance metadata
 *
 * Extends basic search with instructor-specific features:
 * - Relevance scoring for ranking
 * - Matched keywords highlighting
 * - Content snippet extraction
 *
 * @example
 * {
 *   id: "search-result-1",
 *   thread: {...},
 *   relevanceScore: 87,
 *   matchedKeywords: ["binary", "search"],
 *   snippet: "How does binary search work on a sorted array?",
 *   matchLocations: [
 *     { field: 'title', positions: [8, 15] },
 *     { field: 'content', positions: [42, 49] }
 *   ]
 * }
 */
export interface QuestionSearchResult {
  /** Unique identifier for this search result */
  id: string;

  /** The matched thread */
  thread: Thread;

  /** Relevance score (0-100, higher = better match) */
  relevanceScore: number;

  /** Keywords from query that matched */
  matchedKeywords: string[];

  /** Short text snippet showing match context (optional) */
  snippet?: string;

  /** Match locations for highlighting (optional) */
  matchLocations?: Array<{
    /** Field where match occurred ('title' | 'content' | 'tags') */
    field: 'title' | 'content' | 'tags';
    /** Character positions of matches */
    positions: number[];
  }>;
}
```

**Design Rationale:**
- Embeds full `Thread` object for immediate access
- `relevanceScore` enables sorting by quality
- `matchLocations` supports advanced highlighting UI
- `snippet` provides preview without full content

---

## Enhanced Existing Types

### InstructorDashboardData (Enhanced)

**Location:** `lib/models/types.ts` (lines 441-455)

**Changes:** Add optional fields for new features

```typescript
/**
 * Instructor dashboard aggregated data
 */
export interface InstructorDashboardData {
  // ============================================
  // EXISTING FIELDS (unchanged)
  // ============================================
  managedCourses: CourseWithMetrics[];
  unansweredQueue: Thread[];
  recentActivity: ActivityItem[];
  insights: CourseInsight[];
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    unansweredThreads: StatWithTrend;
    activeStudents: StatWithTrend;
    aiCoverage: StatWithTrend;
  };
  goals: GoalProgress[];

  // ============================================
  // NEW FIELDS (optional for backward compatibility)
  // ============================================

  /**
   * Priority-ranked threads requiring instructor attention
   * Sorted by priority score (highest first)
   */
  priorityQueue?: InstructorInsight[];

  /**
   * Frequently asked question clusters
   * Sorted by frequency (most common first)
   */
  frequentlyAsked?: FrequentlyAskedQuestion[];

  /**
   * Trending topics with growth metrics
   * Sorted by recent growth percentage (highest first)
   */
  trendingTopics?: TrendingTopic[];

  /**
   * Instructor's saved response templates
   * Sorted by usage count (most used first)
   */
  responseTemplates?: ResponseTemplate[];
}
```

**Backward Compatibility:**
- All new fields optional (`?`)
- Existing API returns `undefined` for new fields initially
- UI components use optional chaining (`data?.priorityQueue`)
- No breaking changes to existing consumers

---

## Type Guards

### 1. isInstructorInsight

**Purpose:** Validate unknown data as `InstructorInsight`

**Location:** `lib/models/types.ts` (after `InstructorInsight` definition)

```typescript
/**
 * Type guard to check if object is a valid InstructorInsight
 *
 * @param obj - Object to validate
 * @returns True if obj is InstructorInsight, false otherwise
 *
 * @example
 * if (isInstructorInsight(data)) {
 *   console.log(data.thread.title); // TypeScript knows data is InstructorInsight
 * }
 */
export function isInstructorInsight(obj: unknown): obj is InstructorInsight {
  if (typeof obj !== 'object' || obj === null) return false;

  const insight = obj as Record<string, unknown>;

  return (
    typeof insight.id === 'string' &&
    typeof insight.thread === 'object' &&
    typeof insight.priorityScore === 'number' &&
    insight.priorityScore >= 0 &&
    insight.priorityScore <= 100 &&
    (insight.urgency === 'critical' ||
      insight.urgency === 'high' ||
      insight.urgency === 'medium' ||
      insight.urgency === 'low') &&
    typeof insight.engagement === 'object' &&
    Array.isArray(insight.reasonFlags) &&
    typeof insight.calculatedAt === 'string'
  );
}
```

---

### 2. isFrequentlyAskedQuestion

**Purpose:** Validate unknown data as `FrequentlyAskedQuestion`

**Location:** `lib/models/types.ts` (after `FrequentlyAskedQuestion` definition)

```typescript
/**
 * Type guard to check if object is a valid FrequentlyAskedQuestion
 *
 * @param obj - Object to validate
 * @returns True if obj is FrequentlyAskedQuestion, false otherwise
 */
export function isFrequentlyAskedQuestion(
  obj: unknown
): obj is FrequentlyAskedQuestion {
  if (typeof obj !== 'object' || obj === null) return false;

  const faq = obj as Record<string, unknown>;

  return (
    typeof faq.id === 'string' &&
    Array.isArray(faq.questions) &&
    Array.isArray(faq.commonKeywords) &&
    typeof faq.frequency === 'number' &&
    typeof faq.avgConfidence === 'number' &&
    faq.avgConfidence >= 0 &&
    faq.avgConfidence <= 100 &&
    typeof faq.lastOccurred === 'string'
  );
}
```

---

### 3. isTrendingTopic

**Purpose:** Validate unknown data as `TrendingTopic`

**Location:** `lib/models/types.ts` (after `TrendingTopic` definition)

```typescript
/**
 * Type guard to check if object is a valid TrendingTopic
 *
 * @param obj - Object to validate
 * @returns True if obj is TrendingTopic, false otherwise
 */
export function isTrendingTopic(obj: unknown): obj is TrendingTopic {
  if (typeof obj !== 'object' || obj === null) return false;

  const trend = obj as Record<string, unknown>;

  return (
    typeof trend.id === 'string' &&
    typeof trend.topic === 'string' &&
    typeof trend.count === 'number' &&
    Array.isArray(trend.threads) &&
    typeof trend.recentGrowth === 'number' &&
    typeof trend.timeRange === 'object' &&
    trend.timeRange !== null &&
    typeof (trend.timeRange as Record<string, unknown>).start === 'string' &&
    typeof (trend.timeRange as Record<string, unknown>).end === 'string'
  );
}
```

---

### 4. isResponseTemplate

**Purpose:** Validate unknown data as `ResponseTemplate`

**Location:** `lib/models/types.ts` (after `ResponseTemplate` definition)

```typescript
/**
 * Type guard to check if object is a valid ResponseTemplate
 *
 * @param obj - Object to validate
 * @returns True if obj is ResponseTemplate, false otherwise
 */
export function isResponseTemplate(obj: unknown): obj is ResponseTemplate {
  if (typeof obj !== 'object' || obj === null) return false;

  const template = obj as Record<string, unknown>;

  return (
    typeof template.id === 'string' &&
    typeof template.userId === 'string' &&
    typeof template.title === 'string' &&
    typeof template.content === 'string' &&
    (template.category === 'technical-help' ||
      template.category === 'course-policy' ||
      template.category === 'assignment-clarification' ||
      template.category === 'exam-prep' ||
      template.category === 'general') &&
    Array.isArray(template.tags) &&
    typeof template.usageCount === 'number' &&
    (template.lastUsed === undefined || typeof template.lastUsed === 'string') &&
    typeof template.createdAt === 'string'
  );
}
```

---

### 5. isBulkActionResult

**Purpose:** Validate unknown data as `BulkActionResult`

**Location:** `lib/models/types.ts` (after `BulkActionResult` definition)

```typescript
/**
 * Type guard to check if object is a valid BulkActionResult
 *
 * @param obj - Object to validate
 * @returns True if obj is BulkActionResult, false otherwise
 */
export function isBulkActionResult(obj: unknown): obj is BulkActionResult {
  if (typeof obj !== 'object' || obj === null) return false;

  const result = obj as Record<string, unknown>;

  return (
    (result.actionType === 'endorse_ai_answers' ||
      result.actionType === 'resolve_threads' ||
      result.actionType === 'flag_posts' ||
      result.actionType === 'tag_threads' ||
      result.actionType === 'delete_posts') &&
    typeof result.successCount === 'number' &&
    typeof result.failedCount === 'number' &&
    Array.isArray(result.errors) &&
    typeof result.timestamp === 'string'
  );
}
```

---

### 6. isQuestionSearchResult

**Purpose:** Validate unknown data as `QuestionSearchResult`

**Location:** `lib/models/types.ts` (after `QuestionSearchResult` definition)

```typescript
/**
 * Type guard to check if object is a valid QuestionSearchResult
 *
 * @param obj - Object to validate
 * @returns True if obj is QuestionSearchResult, false otherwise
 */
export function isQuestionSearchResult(
  obj: unknown
): obj is QuestionSearchResult {
  if (typeof obj !== 'object' || obj === null) return false;

  const result = obj as Record<string, unknown>;

  return (
    typeof result.id === 'string' &&
    typeof result.thread === 'object' &&
    typeof result.relevanceScore === 'number' &&
    result.relevanceScore >= 0 &&
    result.relevanceScore <= 100 &&
    Array.isArray(result.matchedKeywords) &&
    (result.snippet === undefined || typeof result.snippet === 'string') &&
    (result.matchLocations === undefined || Array.isArray(result.matchLocations))
  );
}
```

---

## Input & Result Types

### 1. CreateResponseTemplateInput

**Purpose:** Input for creating a new response template

**Location:** `lib/models/types.ts` (after `ResponseTemplate` definition)

```typescript
/**
 * Input for creating a new response template
 */
export interface CreateResponseTemplateInput {
  /** Short title for template picker UI */
  title: string;

  /** Template content (supports markdown) */
  content: string;

  /** Category for organization */
  category: TemplateCategory;

  /** Optional searchable tags */
  tags?: string[];
}
```

---

### 2. UpdateResponseTemplateInput

**Purpose:** Input for updating an existing response template

**Location:** `lib/models/types.ts` (after `CreateResponseTemplateInput`)

```typescript
/**
 * Input for updating an existing response template
 */
export interface UpdateResponseTemplateInput {
  /** ID of template to update */
  templateId: string;

  /** Fields to update (partial) */
  updates: Partial<Pick<ResponseTemplate, 'title' | 'content' | 'category' | 'tags'>>;
}
```

---

### 3. BulkEndorseInput

**Purpose:** Input for bulk endorsing AI answers

**Location:** `lib/models/types.ts` (after `BulkActionResult` definition)

```typescript
/**
 * Input for bulk endorsing AI answers
 */
export interface BulkEndorseInput {
  /** Array of AI answer IDs to endorse */
  aiAnswerIds: string[];

  /** ID of user performing endorsement */
  userId: string;

  /** Whether user is an instructor */
  isInstructor: boolean;
}
```

---

### 4. SearchQuestionsInput

**Purpose:** Input for enhanced question search

**Location:** `lib/models/types.ts` (after `QuestionSearchResult` definition)

```typescript
/**
 * Input for enhanced question search
 */
export interface SearchQuestionsInput {
  /** Search query string */
  query: string;

  /** Optional course ID filter */
  courseId?: string;

  /** Optional status filter */
  status?: ThreadStatus[];

  /** Optional tag filter */
  tags?: string[];

  /** Maximum number of results (default: 10) */
  maxResults?: number;

  /** Whether to include match locations for highlighting (default: false) */
  includeMatchLocations?: boolean;
}
```

---

## Usage Examples

### Example 1: Rendering Priority Queue

```typescript
import type { InstructorDashboardData, InstructorInsight } from '@/lib/models/types';
import { isInstructorInsight } from '@/lib/models/types';

function PriorityQueuePanel({ data }: { data: InstructorDashboardData }) {
  // Optional chaining for backward compatibility
  const priorityQueue = data.priorityQueue ?? [];

  return (
    <div className="space-y-4">
      <h2>Priority Queue</h2>
      {priorityQueue.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: InstructorInsight }) {
  // TypeScript knows insight has all required properties
  const urgencyColor = {
    critical: 'bg-danger',
    high: 'bg-warning',
    medium: 'bg-accent',
    low: 'bg-secondary',
  }[insight.urgency];

  return (
    <div className={`p-4 rounded-lg ${urgencyColor}`}>
      <h3>{insight.thread.title}</h3>
      <p>Priority Score: {insight.priorityScore}</p>
      <p>Views: {insight.engagement.views} | Replies: {insight.engagement.replies}</p>
    </div>
  );
}
```

---

### Example 2: Using Response Templates

```typescript
import type { ResponseTemplate, CreateResponseTemplateInput } from '@/lib/models/types';
import { useCreateTemplate, useResponseTemplates } from '@/lib/api/hooks';

function ResponseTemplatePicker() {
  const { data: templates } = useResponseTemplates();
  const { mutate: createTemplate } = useCreateTemplate();

  const handleCreate = (input: CreateResponseTemplateInput) => {
    createTemplate(input, {
      onSuccess: (newTemplate: ResponseTemplate) => {
        console.log('Template created:', newTemplate.id);
      },
    });
  };

  return (
    <div>
      <h3>Your Templates</h3>
      {templates?.map((template) => (
        <div key={template.id}>
          <h4>{template.title}</h4>
          <p>Used {template.usageCount} times</p>
          <span className="text-xs">{template.category}</span>
        </div>
      ))}
    </div>
  );
}
```

---

### Example 3: Bulk Endorsement with Error Handling

```typescript
import type { BulkEndorseInput, BulkActionResult } from '@/lib/models/types';
import { useBulkEndorse } from '@/lib/api/hooks';

function BulkActionsToolbar({ selectedIds }: { selectedIds: string[] }) {
  const { mutate: bulkEndorse, isLoading } = useBulkEndorse();
  const currentUser = useCurrentUser();

  const handleBulkEndorse = () => {
    const input: BulkEndorseInput = {
      aiAnswerIds: selectedIds,
      userId: currentUser.id,
      isInstructor: currentUser.role === 'instructor',
    };

    bulkEndorse(input, {
      onSuccess: (result: BulkActionResult) => {
        console.log(`✅ ${result.successCount} endorsed`);

        if (result.failedCount > 0) {
          console.error(`❌ ${result.failedCount} failed:`);
          result.errors.forEach((err) => {
            console.error(`  - ${err.itemId}: ${err.reason}`);
          });
        }
      },
    });
  };

  return (
    <button onClick={handleBulkEndorse} disabled={isLoading || selectedIds.length === 0}>
      Endorse Selected ({selectedIds.length})
    </button>
  );
}
```

---

### Example 4: FAQ Cluster Display

```typescript
import type { FrequentlyAskedQuestion } from '@/lib/models/types';

function FAQClusterCard({ faq }: { faq: FrequentlyAskedQuestion }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3>
          {faq.commonKeywords.slice(0, 3).join(', ')}
        </h3>
        <span className="badge">{faq.frequency}x asked</span>
      </div>

      <div className="mt-2 space-y-1">
        {faq.questions.slice(0, 3).map((thread) => (
          <p key={thread.id} className="text-sm text-muted-foreground">
            {thread.title}
          </p>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <span>Avg Confidence: {faq.avgConfidence}%</span>
        <span>Last asked: {new Date(faq.lastOccurred).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
```

---

### Example 5: Enhanced Search with Highlighting

```typescript
import type { SearchQuestionsInput, QuestionSearchResult } from '@/lib/models/types';
import { useSearchQuestions } from '@/lib/api/hooks';

function QuestionSearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const searchInput: SearchQuestionsInput = {
    query: debouncedQuery,
    maxResults: 10,
    includeMatchLocations: true,
  };

  const { data: results } = useSearchQuestions(searchInput);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions..."
      />

      <div className="mt-4 space-y-2">
        {results?.map((result: QuestionSearchResult) => (
          <div key={result.id} className="p-3 border rounded">
            <div className="flex items-center justify-between">
              <h4>{result.thread.title}</h4>
              <span className="text-xs">Score: {result.relevanceScore}</span>
            </div>

            {result.snippet && (
              <p className="text-sm text-muted-foreground mt-1">{result.snippet}</p>
            )}

            <div className="mt-2 flex gap-2">
              {result.matchedKeywords.map((keyword) => (
                <span key={keyword} className="badge-sm">{keyword}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Implementation Steps

### Step 1: Add Type Definitions to `lib/models/types.ts`

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**Line Range:** After line 519 (after `GoalProgress` type)

**Actions:**
1. Add `UrgencyLevel` type
2. Add `ThreadEngagement` interface
3. Add `InstructorInsight` interface
4. Add `isInstructorInsight()` type guard
5. Add `FrequentlyAskedQuestion` interface
6. Add `isFrequentlyAskedQuestion()` type guard
7. Add `TrendingTopic` interface
8. Add `isTrendingTopic()` type guard
9. Add `TemplateCategory` type
10. Add `ResponseTemplate` interface
11. Add `isResponseTemplate()` type guard
12. Add `CreateResponseTemplateInput` interface
13. Add `UpdateResponseTemplateInput` interface
14. Add `BulkActionType` type
15. Add `BulkActionError` interface
16. Add `BulkActionResult` interface
17. Add `isBulkActionResult()` type guard
18. Add `BulkEndorseInput` interface
19. Add `QuestionSearchResult` interface
20. Add `isQuestionSearchResult()` type guard
21. Add `SearchQuestionsInput` interface

**Estimated Lines:** ~450 lines (including JSDoc comments)

---

### Step 2: Enhance `InstructorDashboardData` Interface

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**Line:** 441-455 (existing `InstructorDashboardData`)

**Actions:**
1. Add JSDoc comment explaining new fields
2. Add `priorityQueue?: InstructorInsight[]` field
3. Add `frequentlyAsked?: FrequentlyAskedQuestion[]` field
4. Add `trendingTopics?: TrendingTopic[]` field
5. Add `responseTemplates?: ResponseTemplate[]` field

**Estimated Lines:** +25 lines

---

### Step 3: Update Imports in API Client

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

**Line:** 1-27 (existing type imports)

**Actions:**
1. Add new types to `import type { ... }` statement:
   - `InstructorInsight`
   - `FrequentlyAskedQuestion`
   - `TrendingTopic`
   - `ResponseTemplate`
   - `BulkActionResult`
   - `QuestionSearchResult`
   - `CreateResponseTemplateInput`
   - `UpdateResponseTemplateInput`
   - `BulkEndorseInput`
   - `SearchQuestionsInput`

**Estimated Lines:** ~10 type names added to existing import

---

### Step 4: Export Type Guards from Index (Optional)

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**Actions:**
- Ensure all new type guards are exported (already done in definitions above)
- No additional changes needed

---

### Step 5: Verify TypeScript Compilation

**Command:**
```bash
npx tsc --noEmit
```

**Expected Output:** No errors

**If Errors:** Fix type issues before proceeding to implementation

---

### Step 6: Create Mock Data Generation Functions

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`

**Actions:**
1. Create `generateInstructorInsights()` function
2. Create `generateFrequentlyAskedQuestions()` function
3. Create `generateTrendingTopics()` function
4. Create `generateResponseTemplates()` function

**Note:** This is outside the scope of type design but listed here for context.

---

## Test Scenarios

### Type-Level Tests (Compile-Time)

**Test 1: Type Narrowing with Type Guards**
```typescript
function processInsight(data: unknown) {
  if (isInstructorInsight(data)) {
    // TypeScript knows data is InstructorInsight
    console.log(data.thread.title); // ✅ No error
    console.log(data.priorityScore); // ✅ No error
  }
}
```

**Test 2: Optional Field Access**
```typescript
function renderDashboard(data: InstructorDashboardData) {
  // Optional chaining for new fields
  const hasPriorityQueue = data.priorityQueue !== undefined; // ✅ No error
  const queueLength = data.priorityQueue?.length ?? 0; // ✅ No error
}
```

**Test 3: Discriminated Union Exhaustiveness**
```typescript
function getBulkActionMessage(result: BulkActionResult): string {
  switch (result.actionType) {
    case 'endorse_ai_answers':
      return 'Endorsements complete';
    case 'resolve_threads':
      return 'Threads resolved';
    case 'flag_posts':
      return 'Posts flagged';
    case 'tag_threads':
      return 'Threads tagged';
    case 'delete_posts':
      return 'Posts deleted';
    default:
      // TypeScript ensures all cases covered
      const _exhaustive: never = result.actionType;
      return _exhaustive;
  }
}
```

---

### Runtime Tests (Unit Tests)

**Test 4: Type Guard Validation - Valid Data**
```typescript
test('isInstructorInsight returns true for valid insight', () => {
  const validInsight = {
    id: 'insight-1',
    thread: { id: 'thread-1', /* ... */ },
    priorityScore: 85,
    urgency: 'high',
    engagement: { views: 10, replies: 2, lastActivity: '2025-10-12T10:00:00Z' },
    reasonFlags: ['low_ai_confidence'],
    calculatedAt: '2025-10-12T10:00:00Z',
  };

  expect(isInstructorInsight(validInsight)).toBe(true);
});
```

**Test 5: Type Guard Validation - Invalid Data**
```typescript
test('isInstructorInsight returns false for invalid insight', () => {
  const invalidInsight = {
    id: 'insight-1',
    priorityScore: 85,
    // Missing required fields
  };

  expect(isInstructorInsight(invalidInsight)).toBe(false);
});
```

**Test 6: Type Guard Validation - Edge Cases**
```typescript
test('isInstructorInsight validates score range', () => {
  const invalidScore = {
    id: 'insight-1',
    thread: { /* ... */ },
    priorityScore: 150, // Invalid: > 100
    urgency: 'high',
    engagement: { /* ... */ },
    reasonFlags: [],
    calculatedAt: '2025-10-12T10:00:00Z',
  };

  expect(isInstructorInsight(invalidScore)).toBe(false);
});
```

**Test 7: Type Guard Validation - Null/Undefined**
```typescript
test('isInstructorInsight handles null and undefined', () => {
  expect(isInstructorInsight(null)).toBe(false);
  expect(isInstructorInsight(undefined)).toBe(false);
  expect(isInstructorInsight({})).toBe(false);
});
```

---

### Integration Tests

**Test 8: Enhanced Dashboard Data Structure**
```typescript
test('InstructorDashboardData accepts new optional fields', () => {
  const dashboardData: InstructorDashboardData = {
    managedCourses: [],
    unansweredQueue: [],
    recentActivity: [],
    insights: [],
    stats: { /* ... */ },
    goals: [],
    // New optional fields
    priorityQueue: [{ /* ... */ }],
    frequentlyAsked: [{ /* ... */ }],
    trendingTopics: [{ /* ... */ }],
    responseTemplates: [{ /* ... */ }],
  };

  expect(dashboardData).toBeDefined();
});
```

**Test 9: Backward Compatibility**
```typescript
test('InstructorDashboardData works without new fields', () => {
  const oldDashboardData: InstructorDashboardData = {
    managedCourses: [],
    unansweredQueue: [],
    recentActivity: [],
    insights: [],
    stats: { /* ... */ },
    goals: [],
    // No new fields - should still compile
  };

  expect(oldDashboardData.priorityQueue).toBeUndefined();
});
```

---

## Summary

**New Types Created:** 8 interfaces + 4 supporting types
**Type Guards Created:** 6 runtime validators
**Modified Types:** 1 (InstructorDashboardData - additive only)
**Input Types:** 4 (for API mutations and queries)
**Breaking Changes:** 0 (all backward compatible)

**Strict Mode Compliance:**
- ✅ Zero `any` types
- ✅ All type imports use `import type`
- ✅ Discriminated unions for variant types
- ✅ Type guards for runtime validation
- ✅ JSDoc comments on all interfaces
- ✅ Optional properties explicitly marked
- ✅ Literal types for enums
- ✅ Generic constraints where applicable

**Ready for Implementation:** Yes
**Estimated Implementation Time:** 2-3 hours for types only
**Lines Added:** ~550 lines (types + guards + comments)

---

**Plan Complete - Ready for Parent Agent Execution**
