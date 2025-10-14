# Data Model Design: Quokka Points & Assignment Q&A Metrics

**Date:** 2025-10-13
**Task:** Dashboard Q&A Companion Refocus
**Agent:** Mock API Designer

---

## Executive Summary

This document specifies the complete data model architecture, mock API integration, and React Query hook strategy for Quokka Points and Assignment Q&A Opportunities features.

**Key Deliverables:**
1. TypeScript interface definitions (exact locations in `lib/models/types.ts`)
2. Point calculation algorithms (deterministic, O(n))
3. Mock data generation logic
4. API method modifications
5. React Query hook updates (extend existing `useStudentDashboard`)

**Architecture Decision:** Server-side calculation with client-side display only. All business logic in `lib/api/client.ts`, zero calculations in components.

---

## Part A: TypeScript Interface Definitions

### Location: `lib/models/types.ts`

All new types should be added after line 1090 (after `StudentDashboardData` interface).

---

### A1. Quokka Points Interfaces

**Insert at line 1091:**

```typescript
// ============================================
// Quokka Points Types (Dashboard Q&A Gamification)
// ============================================

/**
 * Point source for Quokka Points breakdown
 *
 * Represents a category of actions that earn points.
 * Used to show users how they earned their points.
 */
export interface PointSource {
  /** Unique identifier for this point source type */
  id: string;

  /** Display label (e.g., "Peer Endorsements", "Helpful Answers") */
  label: string;

  /** Icon component from lucide-react */
  icon: React.ComponentType<{ className?: string }>;

  /** Total points earned from this source */
  points: number;

  /** Number of times this action occurred */
  count: number;

  /** Points awarded per action (e.g., 5 points per endorsement) */
  pointsPerAction: number;
}

/**
 * Milestone for Quokka Points progression
 *
 * Educational gamification - milestones celebrate progress
 * without creating competitive pressure.
 */
export interface PointMilestone {
  /** Milestone point threshold (e.g., 100, 500, 1000) */
  threshold: number;

  /** Milestone label (e.g., "Active Contributor") */
  label: string;

  /** Whether user has achieved this milestone */
  achieved: boolean;

  /** Optional badge icon */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Quokka Points data for student dashboard
 *
 * Complete point system data including balance, breakdown,
 * milestones, and sparkline visualization.
 */
export interface QuokkaPointsData {
  /** Total Quokka Points balance (lifetime) */
  totalPoints: number;

  /** Points earned this week */
  weeklyPoints: number;

  /** Breakdown of points by source type (sorted by points DESC) */
  pointSources: PointSource[];

  /** Milestone progression (sorted by threshold ASC) */
  milestones: PointMilestone[];

  /** Optional 7-day sparkline data (points earned per day) */
  sparklineData?: number[];
}
```

---

### A2. Assignment Q&A Interfaces

**Insert after PointMilestone (around line 1145):**

```typescript
// ============================================
// Assignment Q&A Types (Course-Specific Opportunities)
// ============================================

/**
 * Assignment for Q&A opportunity tracking
 *
 * Minimal assignment metadata needed for dashboard.
 * Full assignment details would come from LMS integration.
 */
export interface Assignment {
  /** Unique assignment identifier */
  id: string;

  /** Course ID this assignment belongs to */
  courseId: string;

  /** Assignment title */
  title: string;

  /** Due date (ISO 8601) */
  dueDate: string;

  /** Creation date (ISO 8601) */
  createdAt: string;
}

/**
 * Q&A metrics for a specific assignment
 *
 * Aggregated metrics showing Q&A activity and engagement
 * for assignment-related threads. Used to identify
 * opportunities for students to ask or answer questions.
 */
export interface AssignmentQAMetrics {
  /** Assignment unique ID */
  assignmentId: string;

  /** Assignment title */
  title: string;

  /** Course ID */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Assignment due date (ISO 8601) */
  dueDate: string;

  /** Q&A Engagement Metrics */
  totalQuestions: number;
  unansweredQuestions: number;
  yourQuestions: number;
  yourAnswers: number;
  aiAnswersAvailable: number;
  activeStudents: number;

  /** Recent activity summary (human-readable, optional) */
  recentActivity?: string;

  /** Suggested action based on metrics */
  suggestedAction: "ask" | "answer" | "review";

  /** Reason for suggested action (explainable AI) */
  actionReason: string;

  /** Optional link to assignment Q&A page */
  link?: string;
}
```

---

### A3. Update StudentDashboardData Interface

**Location: line 425-437** (replace existing interface)

```typescript
/**
 * Student dashboard aggregated data
 */
export interface StudentDashboardData {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    totalPosts: StatWithTrend;
    endorsedPosts: StatWithTrend;
  };
  goals: GoalProgress[];

  // NEW: Quokka Points data
  quokkaPoints: QuokkaPointsData;

  // NEW: Assignment Q&A opportunities (sorted by due date, nearest first)
  assignmentQA: AssignmentQAMetrics[];
}
```

