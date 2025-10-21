# Risk Register - QuokkaQ Repository Audit
**Date:** 2025-10-21
**Project:** QuokkaQ Academic Q&A Platform
**Audit Scope:** Security, Type Safety, Contracts, Infrastructure, Performance, DX

---

## Risk Scoring Matrix

| Severity | Likelihood | Risk Score | Priority |
|----------|-----------|------------|----------|
| Critical | High | 9-10 | P0 (Immediate) |
| Critical | Medium | 7-8 | P0 (Immediate) |
| High | High | 7-8 | P1 (This Sprint) |
| High | Medium | 5-6 | P1 (This Sprint) |
| Medium | High | 5-6 | P2 (Next Sprint) |
| Medium | Medium | 3-4 | P2 (Next Sprint) |
| Low | Any | 1-2 | P3 (Backlog) |

---

## P0 Risks - Critical (Fix Immediately)

### R1: No Database Backups
- **Category:** Infrastructure
- **Owner:** DevOps/Backend Team
- **Severity:** Critical (10/10)
- **Likelihood:** Medium (5/10)
- **Risk Score:** 8/10
- **Impact:** Complete data loss if server fails; unrecoverable
- **Current Mitigation:** None (SQLite file on single server)
- **Recommended Mitigation:**
  - Enable RDS automated backups (7-day retention minimum)
  - Test backup restoration procedure weekly
  - Document RTO (2 hours) and RPO (1 hour)
- **Effort:** 2 hours
- **Due Date:** 2025-10-23 (2 days)
- **Status:** 🔴 Open

---

### R2: No Monitoring or Alerting
- **Category:** Infrastructure
- **Owner:** DevOps/SRE Team
- **Severity:** Critical (10/10)
- **Likelihood:** High (9/10)
- **Risk Score:** 10/10
- **Impact:** Blind to production outages; no incident response capability
- **Current Mitigation:** None (no metrics collection)
- **Recommended Mitigation:**
  - Set up CloudWatch metrics (request count, error rate, DB connections)
  - Create dashboards for SLO tracking (uptime >99.9%, p95 latency <500ms)
  - Configure PagerDuty alerts for critical thresholds
- **Effort:** 1-2 days (8-16 hours)
- **Due Date:** 2025-10-25 (4 days)
- **Status:** 🔴 Open

---

### R3: Hardcoded Session Secret Fallback
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Critical (10/10)
- **Likelihood:** High (8/10)
- **Risk Score:** 9/10
- **Impact:** Session forgery, account takeover, data breach
- **Current Mitigation:** Default secret "demo-secret-change-in-production"
- **Recommended Mitigation:**
  - Remove fallback in `backend/src/plugins/session.plugin.ts`
  - Enforce `SESSION_SECRET` env var (fail startup if missing)
  - Rotate secret immediately in all environments
- **Effort:** 30 minutes
- **Due Date:** 2025-10-22 (1 day)
- **Status:** 🔴 Open
- **Code Location:** `backend/src/plugins/session.plugin.ts:15`

---

### R4: No RBAC Enforcement
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Critical (10/10)
- **Likelihood:** High (9/10)
- **Risk Score:** 10/10
- **Impact:** Students can access instructor-only endpoints (metrics, endorsements, moderation)
- **Current Mitigation:** None (no role validation in route handlers)
- **Recommended Mitigation:**
  - Create RBAC middleware: `requireRole(['instructor', 'ta'])`
  - Apply to `/api/v1/instructor/*` routes
  - Add unit tests for unauthorized access (expect 403)
- **Effort:** 4 hours
- **Due Date:** 2025-10-23 (2 days)
- **Status:** 🔴 Open
- **Code Location:** `backend/src/routes/v1/instructor.routes.ts` (all endpoints)

---

