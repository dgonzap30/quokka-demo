# Type Patterns Research: Context-Aware AI System

**Research Date:** 2025-10-16
**Task:** Design type system for context-aware AI with course materials access
**Researcher:** Type Safety Guardian

---

## Executive Summary

The existing type system in `lib/models/types.ts` provides a robust foundation for context-aware AI. The codebase demonstrates excellent TypeScript practices with strict mode compliance, discriminated unions, and comprehensive type guards.

**Key Findings:**
- Zero `any` types found in existing type definitions
- Consistent use of `import type` for type-only imports across components
- Well-structured AI-related types (`AIAnswer`, `Citation`, `Message`)
- Opportunities to extend citation system for material references
- Need for new types: `CourseMaterial`, `MaterialReference`, `AIContext`, `EnhancedAIResponse`

---

## Existing Type Definitions Analysis

### 1. AI Answer & Citation Types (lines 224-336)

**Current Structure:**
```typescript
// Excellent type safety - no violations found
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type CitationSourceType = 'lecture' | 'textbook' | 'slides' | 'lab' | 'assignment' | 'reading';

export interface Citation {
  id: string;
  sourceType: CitationSourceType;
  source: string;
  excerpt: string;
  relevance: number;
  link?: string;
}

export interface AIAnswer {
  id: string;
  threadId: string;
  courseId: string;
  content: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  citations: Citation[];
  studentEndorsements: number;
  instructorEndorsements: number;
  totalEndorsements: number;
  endorsedBy: string[];
  instructorEndorsed: boolean;
  generatedAt: string;
  updatedAt: string;
}
```

**Strengths:**
- Strict literal union types for confidence and source types
- Complete metadata tracking for endorsements
- Proper ISO 8601 timestamp strings (not Date objects)
- No optional fields without clear semantics

**Extension Opportunities:**
- `CitationSourceType` can be reused for course material types
- Citation structure is compatible with material references
- AIAnswer already tracks courseId for context

### 2. Message & Conversation Types (lines 596-707)

**Current Structure:**
```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;  // Note: Uses Date, not ISO string
}

export interface ConversationMetadata {
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  startedAt: Date;
  lastMessageAt: Date;
}
```

**Strengths:**
- Simple, focused interface for chat messages
- Type guard `isMessage()` validates structure at runtime
- `isValidConversation()` enforces minimum message requirements

**Design Decisions:**
- Uses `Date` objects (not ISO strings) for timestamps
- This differs from other types that use ISO 8601 strings
- Decision: Maintain consistency within Message types, but new AI context types should use ISO strings

### 3. Course & Enrollment Types (lines 103-169)

**Current Structure:**
```typescript
export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  description: string;
  instructorIds: string[];
  enrollmentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  role: UserRole;
  enrolledAt: string;
}
```

**Strengths:**
- Clean separation of course metadata from enrollment
- Status uses discriminated union pattern
- Proper ISO 8601 timestamp strings

**Extension Requirements:**
- Need to link course materials to Course entities
- CourseId serves as foreign key for materials

### 4. Type Guards & Runtime Validation

**Existing Patterns:**
```typescript
// Excellent examples of type narrowing
export function isAuthSuccess(result: AuthResult): result is AuthResponse {
  return result.success === true;
}

export function hasValidCitations(answer: AIAnswer, minCount: number = 3): boolean {
  return answer.citations.length >= minCount && answer.citations.every((c) => c.relevance >= 50);
}

export function hasAIAnswer(thread: Thread): thread is Required<Pick<Thread, 'hasAIAnswer' | 'aiAnswerId'>> & Thread {
  return thread.hasAIAnswer === true && thread.aiAnswerId !== undefined;
}
```

**Patterns to Replicate:**
- Type predicate functions with `is` keyword
- Boolean validation functions for business logic
- Complex type narrowing with `Required<Pick<T, K>>`

---

## Current Component Usage Analysis

### QuokkaAssistantModal Component

**File:** `components/ai/quokka-assistant-modal.tsx`

**Props Interface (lines 24-42):**
```typescript
export interface QuokkaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextType: "dashboard" | "course" | "instructor";  // Good: literal union
  courseId?: string;
  courseName?: string;
  courseCode?: string;
}
```

**Type Safety Assessment:**
- ✅ Proper literal union for contextType
- ✅ Optional fields correctly marked with `?`
- ⚠️ Context information split across multiple optional fields
- 🎯 **Improvement Opportunity:** Replace with discriminated union `AIContext` type

**Current AI Response Logic (lines 114-177):**
```typescript
const getAIResponse = (question: string): string => {
  const q = question.toLowerCase();
  const contextPrefix = contextType === "course" && courseCode
    ? `[Course: ${courseCode}${courseName ? ` - ${courseName}` : ""}]\n\n`
    : "";

  // Hardcoded responses based on string matching
  if (contextType === "course" && courseCode?.startsWith("CS")) {
    if (q.includes("binary search")) {
      return contextPrefix + "Binary search is...";
    }
  }
  // ...more hardcoded logic
}
```