---

### A4. Extend Post Interface (Endorsement Tracking)

**Location: line 209-218** (update existing interface)

```typescript
export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  endorsed: boolean;              // KEEP for backward compatibility
  flagged: boolean;
  createdAt: string;
  updatedAt: string;

  // NEW: Enhanced endorsement tracking
  endorsedBy?: string[];          // Array of user IDs who endorsed
  instructorEndorsed?: boolean;   // Flag if any instructor endorsed
}
```

---

## Part B: Point Calculation Algorithms

### B1. Point Values (Constants)

**Location:** Create new file `lib/utils/quokka-points.ts`

```typescript
/**
 * Point values for different actions
 * Matches component design specifications
 */
export const POINT_VALUES = {
  HELPFUL_ANSWER: 10,          // Answer marked helpful (endorsed by peer)
  PEER_ENDORSEMENT: 5,         // Peer endorses your answer
  INSTRUCTOR_ENDORSEMENT: 20,  // Instructor endorses your answer
  SHARE_CONVERSATION: 15,      // Share AI conversation as thread
  QUESTION_ASKED: 2,           // Ask a question (small incentive)
} as const;

/**
 * Milestone thresholds and labels
 */
export const MILESTONES = [
  { threshold: 100, label: "Getting Started" },
  { threshold: 250, label: "Active Learner" },
  { threshold: 500, label: "Active Contributor" },
  { threshold: 1000, label: "Helpful Contributor" },
  { threshold: 2500, label: "Community Expert" },
] as const;
```

---

### B2. Point Calculation Logic

**Location:** `lib/utils/quokka-points.ts` (continued)