### R5: No Row-Level Security (RLS)
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Critical (10/10)
- **Likelihood:** Medium (6/10) - Only if multi-tenant mode enabled
- **Risk Score:** 8/10
- **Impact:** Cross-tenant data leakage; Course A students see Course B data
- **Current Mitigation:** None (all queries ignore `tenantId` column)
- **Recommended Mitigation:**
  - Add `WHERE tenantId = user.tenantId` to all repository queries
  - Use Drizzle query builder with `.where(eq(table.tenantId, tenantId))`
  - Add integration tests for tenant isolation
- **Effort:** 1-2 days (8-16 hours)
- **Due Date:** 2025-10-25 (4 days)
- **Status:** 🔴 Open
- **Code Location:** All `backend/src/repositories/*.repository.ts` files

---

### R6: TypeScript Build Errors Block Deployment
- **Category:** Developer Experience
- **Owner:** Frontend Team
- **Severity:** Critical (9/10)
- **Likelihood:** Certain (10/10)
- **Risk Score:** 10/10
- **Impact:** Cannot deploy frontend to production (`npm run build` fails)
- **Current Mitigation:** None (build is broken)
- **Recommended Mitigation:**
  - Update Vercel AI SDK to latest version
  - Replace deprecated `maxSteps` → `maxRetries`
  - Replace deprecated `maxTokens` → `maxCompletionTokens`
  - Add `materialReferences` field to `AIAnswer` type
- **Effort:** 2 hours
- **Due Date:** 2025-10-22 (1 day)
- **Status:** 🔴 Open
- **Code Locations:**
  - `app/api/chat/route.ts:108`
  - `app/api/conversations/restructure/route.ts:158`
  - `lib/api/client/ai-answers.ts:80`

---

### R7: No Connection Pooling
- **Category:** Infrastructure
- **Owner:** Backend Team
- **Severity:** High (8/10)
- **Likelihood:** High (9/10) - Under production load
- **Risk Score:** 9/10
- **Impact:** Database connection exhaustion; server crashes under moderate traffic
- **Current Mitigation:** None (single SQLite connection, no Postgres pooling)
- **Recommended Mitigation:**
  - Implement pg-pool with max 20 connections
  - Add connection timeout (5 seconds)
  - Add retry logic for connection failures
- **Effort:** 4 hours
- **Due Date:** 2025-10-24 (3 days)
- **Status:** 🔴 Open
- **Code Location:** `backend/src/db/client.ts`

---

## P1 Risks - High Priority (Fix This Sprint)

### R8: PII in Validation Error Logs
- **Category:** Security + Infrastructure
- **Owner:** Backend Team
- **Severity:** High (8/10)
- **Likelihood:** High (8/10)
- **Risk Score:** 8/10
- **Impact:** GDPR violation; user data (email, password, content) exposed in logs
- **Current Mitigation:** Pino logging with JSON output (but no scrubbing)
- **Recommended Mitigation:**
  - Add PII scrubber middleware (redact email, password, apiKey fields)
  - Sanitize Zod validation error messages before logging
  - Add unit tests to verify scrubbing
- **Effort:** 3 hours
- **Due Date:** 2025-10-25 (4 days)
- **Status:** 🟡 Open
- **Code Location:** `backend/src/plugins/validation.plugin.ts`

---

### R9: Client-Side API Keys Exposed
- **Category:** Security
- **Owner:** Frontend Team
- **Severity:** High (8/10)
- **Likelihood:** High (9/10)
- **Risk Score:** 8/10
- **Impact:** LLM API key theft ($1000s cost overrun), quota exhaustion
- **Current Mitigation:** Documented as "demo-only" in `.env.local.example`
- **Recommended Mitigation:**
  - Move LLM calls to backend API route (`/api/v1/ai/chat`)
  - Proxy requests through backend (keys never reach browser)
  - Add per-user cost caps and rate limiting
- **Effort:** 4 hours
- **Due Date:** 2025-10-26 (5 days)
- **Status:** 🟡 Open
- **Code Location:** `app/api/chat/route.ts` (move to backend)

---

