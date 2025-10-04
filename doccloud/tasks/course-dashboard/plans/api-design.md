# API Design Plan - Multi-Course Dashboard

## 1. TypeScript Interfaces

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

Add the following interfaces **after** the existing `InstructorMetrics` interface (after line 90):

```typescript
/**
 * Represents an academic course
 */
export interface Course {
  id: string;
  code: string;          // e.g., "CS101", "MATH221"
  name: string;          // e.g., "Introduction to Computer Science"
  term: string;          // e.g., "Fall 2025", "Spring 2025"
  description: string;
  instructorIds: string[];
  enrollmentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

/**
 * Represents a user's enrollment in a course
 */
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  role: UserRole;        // 'student' | 'instructor' | 'ta'
  enrolledAt: string;
}

/**
 * Types of notifications in the system
 */
export type NotificationType =
  | 'new_thread'
  | 'new_post'
  | 'endorsed'
  | 'resolved'
  | 'flagged';

/**
 * Represents an activity notification for a user
 */
export interface Notification {
  id: string;
  userId: string;
  courseId: string;
  threadId?: string;     // Optional: some notifications aren't thread-specific
  type: NotificationType;
  content: string;       // Human-readable notification text
  read: boolean;
  createdAt: string;
}

/**
 * AI-generated insights for a course
 */
export interface CourseInsight {
  id: string;
  courseId: string;
  summary: string;                // Brief course activity summary
  activeThreads: number;
  topQuestions: string[];         // Array of popular thread titles
  trendingTopics: string[];       // Array of trending tags/topics
  generatedAt: string;
}

/**
 * Metrics for course activity and engagement
 */
export interface CourseMetrics {
  threadCount: number;
  unansweredCount: number;
  answeredCount: number;
  resolvedCount: number;
  activeStudents: number;         // Unique students who posted
  recentActivity: number;         // Threads created in last 7 days
}
```

### Modified Interfaces:

**No modifications needed** - `Thread` already has `courseId: string` field (line 52).

---

## 2. API Methods

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

Add these methods to the `api` object (after line 313):

```typescript
// Courses
async getCourses(): Promise<Course[]> {
  await delay();
  const courses = getCourses(); // from localStore
  return courses
    .filter(c => c.status === 'active')
    .sort((a, b) => a.code.localeCompare(b.code));
},

async getUserCourses(userId: string): Promise<Course[]> {
  await delay();
  const enrollments = getEnrollments(userId); // from localStore
  const allCourses = getCourses(); // from localStore

  const courseIds = enrollments.map(e => e.courseId);
  return allCourses
    .filter(c => courseIds.includes(c.id) && c.status === 'active')
    .sort((a, b) => a.code.localeCompare(b.code));
},

async getEnrollments(userId: string): Promise<Enrollment[]> {
  await delay();
  return getEnrollments(userId); // from localStore
},

async getCourseThreads(courseId: string): Promise<Thread[]> {
  await delay();
  const threads = getThreadsByCourse(courseId); // from localStore
  return threads
    .map((t) => hydrateThread(t as unknown as Record<string, unknown>))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
},

// Notifications
async getNotifications(
  userId: string,
  courseId?: string
): Promise<Notification[]> {
  await delay(200 + Math.random() * 200); // 200-400ms
  const notifications = getNotifications(userId, courseId); // from localStore
  return notifications.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
},

async markNotificationRead(notificationId: string): Promise<void> {
  await delay(50); // Quick action
  markNotificationRead(notificationId); // from localStore
},

async markAllNotificationsRead(
  userId: string,
  courseId?: string
): Promise<void> {
  await delay(100);
  markAllNotificationsRead(userId, courseId); // from localStore
},

// Course Insights & Metrics
async getCourseInsights(courseId: string): Promise<CourseInsight> {
  await delay(600 + Math.random() * 200); // 600-800ms (AI simulation)

  const threads = getThreadsByCourse(courseId);
  const activeThreads = threads.filter(t =>
    t.status === 'open' || t.status === 'answered'
  ).length;

  // Get top questions by view count
  const topQuestions = threads
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(t => t.title);

  // Get trending topics from tags
  const allTags = threads.flatMap(t => t.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendingTopics = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  // Generate summary based on activity
  const unansweredCount = threads.filter(t => t.status === 'open').length;
  const summary = unansweredCount > 5
    ? `High activity with ${unansweredCount} open questions. Students are actively engaging with ${trendingTopics[0] || 'course'} topics.`
    : `Moderate activity. Most questions are answered. Focus areas: ${trendingTopics.slice(0, 2).join(', ') || 'general concepts'}.`;

  return {
    id: generateId('insight'),
    courseId,
    summary,
    activeThreads,
    topQuestions,
    trendingTopics,
    generatedAt: new Date().toISOString(),
  };
},

async getCourseMetrics(courseId: string): Promise<CourseMetrics> {
  await delay(300 + Math.random() * 200); // 300-500ms

  const threads = getThreadsByCourse(courseId);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get unique student authors
  const studentAuthors = new Set(
    threads
      .map(t => t.authorId)
      .filter(authorId => {
        const users = getUsers();
        const user = users.find(u => u.id === authorId);
        return user?.role === 'student';
      })
  );

  const recentThreads = threads.filter(t =>
    new Date(t.createdAt) >= sevenDaysAgo
  );

  return {
    threadCount: threads.length,
    unansweredCount: threads.filter(t => t.status === 'open').length,
    answeredCount: threads.filter(t => t.status === 'answered').length,
    resolvedCount: threads.filter(t => t.status === 'resolved').length,
    activeStudents: studentAuthors.size,
    recentActivity: recentThreads.length,
  };
},
```

