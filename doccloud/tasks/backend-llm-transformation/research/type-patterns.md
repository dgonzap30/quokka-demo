# Type Patterns Research - Backend LLM Transformation

**Created:** 2025-10-16
**Agent:** Type Safety Guardian
**Task:** Audit existing type system and design new types for LLM integration

---

## Executive Summary

The existing type system in `lib/models/types.ts` is **well-structured and strict mode compliant**. It follows excellent patterns:
- ✅ Zero `any` types found
- ✅ All type-only imports use `import type` syntax
- ✅ Comprehensive type guards for runtime validation
- ✅ Discriminated unions where appropriate
- ✅ Extensive JSDoc documentation

**Key Finding:** The codebase already follows best practices. New types must maintain this high standard.

---

## Current Type System Audit

### 1. Existing Type Definitions (lib/models/types.ts)

Total lines: **1,722**
Total interfaces: **54**
Total type aliases: **18**
Total type guards: **22**

#### Core Type Categories

| Category | Types | Pattern | Quality |
|----------|-------|---------|---------|
| **User & Auth** | `User`, `AuthSession`, `AuthState`, `AuthResult`, `LoginInput`, `SignupInput` | Interfaces for objects, discriminated union for results | ✅ Excellent |
| **Course & Enrollment** | `Course`, `Enrollment`, `CourseMetrics`, `CourseInsight` | Interfaces with optional fields | ✅ Excellent |
| **Thread & Post** | `Thread`, `Post`, `ThreadStatus`, `ThreadWithAIAnswer` | Status as literal union, extends pattern | ✅ Excellent |
| **AI Answer** | `AIAnswer`, `Citation`, `ConfidenceLevel`, `GenerateAIAnswerInput` | Enums as literal unions, input patterns | ✅ Excellent |
| **Course Material** | `CourseMaterial`, `MaterialReference`, `CourseMaterialType` | Type guards present | ✅ Excellent |
| **Dashboard** | `StudentDashboardData`, `InstructorDashboardData`, `ActivityItem` | Complex aggregations | ✅ Excellent |
| **Instructor Tools** | `FrequentlyAskedQuestion`, `TrendingTopic`, `ResponseTemplate` | Feature-specific types | ✅ Excellent |
| **Conversations** | `Message`, `ConversationToThreadInput`, `ConversationMetadata` | Message role as literal union | ✅ Good |

#### Type Safety Violations Found

**NONE.** All types are properly typed with no `any` usage.

#### Import Pattern Analysis

**File:** `lib/api/client.ts`
✅ Uses `import type` for all type-only imports (line 1-41)

**File:** `lib/api/hooks.ts`
✅ Uses `import type` for all type-only imports (line 1-15)

**Pattern:** Codebase consistently uses `import type { ... }` syntax.

---

## Type Patterns Used

### 1. Discriminated Unions

**Example: AuthResult**
```typescript
export type AuthResult = AuthResponse | AuthError;

export interface AuthResponse {
  success: true;  // Discriminator
  session: AuthSession;
  message?: string;
}

export interface AuthError {
  success: false; // Discriminator
  error: string;
  code?: string;
}
```

**Pattern:** Literal `success` field discriminates between success/error.
**Type Guards:** `isAuthSuccess()`, `isAuthError()`

### 2. Literal Union Types (Enums)

**Example: ThreadStatus**
```typescript
export type ThreadStatus = 'open' | 'answered' | 'resolved';
```

**Pattern:** Prefer literal unions over enums for better type inference and tree-shaking.

### 3. Optional vs Required Fields

**Pattern:** Use `?:` for truly optional fields, avoid `| undefined` unless needed for strict null checks.

**Example:**
```typescript
export interface Thread {
  id: string;
  courseId: string;
  title: string;
  tags?: string[];      // Optional
  hasAIAnswer?: boolean;
  aiAnswerId?: string;
}
```

### 4. Input Types

**Pattern:** Separate input types from entity types.

**Example:**
```typescript
export interface CreateThreadInput {
  courseId: string;
  title: string;
  content: string;
  tags?: string[];
}
```

**Rationale:** Input types exclude server-generated fields (id, createdAt, etc.).

### 5. Type Guards

**Pattern:** Provide type guards for all discriminated unions and complex runtime checks.

