# Type Design Implementation Plan - Course Dashboard

## Overview

This plan provides exact type definitions, import statements, and integration points for implementing type-safe course dashboard functionality. All changes follow TypeScript strict mode and existing codebase patterns.

**Risk Level:** LOW - All changes are additive, zero breaking changes
**Implementation Time:** 30 minutes (types only, excludes API/hooks/components)
**Validation:** Run `npx tsc --noEmit` after each file modification

---

## Phase 1: Core Type Definitions

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**Location:** Add after line 90 (after InstructorMetrics interface)

**Add the following interfaces:**

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
  role: UserRole;        // Reuses existing UserRole type
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

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types are self-contained, no dependencies beyond UserRole)

---

## Phase 2: API Client Type Integration

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

#### Step 2.1: Update Type Imports

**Location:** Lines 1-11 (existing import statement)

**FIND:**
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
} from "@/lib/models/types";
```

**REPLACE WITH:**
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

#### Step 2.2: Add Method Signatures (Documentation Only)

**Location:** After line 313 (after getCurrentUser method)

**ADD COMMENTS (do not implement methods yet - API Designer handles implementation):**

```typescript
// Course API methods - signatures only (implementation in separate task)
// async getCourses(): Promise<Course[]>
// async getUserCourses(userId: string): Promise<Course[]>
// async getEnrollments(userId: string): Promise<Enrollment[]>
// async getCourseThreads(courseId: string): Promise<Thread[]>
// async getNotifications(userId: string, courseId?: string): Promise<Notification[]>
// async markNotificationRead(notificationId: string): Promise<void>
// async markAllNotificationsRead(userId: string, courseId?: string): Promise<void>
// async getCourseInsights(courseId: string): Promise<CourseInsight>
// async getCourseMetrics(courseId: string): Promise<CourseMetrics>
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types imported correctly)

---

## Phase 3: React Query Hook Type Integration

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

#### Step 3.1: Update Type Imports

**Location:** Lines 5-9 (existing import statement)

**FIND:**
```typescript
import type {
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
} from "@/lib/models/types";
```

**REPLACE WITH:**
```typescript
import type {
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  Course,           // NEW
  Enrollment,       // NEW
  Notification,     // NEW
  CourseInsight,    // NEW
  CourseMetrics,    // NEW
} from "@/lib/models/types";
```

#### Step 3.2: Add Query Key Type Definitions

**Location:** After line 18 (after existing queryKeys object)

**ADD COMMENTS (do not implement hooks yet - API Designer handles implementation):**

```typescript
// Course query keys - type signatures only (implementation in separate task)
// courses: ["courses"] as const,
// userCourses: (userId: string) => ["userCourses", userId] as const,
// courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
// notifications: (userId: string, courseId?: string) => courseId
//   ? ["notifications", userId, courseId] as const
//   : ["notifications", userId] as const,
// courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
// courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
```

#### Step 3.3: Add Hook Return Type Documentation

**Location:** After line 178 (after useCurrentUser hook)

**ADD COMMENTS:**

```typescript
// Course hooks - type signatures only (implementation in separate task)
//
// export function useCourses(): UseQueryResult<Course[], Error>
// export function useUserCourses(userId: string): UseQueryResult<Course[], Error>
// export function useCourseThreads(courseId: string): UseQueryResult<Thread[], Error>
// export function useNotifications(userId: string, courseId?: string): UseQueryResult<Notification[], Error>
// export function useMarkNotificationRead(): UseMutationResult<void, Error, string>
// export function useMarkAllNotificationsRead(): UseMutationResult<void, Error, { userId: string; courseId?: string }>
// export function useCourseInsights(courseId: string): UseQueryResult<CourseInsight, Error>
// export function useCourseMetrics(courseId: string): UseQueryResult<CourseMetrics, Error>
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types imported, hooks not implemented yet)

---

## Phase 4: Local Store Type Integration

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`

#### Step 4.1: Update Type Imports

**Location:** Line 1 (existing import statement)