### Required Imports at Top of File:

```typescript
import type {
  Thread,
  User,
  Post,
  AiAnswer,
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  SimilarThread,
  InstructorMetrics,
  Course,           // NEW
  Enrollment,       // NEW
  Notification,     // NEW
  CourseInsight,    // NEW
  CourseMetrics,    // NEW
} from "@/lib/models/types";
```

### Required localStore Imports:

```typescript
import {
  seedData,
  getThreads,
  getThread,
  getUsers,
  addThread,
  addPost,
  updateThreadStatus,
  togglePostEndorsement,
  togglePostFlag,
  deletePost,
  undoDeletePost,
  getCourses,              // NEW
  getEnrollments,          // NEW
  getThreadsByCourse,      // Already exists
  getNotifications,        // NEW
  markNotificationRead,    // NEW
  markAllNotificationsRead,// NEW
} from "@/lib/store/localStore";
```

---

## 3. React Query Hooks

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

### Add to Query Keys Object (after line 18):

```typescript
export const queryKeys = {
  threads: ["threads"] as const,
  thread: (id: string) => ["thread", id] as const,
  currentUser: ["currentUser"] as const,
  instructorMetrics: ["instructorMetrics"] as const,
  unansweredThreads: ["unansweredThreads"] as const,
  similarThreads: (query: string) => ["similarThreads", query] as const,
  // NEW: Course-related keys
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId
      ? ["notifications", userId, courseId] as const
      : ["notifications", userId] as const,
  courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
};
```

### Add New Hooks (after line 178):

