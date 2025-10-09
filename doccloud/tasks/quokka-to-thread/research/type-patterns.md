# Type Patterns Research: Conversation to Thread Conversion

**Date:** 2025-10-08
**Task:** Quokka Conversation to Thread
**Focus:** Type safety analysis for Message[] to CreateThreadInput conversion

---

## Existing Type Definitions

### Source: FloatingQuokka Message Interface
**Location:** `components/course/floating-quokka.tsx` (lines 12-17)

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
```

**Analysis:**
- Local interface (not exported)
- Uses literal union type for role (`"user" | "assistant"`)
- timestamp is `Date` object (not ISO string)
- No optional fields
- No metadata or context fields

### Target: CreateThreadInput Interface
**Location:** `lib/models/types.ts` (lines 359-364)

```typescript
export interface CreateThreadInput {
  courseId: string;
  title: string;
  content: string;
  tags?: string[];
}
```

**Analysis:**
- Exported interface (public API)
- Only `tags` is optional
- No timestamp fields
- Requires title extraction from messages
- Requires content formatting from conversation
- courseId must be provided externally (not in Message)

### Related: useCreateThread Hook
**Location:** `lib/api/hooks.ts` (lines 294-321)

```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (result) => {
      const { thread, aiAnswer } = result;
      // ... invalidation logic
    },
  });
}
```

**Analysis:**
- Hook expects `{ input: CreateThreadInput; authorId: string }`
- Returns `{ thread: Thread; aiAnswer: AIAnswer }`
- authorId must be current user ID
- No validation of conversation length or content

---

## Type Safety Gaps Identified

### Gap 1: Message Interface Not Exported
**Issue:** Message interface is local to FloatingQuokka component
**Impact:** Cannot import type for conversion utilities
**Risk:** Type duplication or `any` usage in conversion functions
**Solution:** Export Message interface from FloatingQuokka or move to types.ts

### Gap 2: No Conversation-Specific Types
**Issue:** No intermediate types for conversation-to-thread transformation
**Impact:** Conversion logic lacks type safety for intermediate steps
**Risk:** Runtime errors from invalid conversions
**Solution:** Create ConversationMetadata, FormattedConversation types

### Gap 3: No Type Guards for Message Validation
**Issue:** No runtime validation that conversation is valid for thread creation
**Impact:** Cannot safely determine if conversion is possible
**Risk:** Creating threads with insufficient or malformed data
**Solution:** Implement isValidConversation type guard

### Gap 4: Title Extraction Not Typed
**Issue:** No type-safe way to extract thread title from messages
**Impact:** Title generation logic not validated at compile time
**Risk:** Empty or invalid titles
**Solution:** Type function signature with explicit return type

### Gap 5: Content Formatting Not Typed
**Issue:** No type for formatted conversation content structure
**Impact:** Formatting logic lacks type constraints
**Risk:** Inconsistent thread content format
**Solution:** Define FormattedMessage type for rendering

---

## Type Import Patterns Analysis

### Current Pattern: lib/models/types.ts
All types are exported with `export interface` or `export type`:

```typescript
export interface CreateThreadInput { ... }
export type ThreadStatus = 'open' | 'answered' | 'resolved';
export function isAuthSuccess(result: AuthResult): result is AuthResponse { ... }
```

**Pattern:** Type-only imports use `import type`:

```typescript
// From lib/api/hooks.ts
import type {
  LoginInput,
  SignupInput,
  AuthResult,
  CreateThreadInput,
  CreatePostInput,
  GenerateAIAnswerInput,
  EndorseAIAnswerInput,
  AIAnswer,
} from "@/lib/models/types";
```

### Pattern Compliance Requirements
1. Use `export interface` for object types
2. Use `export type` for unions and aliases
3. Import types with `import type { ... }`
4. Export type guards as regular functions (not type-only)
5. No `any` types - use `unknown` with guards when needed

---

## Edge Cases Identified

### Edge Case 1: Single Message Conversation
**Scenario:** User tries to convert conversation with only welcome message
**Type Issue:** Minimum message count not enforced in types
**Solution:** Add minMessages validation in type guard

### Edge Case 2: Very Long Conversations
**Scenario:** 50+ message conversation
**Type Issue:** No maximum content length constraint
**Solution:** Document maxMessages recommendation, handle in UI

### Edge Case 3: Empty Message Content
**Scenario:** Message with empty or whitespace-only content
**Type Issue:** Message.content type doesn't enforce non-empty
**Solution:** Add validation in conversion function

### Edge Case 4: Missing Course Context
**Scenario:** FloatingQuokka has courseId prop but Message doesn't
**Type Issue:** courseId must be threaded through conversion
**Solution:** Add courseId to conversion function parameters

### Edge Case 5: Timestamp Conversion
**Scenario:** Message uses Date, Thread uses ISO string
**Type Issue:** No type-safe conversion between formats
**Solution:** Type conversion function explicitly

---

## Related Type Utilities

### Existing Utilities in types.ts

**Type Guards:**
```typescript
export function isAuthSuccess(result: AuthResult): result is AuthResponse
export function isAuthError(result: AuthResult): result is AuthError
export function isStudentDashboard(data: DashboardData): data is StudentDashboardData
export function isInstructorDashboard(data: DashboardData): data is InstructorDashboardData
export function isActivityType(type: string): type is ActivityType
export function isHighConfidence(answer: AIAnswer): boolean
export function hasValidCitations(answer: AIAnswer, minCount?: number): boolean
export function hasAIAnswer(thread: Thread): thread is Required<Pick<Thread, 'hasAIAnswer' | 'aiAnswerId'>> & Thread
```

**Pattern Analysis:**
- Type guards use `is` keyword for type narrowing
- Boolean checks return `boolean` (not type predicates)
- Complex types use utility types (Pick, Required, etc.)

---

## TypeScript Utility Types Available

For conversation conversion, leverage:
- `Pick<T, K>` - Extract subset of properties
- `Omit<T, K>` - Exclude properties
- `Required<T>` - Make all properties required
- `Readonly<T>` - Make properties immutable
- `NonNullable<T>` - Exclude null/undefined

---

## Strictness Violations to Address

### Current Violations: NONE FOUND
The codebase is already strict mode compliant:
- All files use `import type` correctly
- No `any` types in types.ts
- All interfaces properly exported
- Type guards implemented correctly

### New Code Requirements
- Maintain zero `any` types
- Use `import type` for all type-only imports
- Export all types from types.ts (not component files)
- Implement type guards for runtime validation

---

## Summary

**Type Safety Status:** GOOD - Existing codebase follows strict patterns
**Gaps:** Need conversation-specific types and guards
**Risk Level:** LOW - Clear type patterns established
**Recommendation:** Follow existing patterns, add new types to types.ts

**Key Findings:**
1. Message interface needs to be exported from types.ts
2. Need intermediate ConversationMetadata type
3. Need FormattedConversation type for content generation
4. Need isValidConversation type guard
5. All conversion functions must be explicitly typed
6. Zero tolerance for `any` types
7. Use `import type` consistently
8. Add JSDoc for complex type definitions
