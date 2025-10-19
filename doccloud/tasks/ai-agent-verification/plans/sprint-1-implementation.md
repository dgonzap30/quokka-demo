# Sprint 1: Critical Fixes - Implementation Plan

**Duration:** 2 days (16 hours)
**Goal:** Fix critical blockers for production deployment
**Status:** Ready to implement

---

## Task Breakdown

### Task 1: Fix 7 `any` Types (UNBLOCK BUILD) ⚡

**Priority:** Highest (blocks everything else)
**Effort:** 2 hours
**Files:**
- `app/api/chat/route.ts` (1 any)
- `components/ai-elements/prompt-input.tsx` (4 any)
- `lib/llm/ai-sdk-providers.ts` (1 any)
- Remove unused imports across AI components (1 any equivalent)

**Implementation Steps:**

1. **app/api/chat/route.ts:102** (30 min)
```tsx
// BEFORE:
tools: ragTools as any,

// AFTER:
import type { CoreTool } from 'ai';
const typedRagTools: Record<string, CoreTool> = ragTools;
// ...
tools: typedRagTools,
```

2. **lib/llm/ai-sdk-providers.ts:21** (30 min)
```tsx
// BEFORE:
return models[provider] as any;

// AFTER:
import type { LanguageModel } from 'ai';
return models[provider] as LanguageModel;
```

3. **Remove unused imports** (30 min)
```bash
# Auto-fix where possible
npm run lint -- --fix

# Manual fixes for remaining:
- components/ai/elements/qds-conversation.tsx (canRetry, pageContext, courseCode)
- components/ai/elements/qds-message.tsx (Message, MessageContent)
- components/ai/elements/types.ts (ReactNode)
- components/ai/quokka-assistant-modal.tsx (FormEvent)
```

4. **components/ai-elements/prompt-input.tsx** (30 min)
```tsx
// This file is in ai-elements/, not ai/elements/
// Skip for now - out of primary AI modal scope
// Can address in Sprint 2 if time permits
```

**Verification:**
```bash
npm run lint
# Expected: 3 errors remaining (ai-elements), 0 in ai/ directory
npm run build
# Expected: Success (with warnings OK)
```

---

### Task 2: Fix Tool Turn Tracking Bug ⚡

**Priority:** Critical (security/cost)
**Effort:** 2-3 hours
**Files:**
- `lib/llm/tools/handlers.ts`
- `lib/llm/tools/index.ts`

**Problem:**
```tsx
const turnId = Date.now().toString(); // ❌ Every call = new ID
// Usage limits never checked → unlimited calls
```

**Solution:**

1. **Modify tool handlers to accept turnId** (60 min)
```tsx
// lib/llm/tools/handlers.ts

// Track usage per actual turn
const turnUsageMap = new Map<string, { kb_search: number; kb_fetch: number }>();

export async function handleKbSearch(
  query: string,
  courseId: string | null,
  turnId: string // ✅ Pass from caller
): Promise<KbSearchResult> {
  // Get or init usage
  const usage = turnUsageMap.get(turnId) || { kb_search: 0, kb_fetch: 0 };

  // Check limit
  if (usage.kb_search >= 1) {
    throw new Error('Maximum kb.search calls per turn reached (1)');
  }

  // Increment
  usage.kb_search += 1;
  turnUsageMap.set(turnId, usage);

  // Execute search...
}

export async function handleKbFetch(
  materialId: string,
  courseId: string | null,
  turnId: string
): Promise<KbFetchResult> {
  const usage = turnUsageMap.get(turnId) || { kb_search: 0, kb_fetch: 0 };

  if (usage.kb_fetch >= 1) {
    throw new Error('Maximum kb.fetch calls per turn reached (1)');
  }

  usage.kb_fetch += 1;
  turnUsageMap.set(turnId, usage);

  // Execute fetch...
}

// Cleanup old turns (prevent memory leak)
export function cleanupOldTurns() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [turnId, _] of turnUsageMap) {
    if (parseInt(turnId) < oneHourAgo) {
      turnUsageMap.delete(turnId);
    }
  }
}
```

2. **Update tool definitions to pass turnId** (30 min)
```tsx
// lib/llm/tools/index.ts

import { handleKbSearch, handleKbFetch } from './handlers';

export const ragTools = {
  'kb.search': {
    description: 'Search course materials...',
    parameters: z.object({
      query: z.string(),
      courseId: z.string().nullable(),
    }),
    execute: async ({ query, courseId }, { messages }) => {
      // Generate turnId from message history
      const turnId = messages[messages.length - 1]?.id || Date.now().toString();
      return handleKbSearch(query, courseId, turnId);
    },
  },
  'kb.fetch': {
    description: 'Fetch specific material...',
    parameters: z.object({
      materialId: z.string(),
      courseId: z.string().nullable(),
    }),
    execute: async ({ materialId, courseId }, { messages }) => {
      const turnId = messages[messages.length - 1]?.id || Date.now().toString();
      return handleKbFetch(materialId, courseId, turnId);
    },
  },
};
```