```typescript
// Courses
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: () => api.getCourses(),
    staleTime: 10 * 60 * 1000, // 10 minutes - courses rarely change
  });
}

export function useUserCourses(userId: string) {
  return useQuery({
    queryKey: queryKeys.userCourses(userId),
    queryFn: () => api.getUserCourses(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCourseThreads(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseThreads(courseId),
    queryFn: () => api.getCourseThreads(courseId),
    enabled: !!courseId,
  });
}

// Notifications
export function useNotifications(userId: string, courseId?: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId, courseId),
    queryFn: () => api.getNotifications(userId, courseId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - needs freshness
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.markNotificationRead(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
        exact: false, // Match all notification queries
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId?: string }) =>
      api.markAllNotificationsRead(userId, courseId),
    onSuccess: (_, variables) => {
      // Invalidate specific notification queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(variables.userId, variables.courseId),
      });
      if (variables.courseId) {
        // Also invalidate all notifications for user
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications(variables.userId),
        });
      }
    },
  });
}

// Course Insights & Metrics
export function useCourseInsights(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseInsights(courseId),
    queryFn: () => api.getCourseInsights(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes - expensive to generate
  });
}

export function useCourseMetrics(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseMetrics(courseId),
    queryFn: () => api.getCourseMetrics(courseId),
    enabled: !!courseId,
    staleTime: 1 * 60 * 1000, // 1 minute - balance freshness/performance
  });
}
```

### Update Existing Hooks for Course Invalidation:

**Modify `useCreateThread()` (lines 37-46):**

```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateThreadInput) => api.createThread(input),
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
      // NEW: Invalidate course-specific queries
      if (newThread.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseThreads(newThread.courseId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseMetrics(newThread.courseId)
        });
      }
    },
  });
}
```

**Modify `useCreatePost()` (lines 49-64):**

```typescript
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => api.createPost(input),
    onSuccess: async (_, variables) => {
      // Get thread to find courseId
      const thread = await queryClient.fetchQuery({
        queryKey: queryKeys.thread(variables.threadId),
        queryFn: () => api.getThread(variables.threadId),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.thread(variables.threadId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
      queryClient.invalidateQueries({
        queryKey: queryKeys.unansweredThreads,
      });

      // NEW: Invalidate course-specific queries
      if (thread?.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseThreads(thread.courseId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseMetrics(thread.courseId)
        });
      }
    },
  });
}
```

**Modify `useResolveThread()` and `useUpdateThreadStatus()` similarly** - Add courseId-based invalidation after fetching thread.

---

## 4. Local Store Updates

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`

### Add New Storage Keys (after line 9):

```typescript
const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
  courses: "quokkaq.courses",             // NEW
  enrollments: "quokkaq.enrollments",     // NEW
  notifications: "quokkaq.notifications", // NEW
} as const;
```

### Add Import Types (top of file):

```typescript
import type {
  Thread,
  Post,
  User,
  Session,
  Course,        // NEW
  Enrollment,    // NEW
  Notification,  // NEW
} from "@/lib/models/types";
```

### Update seedData() Function (lines 47-71):

Replace with:

```typescript
export function seedData(): void {
  const initialized = loadFromStorage(KEYS.initialized, false);

  if (!initialized) {
    // Add demo accounts to users
    const demoUsers = [
      { ...TEST_ACCOUNTS.student },
      { ...TEST_ACCOUNTS.instructor },
    ];

    // Combine with existing mock users
    const allUsers = [...demoUsers, ...(usersData as User[])];

    // Transform threads to add courseId and isAnonymous
    const threads = (threadsData as Array<Record<string, unknown>>).map((thread) => ({
      ...thread,
      courseId: thread.courseId || "course-demo-101",
      isAnonymous: thread.isAnonymous || false,
    }));

    // Load course, enrollment, and notification data
    const courses = require('@/mocks/courses.json') as Course[];
    const enrollments = require('@/mocks/enrollments.json') as Enrollment[];
    const notifications = require('@/mocks/notifications.json') as Notification[];

    saveToStorage(KEYS.users, allUsers);
    saveToStorage(KEYS.threads, threads);
    saveToStorage(KEYS.courses, courses);
    saveToStorage(KEYS.enrollments, enrollments);
    saveToStorage(KEYS.notifications, notifications);
    saveToStorage(KEYS.initialized, true);
  }
}
```

### Add New Helper Functions (after line 301):

```typescript
/**
 * Get all courses
 */
export function getCourses(): Course[] {
  return loadFromStorage<Course[]>(KEYS.courses, []);
}