**Type Safety Issues:**
- ✅ Return type properly typed as `string`
- ❌ No access to structured course materials
- ❌ String matching instead of semantic search
- 🎯 **Required:** Course materials type system for structured data

**Message State Management (line 63):**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
```

**Type Safety Assessment:**
- ✅ Explicit generic type parameter
- ✅ Properly typed state initialization
- ✅ No implicit `any` types

---

## Import Pattern Analysis

**Excellent Example from QuokkaAssistantModal:**
```typescript
import { useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import type { Message } from "@/lib/models/types";
```

**Findings:**
- ✅ Consistent use of `import type` for type-only imports
- ✅ No mixed value/type imports
- ✅ Tree-shaking optimized

**Pattern Violations Found:** None across 31 analyzed component files

---

## Gaps Analysis for Context-Aware Features

### 1. Course Material Types (MISSING)

**Required:**
```typescript
// Need material type definition
export type CourseMaterialType =
  | "lecture"
  | "slide"
  | "assignment"
  | "reading"
  | "lab"
  | "textbook";

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
  };
  createdAt: string;
  updatedAt: string;
}
```

**Rationale:**
- Reuses `CitationSourceType` pattern but renames for clarity
- Metadata object allows extensibility without breaking changes
- Keywords array enables semantic search
- ISO 8601 timestamps for consistency

### 2. Material Reference Type (MISSING)

**Required:**
```typescript
export interface MaterialReference {
  materialId: string;
  type: CourseMaterialType;
  title: string;
  excerpt: string;
  relevanceScore: number;
  link?: string;
}
```

**Rationale:**
- Similar to `Citation` but references `CourseMaterial` entities
- Relevance scoring for ranking (0-100)
- Optional link for navigation
- Lightweight for embedding in AI responses

### 3. AI Context Type (MISSING)

**Required:**
```typescript
export type PageContext = "dashboard" | "course" | "instructor";

export interface AIContext {
  pageType: PageContext;
  userId: string;
  currentCourseId?: string;
  currentCourseName?: string;
  currentCourseCode?: string;
  enrolledCourseIds: string[];
  sessionId?: string;
  timestamp: string;
}
```

**Rationale:**
- Replaces scattered optional props in `QuokkaAssistantModalProps`
- Tracks all enrolled courses for multi-course awareness
- Session ID for conversation threading
- ISO 8601 timestamp for context freshness

### 4. Enhanced AI Response Type (MISSING)

**Required:**
```typescript
export interface EnhancedAIResponse {
  id: string;
  content: string;
  materialReferences: MaterialReference[];
  confidenceScore: number;
  context: AIContext;
  generatedAt: string;
}
```

**Rationale:**
- Extends current AI answer structure
- Embeds material references directly
- Preserves context for debugging/analytics
- Compatible with existing `Message` type

---

## Type Safety Violations Found

### Critical Issues: 0

No `any` types found in existing codebase. Excellent strict mode compliance.

### Warnings: 0

All imports use proper `import type` syntax where appropriate.

### Recommendations: 3

1. **Discriminated Union Opportunity:** Replace `QuokkaAssistantModalProps` context fields with single `AIContext` type
2. **Type Guard Addition:** Add `isValidAIContext()` runtime validator
3. **Generic Constraint:** Consider making `EnhancedAIResponse` generic for different material types

---

## Utility Type Usage Opportunities

### Current Usage Patterns:

```typescript
// Example: Type narrowing with Pick and Required
export function hasAIAnswer(thread: Thread): thread is Required<Pick<Thread, 'hasAIAnswer' | 'aiAnswerId'>> & Thread {
  return thread.hasAIAnswer === true && thread.aiAnswerId !== undefined;
}
```

### Recommended for New Types:

1. **Partial for Updates:**
```typescript
export type UpdateCourseMaterialInput = Partial<Pick<CourseMaterial, 'title' | 'content' | 'keywords'>>;
```

2. **Omit for Creation:**
```typescript
export type CreateCourseMaterialInput = Omit<CourseMaterial, 'id' | 'createdAt' | 'updatedAt'>;
```

3. **Pick for Lightweight References:**
```typescript
export type CourseMaterialSummary = Pick<CourseMaterial, 'id' | 'courseId' | 'type' | 'title'>;
```

---

## Related Type Dependencies

### Type Import Graph:

```
CourseMaterial
  ├── Course (foreign key: courseId)
  ├── CourseMaterialType (union literal)
  └── metadata (inline object)

MaterialReference
  ├── CourseMaterial (foreign key: materialId)
  └── CourseMaterialType (reuse)

AIContext
  ├── User (foreign key: userId)
  ├── Course (foreign key: currentCourseId, enrolledCourseIds)
  └── PageContext (union literal)

EnhancedAIResponse
  ├── MaterialReference[] (composition)
  └── AIContext (composition)

Message (existing, no changes)
  └── Used for chat UI state
