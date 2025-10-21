# Plan 1: Demo Functionality Fixes
**Goal:** Make backend integration work in development environment
**Scope:** ONLY issues that prevent demo from working
**Timeline:** 2-3 hours of focused work
**Priority:** Fix demo-blockers, ignore production security/scalability

---

## Executive Summary

**Current Status:** Backend is 67% complete with 5 critical bugs preventing demo functionality

**What Works:**
- ✅ Database schema fully designed (18 tables)
- ✅ 20 of 30 endpoints functional
- ✅ Auth, courses, materials, notifications working
- ✅ Mock data system complete

**What's Broken (Demo-Blockers):**
1. Thread type mismatch (frontend expects AI answers embedded)
2. Instructor dashboard endpoints stubbed (3 TODOs)
3. AI answer generation not wired
4. Session cookies don't work across ports (3000 vs 3001)
5. Database not reseeded after recent changes

**Outcome After Fixes:** Full backend integration working in development

---

## Demo-Blocking Issues (5 Total)

### 🔴 Issue 1: Thread Type Mismatch
**Symptom:** Frontend shows errors when loading threads via backend
**Root Cause:** Backend returns `Thread` but frontend expects `ThreadWithAIAnswer`
**Impact:** Thread list page breaks
**Severity:** BLOCKER

**Files Affected:**
- `backend/src/routes/v1/threads.routes.ts` (line 69-110)
- `lib/api/client/threads.ts` (line 80)

**Fix Options:**
**Option A (Recommended):** Backend embeds AI answers in thread response
```typescript
// In threads.routes.ts, modify GET /api/v1/threads
const threads = await this.threadsRepo.findByCourseId(courseId, { limit, cursor });

// Enrich each thread with AI answer
const enrichedThreads = await Promise.all(
  threads.data.map(async (thread) => {
    const aiAnswer = await this.aiAnswersRepo.findByThreadId(thread.id);
    return { ...thread, aiAnswer: aiAnswer || null };
  })
);

return { items: enrichedThreads, ... };
```

**Option B (Alternative):** Frontend calls separate endpoint
```typescript
// In threads.ts client, fetch threads then AI answers separately
const threads = await httpGet('/api/v1/threads');
const aiAnswers = await Promise.all(
  threads.map(t => httpGet(`/api/v1/ai-answers?threadId=${t.id}`))
);
// Merge manually
```

**Recommendation:** Use Option A (simpler, fewer HTTP calls)

**Effort:** 30 minutes
**Testing:** Load thread list page, verify AI answers display

---

### 🔴 Issue 2: Instructor Dashboard Not Implemented
**Symptom:** Dashboard shows "TODO" instead of metrics
**Root Cause:** 3 endpoint handlers have TODO comments instead of implementation
**Impact:** Instructor dashboard unusable
**Severity:** BLOCKER

**File:** `backend/src/routes/v1/instructor.routes.ts`

**Missing Implementations:**

**2a. GET /api/v1/instructor/metrics (Line 158)**
```typescript
// Current
// TODO: Implement proper metrics calculation

// Fix (simple version for demo)
async getMetrics(request: FastifyRequest, reply: FastifyReply) {
  const { courseId, timeRange } = request.query as { courseId: string; timeRange: string };

  // Get basic counts
  const totalThreads = await this.threadsRepo.countByCourseId(courseId);
  const answeredThreads = await this.threadsRepo.countAnswered(courseId);
  const avgResponseTime = await this.threadsRepo.avgResponseTime(courseId, timeRange);
  const instructorEngagement = await this.postsRepo.countByRole(courseId, ['instructor', 'ta']);

  return {
    totalQuestions: totalThreads,
    answeredQuestions: answeredThreads,
    avgResponseTime: avgResponseTime || '2h 15m', // Fallback
    instructorEngagement: instructorEngagement,
    aiAnswerAccuracy: 0.87, // Static for demo (Phase 3.4 metric)
    timeSaved: Math.round(answeredThreads * 5), // 5 min per answer
  };
}
```