/**
 * Get courses by IDs
 */
export function getCoursesByIds(ids: string[]): Course[] {
  const courses = getCourses();
  return courses.filter(c => ids.includes(c.id));
}

/**
 * Get single course by ID
 */
export function getCourse(id: string): Course | null {
  const courses = getCourses();
  return courses.find(c => c.id === id) || null;
}

/**
 * Get enrollments for a user
 */
export function getEnrollments(userId: string): Enrollment[] {
  const enrollments = loadFromStorage<Enrollment[]>(KEYS.enrollments, []);
  return enrollments.filter(e => e.userId === userId);
}

/**
 * Get user's enrolled courses
 */
export function getUserCourses(userId: string): Course[] {
  const enrollments = getEnrollments(userId);
  const courseIds = enrollments.map(e => e.courseId);
  const courses = getCourses();
  return courses.filter(c => courseIds.includes(c.id));
}

/**
 * Get all notifications, optionally filtered by user and/or course
 */
export function getNotifications(
  userId: string,
  courseId?: string
): Notification[] {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);

  let filtered = notifications.filter(n => n.userId === userId);

  if (courseId) {
    filtered = filtered.filter(n => n.courseId === courseId);
  }

  return filtered;
}

/**
 * Mark a notification as read
 */
export function markNotificationRead(notificationId: string): void {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);
  const notification = notifications.find(n => n.id === notificationId);

  if (notification) {
    notification.read = true;
    saveToStorage(KEYS.notifications, notifications);
  }
}

/**
 * Mark all notifications as read for a user, optionally filtered by course
 */
export function markAllNotificationsRead(
  userId: string,
  courseId?: string
): void {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);

  notifications.forEach(notification => {
    if (notification.userId === userId) {
      if (!courseId || notification.courseId === courseId) {
        notification.read = true;
      }
    }
  });

  saveToStorage(KEYS.notifications, notifications);
}

/**
 * Add a new notification
 */
export function addNotification(notification: Notification): void {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);
  notifications.unshift(notification);
  saveToStorage(KEYS.notifications, notifications);
}
```

---

## 5. Mock Data Files

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/courses.json`

