# Dashboard Type Patterns Research

**Date:** 2025-10-04
**Task:** auth-dashboard-system
**Agent:** Type Safety Guardian

---

## Existing Type System Analysis

### Core Types in `lib/models/types.ts`

#### 1. User & Authentication Types ✅
- `UserRole` - Type union: `"student" | "instructor" | "ta"`
- `User` - Complete user model with role
- `AuthSession` - Session with user + token
- `AuthState` - React state shape
- `LoginInput`, `SignupInput` - Input types
- `AuthResult` - Discriminated union with type guards

**Patterns Found:**
- ✅ Discriminated unions (`success: true | false`)
- ✅ Type guards (`isAuthSuccess`, `isAuthError`)
- ✅ Strict null handling (`User | null`)
- ✅ Type-only imports used in API client

#### 2. Course & Enrollment Types ✅
- `Course` - Full course model
- `Enrollment` - User-course relationship with role
- `CourseMetrics` - Thread counts, active students, recent activity
- `CourseInsight` - AI-generated insights

**Patterns Found:**
- ✅ Metrics shape already defined
- ✅ Insights include summary, topQuestions, trendingTopics
- ❌ No aggregated dashboard data types

#### 3. Thread & Notification Types ✅
- `Thread` - Q&A thread with status
- `Post` - Replies to threads
- `Notification` - User notifications
- `NotificationType` - Type union for notification types
- `CreateThreadInput`, `CreatePostInput` - Mutation inputs

**Patterns Found:**
- ✅ Status enums as type unions
- ✅ Consistent timestamp fields (ISO 8601 strings)
- ❌ No activity feed types
- ❌ No dashboard-specific aggregations

---

## Type Safety Gaps Identified

### 1. Dashboard Data Aggregations ❌
**Gap:** No types for role-specific dashboard payloads

Current situation:
- `CourseMetrics` exists but needs to be part of larger dashboard type
- `CourseInsight` exists but needs to be part of larger dashboard type
- No `StudentDashboardData` type
- No `InstructorDashboardData` type

**Impact:** Components will use ad-hoc types or `any`

### 2. Activity Feed Types ❌
**Gap:** No structured types for activity timeline

Current situation:
- `Notification` exists but doesn't capture all activity types
- No `ActivityItem` type for feed display
- No `ActivityType` discriminator

**Impact:** Activity feeds will lack type safety

### 3. Dashboard Component Props ❌
**Gap:** No standardized prop types for dashboard UI

Current situation:
- No `DashboardProps` base type
- No `CourseCardProps` with role variants
- No `MetricCardProps` for instructor dashboard

**Impact:** Component reuse will be difficult

### 4. Course-with-Metadata Types ❌
**Gap:** No composed types for enriched course data

Current situation:
- `Course` type is separate from metrics
- Need `EnrichedCourse` with metrics and recent activity
- Need role-specific course views

**Impact:** Data fetching will require manual composition

### 5. Type Guards for Runtime Checks ❌
**Gap:** No role-based type narrowing

Current situation:
- `UserRole` exists but no guards for role checking
- No guards for dashboard data shape validation

**Impact:** Runtime type checking will be unsafe

---

## Discriminated Union Patterns

### 1. AuthResult Pattern (Existing ✅)
```typescript
type AuthResult = AuthResponse | AuthError;

interface AuthResponse {
  success: true;
  session: AuthSession;
}

interface AuthError {
  success: false;
  error: string;
}
```

**Discriminator:** `success: boolean`
**Type Guards:** `isAuthSuccess()`, `isAuthError()`

### 2. Dashboard Data Pattern (Needed ❌)
```typescript
type DashboardData = StudentDashboardData | InstructorDashboardData;

interface StudentDashboardData {
  role: 'student';
  enrolledCourses: EnrichedCourse[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
}

interface InstructorDashboardData {
  role: 'instructor';
  managedCourses: EnrichedCourse[];
  courseMetrics: Map<string, CourseMetrics>;
  unansweredQueue: Thread[];
  insights: CourseInsight[];
}
```

**Discriminator:** `role: UserRole`
**Type Guards:** `isStudentDashboard()`, `isInstructorDashboard()`

### 3. Activity Type Pattern (Needed ❌)
```typescript
type ActivityItem =
  | ThreadCreatedActivity
  | PostCreatedActivity
  | ThreadResolvedActivity
  | PostEndorsedActivity;

interface BaseActivity {
  id: string;
  type: ActivityType;
  courseId: string;
  threadId: string;
  timestamp: string;
}

interface ThreadCreatedActivity extends BaseActivity {
  type: 'thread_created';
  threadTitle: string;
  authorId: string;
}

interface PostCreatedActivity extends BaseActivity {
  type: 'post_created';
  threadTitle: string;
  authorId: string;
  isReplyToUser: boolean;
}
```