```typescript
import type { Thread, Post, PointSource, PointMilestone, QuokkaPointsData } from "@/lib/models/types";
import { ThumbsUp, MessageSquare, Star, Share2, HelpCircle } from "lucide-react";
import { generateSparkline } from "./dashboard-calculations";

/**
 * Calculate total Quokka Points for a user
 *
 * @param userId - User ID to calculate points for
 * @param userThreads - All threads created by user
 * @param userPosts - All posts created by user
 * @returns QuokkaPointsData with complete breakdown
 */
export function calculateQuokkaPoints(
  userId: string,
  userThreads: Thread[],
  userPosts: Post[]
): QuokkaPointsData {
  // 1. Calculate point sources
  const pointSources: PointSource[] = [];

  // Source 1: Peer Endorsements (endorsed posts, not by instructor)
  const peerEndorsedPosts = userPosts.filter(p =>
    p.endorsed &&
    p.endorsedBy &&
    p.endorsedBy.length > 0 &&
    !p.instructorEndorsed  // Exclude instructor endorsements
  );
  const peerEndorsementCount = peerEndorsedPosts.reduce((sum, post) => {
    // Count peer endorsers only (filter out instructor IDs)
    const peerEndorsers = (post.endorsedBy || []).filter(id => !id.startsWith('instructor-'));
    return sum + peerEndorsers.length;
  }, 0);
  const peerEndorsementPoints = peerEndorsementCount * POINT_VALUES.PEER_ENDORSEMENT;

  if (peerEndorsementCount > 0) {
    pointSources.push({
      id: "peer-endorsements",
      label: "Peer Endorsements",
      icon: ThumbsUp,
      points: peerEndorsementPoints,
      count: peerEndorsementCount,
      pointsPerAction: POINT_VALUES.PEER_ENDORSEMENT,
    });
  }

  // Source 2: Helpful Answers (posts with peer endorsements)
  const helpfulAnswers = peerEndorsedPosts.length;
  const helpfulAnswerPoints = helpfulAnswers * POINT_VALUES.HELPFUL_ANSWER;

  if (helpfulAnswers > 0) {
    pointSources.push({
      id: "helpful-answers",
      label: "Helpful Answers",
      icon: MessageSquare,
      points: helpfulAnswerPoints,
      count: helpfulAnswers,
      pointsPerAction: POINT_VALUES.HELPFUL_ANSWER,
    });
  }

  // Source 3: Instructor Endorsements (highest value)
  const instructorEndorsedPosts = userPosts.filter(p =>
    p.endorsed && p.instructorEndorsed
  );
  const instructorEndorsementCount = instructorEndorsedPosts.length;
  const instructorEndorsementPoints = instructorEndorsementCount * POINT_VALUES.INSTRUCTOR_ENDORSEMENT;

  if (instructorEndorsementCount > 0) {
    pointSources.push({
      id: "instructor-endorsements",
      label: "Instructor Endorsed",
      icon: Star,
      points: instructorEndorsementPoints,
      count: instructorEndorsementCount,
      pointsPerAction: POINT_VALUES.INSTRUCTOR_ENDORSEMENT,
    });
  }

  // Source 4: Shared Conversations (threads converted from AI chat)
  // Identify by checking thread metadata (future: add `sharedFromChat` flag to Thread)
  // For now, approximate: threads with AI answers and high engagement
  const sharedConversations = userThreads.filter(t =>
    t.hasAIAnswer && t.views > 5
  ).length;
  const sharePoints = sharedConversations * POINT_VALUES.SHARE_CONVERSATION;

  if (sharedConversations > 0) {
    pointSources.push({
      id: "shared-conversations",
      label: "Shared Conversations",
      icon: Share2,
      points: sharePoints,
      count: sharedConversations,
      pointsPerAction: POINT_VALUES.SHARE_CONVERSATION,
    });
  }

  // Source 5: Questions Asked (small incentive)
  const questionsAsked = userThreads.length;
  const questionPoints = questionsAsked * POINT_VALUES.QUESTION_ASKED;

  if (questionsAsked > 0) {
    pointSources.push({
      id: "questions-asked",
      label: "Questions Asked",
      icon: HelpCircle,
      points: questionPoints,
      count: questionsAsked,
      pointsPerAction: POINT_VALUES.QUESTION_ASKED,
    });
  }

  // 2. Calculate total points
  const totalPoints = pointSources.reduce((sum, source) => sum + source.points, 0);

  // 3. Calculate weekly points (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = userPosts.filter(p =>
    new Date(p.createdAt) >= sevenDaysAgo
  );
  const recentThreads = userThreads.filter(t =>
    new Date(t.createdAt) >= sevenDaysAgo
  );

  // Recalculate points for recent activity only
  const weeklyPeerEndorsements = recentPosts.filter(p =>
    p.endorsed && !p.instructorEndorsed
  ).length * POINT_VALUES.PEER_ENDORSEMENT;

  const weeklyHelpfulAnswers = recentPosts.filter(p =>
    p.endorsed && !p.instructorEndorsed
  ).length * POINT_VALUES.HELPFUL_ANSWER;

  const weeklyInstructorEndorsements = recentPosts.filter(p =>
    p.endorsed && p.instructorEndorsed
  ).length * POINT_VALUES.INSTRUCTOR_ENDORSEMENT;

  const weeklyShares = recentThreads.filter(t =>
    t.hasAIAnswer && t.views > 5
  ).length * POINT_VALUES.SHARE_CONVERSATION;

  const weeklyQuestions = recentThreads.length * POINT_VALUES.QUESTION_ASKED;

  const weeklyPoints = weeklyPeerEndorsements + weeklyHelpfulAnswers +
    weeklyInstructorEndorsements + weeklyShares + weeklyQuestions;

  // 4. Calculate milestones
  const milestones: PointMilestone[] = MILESTONES.map(m => ({
    threshold: m.threshold,
    label: m.label,
    achieved: totalPoints >= m.threshold,
  }));

  // 5. Generate sparkline (7-day history)
  const avgPointsPerDay = totalPoints / Math.max(1, userThreads.length + userPosts.length / 2);
  const sparklineData = generateSparkline(
    `quokka-points-${userId}`,
    7,
    Math.max(1, avgPointsPerDay)
  );

  // 6. Sort point sources by points (highest first)
  pointSources.sort((a, b) => b.points - a.points);

  return {
    totalPoints,
    weeklyPoints,
    pointSources,
    milestones,
    sparklineData,
  };
}
```

**Complexity Analysis:**
- Post filtering: O(n) where n = total posts
- Thread filtering: O(m) where m = total threads
- Sorting: O(k log k) where k = point sources (max 5) = O(1)
- **Total: O(n + m) - linear, acceptable**

---

### B3. Point Calculation Edge Cases

**Zero Points:**
```typescript
// Empty arrays
calculateQuokkaPoints(userId, [], [])
// Returns: { totalPoints: 0, weeklyPoints: 0, pointSources: [], milestones: [...], sparklineData: [0,0,0,0,0,0,0] }
```

**No Endorsements:**
```typescript
// User has threads/posts but no endorsements
calculateQuokkaPoints(userId, [thread1, thread2], [post1, post2, post3])
// Returns: { totalPoints: 4, weeklyPoints: X, pointSources: [QuestionsAsked], milestones: [...] }
```

**Mixed Endorsements:**
```typescript
// Some peer, some instructor endorsements
post1.endorsedBy = ['student-1', 'student-2'];  // 2 peer endorsements
post1.instructorEndorsed = false;

post2.endorsedBy = ['instructor-1'];
post2.instructorEndorsed = true;  // 1 instructor endorsement

// Result:
// - Peer: 2 × 5 = 10 points
// - Helpful: 1 × 10 = 10 points (only post1)
// - Instructor: 1 × 20 = 20 points
```