```json
[
  {
    "id": "course-cs101",
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "term": "Fall 2025",
    "description": "Fundamental concepts in computer science including programming, algorithms, and data structures.",
    "instructorIds": ["user-1"],
    "enrollmentCount": 156,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  },
  {
    "id": "course-cs201",
    "code": "CS201",
    "name": "Data Structures and Algorithms",
    "term": "Fall 2025",
    "description": "Advanced data structures, algorithm design, and complexity analysis.",
    "instructorIds": ["user-1"],
    "enrollmentCount": 89,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  },
  {
    "id": "course-cs301",
    "code": "CS301",
    "name": "Advanced Algorithms",
    "term": "Fall 2025",
    "description": "Graph algorithms, dynamic programming, NP-completeness, and approximation algorithms.",
    "instructorIds": ["demo-instructor-1"],
    "enrollmentCount": 45,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  },
  {
    "id": "course-math221",
    "code": "MATH221",
    "name": "Calculus I",
    "term": "Fall 2025",
    "description": "Limits, derivatives, integrals, and applications.",
    "instructorIds": ["user-1"],
    "enrollmentCount": 203,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  },
  {
    "id": "course-math341",
    "code": "MATH341",
    "name": "Linear Algebra",
    "term": "Fall 2025",
    "description": "Vector spaces, matrices, eigenvalues, and linear transformations.",
    "instructorIds": ["demo-instructor-1"],
    "enrollmentCount": 78,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  },
  {
    "id": "course-phys141",
    "code": "PHYS141",
    "name": "Classical Mechanics",
    "term": "Fall 2025",
    "description": "Newton's laws, energy, momentum, rotational dynamics, and oscillations.",
    "instructorIds": ["user-1"],
    "enrollmentCount": 112,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  }
]
```

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/enrollments.json`

```json
[
  {
    "id": "enroll-1",
    "userId": "demo-student-1",
    "courseId": "course-cs101",
    "role": "student",
    "enrolledAt": "2025-08-20T10:00:00Z"
  },
  {
    "id": "enroll-2",
    "userId": "demo-student-1",
    "courseId": "course-cs201",
    "role": "student",
    "enrolledAt": "2025-08-20T10:00:00Z"
  },
  {
    "id": "enroll-3",
    "userId": "demo-student-1",
    "courseId": "course-math221",
    "role": "student",
    "enrolledAt": "2025-08-20T10:00:00Z"
  },
  {
    "id": "enroll-4",
    "userId": "demo-instructor-1",
    "courseId": "course-cs301",
    "role": "instructor",
    "enrolledAt": "2025-08-15T08:00:00Z"
  },
  {
    "id": "enroll-5",
    "userId": "demo-instructor-1",
    "courseId": "course-math341",
    "role": "instructor",
    "enrolledAt": "2025-08-15T08:00:00Z"
  },
  {
    "id": "enroll-6",
    "userId": "user-2",
    "courseId": "course-cs101",
    "role": "student",
    "enrolledAt": "2025-08-21T14:30:00Z"
  },
  {
    "id": "enroll-7",
    "userId": "user-2",
    "courseId": "course-math221",
    "role": "student",
    "enrolledAt": "2025-08-21T14:30:00Z"
  },
  {
    "id": "enroll-8",
    "userId": "user-3",
    "courseId": "course-cs101",
    "role": "student",
    "enrolledAt": "2025-08-22T09:15:00Z"
  },
  {
    "id": "enroll-9",
    "userId": "user-3",
    "courseId": "course-cs201",
    "role": "student",
    "enrolledAt": "2025-08-22T09:15:00Z"
  },
  {
    "id": "enroll-10",
    "userId": "user-4",
    "courseId": "course-cs201",
    "role": "student",
    "enrolledAt": "2025-08-22T11:00:00Z"
  },
  {
    "id": "enroll-11",
    "userId": "user-5",
    "courseId": "course-math221",
    "role": "student",
    "enrolledAt": "2025-08-23T08:45:00Z"
  },
  {
    "id": "enroll-12",
    "userId": "user-6",
    "courseId": "course-cs101",
    "role": "ta",
    "enrolledAt": "2025-08-16T10:00:00Z"
  },
  {
    "id": "enroll-13",
    "userId": "user-6",
    "courseId": "course-cs201",
    "role": "ta",
    "enrolledAt": "2025-08-16T10:00:00Z"
  },
  {
    "id": "enroll-14",
    "userId": "user-7",
    "courseId": "course-cs301",
    "role": "student",
    "enrolledAt": "2025-08-24T13:20:00Z"
  },
  {
    "id": "enroll-15",
    "userId": "user-8",
    "courseId": "course-phys141",
    "role": "student",
    "enrolledAt": "2025-08-24T15:00:00Z"
  }
]
```

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/notifications.json`