**2b. GET /api/v1/instructor/unanswered (Line 187)**
```typescript
// Current
// TODO: Implement proper unanswered threads query

// Fix
async getUnansweredThreads(request: FastifyRequest, reply: FastifyReply) {
  const { courseId } = request.query as { courseId: string };

  const threads = await this.threadsRepo.findAll({
    where: {
      courseId,
      status: 'open', // or check if posts.length === 0
    },
    orderBy: { createdAt: 'desc' },
    limit: 50,
  });

  return { threads };
}
```

**2c. GET /api/v1/instructor/moderation-queue (Line 211)**
```typescript
// Current
// TODO: Implement proper moderation queue logic

// Fix
async getModerationQueue(request: FastifyRequest, reply: FastifyReply) {
  const { courseId } = request.query as { courseId: string };

  // Flagged posts (if flagged column exists)
  const flaggedPosts = await this.postsRepo.findFlagged(courseId);

  // Recent threads needing attention
  const needsAttention = await this.threadsRepo.findAll({
    where: {
      courseId,
      status: 'open',
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    },
    orderBy: { createdAt: 'desc' },
    limit: 20,
  });

  return {
    flaggedPosts,
    needsAttention,
  };
}
```

**Effort:** 1 hour (implement all 3 + add repository methods if needed)
**Testing:** Open instructor dashboard, verify metrics display

---

### 🔴 Issue 3: AI Answer Generation Not Wired
**Symptom:** Creating new threads shows "TODO" comment
**Root Cause:** No backend endpoint for generating AI answers
**Impact:** Can't create AI-powered responses to new questions
**Severity:** HIGH (demo can work without this, but core feature missing)

**File:** `lib/api/client/ai-answers.ts` (Line 75)

**Current:**
```typescript
// TODO: Add backend endpoint when AI answer generation is implemented
return mockAskQuestion(input); // Falls back to mock
```

**Fix Decision:** **DEFER THIS** - Keep AI generation frontend-only for demo
- Frontend AI chat (Quokka) already works via API routes
- Backend AI integration is complex (needs LLM SDK, streaming, tool calling)
- Not essential for demo to work

**Alternative:** Add simple backend endpoint that calls frontend API route
```typescript
// backend/src/routes/v1/ai-answers.routes.ts
fastify.post('/api/v1/ai-answers', async (request, reply) => {
  // Proxy to frontend API route
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify(request.body),
  });
  return response.json();
});
```

**Effort:** 15 minutes (proxy approach) OR 4+ hours (full backend integration)
**Recommendation:** Keep frontend-only for now, add to production roadmap

---

### 🔴 Issue 4: Session Cookie Cross-Port Issue
**Symptom:** Login works but session not maintained between requests
**Root Cause:** Cookie domain set to `localhost` but ports differ (3000 vs 3001)
**Impact:** Auth state not persisted
**Severity:** BLOCKER

**File:** `backend/src/plugins/session.plugin.ts` (Line 71)

**Current:**
```typescript
cookie: {
  httpOnly: true,
  secure: false, // Dev mode
  sameSite: 'lax',
  domain: 'localhost', // ❌ Too strict
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}
```

**Fix:**
```typescript
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined, // ✅ Allow localhost:*
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}
```

**Also Update CORS:**
```typescript
// In server.ts
fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : 'http://localhost:3000', // ✅ Explicitly allow frontend origin
  credentials: true, // ✅ Required for cookies
});
```

**Effort:** 15 minutes
**Testing:** Login via dev-login, check cookie in DevTools, refresh page, verify still logged in

---