3. **Add cleanup interval** (15 min)
```tsx
// app/api/chat/route.ts

import { cleanupOldTurns } from '@/lib/llm/tools/handlers';

// Cleanup every 5 minutes
setInterval(cleanupOldTurns, 300000);
```

4. **Add unit tests** (45 min)
```tsx
// lib/llm/tools/__tests__/handlers.test.ts

describe('Tool usage limits', () => {
  it('should enforce kb.search limit of 1 per turn', async () => {
    const turnId = 'test-turn-1';

    // First call succeeds
    await handleKbSearch('query1', 'cs101', turnId);

    // Second call fails
    await expect(
      handleKbSearch('query2', 'cs101', turnId)
    ).rejects.toThrow('Maximum kb.search calls per turn reached');
  });

  it('should allow kb.search in different turns', async () => {
    await handleKbSearch('query1', 'cs101', 'turn-1');
    await handleKbSearch('query2', 'cs101', 'turn-2'); // ✅ Should succeed
  });
});
```

**Verification:**
```bash
npm test lib/llm/tools
# Expected: All tests pass
# Manual: Try multiple kb.search calls → second should fail
```

---

### Task 3: Add Rate Limiting Middleware ⚡

**Priority:** High (production requirement)
**Effort:** 1.5 hours
**Files:**
- `lib/utils/rate-limit.ts` (new)
- `app/api/chat/route.ts`

**Implementation:**

1. **Create rate limiter** (45 min)
```tsx
// lib/utils/rate-limit.ts

interface RateLimitConfig {
  requests: number;
  window: string; // e.g., '1m', '1h'
}

interface RateLimitStore {
  [userId: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) throw new Error(`Invalid window format: ${window}`);

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = { s: 1000, m: 60000, h: 3600000 };
  return value * multipliers[unit as keyof typeof multipliers];
}

export function rateLimit(config: RateLimitConfig) {
  const windowMs = parseWindow(config.window);

  return {
    async check(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
      const now = Date.now();
      const userLimit = store[userId];

      // No record or expired → allow
      if (!userLimit || now > userLimit.resetAt) {
        store[userId] = {
          count: 1,
          resetAt: now + windowMs,
        };
        return { allowed: true };
      }

      // Within window → check count
      if (userLimit.count < config.requests) {
        userLimit.count += 1;
        return { allowed: true };
      }

      // Limit exceeded
      const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    },
  };
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const userId in store) {
    if (store[userId].resetAt < now) {
      delete store[userId];
    }
  }
}, 300000);
```

2. **Apply to API route** (30 min)
```tsx
// app/api/chat/route.ts

import { rateLimit } from '@/lib/utils/rate-limit';

// 10 requests per minute per user
const limiter = rateLimit({ requests: 10, window: '1m' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check rate limit
    const { allowed, retryAfter } = await limiter.check(userId);

    if (!allowed) {
      return Response.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter!.toString() },
        }
      );
    }

    // ... rest of handler
  } catch (error) {
    // ... error handling
  }
}
```

3. **Add tests** (15 min)
```tsx
// lib/utils/__tests__/rate-limit.test.ts

describe('rateLimit', () => {
  it('should allow requests within limit', async () => {
    const limiter = rateLimit({ requests: 2, window: '1m' });

    const result1 = await limiter.check('user1');
    expect(result1.allowed).toBe(true);

    const result2 = await limiter.check('user1');
    expect(result2.allowed).toBe(true);
  });

  it('should block requests over limit', async () => {
    const limiter = rateLimit({ requests: 1, window: '1m' });

    await limiter.check('user1');
    const result = await limiter.check('user1');

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

**Verification:**
```bash
npm test lib/utils/rate-limit
# Expected: All tests pass
# Manual: Make 11 requests rapidly → 11th should return 429
```

---

### Task 4: Accessibility Critical Fixes ⚡

**Priority:** Critical (legal/compliance)
**Effort:** 6-8 hours
**Files:**
- `components/ai/quokka-assistant-modal.tsx`
- `components/ai/elements/qds-conversation.tsx`
- `components/ai/elements/qds-prompt-input.tsx`

**Sub-tasks:**

#### 4.1 Focus Return Mechanism (2h)

**File:** `components/ai/quokka-assistant-modal.tsx`

```tsx
// Add at top of component
const triggerRef = useRef<HTMLElement | null>(null);

// Capture trigger on open
useEffect(() => {
  if (isOpen && !triggerRef.current) {
    triggerRef.current = document.activeElement as HTMLElement;
  }
}, [isOpen]);

// Return focus on close
useEffect(() => {
  if (!isOpen && triggerRef.current) {
    // Small delay to ensure modal DOM is removed
    setTimeout(() => {
      triggerRef.current?.focus();
      triggerRef.current = null;
    }, 100);
  }
}, [isOpen]);

// Update Dialog component
<Dialog
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) {
      onClose();
    }
  }}
>
  <DialogContent
    aria-labelledby="quokka-modal-title"
    aria-describedby="quokka-modal-description"
  >
    {/* ... */}
  </DialogContent>