---

## Part C: Assignment Q&A Calculation Logic

### C1. Assignment Q&A Algorithm

**Location:** `lib/utils/assignment-qa.ts` (NEW FILE)

```typescript
import type { Thread, Post, User, Assignment, AssignmentQAMetrics } from "@/lib/models/types";

/**
 * Calculate Q&A metrics for a single assignment
 *
 * @param assignment - Assignment metadata
 * @param allThreads - All threads in the system
 * @param allPosts - All posts in the system
 * @param allUsers - All users (for role checking)
 * @param userId - Current user ID
 * @returns AssignmentQAMetrics with engagement data
 */
export function calculateAssignmentQA(
  assignment: Assignment,
  allThreads: Thread[],
  allPosts: Post[],
  allUsers: User[],
  userId: string
): AssignmentQAMetrics {
  // 1. Find threads tagged with this assignment
  // Tag format: "assignment-{assignmentId}" (e.g., "assignment-1")
  const assignmentTag = `assignment-${assignment.id}`;
  const assignmentThreads = allThreads.filter(t =>
    t.courseId === assignment.courseId &&
    t.tags?.includes(assignmentTag)
  );

  // 2. Calculate total questions
  const totalQuestions = assignmentThreads.length;

  // 3. Calculate unanswered questions (status = 'open')
  const unansweredQuestions = assignmentThreads.filter(t =>
    t.status === 'open'
  ).length;

  // 4. Calculate user's questions
  const yourQuestions = assignmentThreads.filter(t =>
    t.authorId === userId
  ).length;

  // 5. Calculate user's answers (posts in assignment threads)
  const threadIds = assignmentThreads.map(t => t.id);
  const yourAnswers = allPosts.filter(p =>
    threadIds.includes(p.threadId) &&
    p.authorId === userId
  ).length;

  // 6. Calculate AI answers available
  const aiAnswersAvailable = assignmentThreads.filter(t =>
    t.hasAIAnswer
  ).length;

  // 7. Calculate active students (unique authors)
  const authorIds = new Set(assignmentThreads.map(t => t.authorId));
  const activeStudents = authorIds.size;

  // 8. Calculate recent activity (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentThreads = assignmentThreads.filter(t =>
    new Date(t.createdAt) >= oneDayAgo
  );
  const recentActivity = recentThreads.length > 0
    ? `${recentThreads.length} question${recentThreads.length !== 1 ? 's' : ''} in last 24h`
    : undefined;

  // 9. Determine suggested action (server-side recommendation)
  let suggestedAction: "ask" | "answer" | "review";
  let actionReason: string;

  if (unansweredQuestions >= 5) {
    // Critical: many unanswered questions
    suggestedAction = "answer";
    actionReason = `${unansweredQuestions} unanswered questions need help`;
  } else if (unansweredQuestions >= 1 && unansweredQuestions < 5) {
    // Moderate: some unanswered questions
    suggestedAction = "answer";
    actionReason = `${unansweredQuestions} question${unansweredQuestions !== 1 ? 's' : ''} waiting for answers`;
  } else if (totalQuestions === 0 || yourQuestions === 0) {
    // No activity or user hasn't asked
    suggestedAction = "ask";
    actionReason = yourQuestions === 0
      ? "Start the discussion - ask a question"
      : "Be the first to ask about this assignment";
  } else if (aiAnswersAvailable > 0 && totalQuestions === yourQuestions + yourAnswers) {
    // All questions answered, AI answers available
    suggestedAction = "review";
    actionReason = "All questions answered - review AI responses";
  } else {
    // Default: encourage asking
    suggestedAction = "ask";
    actionReason = "Ask questions to clarify concepts";
  }

  // 10. Generate link to assignment Q&A page
  const link = `/courses/${assignment.courseId}/assignments/${assignment.id}/qa`;

  return {
    assignmentId: assignment.id,
    title: assignment.title,
    courseId: assignment.courseId,
    courseName: "", // Will be filled by caller
    dueDate: assignment.dueDate,
    totalQuestions,
    unansweredQuestions,
    yourQuestions,
    yourAnswers,
    aiAnswersAvailable,
    activeStudents,
    recentActivity,
    suggestedAction,
    actionReason,
    link,
  };
}

/**
 * Calculate Q&A metrics for all assignments in user's courses
 *
 * @returns Array of AssignmentQAMetrics sorted by due date (nearest first)
 */
export function calculateAllAssignmentQA(
  assignments: Assignment[],
  allThreads: Thread[],
  allPosts: Post[],
  allUsers: User[],
  userId: string,
  userCourses: Array<{ id: string; name: string }>
): AssignmentQAMetrics[] {
  // Filter assignments for user's enrolled courses
  const courseIds = userCourses.map(c => c.id);
  const userAssignments = assignments.filter(a =>
    courseIds.includes(a.courseId)
  );

  // Calculate metrics for each assignment
  const metrics = userAssignments.map(assignment => {
    const qa = calculateAssignmentQA(assignment, allThreads, allPosts, allUsers, userId);

    // Fill in course name
    const course = userCourses.find(c => c.id === assignment.courseId);
    qa.courseName = course?.name || "Unknown Course";

    return qa;
  });

  // Sort by due date (nearest first)
  metrics.sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Return top 5 upcoming assignments
  return metrics.slice(0, 5);
}
```