```

### Import Locations:

All new types should be added to: `lib/models/types.ts`

Import pattern for components:
```typescript
import type {
  CourseMaterial,
  MaterialReference,
  AIContext,
  EnhancedAIResponse
} from "@/lib/models/types";
```

---

## TypeScript Utilities in Codebase

**Found in `lib/models/types.ts`:**
- 13 type guards (all properly typed with `is` predicates)
- 5 discriminated unions (AuthResult, DashboardData, etc.)
- 0 uses of `Partial`, `Pick`, `Omit` (opportunity for addition)
- Consistent use of interfaces for objects
- Consistent use of type aliases for unions

**Recommended Additions:**
- Add utility types for material CRUD operations
- Add branded types for IDs if needed (e.g., `type MaterialId = string & { __brand: "MaterialId" }`)
- Consider readonly properties for immutable course content

---

## Performance & Bundle Size Considerations

### Type-Only Import Benefits:

**Current Bundle (estimated):**
- All type imports are stripped at compile time
- No runtime overhead from type definitions
- Tree-shaking works correctly

**New Types Impact:**
- Pure TypeScript types: 0 bytes at runtime
- Type guards add minimal runtime code (only when called)
- Material reference arrays may impact JSON payload size

**Mitigation:**
- Use `MaterialReference` (lightweight) instead of full `CourseMaterial` in responses
- Limit `materialReferences` array to top 5 results
- Consider pagination for large course material lists

---

## Existing Type Pattern Strengths

1. **Strict Null Safety:** All optional fields explicitly marked with `?`
2. **Discriminated Unions:** Used correctly for `AuthResult`, `DashboardData`
3. **Literal Types:** Extensive use for status fields ("open" | "answered" | "resolved")
4. **Type Guards:** Comprehensive runtime validation functions
5. **No Any Types:** Perfect strict mode compliance
6. **JSDoc Comments:** Extensive documentation on complex types
7. **Timestamp Consistency:** ISO 8601 strings (except Message type which uses Date)

---

## Recommended Type Design Principles

Based on existing patterns in codebase:

1. **Interfaces for Objects:** Use `interface` for all object shapes
2. **Type Aliases for Unions:** Use `type` for literal unions and discriminated unions
3. **Explicit Over Implicit:** Always specify generic type parameters
4. **Type-Only Imports:** Use `import type` for all type-only imports
5. **Type Guards:** Provide runtime validators for complex types
6. **JSDoc Required:** Document all public-facing types
7. **ISO 8601 Strings:** Use string timestamps for consistency (except Message)
8. **Readonly Where Appropriate:** Consider readonly for course content metadata

---

## Security & Validation Considerations

### Runtime Type Safety:

Current validation patterns:
```typescript
export function isMessage(obj: unknown): obj is Message {
  if (typeof obj !== "object" || obj === null) return false;
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.id === "string" &&
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    msg.timestamp instanceof Date
  );
}
```

**Required for New Types:**
- `isCourseMaterial()` - Validate material structure
- `isMaterialReference()` - Validate reference structure
- `isValidAIContext()` - Validate context completeness
- `isEnhancedAIResponse()` - Validate response structure

### Considerations:
- Course content may contain user input (XSS risk)
- Material excerpts should be sanitized
- Relevance scores must be bounded (0-100)
- Keywords should be validated against injection

---

## Backward Compatibility Analysis

### Breaking Changes: None Required

New types are additive and don't modify existing structures.

### Compatible Changes:

1. `Citation` type can coexist with `MaterialReference`
2. `AIAnswer` doesn't need modification (already has courseId)
3. `Message` type remains unchanged for UI state
4. `QuokkaAssistantModalProps` can accept new `AIContext` while keeping old props deprecated

### Migration Path:

```typescript
// Phase 1: Add new types (backward compatible)
export interface AIContext { /* new */ }

// Phase 2: Deprecate old props (backward compatible)
export interface QuokkaAssistantModalProps {
  /** @deprecated Use aiContext instead */
  contextType?: "dashboard" | "course" | "instructor";
  /** New preferred method */
  aiContext?: AIContext;
}

// Phase 3: Remove deprecated props (breaking change, future)
```

---

## Files Requiring Type Updates

1. **lib/models/types.ts** - Add new type definitions
2. **components/ai/quokka-assistant-modal.tsx** - Update props and state
3. **lib/api/client.ts** - Add course material API methods
4. **lib/api/hooks.ts** - Add React Query hooks for materials
5. **mocks/** - Add course material seed data (JSON, not types)

---

## Conclusion

The existing type system demonstrates excellent TypeScript practices and provides a solid foundation for context-aware AI features. Key recommendations:

1. ✅ Maintain zero `any` policy
2. ✅ Continue using `import type` consistently
3. ✅ Add discriminated union for `AIContext`
4. ✅ Implement type guards for runtime validation
5. ✅ Use existing patterns (interfaces for objects, types for unions)
6. ✅ Extend `CitationSourceType` pattern for materials
7. ✅ Keep backward compatibility during migration

**No type safety violations found. Proceed with confidence.**

---

**Next Steps:**
1. Review this research document
2. Create detailed implementation plan (`plans/type-design-context.md`)
3. Update Decisions section in `context.md`
4. Await parent approval before implementation