**Discriminator:** `type: ActivityType`
**Type Guards:** `isThreadActivity()`, `isPostActivity()`

---

## Type Guard Recommendations

### 1. Role-Based Guards
```typescript
// User role guards
export function isStudent(user: User): boolean;
export function isInstructor(user: User): boolean;
export function isTA(user: User): boolean;

// Dashboard data guards
export function isStudentDashboard(data: DashboardData): data is StudentDashboardData;
export function isInstructorDashboard(data: DashboardData): data is InstructorDashboardData;
```

### 2. Activity Type Guards
```typescript
// Activity discriminators
export function isThreadCreatedActivity(item: ActivityItem): item is ThreadCreatedActivity;
export function isPostCreatedActivity(item: ActivityItem): item is PostCreatedActivity;
export function isThreadResolvedActivity(item: ActivityItem): item is ThreadResolvedActivity;
export function isPostEndorsedActivity(item: ActivityItem): item is PostEndorsedActivity;
```

### 3. Data Validation Guards
```typescript
// Runtime validation
export function isValidCourseMetrics(data: unknown): data is CourseMetrics;
export function isValidNotification(data: unknown): data is Notification;
```

---

## Existing Conventions to Follow

### 1. Naming Patterns ✅
- Interfaces for objects: `User`, `Course`, `Thread`
- Type aliases for unions: `UserRole`, `ThreadStatus`, `NotificationType`
- Input types suffixed with `Input`: `LoginInput`, `CreateThreadInput`
- Result types suffixed with `Result`: `AuthResult`

### 2. Import Patterns ✅
```typescript
// Type-only imports (already used in client.ts)
import type { User, Course, Thread } from "@/lib/models/types";

// Mixed imports when type guards needed
import { isAuthSuccess, type AuthResult } from "@/lib/models/types";
```

### 3. Field Naming ✅
- IDs: `userId`, `courseId`, `threadId` (camelCase with Id suffix)
- Timestamps: ISO 8601 strings with `createdAt`, `updatedAt` suffix
- Counts: `enrollmentCount`, `unreadCount` (number type)
- Booleans: `read`, `endorsed`, `flagged` (no "is" prefix)

### 4. Optional Fields ✅
- Use `?:` for optional properties
- Use `| null` for nullable values that might be fetched
- Use `| undefined` sparingly (prefer optional `?:`)

---

## Integration Points

### 1. Mock API Client (`lib/api/client.ts`)
- Already uses `import type` for all types ✅
- Methods return typed promises ✅
- Need to add dashboard data methods ❌

### 2. React Query Hooks (`lib/api/hooks.ts`)
- Already typed with generics ✅
- Query keys properly typed with `as const` ✅
- Need dashboard-specific hooks ❌

### 3. Components
- Will need prop interfaces for:
  - `DashboardLayout`
  - `CourseCard` (with role variants)
  - `ActivityFeed`
  - `MetricsGrid`
  - `NotificationPanel`

---

## Strict Mode Compliance Checklist

- ✅ No `any` types in existing codebase
- ✅ `strictNullChecks` enabled (nullable types explicit)
- ✅ Type-only imports used where appropriate
- ✅ Discriminated unions with type guards
- ✅ Generic type constraints in hooks
- ❌ Need to maintain zero `any` in new dashboard types
- ❌ Need explicit null handling in dashboard queries
- ❌ Need type guards for runtime data validation

---

## Key Findings Summary

1. **Excellent Foundation:** Existing types follow strict mode best practices
2. **Pattern Consistency:** Discriminated unions + type guards pattern established
3. **Main Gap:** No dashboard-specific data aggregation types
4. **Secondary Gap:** No activity feed/timeline types
5. **Tertiary Gap:** No component prop type standardization
6. **Risk:** Manual type composition could introduce `any` types
7. **Opportunity:** Extend existing patterns (AuthResult → DashboardData)

---

## Next Steps

1. Define `DashboardData` discriminated union with role-based variants
2. Create `ActivityItem` discriminated union with activity types
3. Design `EnrichedCourse` composition type
4. Add dashboard component prop interfaces
5. Implement type guards for runtime safety
6. Update mock API with typed dashboard methods
7. Add React Query hooks with proper generics