**Complexity Analysis:**
- Thread filtering: O(t) where t = total threads
- Post filtering: O(p) where p = total posts
- Per-assignment: O(t + p)
- All assignments: O(a × (t + p)) where a = assignments (typically 5)
- **Total: O(5 × (t + p)) = O(t + p) - linear, acceptable**

---

## Part D: Mock Data Generation

### D1. New Mock Data File: assignments.json

**Location:** `mocks/assignments.json` (NEW FILE)

```json
{
  "assignments": [
    {
      "id": "assignment-1",
      "courseId": "course-1",
      "title": "Assignment 3: Binary Search Trees",
      "dueDate": "2025-10-15T23:59:00Z",
      "createdAt": "2025-10-01T00:00:00Z"
    },
    {
      "id": "assignment-2",
      "courseId": "course-1",
      "title": "Assignment 4: Graph Algorithms",
      "dueDate": "2025-10-20T23:59:00Z",
      "createdAt": "2025-10-05T00:00:00Z"
    },
    {
      "id": "assignment-3",
      "courseId": "course-2",
      "title": "Assignment 2: Integration by Parts",
      "dueDate": "2025-10-18T23:59:00Z",
      "createdAt": "2025-10-03T00:00:00Z"
    },
    {
      "id": "assignment-4",
      "courseId": "course-3",
      "title": "Lab 5: Circuit Analysis",
      "dueDate": "2025-10-22T23:59:00Z",
      "createdAt": "2025-10-08T00:00:00Z"
    },
    {
      "id": "assignment-5",
      "courseId": "course-4",
      "title": "Essay 1: Renaissance Art",
      "dueDate": "2025-10-25T23:59:00Z",
      "createdAt": "2025-10-10T00:00:00Z"
    }
  ]
}
```

**Rationale:** 5 assignments across different courses, staggered due dates.

---

### D2. Extend Existing Mock Data: threads.json

**Add assignment tags to existing threads:**

```json
{
  "id": "thread-1",
  "courseId": "course-1",
  "title": "How does binary search work?",
  "tags": ["algorithms", "search", "assignment-1"],  // ADD assignment tag
  "// ...": "rest of thread data"
}
```

**Action Required:** Update 10-15 existing threads in `mocks/threads.json` to add assignment tags.

---

### D3. Extend Existing Mock Data: posts.json

**Add endorsement tracking to existing posts:**

```json
{
  "id": "post-1",
  "endorsed": true,
  "endorsedBy": ["instructor-1"],       // NEW
  "instructorEndorsed": true,           // NEW
  "// ...": "rest of post data"
},
{
  "id": "post-2",
  "endorsed": true,
  "endorsedBy": ["student-2", "student-3"],  // NEW
  "instructorEndorsed": false,               // NEW (explicitly false)
  "// ...": "rest of post data"
}
```

**Action Required:** Update all `endorsed: true` posts in `mocks/posts.json` to add `endorsedBy` and `instructorEndorsed`.

---

### D4. Seed Data Logic Updates

**Location:** `lib/store/localStore.ts`

```typescript
import assignmentsData from "@/mocks/assignments.json";

// Add to existing store variables
let mockAssignments: Assignment[] = [];

// Add to seedData() function
export function seedData() {
  if (isSeeded) return;

  // ... existing seed logic ...

  // NEW: Load assignments
  mockAssignments = assignmentsData.assignments.map(a => ({
    ...a,
    createdAt: a.createdAt || new Date().toISOString(),
  }));

  // NEW: Backfill endorsement data for existing posts
  mockPosts.forEach(post => {
    if (post.endorsed && !post.endorsedBy) {
      // Randomly assign endorser (instructor or peer)
      const isInstructorEndorsement = Math.random() > 0.7;
      if (isInstructorEndorsement) {
        post.endorsedBy = ['instructor-1'];
        post.instructorEndorsed = true;
      } else {
        // Random peer endorsers (1-3 students)
        const endorserCount = 1 + Math.floor(Math.random() * 3);
        post.endorsedBy = Array.from({ length: endorserCount }, (_, i) =>
          `student-${i + 2}`  // Not the post author
        );
        post.instructorEndorsed = false;
      }
    }
  });

  isSeeded = true;
}

// NEW: Getter for assignments
export function getAssignments(): Assignment[] {
  return [...mockAssignments];
}

export function getAssignment(assignmentId: string): Assignment | null {
  return mockAssignments.find(a => a.id === assignmentId) || null;
}
```