### R10: No Rate Limiting
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** High (8/10)
- **Likelihood:** High (7/10)
- **Risk Score:** 7/10
- **Impact:** Brute-force login attacks (5 attempts = account takeover), API abuse
- **Current Mitigation:** Feature flag disabled (`ENABLE_RATE_LIMITING=false`)
- **Recommended Mitigation:**
  - Enable `@fastify/rate-limit` plugin
  - Apply to `/auth/login` (5 attempts per 15 min)
  - Apply to all API routes (100 req/min per IP)
- **Effort:** 2 hours
- **Due Date:** 2025-10-26 (5 days)
- **Status:** 🟡 Open
- **Code Location:** `backend/src/server.ts:45` (feature flag)

---

### R11: Repository Pattern Type Leak (`any`)
- **Category:** Type Safety
- **Owner:** Backend Team
- **Severity:** High (7/10)
- **Likelihood:** Medium (6/10)
- **Risk Score:** 6/10
- **Impact:** Type-unsafe DB queries; passing wrong types (string where number expected)
- **Current Mitigation:** None (all `fieldEquals` calls accept `any`)
- **Recommended Mitigation:**
  - Fix `fieldEquals` signature to use `TTable[K]` instead of `any`
  - Add type tests to verify type inference
- **Effort:** 4 hours
- **Due Date:** 2025-10-27 (6 days)
- **Status:** 🟡 Open
- **Code Location:** `backend/src/repositories/base.repository.ts:78`

---

### R12: Route Handlers Bypass Zod Validation
- **Category:** Type Safety
- **Owner:** Backend Team
- **Severity:** High (7/10)
- **Likelihood:** Medium (5/10)
- **Risk Score:** 6/10
- **Impact:** API returns unexpected shapes, breaking frontend contracts
- **Current Mitigation:** None (27 instances of `as any` to silence errors)
- **Recommended Mitigation:**
  - Remove all `as any` assertions in route handlers
  - Use `.parse()` to validate response shapes
  - Align Drizzle types with Zod schemas
- **Effort:** 6 hours
- **Due Date:** 2025-10-28 (7 days)
- **Status:** 🟡 Open
- **Code Locations:** All `backend/src/routes/v1/*.routes.ts` files (27 instances)

---

### R13: Zero Test Coverage
- **Category:** Developer Experience
- **Owner:** Full-stack Team
- **Severity:** High (7/10)
- **Likelihood:** Medium (6/10)
- **Risk Score:** 6/10
- **Impact:** Regressions go undetected; risky refactoring; production bugs
- **Current Mitigation:** None (no test framework configured)
- **Recommended Mitigation:**
  - Install Vitest for unit tests
  - Install Playwright for e2e tests
  - Write tests for critical paths (>80% coverage goal)
  - Add pre-commit test hook
- **Effort:** 2-3 days (16-24 hours)
- **Due Date:** 2025-10-31 (10 days)
- **Status:** 🟡 Open

---

## P2 Risks - Medium Priority (Fix Next Sprint)

### R14: Thread Tags Serialization Mismatch
- **Category:** FE/BE Contracts
- **Owner:** Backend Team
- **Severity:** Medium (6/10)
- **Likelihood:** High (8/10)
- **Risk Score:** 7/10
- **Impact:** Tags won't display when backend enabled
- **Current Mitigation:** Frontend uses mock data (arrays work fine)
- **Recommended Mitigation:**
  - Update backend DTO to parse JSON string → array
  - Add `tags?: string[]` field to Thread DTO
  - Test with real backend
- **Effort:** 2 hours
- **Due Date:** 2025-10-29 (8 days)
- **Status:** 🟡 Open
- **Code Location:** `backend/src/routes/v1/threads.routes.ts`

---