```json
[
  {
    "id": "notif-1",
    "userId": "demo-student-1",
    "courseId": "course-cs101",
    "threadId": "thread-1",
    "type": "endorsed",
    "content": "Your question about binary search was endorsed by Dr. Sarah Chen",
    "read": false,
    "createdAt": "2025-10-03T14:30:00Z"
  },
  {
    "id": "notif-2",
    "userId": "demo-student-1",
    "courseId": "course-cs101",
    "threadId": "thread-2",
    "type": "new_post",
    "content": "New reply to 'append() vs extend()' in CS101",
    "read": false,
    "createdAt": "2025-10-03T09:50:00Z"
  },
  {
    "id": "notif-3",
    "userId": "demo-student-1",
    "courseId": "course-cs201",
    "threadId": "thread-4",
    "type": "new_thread",
    "content": "New question about linked lists posted in CS201",
    "read": false,
    "createdAt": "2025-10-02T16:20:00Z"
  },
  {
    "id": "notif-4",
    "userId": "demo-student-1",
    "courseId": "course-math221",
    "type": "new_thread",
    "content": "5 new questions posted in MATH221 this week",
    "read": false,
    "createdAt": "2025-10-01T08:00:00Z"
  },
  {
    "id": "notif-5",
    "userId": "demo-student-1",
    "courseId": "course-cs101",
    "threadId": "thread-5",
    "type": "resolved",
    "content": "Thread 'recursion vs iteration' was marked as resolved",
    "read": true,
    "createdAt": "2025-09-30T11:45:00Z"
  },
  {
    "id": "notif-6",
    "userId": "demo-instructor-1",
    "courseId": "course-cs301",
    "threadId": "thread-10",
    "type": "new_thread",
    "content": "Student posted question about graph traversal in CS301",
    "read": false,
    "createdAt": "2025-10-03T15:20:00Z"
  },
  {
    "id": "notif-7",
    "userId": "demo-instructor-1",
    "courseId": "course-cs301",
    "threadId": "thread-11",
    "type": "flagged",
    "content": "Post flagged for review in CS301",
    "read": false,
    "createdAt": "2025-10-03T10:15:00Z"
  },
  {
    "id": "notif-8",
    "userId": "demo-instructor-1",
    "courseId": "course-math341",
    "type": "new_thread",
    "content": "3 unanswered questions in MATH341",
    "read": false,
    "createdAt": "2025-10-02T09:00:00Z"
  },
  {
    "id": "notif-9",
    "userId": "user-2",
    "courseId": "course-cs101",
    "threadId": "thread-1",
    "type": "new_post",
    "content": "Dr. Sarah Chen replied to your question",
    "read": false,
    "createdAt": "2025-10-01T11:20:00Z"
  },
  {
    "id": "notif-10",
    "userId": "user-2",
    "courseId": "course-math221",
    "type": "new_thread",
    "content": "New calculus practice problems posted",
    "read": true,
    "createdAt": "2025-09-29T14:00:00Z"
  }
]
```

### Update Existing File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/threads.json`

**Action:** Ensure all threads have a `courseId` field. Update threads without courseId to distribute across courses:

```json
// Add to threads that don't have courseId:
"courseId": "course-cs101",   // For programming-related threads
"courseId": "course-math221", // For math-related threads
"courseId": "course-phys141", // For physics-related threads
```

**Distribution Strategy:**
- Threads 1-3: `course-cs101` (binary search, lists, loops)
- Threads 4-6: `course-cs201` (data structures)
- Threads 7-8: `course-math221` (calculus)
- Threads 9-10: `course-cs301` (algorithms)

---

## 6. Implementation Checklist

### Phase 1: Types & Storage (30 min)
- [ ] Add new interfaces to `lib/models/types.ts`
- [ ] Add new storage keys to `lib/store/localStore.ts`
- [ ] Update seedData() to load courses/enrollments/notifications
- [ ] Add helper functions to localStore.ts
- [ ] Run `npx tsc --noEmit` to verify types

### Phase 2: Mock Data (30 min)
- [ ] Create `mocks/courses.json` with 6 courses
- [ ] Create `mocks/enrollments.json` with 15 enrollments
- [ ] Create `mocks/notifications.json` with 10 notifications
- [ ] Update `mocks/threads.json` with courseId fields
- [ ] Test seed script loads all data correctly

### Phase 3: API Methods (45 min)
- [ ] Add course methods to `lib/api/client.ts`
- [ ] Add notification methods to `lib/api/client.ts`
- [ ] Add insights/metrics methods to `lib/api/client.ts`
- [ ] Update imports for new types
- [ ] Test each method in isolation

### Phase 4: React Query Hooks (45 min)
- [ ] Add new query keys to `lib/api/hooks.ts`
- [ ] Add course hooks (useCourses, useUserCourses, etc.)
- [ ] Add notification hooks
- [ ] Add insights/metrics hooks
- [ ] Update existing hooks for course invalidation
- [ ] Run `npx tsc --noEmit` to verify types

