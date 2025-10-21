# QuokkaQ Repository Complete Architecture Map

**Date:** 2025-10-21  
**Scope:** Frontend + Backend (monorepo) + Mocks + Infrastructure  
**Key Stats:**
- 11,092 TypeScript/TSX files
- 57 lib files (API layer, utilities, LLM integration)
- 122 component files
- 2 workspaces: root (Next.js frontend) + backend/ (Fastify)
- 18 database tables (Drizzle ORM)
- 35 API endpoints (backend v1 routes)
- Feature-flagged backend integration

---

## 1. WORKSPACE STRUCTURE & DIRECTORY TREE

### Root Directory Layout
```
quokka-demo/
├── app/                          # Next.js 15 App Router (232 KB)
│   ├── layout.tsx, globals.css, error.tsx
│   ├── (auth)/, page.tsx, dashboard/, instructor/
│   ├── threads/[id]/, courses/[courseId]/
│   ├── settings/, profile/, points/
│   └── api/ (Next.js routes)
│
├── backend/                      # Fastify backend (166 MB)
│   ├── src/
│   │   ├── server.ts             # Entry point
│   │   ├── db/ (schema, client, seed)
│   │   ├── repositories/ (9 repos)
│   │   ├── routes/v1/ (10 route files)
│   │   ├── schemas/ (Zod validation)
│   │   ├── plugins/ (session, validation, error)
│   │   └── utils/
│   ├── drizzle/ (migrations)
│   └── dev.db (SQLite)
│
├── components/                   # React components (892 KB)
│   ├── ai/, ai-elements/, auth/, course/
│   ├── dashboard/, instructor/, layout/, navbar/
│   └── ui/ (35+ shadcn/ui primitives)
│
├── lib/                          # Utilities (572 KB)
│   ├── api/client/ (9 modules, 4328 lines)
│   ├── llm/ (AI SDK integration)
│   ├── config/ (feature flags)
│   ├── models/ (TypeScript types)
│   └── utils.ts
│
├── mocks/                        # Mock data (544 KB, 12 files)
├── public/                       # Static assets (60 KB)
├── doccloud/                     # Agentic workflow (8.1 MB)
├── docs/audits/2025-10-21/       # This audit session
│
└── Configuration files
    ├── package.json, tsconfig.json, next.config.ts
    ├── .env.local, .env.local.example
    └── eslint.config.mjs, components.json
```

---

## 2. PACKAGE DEPENDENCY GRAPH

### Frontend Root Dependencies