**Example:**
```typescript
export function isCourseMaterial(obj: unknown): obj is CourseMaterial {
  if (typeof obj !== "object" || obj === null) return false;

  const material = obj as Record<string, unknown>;

  return (
    typeof material.id === "string" &&
    typeof material.courseId === "string" &&
    typeof material.type === "string" &&
    ["lecture", "slide", "assignment", "reading", "lab", "textbook"].includes(material.type as string) &&
    typeof material.title === "string" &&
    typeof material.content === "string" &&
    Array.isArray(material.keywords) &&
    material.keywords.every((k: unknown) => typeof k === "string") &&
    typeof material.metadata === "object" &&
    material.metadata !== null &&
    typeof material.createdAt === "string" &&
    typeof material.updatedAt === "string"
  );
}
```

### 6. Utility Type Usage

**Found:** Minimal use of TypeScript utility types.

**Opportunities:**
- `Pick<CourseMaterial, "id" | "type" | "title">` for lightweight summaries
- `Omit<Thread, "views" | "updatedAt">` for creation inputs
- `Partial<AIAnswer>` for update operations
- `Required<Pick<Thread, "hasAIAnswer" | "aiAnswerId">>` for narrowing

**Current Example:**
```typescript
export type CourseSummary = Pick<Course, "id" | "code" | "name" | "term">;
export type MaterialSummary = Pick<CourseMaterial, "id" | "courseId" | "type" | "title">;
```

### 7. Extends Pattern

**Pattern:** Extend base types to create enriched variants.

**Example:**
```typescript
export interface ThreadWithAIAnswer extends Thread {
  aiAnswer: AIAnswer;
}
```

---

## Related Type Dependencies

### Conversation System Dependencies

**New types will depend on:**
- `User` - for userId references
- `Course` - for courseId references
- `Message` - existing conversation type (lines 996-1008)
- `CreateThreadInput` - for conversion result

**Existing types that need updates:**
- `Message` - currently has `timestamp: Date`, should be ISO string for consistency
- **BREAKING CHANGE:** This affects serialization across API boundary

### LLM Provider Dependencies

**New types will depend on:**
- `AIAnswer` - for response structure
- `Citation` - for citation format
- `CourseMaterial` - for context building
- `EnhancedAIResponse` - for richer AI responses

### LMS Integration Dependencies

**New types will depend on:**
- `Course` - for course metadata
- `CourseMaterial` - for synced content
- `Assignment` - existing type (lines 1580-1595)

### Database Schema Dependencies

**New types will mirror:**
- All existing entity types (User, Course, Thread, Post, etc.)
- Migration types will use `Partial<T>` for updates

---

## API Client Type Usage Audit

### lib/api/client.ts Analysis

**Functions Analyzed:** 50+

**Type Safety Issues Found:** 0

**Patterns Observed:**
1. **Consistent return types:** All async functions properly typed as `Promise<T>`
2. **Input validation:** All inputs typed with specific interfaces
3. **Type narrowing:** Uses type guards appropriately
4. **Error handling:** Throws `Error` (should consider typed errors)

**Notable Functions:**
```typescript
async generateAIResponseWithMaterials(
  courseId: string,
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): Promise<{
  content: string;
  confidence: { level: ConfidenceLevel; score: number };
  citations: Citation[];
}>
```

**Observation:** This function already uses `CourseMaterial[]` for context (line 537-549).
**Implication:** New LLM types should align with this existing pattern.

---

## React Query Hooks Type Analysis

### lib/api/hooks.ts Analysis

**Hooks Analyzed:** 30+

**Type Safety Issues Found:** 0

**Patterns Observed:**
1. **Generic typing:** All hooks properly typed with React Query generics
2. **Enabled guards:** Conditional queries use `enabled: !!param`
3. **Optimistic updates:** Complex types in `onMutate` callbacks
4. **Query keys:** Strongly typed with `as const` assertions

**Example Pattern:**
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

**Observation:** All hooks handle `undefined` gracefully with conditional query keys.
**Implication:** New conversation hooks must follow this pattern.

---

## Gaps & Missing Types

### 1. Conversation Storage Types

**Missing:**
- `Conversation` - Session metadata
- `ConversationMessage` - Individual message in conversation
- `ConversationSession` - Conversation with embedded messages
- `ConversationToThreadResult` - Full conversion result