### Phase 5: Verification (30 min)
- [ ] Test all hooks in browser console
- [ ] Verify query invalidation works correctly
- [ ] Check notification read/unread state
- [ ] Verify course metrics calculate correctly
- [ ] Test AI insights generation
- [ ] Confirm no console errors
- [ ] Run `npm run lint`

---

## 7. Test Scenarios

### Scenario 1: Multi-Course Data Loading
```typescript
// In browser console:
const { data: courses } = useCourses();
console.log(courses); // Should show 6 active courses

const { data: userCourses } = useUserCourses('demo-student-1');
console.log(userCourses); // Should show 3 enrolled courses
```

### Scenario 2: Course-Specific Threads
```typescript
const { data: threads } = useCourseThreads('course-cs101');
console.log(threads); // Should show only CS101 threads
```

### Scenario 3: Notification Management
```typescript
const { data: notifications } = useNotifications('demo-student-1');
console.log(notifications.filter(n => !n.read).length); // Unread count

const markRead = useMarkNotificationRead();
markRead.mutate('notif-1'); // Should invalidate and refetch
```

### Scenario 4: Course Metrics
```typescript
const { data: metrics } = useCourseMetrics('course-cs101');
console.log(metrics);
// Should show: { threadCount, unansweredCount, activeStudents, etc. }
```

### Scenario 5: AI Insights
```typescript
const { data: insights } = useCourseInsights('course-cs101');
console.log(insights.summary); // Should show course activity summary
console.log(insights.topQuestions); // Top 5 questions by views
console.log(insights.trendingTopics); // Top 5 tags by frequency
```

### Scenario 6: Query Invalidation
```typescript
// Create new thread in course
const createThread = useCreateThread();
createThread.mutate({
  title: 'Test',
  content: 'Test',
  authorId: 'demo-student-1',
  courseId: 'course-cs101',
});

// Should invalidate:
// - queryKeys.threads
// - queryKeys.courseThreads('course-cs101')
// - queryKeys.courseMetrics('course-cs101')
```

### Scenario 7: Empty States
```typescript
// Course with no threads
const { data } = useCourseThreads('course-new-course');
console.log(data); // Should return []

// User with no notifications
const { data } = useNotifications('user-new');
console.log(data); // Should return []
```

---

## 8. Backend Integration Guide

### Environment Variables (Future)

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.quokkaq.com
NEXT_PUBLIC_WS_URL=wss://api.quokkaq.com/notifications
```

### API Endpoint Mapping

| Mock Method | Future Endpoint | Notes |
|-------------|-----------------|-------|
| `getCourses()` | `GET /api/courses` | Add pagination |
| `getUserCourses(userId)` | `GET /api/users/:userId/courses` | Auth required |
| `getCourseThreads(courseId)` | `GET /api/courses/:courseId/threads` | Add pagination, filters |
| `getNotifications(userId, courseId?)` | `GET /api/users/:userId/notifications` | Real-time via WebSocket |
| `markNotificationRead(id)` | `PATCH /api/notifications/:id` | Optimistic update |
| `getCourseInsights(courseId)` | `GET /api/courses/:courseId/insights` | Cache aggressively |
| `getCourseMetrics(courseId)` | `GET /api/courses/:courseId/metrics` | Consider server-side caching |

### Migration Steps

1. **Add Environment Detection:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'mock';

export const api = {
  async getCourses() {
    if (API_URL === 'mock') {
      // ... existing mock logic
    } else {
      const res = await fetch(`${API_URL}/api/courses`);
      return res.json();
    }
  },
  // ... rest of methods
};
```