---

## Part E: API Method Modifications

### E1. Update getStudentDashboard()

**Location:** `lib/api/client.ts` (lines 863-1043)

**Changes:**

```typescript
import { calculateQuokkaPoints } from "@/lib/utils/quokka-points";
import { calculateAllAssignmentQA } from "@/lib/utils/assignment-qa";
import { getAssignments } from "@/lib/store/localStore";

async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  await delay(200 + Math.random() * 200); // 200-400ms
  seedData();

  // ... existing code for enrollments, courses, threads, posts, etc. ...

  // NEW: Calculate Quokka Points
  const userThreads = allThreads.filter((t) => t.authorId === userId);
  const userPosts = allPosts.filter((p) => p.authorId === userId);

  const quokkaPoints = calculateQuokkaPoints(userId, userThreads, userPosts);

  // NEW: Calculate Assignment Q&A Opportunities
  const assignments = getAssignments();
  const assignmentQA = calculateAllAssignmentQA(
    assignments,
    allThreads,
    allPosts,
    users,
    userId,
    enrolledCourses.map(c => ({ id: c.id, name: c.name }))
  );

  // ... existing stats and goals calculation ...

  return {
    enrolledCourses,
    recentActivity,
    notifications: notifications.slice(0, 5),
    unreadCount,
    stats,
    goals,
    quokkaPoints,        // NEW
    assignmentQA,        // NEW
  };
}
```

**Estimated Performance Impact:**
- Quokka Points calculation: +10-20ms (O(n) scan of posts)
- Assignment Q&A calculation: +15-30ms (O(t + p) scan)
- **Total increase: +25-50ms (acceptable, within 200-400ms target)**

---

### E2. Add Utility Imports

**Location:** `lib/api/client.ts` (top of file, after existing imports)

```typescript
// Add after line 48
import { calculateQuokkaPoints } from "@/lib/utils/quokka-points";
import { calculateAllAssignmentQA } from "@/lib/utils/assignment-qa";
```

---

### E3. Update Import from localStore

**Location:** `lib/store/localStore.ts` exports

```typescript
// Add to existing exports (line 82)
export {
  // ... existing exports ...
  getAssignments,
  getAssignment,
};
```

---

## Part F: React Query Hook Strategy

### F1. No New Hooks Required

**Decision:** Extend existing `useStudentDashboard()` hook - NO changes needed to hook itself.

**Rationale:**
- Dashboard data is fetched as a single unit
- Atomic updates (points + assignments fetch together)
- Consistent invalidation strategy
- Simpler component logic (one loading state)

**Existing Hook (NO CHANGES):**
```typescript
// lib/api/hooks.ts (lines 358-366)
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.studentDashboard(userId) : ["studentDashboard"],
    queryFn: () => (userId ? api.getStudentDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,      // 5 minutes
  });
}
```

**Components Access New Data:**
```typescript
// app/dashboard/page.tsx
function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  // NEW: Access Quokka Points
  const { quokkaPoints, assignmentQA } = data;

  return (
    <>
      <QuokkaPointsCard {...quokkaPoints} />
      <AssignmentQAOpportunities assignments={assignmentQA} maxItems={5} />
    </>
  );
}
```

---

### F2. Invalidation Strategy

**Existing invalidations that now refresh points/assignments:**

```typescript
// After createThread mutation
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
// ✅ Refetches assignmentQA (new thread may affect metrics)

// After createPost mutation
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
// ✅ Refetches quokkaPoints (new answer may earn points)

// After endorsement (future: useEndorsePost hook)
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
// ✅ Refetches quokkaPoints (endorsement earns points)
```

**No additional invalidation logic needed** - existing mutations already invalidate dashboard.

---

### F3. Cache Behavior

**Stale Time: 2 minutes**
- User sees cached points for 2 minutes
- Points update after 2 minutes or on mutation
- **Trade-off:** Slight delay vs. reduced API calls

**GC Time: 5 minutes**
- Dashboard data kept in memory for 5 minutes
- Fast navigation back to dashboard
- **Trade-off:** Memory usage vs. UX smoothness

**Refetch Interval: None**
- No polling (reduces server load)
- Updates only on:
  1. Initial mount
  2. Stale time expiry
  3. Mutation success
  4. Manual refetch

---

## Part G: Implementation Checklist