**FIND:**
```typescript
import type { Thread, Post, User, Session } from "@/lib/models/types";
```

**REPLACE WITH:**
```typescript
import type {
  Thread,
  Post,
  User,
  Session,
  Course,           // NEW
  Enrollment,       // NEW
  Notification,     // NEW
} from "@/lib/models/types";
```

#### Step 4.2: Add Storage Key Type Definitions

**Location:** After line 10 (after KEYS constant)

**FIND:**
```typescript
const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
} as const;
```

**REPLACE WITH:**
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

#### Step 4.3: Add Function Signatures (Documentation Only)

**Location:** After line 301 (end of file)

**ADD COMMENTS:**

```typescript
// Course data access functions - type signatures only (implementation in separate task)
//
// export function getCourses(): Course[]
// export function getCoursesByIds(ids: string[]): Course[]
// export function getCourse(id: string): Course | null
// export function getEnrollments(userId: string): Enrollment[]
// export function getUserCourses(userId: string): Course[]
// export function getNotifications(userId: string, courseId?: string): Notification[]
// export function markNotificationRead(notificationId: string): void
// export function markAllNotificationsRead(userId: string, courseId?: string): void
// export function addNotification(notification: Notification): void
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types imported, functions not implemented yet)

---

## Phase 5: Mock Data Type Validation

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/courses.json`

**Type Validation Strategy:**

When creating `courses.json`, validate against Course interface:

```typescript
// Type check in lib/store/localStore.ts seedData():
const courses = require('@/mocks/courses.json') as Course[];

// TypeScript will validate JSON structure at compile time
// Runtime validation happens in try/catch (line 22-28)
```

**Expected JSON Structure:**
```json
[
  {
    "id": "course-cs101",
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "term": "Fall 2025",
    "description": "...",
    "instructorIds": ["user-1"],
    "enrollmentCount": 156,
    "status": "active",
    "createdAt": "2025-08-15T00:00:00Z"
  }
]
```

**Type Safety Guarantee:**
- TypeScript validates JSON structure against Course interface
- Invalid fields cause compile-time errors
- Missing required fields caught by type system
- Type assertion `as Course[]` safe (validated by compiler)

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/enrollments.json`

**Type Validation:**
```typescript
const enrollments = require('@/mocks/enrollments.json') as Enrollment[];
```

**Expected JSON Structure:**
```json
[
  {
    "id": "enroll-1",
    "userId": "demo-student-1",
    "courseId": "course-cs101",
    "role": "student",
    "enrolledAt": "2025-08-20T10:00:00Z"
  }
]
```

**Type Constraints:**
- `role` must be `"student" | "instructor" | "ta"` (validated by UserRole type)
- Invalid role values caught by TypeScript

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/notifications.json`

**Type Validation:**
```typescript
const notifications = require('@/mocks/notifications.json') as Notification[];
```

**Expected JSON Structure:**
```json
[
  {
    "id": "notif-1",
    "userId": "demo-student-1",
    "courseId": "course-cs101",
    "threadId": "thread-1",
    "type": "endorsed",
    "content": "Your question was endorsed",
    "read": false,
    "createdAt": "2025-10-03T14:30:00Z"
  }
]
```

**Type Constraints:**
- `type` must match `NotificationType` union (validated at compile time)
- `threadId` can be omitted for course-level notifications
- `read` must be boolean (not string "false")

---

## Phase 6: Type-Only Import Enforcement

### Verification Script

**Create temporary type check file:**

`/tmp/type-check.ts`
```typescript
// Verify all imports are type-only (no runtime values)
import type { Course, Enrollment, Notification, CourseInsight, CourseMetrics } from "@/lib/models/types";

// These should work (types can be used as types)
const course: Course = {} as Course;
const enrollment: Enrollment = {} as Enrollment;
const notification: Notification = {} as Notification;

// These should fail (cannot use types as values)
// const x = new Course();  // ERROR: Course only refers to a type
// const y = typeof Course; // ERROR: Course only refers to a type
```