2. **Add Authentication Headers:**
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
};
```

3. **Add Error Handling:**
```typescript
try {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

4. **WebSocket for Notifications:**
```typescript
useEffect(() => {
  const ws = new WebSocket(WS_URL);
  ws.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    queryClient.setQueryData(['notifications', userId], (old) => [
      notification,
      ...(old || []),
    ]);
  };
  return () => ws.close();
}, [userId]);
```

---

## 9. Performance Considerations

### Bundle Size Impact
- New types: ~2KB
- New API methods: ~5KB
- Mock data: ~15KB (courses + enrollments + notifications)
- **Total: ~22KB** (well under 200KB route limit)

### Cache Strategy

| Query | Stale Time | Refetch Interval | Rationale |
|-------|-----------|------------------|-----------|
| `courses` | 10 min | - | Rarely changes |
| `userCourses` | 5 min | - | Enrollments stable |
| `courseThreads` | default (0) | - | Needs freshness |
| `notifications` | 30 sec | 30 sec | Activity updates |
| `courseMetrics` | 1 min | - | Balance performance/freshness |
| `courseInsights` | 5 min | - | Expensive to generate |

### Optimization Opportunities

1. **Prefetch on Login:**
```typescript
useEffect(() => {
  if (user) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.userCourses(user.id),
      queryFn: () => api.getUserCourses(user.id),
    });
  }
}, [user]);
```

2. **Parallel Queries:**
```typescript
const { data: courses } = useCourses();
const courseMetrics = useQueries({
  queries: courses?.map(course => ({
    queryKey: queryKeys.courseMetrics(course.id),
    queryFn: () => api.getCourseMetrics(course.id),
  })) || [],
});
```

3. **Optimistic Updates:**
```typescript
onMutate: async (notificationId) => {
  await queryClient.cancelQueries({ queryKey: ['notifications'] });
  const previous = queryClient.getQueryData(['notifications', userId]);

  queryClient.setQueryData(['notifications', userId], (old) =>
    old?.map(n => n.id === notificationId ? { ...n, read: true } : n)
  );

  return { previous };
},
onError: (err, variables, context) => {
  queryClient.setQueryData(['notifications', userId], context.previous);
},
```

---

## 10. Accessibility & UX Notes

### Focus Management
- Course card navigation should be keyboard accessible
- Notification list needs proper ARIA labels
- Alert users to new notifications (aria-live regions)

### Screen Reader Announcements
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {unreadCount > 0 && `${unreadCount} unread notifications`}
</div>
```

### Loading States
- Skeleton loaders for course cards
- Spinner for notification updates
- Stale data indicator for cached insights

### Error Handling
```tsx
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Failed to load courses</AlertTitle>
      <AlertDescription>
        {error.message}. Please try again.
      </AlertDescription>
    </Alert>
  );
}
```

---

## 11. Edge Cases to Handle

1. **No Enrollments:** User has no courses
   - Show empty state with "Browse courses" CTA

2. **No Notifications:** User has no notifications
   - Show "All caught up!" message

3. **Course with No Threads:** New/empty course
   - Show "Start a discussion" prompt

4. **Archived Courses:** Status = 'archived'
   - Filter out of active lists
   - Show in separate "Archived" section if needed

5. **Invalid Course ID:** courseId doesn't exist
   - Return empty array from getCourseThreads
   - Log warning, don't throw error

6. **Network Delays:** Slow mock API responses
   - Show loading states
   - Prevent race conditions with React Query

7. **Concurrent Mutations:** Multiple notifications marked read
   - React Query handles deduplication
   - Last write wins for optimistic updates

---

## Files Summary

### New Files to Create:
1. `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/courses.json`
2. `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/enrollments.json`
3. `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/notifications.json`

### Files to Modify:
1. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` - Add 6 new interfaces
2. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts` - Add 9 new methods, update imports
3. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts` - Add 8 new hooks, update 2 existing hooks
4. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts` - Add storage keys, helpers, update seed
5. `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/threads.json` - Add courseId to all threads

---

**Implementation Time Estimate:** 2.5-3 hours total

**Risk Level:** Low - All changes are additive, no breaking changes to existing API contracts