### 🟡 Issue 5: Database Not Seeded
**Symptom:** Old data in database (pre-Oct 19 schema changes)
**Root Cause:** `npm run db:seed` not run recently
**Impact:** Demo might show stale data
**Severity:** MEDIUM (doesn't break functionality, just shows old data)

**Fix:**
```bash
cd backend
npm run db:seed
```

**Expected Output:**
```
🔄 Clearing existing data...
✅ Loaded users (4)
✅ Loaded courses (2)
✅ Loaded enrollments (6)
✅ Loaded threads (30)
✅ Loaded posts (70)
✅ Loaded ai_answers (30)
✅ Loaded ai_conversations (5)
...
🎉 Database seeded successfully!
```

**Effort:** 5 minutes
**Testing:** Check database size, verify `dev.db` timestamp updated

---

## Implementation Plan

### Step 1: Reseed Database (5 minutes)
```bash
cd backend
npm run db:seed
```

### Step 2: Fix Session Cookie (15 minutes)
- Edit `backend/src/plugins/session.plugin.ts`
- Set `domain: undefined` for dev mode
- Update CORS to allow credentials
- Restart backend: `npm run dev`

### Step 3: Fix Thread Type Mismatch (30 minutes)
- Edit `backend/src/routes/v1/threads.routes.ts`
- Add AI answer enrichment to GET endpoints
- Test with frontend thread list page

### Step 4: Implement Instructor Endpoints (1 hour)
- Edit `backend/src/routes/v1/instructor.routes.ts`
- Implement 3 TODO functions (metrics, unanswered, moderation queue)
- Add repository methods if needed
- Test with instructor dashboard

### Step 5: (Optional) AI Answer Proxy (15 minutes)
- Add simple proxy endpoint to backend
- Or keep frontend-only and document

### Step 6: End-to-End Testing (30 minutes)
**Test Checklist:**
- [ ] Login via dev-login endpoint
- [ ] Session persists after refresh
- [ ] Thread list displays with AI answers
- [ ] Instructor dashboard shows metrics
- [ ] Creating new thread works (even if AI gen is frontend-only)
- [ ] No console errors in browser
- [ ] No 404 errors in network tab

---

## Total Effort Estimate

| Task | Time | Priority |
|------|------|----------|
| Reseed database | 5 min | MEDIUM |
| Fix session cookie | 15 min | HIGH |
| Fix thread type mismatch | 30 min | HIGH |
| Implement instructor endpoints | 60 min | HIGH |
| AI answer proxy (optional) | 15 min | LOW |
| End-to-end testing | 30 min | HIGH |
| **TOTAL** | **2h 35min** | |

---

## Acceptance Criteria

**Demo is considered "working" when:**
- ✅ User can login via backend API
- ✅ Session persists across page refreshes
- ✅ Thread list page loads without errors
- ✅ AI answers display on thread cards
- ✅ Instructor dashboard shows metrics
- ✅ Creating threads works (even if AI gen stays frontend-only)
- ✅ No 404 errors in network tab
- ✅ No TypeScript errors in console

**Not Required for Demo:**
- ❌ Real password authentication (dev-only auth is OK)
- ❌ Backend AI generation (frontend API routes work fine)
- ❌ Production security (hardcoded secrets OK)
- ❌ Postgres database (SQLite is fine)
- ❌ Redis sessions (cookies work for single server)
- ❌ Rate limiting
- ❌ Monitoring/alerting

---

## Known Limitations After Fixes

**These are acceptable for demo:**
1. Dev-only login (no password required)
2. Hardcoded session secret
3. SQLite database (single file)
4. Cookie-based sessions (no Redis)
5. No rate limiting
6. No monitoring
7. AI generation happens frontend-only
8. No RBAC enforcement (students can call instructor endpoints)
9. No row-level security (single tenant assumed)
10. API keys visible in browser (demo-only warning in .env.local.example)

**All of these will be addressed in Plan 2 (Production Roadmap)**

---

## Rollback Plan

**If fixes break something:**
1. Git stash changes: `git stash`
2. Restart backend: `npm run dev` (in backend/)
3. Frontend falls back to mocks automatically (feature flags)

**Emergency Mock Mode:**
```bash
# In .env.local
NEXT_PUBLIC_USE_BACKEND=false  # Disables all backend calls
```

---

## Next Steps After Demo Works

1. ✅ Demo backend integration working
2. Create Plan 2 for production hardening
3. Test all user flows end-to-end
4. Document any remaining issues
5. Begin production security work (Plan 2)

---

**Plan Owner:** Engineering Team
**Timeline:** 2-3 hours focused work
**Risk Level:** 🟢 Low (fixes are isolated, rollback easy)
**Dependencies:** None (all changes backend-only)
**Status:** Ready to implement