### Phase 1: Type Definitions (5 min)
- [ ] Add `PointSource` interface to `lib/models/types.ts` (line 1091)
- [ ] Add `PointMilestone` interface (line ~1115)
- [ ] Add `QuokkaPointsData` interface (line ~1135)
- [ ] Add `Assignment` interface (line ~1160)
- [ ] Add `AssignmentQAMetrics` interface (line ~1175)
- [ ] Update `StudentDashboardData` interface (line 425-437)
- [ ] Update `Post` interface to add `endorsedBy`, `instructorEndorsed` (line 209-218)
- [ ] Run `npx tsc --noEmit` to verify types

### Phase 2: Calculation Utilities (20 min)
- [ ] Create `lib/utils/quokka-points.ts`
- [ ] Implement `POINT_VALUES` constants
- [ ] Implement `MILESTONES` constants
- [ ] Implement `calculateQuokkaPoints()` function
- [ ] Create `lib/utils/assignment-qa.ts`
- [ ] Implement `calculateAssignmentQA()` function
- [ ] Implement `calculateAllAssignmentQA()` function
- [ ] Run `npx tsc --noEmit` to verify

### Phase 3: Mock Data (15 min)
- [ ] Create `mocks/assignments.json` with 5 assignments
- [ ] Update `mocks/threads.json` - add assignment tags to 10-15 threads
- [ ] Update `mocks/posts.json` - add `endorsedBy`, `instructorEndorsed` to endorsed posts
- [ ] Update `lib/store/localStore.ts` - add assignment getters
- [ ] Update `seedData()` function - load assignments, backfill endorsements
- [ ] Test: Run app, verify mock data loads without errors

### Phase 4: API Integration (10 min)
- [ ] Update `lib/api/client.ts` - add imports for calculation utilities
- [ ] Update `getStudentDashboard()` - call `calculateQuokkaPoints()`
- [ ] Update `getStudentDashboard()` - call `calculateAllAssignmentQA()`
- [ ] Update return statement - include `quokkaPoints`, `assignmentQA`
- [ ] Test: Log `data.quokkaPoints` and `data.assignmentQA` in dashboard component
- [ ] Run `npx tsc --noEmit` to verify types

### Phase 5: Verification (10 min)
- [ ] Test: Open dashboard, check browser console for data
- [ ] Test: Verify `data.quokkaPoints.totalPoints` is a number
- [ ] Test: Verify `data.quokkaPoints.pointSources` is an array
- [ ] Test: Verify `data.assignmentQA` is an array with 5 items
- [ ] Test: Verify assignment due dates are sorted (nearest first)
- [ ] Test: Create new thread, wait 2 minutes, verify dashboard refetches
- [ ] Run `npm run lint` to verify code quality
- [ ] Run `npm run build` to verify production build

---

## Part H: Data Model Examples

### H1. Example: Zero Points (New User)

```typescript
const quokkaPoints: QuokkaPointsData = {
  totalPoints: 0,
  weeklyPoints: 0,
  pointSources: [],
  milestones: [
    { threshold: 100, label: "Getting Started", achieved: false },
    { threshold: 250, label: "Active Learner", achieved: false },
    { threshold: 500, label: "Active Contributor", achieved: false },
    { threshold: 1000, label: "Helpful Contributor", achieved: false },
    { threshold: 2500, label: "Community Expert", achieved: false },
  ],
  sparklineData: [0, 0, 0, 0, 0, 0, 0],
};
```

---

### H2. Example: Mid-Range Points (Active Student)

```typescript
const quokkaPoints: QuokkaPointsData = {
  totalPoints: 387,
  weeklyPoints: 45,
  pointSources: [
    {
      id: "helpful-answers",
      label: "Helpful Answers",
      icon: MessageSquare,
      points: 120,
      count: 12,
      pointsPerAction: 10,
    },
    {
      id: "peer-endorsements",
      label: "Peer Endorsements",
      icon: ThumbsUp,
      points: 85,
      count: 17,
      pointsPerAction: 5,
    },
    {
      id: "instructor-endorsements",
      label: "Instructor Endorsed",
      icon: Star,
      points: 60,
      count: 3,
      pointsPerAction: 20,
    },
    {
      id: "shared-conversations",
      label: "Shared Conversations",
      icon: Share2,
      points: 90,
      count: 6,
      pointsPerAction: 15,
    },
    {
      id: "questions-asked",
      label: "Questions Asked",
      icon: HelpCircle,
      points: 32,
      count: 16,
      pointsPerAction: 2,
    },
  ],
  milestones: [
    { threshold: 100, label: "Getting Started", achieved: true },
    { threshold: 250, label: "Active Learner", achieved: true },
    { threshold: 500, label: "Active Contributor", achieved: false },
    { threshold: 1000, label: "Helpful Contributor", achieved: false },
    { threshold: 2500, label: "Community Expert", achieved: false },
  ],
  sparklineData: [3, 5, 8, 6, 12, 7, 9],
};
```