**Verification Command:**
```bash
npx tsc --noEmit /tmp/type-check.ts
```

**Expected Output:**
- 0 errors (confirms types are type-only, not values)
- If errors: "Course only refers to a type" → GOOD (confirms type-only import)

---

## Type Integration Checklist

### Core Types (lib/models/types.ts)
- [ ] Add Course interface (after line 90)
- [ ] Add Enrollment interface
- [ ] Add NotificationType type alias
- [ ] Add Notification interface
- [ ] Add CourseInsight interface
- [ ] Add CourseMetrics interface
- [ ] Run `npx tsc --noEmit` → 0 errors

### API Client (lib/api/client.ts)
- [ ] Update import statement (add 5 new types)
- [ ] Add method signature comments (9 methods)
- [ ] Run `npx tsc --noEmit` → 0 errors
- [ ] Verify no "unused type" warnings

### React Query Hooks (lib/api/hooks.ts)
- [ ] Update import statement (add 5 new types)
- [ ] Add query key comments
- [ ] Add hook signature comments (8 hooks)
- [ ] Run `npx tsc --noEmit` → 0 errors

### Local Store (lib/store/localStore.ts)
- [ ] Update import statement (add 3 new types)
- [ ] Update KEYS constant (add 3 new keys)
- [ ] Add function signature comments (9 functions)
- [ ] Run `npx tsc --noEmit` → 0 errors

### Mock Data (mocks/)
- [ ] Validate courses.json structure
- [ ] Validate enrollments.json structure
- [ ] Validate notifications.json structure
- [ ] Verify UserRole values in enrollments
- [ ] Verify NotificationType values in notifications
- [ ] Verify all timestamps are ISO 8601 format

---

## Type Testing Strategy

### Test 1: Type Assignability

**Create test file:** `/tmp/type-test.ts`

```typescript
import type { Course, Enrollment, Notification, NotificationType, CourseInsight, CourseMetrics } from "@/lib/models/types";

// Valid Course
const course: Course = {
  id: 'c1',
  code: 'CS101',
  name: 'Test',
  term: 'Fall 2025',
  description: 'Test',
  instructorIds: [],
  enrollmentCount: 0,
  status: 'active',
  createdAt: new Date().toISOString(),
};

// Valid Enrollment
const enrollment: Enrollment = {
  id: 'e1',
  userId: 'u1',
  courseId: 'c1',
  role: 'student',
  enrolledAt: new Date().toISOString(),
};

// Valid Notification (with optional threadId omitted)
const notification: Notification = {
  id: 'n1',
  userId: 'u1',
  courseId: 'c1',
  type: 'new_thread',
  content: 'Test',
  read: false,
  createdAt: new Date().toISOString(),
};

// Valid NotificationType
const type: NotificationType = 'endorsed';

// Invalid type (should error)
// const invalid: NotificationType = 'invalid';  // Uncomment to test

// Valid CourseInsight
const insight: CourseInsight = {
  id: 'i1',
  courseId: 'c1',
  summary: 'Test',
  activeThreads: 0,
  topQuestions: [],
  trendingTopics: [],
  generatedAt: new Date().toISOString(),
};

// Valid CourseMetrics
const metrics: CourseMetrics = {
  threadCount: 0,
  unansweredCount: 0,
  answeredCount: 0,
  resolvedCount: 0,
  activeStudents: 0,
  recentActivity: 0,
};
```

**Run:**
```bash
npx tsc --noEmit /tmp/type-test.ts
```

**Expected:** 0 errors (all assignments valid)

### Test 2: Type Narrowing (NotificationType Union)

**Create test file:** `/tmp/union-test.ts`

```typescript
import type { NotificationType, Notification } from "@/lib/models/types";

function handleNotification(notification: Notification) {
  // Type narrowing with switch
  switch (notification.type) {
    case 'new_thread':
      console.log('New thread');
      break;
    case 'new_post':
      console.log('New post');
      break;
    case 'endorsed':
      console.log('Endorsed');
      break;
    case 'resolved':
      console.log('Resolved');
      break;
    case 'flagged':
      console.log('Flagged');
      break;
    default:
      // Should be never (exhaustive check)
      const _exhaustive: never = notification.type;
      return _exhaustive;
  }
}
```