### R15: Post Endorsement Field Missing
- **Category:** FE/BE Contracts
- **Owner:** Backend Team
- **Severity:** Medium (6/10)
- **Likelihood:** High (7/10)
- **Risk Score:** 6/10
- **Impact:** `if (post.endorsed)` logic breaks in frontend
- **Current Mitigation:** Frontend uses mock data (boolean works)
- **Recommended Mitigation:**
  - Add computed field `endorsed: endorsementCount > 0` to Post DTO
  - Update Zod schema
- **Effort:** 1 hour
- **Due Date:** 2025-10-29 (8 days)
- **Status:** 🟡 Open
- **Code Location:** `backend/src/routes/v1/posts.routes.ts`

---

### R16: 3 Routes Exceed 200KB Bundle Target
- **Category:** Performance
- **Owner:** Frontend Team
- **Severity:** Medium (6/10)
- **Likelihood:** Certain (10/10)
- **Risk Score:** 8/10
- **Impact:** Slow page loads; poor Lighthouse scores (<85); bad UX on mobile
- **Current Mitigation:** None (all routes load full bundles)
- **Recommended Mitigation:**
  - Phase 1: Replace date-fns, streamdown (~80KB saved)
  - Phase 2: Add 6 dynamic imports (~320KB saved)
  - Phase 3: Optimize barrel exports (~115KB saved)
- **Effort:** 16 hours (4 phases)
- **Due Date:** 2025-11-01 (11 days)
- **Status:** 🟡 Open
- **Routes Affected:** `/instructor`, `/courses`, `/quokka`

---

### R17: No Staging Environment
- **Category:** Infrastructure
- **Owner:** DevOps Team
- **Severity:** Medium (6/10)
- **Likelihood:** High (8/10)
- **Risk Score:** 7/10
- **Impact:** Changes go straight to production; no safe testing environment
- **Current Mitigation:** None (frontend-only Netlify, backend not deployed)
- **Recommended Mitigation:**
  - Deploy backend to Fargate with staging environment
  - Set up staging database (separate RDS instance)
  - Configure CI/CD pipeline (dev → staging → prod)
- **Effort:** 1-2 days (8-16 hours)
- **Due Date:** 2025-11-04 (14 days)
- **Status:** 🟡 Open

---

### R18: No S3 File Upload Support
- **Category:** Infrastructure
- **Owner:** Backend Team
- **Severity:** Medium (5/10)
- **Likelihood:** Medium (6/10)
- **Risk Score:** 5/10
- **Impact:** File uploads blocked (avatars, course attachments, documents)
- **Current Mitigation:** None (feature not implemented)
- **Recommended Mitigation:**
  - Implement presigned URL generation for uploads
  - Add file type validation (MIME type, extension)
  - Add virus scanning (ClamAV or AWS S3 antivirus)
  - Set S3 bucket to private (block public access)
- **Effort:** 8 hours
- **Due Date:** 2025-11-05 (15 days)
- **Status:** 🟡 Open

---

### R19: Backend ESLint Broken
- **Category:** Developer Experience
- **Owner:** Backend Team
- **Severity:** Medium (5/10)
- **Likelihood:** Certain (10/10)
- **Risk Score:** 7/10
- **Impact:** Can't run `npm run lint` in backend; violations accumulate
- **Current Mitigation:** None (config conflict with Next.js preset)
- **Recommended Mitigation:**
  - Remove `extends: ['next/core-web-vitals']` from backend ESLint
  - Add backend-specific ESLint config
  - Add `.eslintignore` for `dist/` folder
- **Effort:** 1 hour
- **Due Date:** 2025-10-28 (7 days)
- **Status:** 🟡 Open
- **Code Location:** `backend/.eslintrc.json`

---

### R20: 423 ESLint Violations
- **Category:** Developer Experience
- **Owner:** Full-stack Team
- **Severity:** Medium (4/10)
- **Likelihood:** Certain (10/10)
- **Risk Score:** 7/10
- **Impact:** Code quality debt; harder to maintain over time
- **Current Mitigation:** None (violations ignored)
- **Recommended Mitigation:**
  - Auto-fix unused imports (350 violations)
  - Fix `any` types in compiled output (exclude dist/ from linting)
  - Add pre-commit hook to prevent new violations