**Production (22 key packages):**
- **Framework:** next@15.5.4, react@19.1.0, react-dom@19.1.0
- **UI:** @radix-ui/* (11), lucide-react, cmdk, embla-carousel-react
- **Styling:** tailwindcss@4, class-variance-authority, clsx, tailwind-merge
- **State:** @tanstack/react-query@5.62.14, @ai-sdk/react@2.0.76
- **LLM:** ai@5.0.76, @ai-sdk/openai@2.0.52, @ai-sdk/anthropic@2.0.33
- **Validation:** zod@4.1.12
- **Utilities:** date-fns, motion, sonner, nanoid, chalk

**Dev (msw@2.7.0 for mocking)**

### Backend Root Dependencies

**Production (10 key packages):**
- **Framework:** fastify@4.28.1, @fastify/* (6 plugins)
- **Database:** drizzle-orm@0.33.0, better-sqlite3@11.3.0, postgres@3.4.4
- **Validation:** zod@3.23.8
- **Logging:** pino@9.4.0, pino-pretty@11.2.2
- **Cache:** ioredis@5.4.1 (optional)
- **Config:** dotenv@16.4.5

**⚠️ Risk:** Zod version mismatch (frontend 4.x, backend 3.x)

---

## 3. SERVICE ARCHITECTURE

### Service Topology

```
Client (Browser)
    ↓ HTTP (feature-flagged)
[Mock API or HTTP Client]
    ↓
[Backend Routes]
    ↓
[Repositories] → [Drizzle ORM] → [Database]
    ↓
[LLM Provider] (optional)
```

**Key Boundaries:**
- **Frontend:** React components, React Query cache, Vercel AI SDK
- **API Layer:** Feature-flagged mock vs HTTP adapter
- **Backend:** HTTP routing, validation, data access, session mgmt
- **Database:** SQLite (dev) / Postgres (prod)
- **LLM:** OpenAI / Anthropic / Google (optional streaming)

---

## 4. BACKEND ROUTE INVENTORY (35 endpoints)

| Category | Method | Path | Auth | Status |
|----------|--------|------|------|--------|
| **Health** | GET | `/health, /ready, /ping` | No | ✅ |
| **Auth** | POST/GET | `/auth/login, /logout, /me` | Yes (2/3) | ✅ |
| **Threads** | GET/POST/DELETE | `/threads, /threads/:id, /threads/:id/upvote` | Optional | ✅ |
| **Posts** | GET/POST/DELETE | `/posts, /threads/:id/posts` | Optional | ✅ |
| **Courses** | GET/POST | `/courses, /courses/:id, /courses/:id/enroll` | Optional | ✅ |
| **Materials** | GET | `/materials, /courses/:id/materials` | Optional | ✅ |
| **AI Answers** | GET/POST | `/ai-answers, /ai-answers/:id, /ai-answers/:id/endorse` | Optional | ✅ |
| **Conversations** | GET/POST/DELETE | `/conversations, /conversations/:id/messages` | Yes | ✅ |
| **Instructor** | GET/POST | `/instructor/metrics, /unanswered, /threads/:id/resolve` | Yes (prof/ta) | ✅ |
| **Notifications** | GET/POST | `/notifications, /notifications/:id/read` | Yes | ✅ |

---

## 5. ENVIRONMENT VARIABLES

### Frontend (.env.local) - 18 variables

| Variable | Purpose | Type | Default | Secret? |
|----------|---------|------|---------|---------|
| NEXT_PUBLIC_USE_BACKEND | Mock vs HTTP backend | boolean | false | No |
| NEXT_PUBLIC_API_URL | Backend base URL | string | http://localhost:3001 | No |
| NEXT_PUBLIC_USE_LLM | Enable LLM | boolean | false | No |
| NEXT_PUBLIC_LLM_PROVIDER | openai/anthropic/google | string | openai | No |
| NEXT_PUBLIC_OPENAI_API_KEY | OpenAI credential | string | - | **YES** |
| NEXT_PUBLIC_ANTHROPIC_API_KEY | Anthropic credential | string | - | **YES** |
| NEXT_PUBLIC_MAX_TOKENS | LLM output length | number | 2000 | No |
| NEXT_PUBLIC_LLM_TEMPERATURE | Creativity (0-1) | float | 0.7 | No |
| NEXT_PUBLIC_LLM_TOP_P | Nucleus sampling | float | 0.9 | No |
| NEXT_PUBLIC_MAX_DAILY_COST | Budget alert (USD) | float | 10.00 | No |
| NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE | Rate limit | number | 20 | No |
| NEXT_PUBLIC_MAX_CONTEXT_MATERIALS | Materials in context | number | 10 | No |
| NEXT_PUBLIC_MIN_RELEVANCE_SCORE | Citation threshold | number | 30 | No |
| NEXT_PUBLIC_AUTO_DETECT_THRESHOLD | Course detection confidence | number | 70 | No |
| NEXT_PUBLIC_DEBUG_LLM | Debug logging | boolean | false | No |
| NEXT_PUBLIC_SHOW_COST_TRACKING | Display cost UI | boolean | false | No |

**⚠️ Risk:** API keys exposed in browser (marked demo-only)

### Backend (.env.local) - 10 variables

| Variable | Purpose | Type | Default | Secret? |
|----------|---------|------|---------|---------|
| NODE_ENV | deployment env | development/production | development | No |
| PORT | HTTP port | number | 3001 | No |
| HOST | Bind address | string | 0.0.0.0 | No |
| LOG_LEVEL | Pino log level | trace/debug/info/warn/error | info | No |
| DATABASE_TYPE | sqlite/postgres | string | sqlite | No |
| DATABASE_URL | DB connection | string | ./dev.db | **YES** |
| SESSION_SECRET | Cookie signing key | string (32+ chars) | - | **YES** |
| CORS_ORIGIN | Allowed CORS origin | string | http://localhost:3000 | No |
| REDIS_URL | Redis connection (optional) | string | - | **YES** |
| ENABLE_SWAGGER | OpenAPI docs | boolean | true | No |

---

## 6. DATABASE SCHEMA (18 tables, Drizzle ORM)

### Table List with Relationships

```
users (1) ─── (N) threads, posts, aiConversations, enrollments, authSessions
  │
courses (1) ─── (N) threads, enrollments, materials, assignments
  │
threads (1) ─── (N) posts, aiAnswers
  ├─ (1) posts
  ├─ (1) aiAnswers
  ├─ (1) threadEndorsements
  └─ (1) threadUpvotes
  
posts (1) ─── (N) postEndorsements
  │
aiAnswers (1) ─── (N) aiAnswerCitations, aiAnswerEndorsements
  │
aiConversations (1) ─── (N) aiMessages
  │
courseMaterials (1) ─── (N) assignments
```

### Core Tables (18 total)

1. **users** - 8 columns: id, name, email, password, role, avatar, tenantId, createdAt
2. **courses** - 8 columns: id, code, name, term, description, status, enrollmentCount, tenantId, createdAt
3. **authSessions** - 6 columns: id, userId, token, expiresAt, createdAt, userAgent
4. **enrollments** - 6 columns: id, userId, courseId, role, createdAt, updatedAt
5. **threads** - 12 columns: id, courseId, authorId, title, content, status, upvoteCount, isResolved, isPinned, pinnedAt, createdAt, updatedAt
6. **posts** - 7 columns: id, threadId, authorId, content, upvoteCount, createdAt, updatedAt
7. **aiAnswers** - 10 columns: id, threadId, courseId, content, model, confidence, endorsementCount, createdAt, updatedAt
8. **aiAnswerCitations** - 4 columns: id, answerId, materialId, relevanceScore
9. **courseMaterials** - 9 columns: id, courseId, title, type, content, url, uploadedAt, relevanceScore, createdAt
10. **assignments** - 9 columns: id, courseId, title, description, dueDate, createdAt, updatedAt
11. **threadEndorsements** - 5 columns: id, threadId, userId, role, createdAt
12. **threadUpvotes** - 5 columns: id, threadId, userId, createdAt
13. **postEndorsements** - 5 columns: id, postId, userId, role, createdAt
14. **aiAnswerEndorsements** - 5 columns: id, answerId, userId, role, createdAt
15. **aiConversations** - 6 columns: id, userId, courseId (nullable), title, createdAt, updatedAt
16. **aiMessages** - 7 columns: id, conversationId, role, content, tokensUsed (nullable), createdAt
17. **notifications** - 8 columns: id, userId, type, content, isRead, createdAt, updatedAt
18. **responseTemplates** - 6 columns: id, userId, title, content, category, createdAt

### Indexes (Performance)

- **users:** email (unique), tenantId, role
- **courses:** code, status, tenantId
- **threads:** courseId, authorId, status, createdAt
- **posts:** threadId, authorId, createdAt
- **aiAnswers:** threadId
- **aiConversations:** userId
- **aiMessages:** conversationId

---

## 7. THIRD-PARTY INTEGRATIONS

### LLM Providers (Vercel AI SDK)

| Provider | Endpoint | Models | Auth | Status |
|----------|----------|--------|------|--------|
| **OpenAI** | api.openai.com | gpt-4, gpt-4o, gpt-4o-mini | API key | Configured |
| **Anthropic** | api.anthropic.com | claude-3-opus, haiku | API key | Configured |
| **Google** | generativelanguage.googleapis.com | gemini-pro | API key | Installed |

**Current:** `NEXT_PUBLIC_USE_LLM=false` (template fallback)

### External Services (Not Yet Implemented)

- **Redis:** ioredis package installed (for session cache, rate limiting)
- **S3/GCS:** Not installed (for file uploads)
- **PostgreSQL RDS:** Installed (prod DB)
- **Auth0/Firebase:** Not installed
- **Sentry/DataDog:** Not installed (error monitoring)

---

## 8. API CLIENT MODULES (lib/api/client/)

### 9 Modules: 4,328 lines total

1. **index.ts** - Barrel export with feature-flag routing
2. **http.client.ts** - Fetch wrapper (GET, POST, DELETE)
3. **auth.ts** - Login, logout, getCurrentUser
4. **threads.ts** - CRUD + filtering (21.5 KB)
5. **posts.ts** - Create reply (2.3 KB)
6. **courses.ts** - List courses, enroll (7 KB)
7. **materials.ts** - List course materials (6 KB)
8. **ai-answers.ts** - Ask question, endorse (11.9 KB)
9. **conversations.ts** - LLM conversations (17.5 KB)
10. **instructor.ts** - Metrics + moderation (45 KB)
11. **notifications.ts** - List, mark read (4.3 KB)

**Feature Flag:** All modules use `USE_BACKEND` to route to mock or HTTP

---

## 9. REACT QUERY HOOKS (lib/api/hooks.ts)

**13+ hooks:**
- useThreads(), useThread()
- useCreatePost(), useEndorsePost(), useFlagPost()
- useResolveThread(), useAskQuestion()
- useSimilarThreads() (debounced search)
- useInstructorMetrics(), useUnansweredThreads()
- useCurrentUser()
- useEndorseThread(), useUpvoteThread(), useRemoveUpvote()
- useCheckDuplicates(), useMergeThreads()

**Stable interface:** Used by all components, abstracted from mock/HTTP

---

## 10. MOCK DATA FILES (mocks/, 544 KB)

1. **users.json** - 5 users (student, TA, instructor)
2. **courses.json** - 3 courses (CS101, DS201, AI301)
3. **enrollments.json** - User-course mappings
4. **threads.json** - 100+ discussion threads (29 KB)
5. **posts.json** - 200+ thread replies (69 KB)
6. **ai-answers.json** - AI responses with citations (75 KB)
7. **ai-conversations.json** - Conversation metadata
8. **ai-messages.json** - Message history (41 KB)
9. **course-materials.json** - Lecture notes, slides (60 KB)
10. **assignments.json** - Assignment metadata
11. **notifications.json** - User alerts (10 KB)
12. **response-templates.json** - Template fallbacks (6.9 KB)

**Artifacts:** threads-with-metrics, posts-with-endorsements, ai-answers-with-endorsements

---

## 11. COMPONENT STRUCTURE (122 components)

### By Feature

- **AI Components (10+):** quokka-assistant-modal, sources-panel, response components
- **Course Components (30+):** course listings, material viewers, enrollment UI
- **Dashboard (13+):** metrics widgets, charts, analytics
- **Instructor Tools (11+):** moderation queue, analytics, student management
- **Layout (11+):** header, footer, sidebar, navigation
- **UI Primitives (35+):** Button, Input, Dialog, Select, Tabs, etc. (shadcn/ui wrapped)
- **Navigation (3+):** Menu, breadcrumb, sidebar navigation
- **Points/Gamification (1+):** Points display

---

## 12. FEATURE FLAGS & CONDITIONAL LOGIC

### Main Toggles (lib/config/features.ts)

```
NEXT_PUBLIC_USE_BACKEND         false → mock data, true → HTTP
NEXT_PUBLIC_USE_LLM             false → template, true → real LLM
NEXT_PUBLIC_LLM_PROVIDER        openai / anthropic / google
NEXT_PUBLIC_DEBUG_LLM           Console logging
NEXT_PUBLIC_SHOW_COST_TRACKING  Display LLM cost UI
ENABLE_SWAGGER                  OpenAPI docs (backend)
ENABLE_RATE_LIMITING            Rate limiter (backend)
ENABLE_IDEMPOTENCY              Request deduplication (backend)
```

---

## 13. KEY STATISTICS

| Metric | Count |
|--------|-------|
| TypeScript files (total) | 11,092 |
| Source files (excl. node_modules) | ~2,500 |
| Lib modules | 57 |
| Components | 122 |
| Database tables | 18 |
| API endpoints | 35 |
| API client modules | 11 |
| React Query hooks | 13+ |
| Mock data files | 12 |
| Environment variables | 28 |
| Frontend dependencies | 50+ |
| Backend dependencies | 10+ |
| Lines in api/client/ | 4,328 |
| Lines in instructor.ts | 45,000+ |
| Lines in conversations.ts | 17,557 |

---

## 14. RISKS & OBSERVATIONS

### Dependency Risks

| Risk | Severity | Details | Fix |
|------|----------|---------|-----|
| Zod version mismatch | Medium | Frontend 4.x, Backend 3.x | Update backend Zod to 4.x |
| API keys in browser | High | OPENAI_API_KEY in .env.local | Move to server-side (production) |
| No error monitoring | Medium | No Sentry/DataDog | Add error tracking service |
| Limited test coverage | Medium | No visible unit/e2e tests | Add Jest + Playwright |
| No API documentation | Low | @fastify/swagger installed but not used | Enable Swagger UI |
| Extraneous WASM packages | Low | @emnapi/*, @napi-rs/* not in package.json | Clean node_modules |

### Architectural Strengths

✅ Clean service separation (frontend/backend)
✅ Feature-flagged integration (easy mock/backend switching)
✅ Type-safe validation (Zod across stack)
✅ Repository pattern (testable data access)
✅ Modern tech stack (Next.js 15, React 19, Drizzle ORM)
✅ Accessible UI (Radix UI + shadcn/ui)
✅ Cursor pagination (scalable data fetching)
✅ Session cookies (secure auth)

### Gaps & Improvements

⚠️ No shared types package (frontend + backend duplicate)
⚠️ No database migration versioning
⚠️ No request/response logging
⚠️ No cache headers (HTTP caching)
⚠️ No gzip compression config
⚠️ No CSRF protection visible
⚠️ No rate limiting (feature flag disabled)
⚠️ No idempotency keys (feature flag disabled)

---

## SUMMARY

**QuokkaQ** is a well-structured, full-stack academic Q&A platform with:

**Architecture:** Next.js 15 frontend + Fastify backend + Drizzle ORM + Vercel AI SDK
**Database:** 18 tables (SQLite dev, Postgres prod)
**API:** 35 REST endpoints with Zod validation
**Features:** Mock data integration, LLM streaming, cursor pagination, session auth
**Ready for audit:** All major components mapped and documented

**Next Steps:** 
1. Sync Zod versions (frontend/backend)
2. Move API keys to server-side (production)
3. Add error monitoring (Sentry)
4. Add unit/e2e tests (Jest, Playwright)
5. Enable API documentation (Swagger UI)