**Run:**
```bash
npx tsc --noEmit /tmp/union-test.ts
```

**Expected:** 0 errors (union exhaustively handled)

### Test 3: Optional Properties (Notification.threadId)

**Create test file:** `/tmp/optional-test.ts`

```typescript
import type { Notification } from "@/lib/models/types";

// Valid: threadId omitted
const notif1: Notification = {
  id: 'n1',
  userId: 'u1',
  courseId: 'c1',
  type: 'new_thread',
  content: 'Test',
  read: false,
  createdAt: new Date().toISOString(),
};

// Valid: threadId provided
const notif2: Notification = {
  id: 'n2',
  userId: 'u1',
  courseId: 'c1',
  threadId: 't1',
  type: 'new_post',
  content: 'Test',
  read: false,
  createdAt: new Date().toISOString(),
};

// Access threadId safely
function getThreadId(notif: Notification): string | undefined {
  return notif.threadId;  // OK: returns string | undefined
}

// Type guard
function hasThreadId(notif: Notification): notif is Notification & { threadId: string } {
  return notif.threadId !== undefined;
}

// Usage
const notif3: Notification = notif1;
if (hasThreadId(notif3)) {
  const threadId: string = notif3.threadId;  // Type narrowed to string
}
```

**Run:**
```bash
npx tsc --noEmit /tmp/optional-test.ts
```

**Expected:** 0 errors (optional property handled correctly)

---

## Error Scenarios and Resolutions

### Error 1: "Cannot find name 'Course'"

**Cause:** Type not exported from lib/models/types.ts
**Resolution:** Ensure `export interface Course` (not just `interface Course`)

### Error 2: "Type 'string' is not assignable to type 'NotificationType'"

**Cause:** Invalid notification type in mock data
**Resolution:** Use only: 'new_thread' | 'new_post' | 'endorsed' | 'resolved' | 'flagged'

### Error 3: "Property 'threadId' is missing"

**Cause:** Missing optional property treated as required
**Resolution:** Ensure `threadId?: string` (with `?`) not `threadId: string | undefined`

### Error 4: "Cannot use namespace 'Course' as a type"

**Cause:** Imported as value instead of type
**Resolution:** Use `import type { Course }` not `import { Course }`

### Error 5: "Module has no exported member 'Course'"

**Cause:** Typo in type name or not exported
**Resolution:** Check spelling, ensure `export interface Course` exists

---

## Performance Validation

### Bundle Size Check

**Before adding types:**
```bash
npm run build
# Check .next/static/chunks/*.js sizes
```

**After adding types:**
```bash
npm run build
# Compare sizes - should be IDENTICAL (types erased at compile time)
```

**Expected Result:** 0 byte increase (types are compile-time only)

### Type Checking Performance

**Measure compilation time:**
```bash
time npx tsc --noEmit
```

**Expected:** <2 seconds (6 new interfaces negligible overhead)

---

## Integration with Existing Types

### Zero Breaking Changes Verification

**Test existing code still compiles:**

```bash
# Check Thread interface still works
npx tsc --noEmit lib/api/client.ts

# Check hooks still work
npx tsc --noEmit lib/api/hooks.ts

# Check components still work
npx tsc --noEmit components/thread-card.tsx
npx tsc --noEmit components/post-item.tsx
```

**Expected:** 0 errors (no breaking changes)

### Type Reuse Validation

**Verify UserRole reuse in Enrollment:**

```typescript
import type { UserRole, Enrollment } from "@/lib/models/types";

const enrollment: Enrollment = {
  id: 'e1',
  userId: 'u1',
  courseId: 'c1',
  role: 'student',  // Must be UserRole ('student' | 'instructor' | 'ta')
  enrolledAt: new Date().toISOString(),
};

// Invalid role
// const invalid: Enrollment = { ..., role: 'admin' };  // ERROR
```