- **Effort:** 4 hours
- **Due Date:** 2025-11-01 (11 days)
- **Status:** 🟡 Open

---

## P3 Risks - Low Priority (Backlog)

### R21: No CSRF Protection
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Medium (5/10)
- **Likelihood:** Low (3/10)
- **Risk Score:** 4/10
- **Impact:** CSRF attacks on state-changing operations
- **Current Mitigation:** Partial (`sameSite=lax` cookies)
- **Recommended Mitigation:**
  - Add CSRF tokens to all POST/DELETE/PUT requests
  - Use `@fastify/csrf-protection` plugin
- **Effort:** 3 hours
- **Due Date:** Backlog
- **Status:** 🟢 Deferred

---

### R22: No Audit Logging
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Medium (5/10)
- **Likelihood:** Low (4/10)
- **Risk Score:** 4/10
- **Impact:** Can't track user actions; no forensic trail for investigations
- **Current Mitigation:** None
- **Recommended Mitigation:**
  - Log all authentication events (login, logout)
  - Log all data modifications (create, update, delete)
  - Send audit logs to CloudWatch Logs Insights
- **Effort:** 4 hours
- **Due Date:** Backlog
- **Status:** 🟢 Deferred

---

### R23: Missing GDPR Features
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Medium (5/10)
- **Likelihood:** Low (2/10) - Only if serving EU users
- **Risk Score:** 3/10
- **Impact:** GDPR non-compliance (right to deletion, data export)
- **Current Mitigation:** None
- **Recommended Mitigation:**
  - Implement user data export endpoint
  - Implement user account deletion endpoint (cascade delete)
  - Add privacy policy and cookie consent banner
- **Effort:** 1-2 days (8-16 hours)
- **Due Date:** Backlog
- **Status:** 🟢 Deferred

---

### R24: Dependency Vulnerabilities (4 moderate CVEs)
- **Category:** Security
- **Owner:** Backend Team
- **Severity:** Medium (4/10)
- **Likelihood:** Medium (5/10)
- **Risk Score:** 4/10
- **Impact:** SSRF vulnerability in esbuild ≤0.24.2 (via drizzle-kit)
- **Current Mitigation:** None
- **Recommended Mitigation:**
  - Update drizzle-kit to v0.31.5 (includes esbuild fix)
  - Run `pnpm audit fix` to auto-update dependencies
  - Enable Dependabot alerts in GitHub
- **Effort:** 1 hour
- **Due Date:** Backlog
- **Status:** 🟢 Deferred

---

### R25: No Shared Type Library
- **Category:** FE/BE Contracts
- **Owner:** Full-stack Team
- **Severity:** Low (3/10)
- **Likelihood:** Medium (6/10)
- **Risk Score:** 4/10
- **Impact:** Type duplication; manual sync required; contract drift over time
- **Current Mitigation:** None (frontend and backend have separate types)
- **Recommended Mitigation:**
  - Create shared types package (`packages/types`)
  - Export Zod schemas from backend
  - Generate TypeScript types from Zod schemas (zod-to-ts)
- **Effort:** 1 day (8 hours)
- **Due Date:** Backlog
- **Status:** 🟢 Deferred

---

## Risk Summary Dashboard

| Priority | Count | Total Effort | Status |
|----------|-------|--------------|--------|
| P0 (Critical) | 7 | 4 days | 🔴 7 open |
| P1 (High) | 6 | 3.5 days | 🟡 6 open |
| P2 (Medium) | 7 | 4 days | 🟡 7 open |
| P3 (Low) | 5 | 3 days | 🟢 5 deferred |
| **Total** | **25** | **14.5 days** | **20 active** |

---

## Next Review Date
**2025-11-04** (after Week 2 fixes)

---

**Document Owner:** Engineering Leadership
**Last Updated:** 2025-10-21
**Version:** 1.0