**Partial Implementation:**
- `Message` (lines 996-1008) - exists but incomplete
- `ConversationToThreadInput` (lines 1047-1056) - exists
- `ConversationToThreadResult` (lines 1060-1070) - exists

**Issues:**
- `Message.timestamp` is `Date` not ISO string (inconsistent with rest of codebase)
- No conversation session type with metadata

### 2. LLM Provider Types

**Missing:**
- `LLMProvider` - Generic interface
- `LLMConfig` - Provider configuration
- `LLMRequest` - Request to LLM
- `LLMResponse` - Response from LLM
- `LLMStreamChunk` - Streaming response
- `ProviderType` - 'openai' | 'anthropic'

### 3. Course Context Types

**Missing:**
- `CourseContext` - Built context for single course
- `MultiCourseContext` - Aggregated context
- `ContextMaterial` - Material with relevance score
- `CourseDetectionResult` - Auto-detected course
- `ContextBuildOptions` - Options for context building

**Partial Implementation:**
- `CourseMaterial` - exists and well-typed
- `MaterialReference` - exists (lines 282-300)
- `AIContext` - exists (lines 317-341)

### 4. LMS Integration Types

**Missing:**
- `LMSClient` - Generic LMS interface
- `LMSContent` - Generic content structure
- `SyllabusData` - Syllabus structure
- `ScheduleEntry` - Calendar entry
- `LMSSyncResult` - Sync operation result
- `LMSWebhookPayload` - Webhook event data

### 5. Database Types

**Missing:**
- Table schemas as TypeScript interfaces
- Migration types
- Query result types
- Index definitions

---

## Type Design Constraints

### 1. Backward Compatibility

**MUST NOT:**
- Change existing type signatures in `lib/models/types.ts`
- Break existing API contracts in `lib/api/client.ts`
- Modify existing React Query hooks in `lib/api/hooks.ts`

**MAY:**
- Add new optional fields to existing interfaces
- Add new types to `lib/models/types.ts`
- Add new hooks to `lib/api/hooks.ts`

### 2. Strict Mode Compliance

**MUST:**
- No `any` types
- All type-only imports use `import type`
- All interfaces have explicit types
- All generic types have constraints where appropriate
- All runtime checks use type guards

### 3. Consistency Requirements

**MUST:**
- Use ISO 8601 strings for timestamps (not `Date`)
- Use `string` for IDs (not `number`)
- Use interfaces for objects, type aliases for unions
- Provide type guards for discriminated unions
- Document complex types with JSDoc

### 4. React Query Compatibility

**MUST:**
- All API return types must be serializable (no `Date`, `Map`, `Set`)
- All mutation inputs must be plain objects
- All query keys must use `as const` assertions

---

## Naming Conventions

### Observed Patterns

1. **Entities:** PascalCase nouns (`User`, `Course`, `Thread`)
2. **Input types:** `Create<Entity>Input`, `Update<Entity>Input`, `Search<Entity>Input`
3. **Result types:** `<Entity>Result`, `<Entity>SearchResult`
4. **Status enums:** Lowercase literal unions (`'open' | 'answered' | 'resolved'`)
5. **Type guards:** `is<TypeName>(obj): obj is TypeName`
6. **Utility types:** `<Entity>Summary`, `<Entity>WithMetrics`, `<Entity>WithActivity`

### Recommended Naming

**New conversation types:**
- `Conversation` (not `ConversationSession`)
- `ConversationMessage` (not `Message` - too generic)
- `CreateConversationInput`
- `ConvertConversationToThreadInput`
- `ConvertConversationToThreadResult`

**New LLM types:**
- `LLMProvider` (interface)
- `LLMProviderConfig` (not just `LLMConfig`)
- `LLMRequest`, `LLMResponse`
- `LLMStreamChunk`
- `ProviderType = 'openai' | 'anthropic'`

**New context types:**
- `CourseContext` (built for single course)
- `MultiCourseContext` (aggregated)
- `ContextMaterial` (material with score)
- `CourseDetectionResult`

---

## Type Guard Requirements

### All New Discriminated Unions Need Guards

**Example: LLMResponse discriminated by status**
```typescript
export type LLMResponse =
  | { status: 'success'; content: string; usage: TokenUsage }
  | { status: 'error'; error: string; code: string };

export function isLLMSuccess(resp: LLMResponse): resp is Extract<LLMResponse, { status: 'success' }> {
  return resp.status === 'success';
}
```