---

### H3. Example: Assignment Q&A (Danger Level)

```typescript
const assignmentQA: AssignmentQAMetrics = {
  assignmentId: "assignment-1",
  title: "Assignment 3: Binary Search Trees",
  courseId: "course-1",
  courseName: "CS 101: Intro to Algorithms",
  dueDate: "2025-10-15T23:59:00Z",
  totalQuestions: 18,
  unansweredQuestions: 7,  // DANGER (5+)
  yourQuestions: 2,
  yourAnswers: 3,
  aiAnswersAvailable: 11,
  activeStudents: 12,
  recentActivity: "5 questions in last 24h",
  suggestedAction: "answer",
  actionReason: "7 unanswered questions need help",
  link: "/courses/course-1/assignments/assignment-1/qa",
};
```

**Component renders:** Red dot, "7 unanswered questions need help", "Help Answer" primary CTA.

---

### H4. Example: Assignment Q&A (All Resolved)

```typescript
const assignmentQA: AssignmentQAMetrics = {
  assignmentId: "assignment-2",
  title: "Assignment 4: Graph Algorithms",
  courseId: "course-1",
  courseName: "CS 101: Intro to Algorithms",
  dueDate: "2025-10-20T23:59:00Z",
  totalQuestions: 9,
  unansweredQuestions: 0,  // SUCCESS
  yourQuestions: 1,
  yourAnswers: 2,
  aiAnswersAvailable: 9,
  activeStudents: 8,
  recentActivity: undefined,
  suggestedAction: "review",
  actionReason: "All questions answered - review AI responses",
  link: "/courses/course-1/assignments/assignment-2/qa",
};
```

**Component renders:** Green dot, "All questions answered - review AI responses", "Review Answers" CTA.

---

## Part I: Backend Integration Notes

### What Changes When Connecting to Real Backend

**Quokka Points:**
1. **Endorsement tracking** - Real endorsement events in database
2. **Point history** - Store point transactions for audit trail
3. **Leaderboards** - Optional opt-in competitive views
4. **Badges** - Unlock achievement badges at milestones
5. **Time decay** - Consider time-weighted point calculations

**Assignment Q&A:**
1. **LMS integration** - Fetch assignments from Canvas/Blackboard API
2. **Real-time metrics** - WebSocket updates for live Q&A counts
3. **Push notifications** - Alert students when questions are answered
4. **Calendar sync** - Sync assignment due dates to calendar
5. **AI suggestion refinement** - ML model for personalized action recommendations

**Environment Variables Needed:**
```env
# LMS Integration
LMS_API_URL=https://canvas.example.edu/api/v1
LMS_API_KEY=your_api_key

# Real-time Features
WEBSOCKET_URL=wss://api.example.com/ws
REDIS_URL=redis://localhost:6379

# AI/ML Services
ML_RECOMMENDATION_ENDPOINT=https://ml.example.com/recommend
```

---

## Summary

### Files to Create (3 new files)
1. `lib/utils/quokka-points.ts` - Point calculation logic
2. `lib/utils/assignment-qa.ts` - Assignment Q&A calculation logic
3. `mocks/assignments.json` - Assignment mock data

### Files to Modify (5 existing files)
1. `lib/models/types.ts` - Add 5 new interfaces, update 2 existing
2. `lib/store/localStore.ts` - Add assignment getters, backfill endorsements
3. `lib/api/client.ts` - Update `getStudentDashboard()` method
4. `mocks/threads.json` - Add assignment tags to 10-15 threads
5. `mocks/posts.json` - Add endorsement tracking to endorsed posts

### No Changes Required
- `lib/api/hooks.ts` - Existing `useStudentDashboard()` works as-is
- React Query invalidation strategy - Already correct

### Performance Impact
- **Point calculation:** +10-20ms (O(n))
- **Assignment calculation:** +15-30ms (O(t + p))
- **Total API time:** 200-400ms → 225-450ms (12% increase, acceptable)

### Type Safety
- ✅ All types strictly defined
- ✅ No `any` types
- ✅ Interfaces match component props exactly
- ✅ Server-side calculation prevents client manipulation

### Testing Scenarios
1. Zero points (new user)
2. Mid-range points (active student)
3. High points (top contributor)
4. Zero assignments (summer break)
5. Multiple assignments (exam week)
6. All questions answered (green status)
7. Many unanswered (red status)
8. Dashboard refetch after mutation

---

**Implementation Estimate:** 60 minutes (types → utils → mock data → API → verify)

**Next Step:** Review this design plan, then implement incrementally with verification at each phase.