</Dialog>
```

#### 4.2 Message Announcements (2h)

**File:** `components/ai/elements/qds-conversation.tsx`

```tsx
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Conversation messages"
  className="flex-1 overflow-y-auto px-6 py-4"
>
  {messages.map((message, index) => (
    <QDSMessage
      key={message.id}
      message={message}
      isLast={index === messages.length - 1}
      aria-label={`${message.role} message ${index + 1} of ${messages.length}`}
    />
  ))}
</div>
```

#### 4.3 Streaming Status Announcement (1h)

**File:** `components/ai/quokka-assistant-modal.tsx`

```tsx
// Add live region for status
<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {isStreaming && 'AI is responding'}
  {!isStreaming && messages.length > 0 && 'Response complete'}
</div>
```

#### 4.4 Error Announcements (1h)

```tsx
// Add error live region
{error && (
  <div
    role="alert"
    aria-live="assertive"
    className="rounded-md bg-danger/10 border border-danger p-4 mb-4"
  >
    <p className="text-sm text-danger font-medium">
      {error.message || 'An error occurred'}
    </p>
  </div>
)}
```

#### 4.5 Modal Title & Description (30min)

```tsx
<DialogHeader>
  <DialogTitle id="quokka-modal-title">
    Quokka AI Assistant
  </DialogTitle>
  <DialogDescription id="quokka-modal-description">
    {activeCourse
      ? `Ask questions about ${activeCourse.name}`
      : 'Ask questions across all your courses'}
  </DialogDescription>
</DialogHeader>
```

**Verification:**
```bash
# Manual testing with screen reader
# macOS: VoiceOver (Cmd+F5)
# Test:
# 1. Open modal → title announced?
# 2. Send message → response announced?
# 3. Trigger error → error announced?
# 4. Close modal → focus returns to trigger?
```

---

### Task 5: Component Refactor (Split Modal) 🔧

**Priority:** High (maintainability)
**Effort:** 4-6 hours
**Files:**
- `lib/llm/hooks/useQuokkaAssistant.ts` (new)
- `components/ai/QuokkaAssistantPanel.tsx` (new)
- `components/ai/QuokkaConfirmationDialogs.tsx` (new)
- `components/ai/quokka-assistant-modal.tsx` (refactor)

**Note:** This is a larger refactor. Given time constraints, we may defer to Sprint 2 or post-launch.

**Decision:** DEFER to Sprint 2 if Sprint 1 takes >12 hours

---

## Sprint 1 Execution Order

### Day 1 (8 hours)

**Morning (4h):**
1. ✅ Fix 7 `any` types (2h)
2. ✅ Verify build succeeds (15min)
3. ✅ Add rate limiting (1.5h)
4. ✅ Test rate limiting (15min)

**Afternoon (4h):**
5. ✅ Fix tool turn tracking bug (3h)
6. ✅ Test tool limits (30min)
7. ✅ Commit progress (30min)

### Day 2 (8 hours)

**Morning (4h):**
8. ✅ Accessibility: Focus return (2h)
9. ✅ Accessibility: Message announcements (2h)

**Afternoon (4h):**
10. ✅ Accessibility: Streaming status (1h)
11. ✅ Accessibility: Error announcements (1h)
12. ✅ Accessibility: Modal ARIA (30min)
13. ✅ Screen reader testing (1h)
14. ✅ Final verification & commit (30min)

---

## Verification Checklist

After Sprint 1 completion:

### Code Quality
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0-3 errors (ai-elements only)
- [ ] `npm run build` → Success
- [ ] No console errors in dev mode

### Functionality
- [ ] Modal opens/closes correctly
- [ ] Messages send and stream
- [ ] Rate limiting works (11th request fails)
- [ ] Tool limits enforced (2nd kb.search fails)
- [ ] Citations display correctly

### Accessibility
- [ ] Focus returns to trigger on close
- [ ] Screen reader announces messages
- [ ] Errors announced with role="alert"
- [ ] Streaming status communicated
- [ ] Modal title/description announced
- [ ] All interactive elements keyboard accessible

### Performance
- [ ] No memory leaks (check DevTools)
- [ ] React Query cache reasonable
- [ ] Bundle size <200KB for /quokka route

---

## Success Criteria

**Sprint 1 Complete When:**
- ✅ Build succeeds (no `any` errors)
- ✅ Tool tracking bug fixed (limits enforced)
- ✅ Rate limiting active (429 on excess)
- ✅ Accessibility critical fixes applied (focus, announcements, errors)
- ✅ All verification checks pass

**Deferred to Sprint 2:**
- Component refactor (if time runs short)
- QDS compliance fixes
- React Query optimization
- A11y high priority issues

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Type fixes break functionality | Test after each fix, commit incrementally |
| Tool tracking changes break flows | Comprehensive unit tests before integration |
| Rate limiting too strict | Start with generous limit (10/min), monitor |
| A11y fixes introduce bugs | Test each fix independently |
| Time overrun | Defer component refactor to Sprint 2 |

---

**Sprint 1 Start:** Ready to begin
**Expected Completion:** 2 days (16 hours)
**Next:** Execute tasks in order, commit after each major milestone