### All Complex Runtime Types Need Guards

**Required for:**
- `Conversation` - validate conversation structure from storage
- `ConversationMessage` - validate message structure
- `LLMRequest` - validate request before sending
- `CourseContext` - validate built context
- `LMSContent` - validate synced content

---

## Import Organization

### Current Pattern (lib/models/types.ts)

**File structure:**
1. Core types (User, Auth)
2. Domain types (Course, Thread, Post)
3. Feature types (AI Answer, Dashboard)
4. Type guards (grouped by domain)
5. Input types (grouped by domain)

**No imports** - all types self-contained in single file.

### Recommended Pattern for New Types

**Option 1: Extend existing file**
- Add new types to `lib/models/types.ts`
- Group by feature (LLM, Conversation, LMS, Context)
- Pros: Single source of truth, no import management
- Cons: File becomes very large (2000+ lines)

**Option 2: Feature modules** (NOT RECOMMENDED for this project)
- Split into `lib/models/llm.ts`, `lib/models/conversation.ts`, etc.
- Pros: Better organization
- Cons: Breaks existing import patterns, circular dependencies risk

**Recommendation:** **Option 1** - extend existing file. The codebase already has a single-file pattern.

---

## Breaking Changes Analysis

### Identified Breaking Changes

#### 1. Message.timestamp type

**Current:**
```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date; // ⚠️ INCONSISTENT
}
```

**Should be:**
```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601
}
```

**Impact:**
- `lib/api/client.ts` - No usage found
- Components may create `Date` objects
- React Query serialization issue

**Migration:**
- Convert all `Date` to ISO string before storage
- Update any consumers creating `Message` objects

### No Other Breaking Changes Required

All other types are additive and can be safely added without breaking existing code.

---

## Performance Considerations

### Type Complexity

**Current complexity:** Manageable
**Largest interface:** `InstructorDashboardData` (30+ fields)
**Deepest nesting:** 3 levels (acceptable)

**New types complexity:**
- `LLMProvider` interface - 5 methods (low)
- `Conversation` - 8 fields (low)
- `CourseContext` - 10+ fields (medium)
- `MultiCourseContext` - aggregate of CourseContext (medium)

**TypeScript compiler impact:** Minimal - all types are simple object shapes.

### Type Guard Performance

**Current pattern:** Exhaustive runtime checks

**Example (lines 782-801):**
```typescript
export function isCourseMaterial(obj: unknown): obj is CourseMaterial {
  if (typeof obj !== "object" || obj === null) return false;

  const material = obj as Record<string, unknown>;

  return (
    typeof material.id === "string" &&
    typeof material.courseId === "string" &&
    // ... 8 more checks
  );
}
```

**Cost:** O(n) where n = number of fields
**Frequency:** Once per API call
**Impact:** Negligible

**Recommendation:** Continue this pattern for new types.

---

## Summary of Findings

### Strengths of Current Type System

1. ✅ **Zero `any` types** - Excellent type safety
2. ✅ **Consistent patterns** - Easy to extend
3. ✅ **Comprehensive guards** - Runtime safety
4. ✅ **Good documentation** - JSDoc comments present
5. ✅ **Proper imports** - `import type` used correctly

### Areas for Improvement

1. 🟡 **Message.timestamp** - Use ISO string for consistency
2. 🟡 **Utility type usage** - Could use more Pick/Omit/Partial
3. 🟡 **Error types** - All errors are generic `Error` (could use discriminated union)

### Type Design Priorities

1. **Conversation Types** - HIGH priority, user-facing feature
2. **LLM Provider Types** - HIGH priority, core architecture
3. **Context Types** - MEDIUM priority, AI quality feature
4. **LMS Types** - MEDIUM priority, content sync
5. **Database Types** - LOW priority, internal implementation

---

## Next Steps

1. Review this research with parent agent
2. Create comprehensive type design in `plans/type-design.md`
3. Update **Decisions** section in `context.md` with key findings
4. Await approval before implementation

---

**Research completed:** 2025-10-16
**Files analyzed:** 3 (`types.ts`, `client.ts`, `hooks.ts`)
**Types audited:** 72
**Issues found:** 1 (Message.timestamp inconsistency)