---

## Documentation Updates

### Type Definition Comments

**All interfaces have JSDoc comments:**
```typescript
/**
 * Represents an academic course
 */
export interface Course { ... }
```

**Inline comments for clarification:**
```typescript
code: string;          // e.g., "CS101", "MATH221"
```

### README.md Updates (Future)

**Add to Type Safety section:**
```markdown
## Type Definitions

Core course-related types:
- `Course` - Academic course entity
- `Enrollment` - User enrollment in course
- `Notification` - Activity notification
- `NotificationType` - Union of notification types
- `CourseInsight` - AI-generated course insights
- `CourseMetrics` - Course activity metrics

All types use TypeScript strict mode with zero `any` types.
```

---

## Rollback Plan

### If Type Errors Occur

**Step 1: Identify failing file**
```bash
npx tsc --noEmit
# Note which file has errors
```

**Step 2: Revert specific file**
```bash
git checkout HEAD -- lib/models/types.ts
# Or specific file causing issues
```

**Step 3: Verify revert works**
```bash
npx tsc --noEmit
# Should return to 0 errors
```

### If Mock Data Validation Fails

**Step 1: Remove type assertion**
```typescript
// Before (failing):
const courses = require('@/mocks/courses.json') as Course[];

// After (temporarily):
const courses = require('@/mocks/courses.json');
```

**Step 2: Fix JSON data**
- Validate structure against Course interface
- Fix missing fields, incorrect types

**Step 3: Re-add type assertion**
```typescript
const courses = require('@/mocks/courses.json') as Course[];
```

---

## Next Steps (After Type Implementation)

### Immediate Next Tasks (API Designer Agent)
1. Implement API methods in `lib/api/client.ts`
2. Implement React Query hooks in `lib/api/hooks.ts`
3. Implement data store functions in `lib/store/localStore.ts`
4. Create mock JSON data files

### Verification Tasks (Parent Agent)
1. Run `npx tsc --noEmit` after each implementation step
2. Run `npm run lint` to check for style issues
3. Test API methods in browser console
4. Verify React Query hooks work with devtools

---

## File Summary

### Files to Modify

1. **lib/models/types.ts**
   - Add 6 new type definitions
   - Lines to add: ~80 lines (after line 90)
   - Zero breaking changes

2. **lib/api/client.ts**
   - Update 1 import statement (add 5 types)
   - Add 9 method signature comments
   - Lines to add: ~15 lines

3. **lib/api/hooks.ts**
   - Update 1 import statement (add 5 types)
   - Add query key + hook signature comments
   - Lines to add: ~20 lines

4. **lib/store/localStore.ts**
   - Update 1 import statement (add 3 types)
   - Update KEYS constant (add 3 keys)
   - Add 9 function signature comments
   - Lines to modify/add: ~25 lines

### Files to Create (Future - Mock Data Agent)

1. **mocks/courses.json** - Course data (6 courses)
2. **mocks/enrollments.json** - Enrollment data (15 enrollments)
3. **mocks/notifications.json** - Notification data (10 notifications)

---

## Success Criteria

- [ ] All 6 new types defined in lib/models/types.ts
- [ ] All imports updated with `import type` syntax
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] No breaking changes to existing code
- [ ] Type reuse (UserRole) working correctly
- [ ] Optional properties (threadId?) working correctly
- [ ] Union types (NotificationType) exhaustively checkable
- [ ] Mock data type assertions compile successfully
- [ ] Zero bundle size increase after types added
- [ ] All tests pass (type assignability, narrowing, optional)

---

**Implementation Ready:** YES
**Risk Level:** LOW (additive changes only)
**Estimated Time:** 30 minutes (types only)
**Next Agent:** API Designer (for method implementations)

---

**Plan Created:** 2025-10-04
**Created By:** Type Safety Guardian (Sub-Agent)
**Status:** READY FOR IMPLEMENTATION
