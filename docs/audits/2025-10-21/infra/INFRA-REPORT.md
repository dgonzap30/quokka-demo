# Infrastructure & Observability Audit Report

**Date:** 2025-10-21
**Auditor:** Infrastructure Analysis Agent
**Scope:** Database, logging, monitoring, storage, environment parity, cost, disaster recovery

---

## Executive Summary

**Overall Infrastructure Readiness: 🟡 YELLOW (Demo-Ready, Production-Needs Work)**

The QuokkaQ infrastructure is well-architected for a demo/MVP environment but requires significant hardening for production deployment. Key strengths include clean database schema design, structured error handling, and repository pattern. Critical gaps exist in observability, backup procedures, connection pooling, PII handling, and multi-environment configuration management.

### Quick Stats
- **Database**: SQLite (dev), schema ready for Postgres (prod) ✅
- **Logging**: Pino with pretty-print (dev only) 🟡
- **Health Checks**: Basic liveness/readiness ✅
- **Monitoring**: ❌ None (no metrics, dashboards, alerts)
- **Backups**: ❌ None
- **Connection Pooling**: ❌ None
- **Storage/S3**: ❌ Not implemented
- **Cost Monitoring**: ❌ None
- **DR Plan**: ❌ None

---

## 1. Database Health Assessment

### 1.1 Schema Quality ✅ **STRONG**

**Findings:**
- **18 tables** with proper normalization and foreign key relationships
- **UUID primary keys** with crypto.randomUUID() (SQLite-compatible, Postgres-ready)
- **Comprehensive indexes** on common query patterns (31 indexes total)
  - `users`: email (unique), tenantId, role
  - `threads`: courseId, authorId, status, hasAIAnswer, createdAt, duplicatesOf
  - `posts`: threadId, authorId, instructorAnswer, createdAt
  - `aiAnswers`: threadId (unique), courseId, confidence
  - Junction tables: All have composite unique indexes (e.g., thread_user)
- **Tenant isolation** ready (tenantId in all tables for future multi-tenancy)
- **Soft delete support** (authorId nullable with SET NULL on user deletion)
- **Denormalized counters** for performance (replyCount, viewCount, endorsementCount, upvoteCount)

**Schema Highlights:**
```typescript
// Foreign key with CASCADE/SET NULL rules
threads.authorId -> users.id (SET NULL on delete)
threads.courseId -> courses.id (CASCADE on delete)
threads.aiAnswerId -> aiAnswers.id (SET NULL on delete)

// Performance indexes
idx_threads_course_status (courseId, status) // Common dashboard query
idx_threads_created_at // Cursor pagination
idx_posts_thread_instructor // Instructor answer filtering
idx_ai_answers_confidence // AI quality metrics
```

**Strengths:**
- ✅ Relations properly defined with Drizzle ORM
- ✅ Indexes support cursor pagination (createdAt, id)
- ✅ JSON columns for flexible data (tags, metadata, materialReferences)
- ✅ Boolean columns use integer mode for SQLite compatibility

**Weaknesses:**
- ⚠️ **No composite indexes** for common multi-column queries (e.g., courseId + status + createdAt)
- ⚠️ **Denormalized counters** require careful transaction management to avoid drift
- ⚠️ **No database-level constraints** on enum values (status, role, type) - rely on application layer
- ⚠️ **Password field** stored as plaintext in schema comment (migration shows intent to hash, but seed script doesn't)

### 1.2 Migration Strategy ✅ **ADEQUATE**

**Current State:**
- **Single migration file**: `0000_stiff_firedrake.sql` (9,869 bytes)
- **Drizzle Kit** for schema generation
- **Migration runner**: `backend/src/db/migrate.ts` with error handling

**Process:**
```bash
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed with mock data
```

**Strengths:**
- ✅ Type-safe schema with Drizzle ORM
- ✅ Foreign keys enabled: `sqlite.pragma("foreign_keys = ON")`
- ✅ WAL mode enabled: `sqlite.pragma("journal_mode = WAL")` (better concurrency)
- ✅ Migration folder tracked in Git

**Weaknesses:**
- ❌ **No rollback mechanism** - migrations are one-way
- ❌ **No migration versioning** in database (Drizzle doesn't track applied migrations in SQLite)
- ❌ **No staging environment** testing before production
- ⚠️ **Seed script destructive** - deletes all data before re-seeding (not safe for production)

### 1.3 Connection Management 🔴 **CRITICAL GAP**

**Current Implementation:**
```typescript
// backend/src/db/client.ts
const sqlite = new Database(DATABASE_URL);
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite, { schema });
```

**Issues:**
- ❌ **Single connection** shared across all requests (SQLite limitation acceptable for demo)
- ❌ **No connection pooling** for Postgres (production will need pg-pool)
- ❌ **No connection retry logic** on failure
- ❌ **No connection timeout** configuration
- ❌ **No graceful shutdown** handling (server closes DB, but no connection drain)

**Postgres Migration Concerns:**
- Schema uses `text` for UUIDs (SQLite-compatible), needs `uuid` type in Postgres
- No `DATABASE_TYPE` switching logic in client.ts
- Missing `postgres` driver configuration (package.json has `postgres` dependency but unused)

**Recommendations:**
```typescript
// Production-ready connection pooling (Postgres)
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 1.4 Query Performance ⚠️ **NEEDS ATTENTION**

**Repository Pattern Analysis** (via `threads.repository.ts`):

**Strengths:**
- ✅ Cursor pagination (keyset-based, avoids OFFSET)
- ✅ N+1 query awareness (fetches related data in batches)

**Issues:**
- ⚠️ **N+1 queries in findByCourse()** - loops over threads to fetch author/counts separately
  ```typescript
  // Current: 1 query for threads + N queries for authors + N for counts
  const threadResults = await db.select().from(threads)...;
  await Promise.all(threadItems.map(async (thread) => {
    const author = await db.select().from(users)...; // N queries
    const upvoteCount = await db.select().from(threadUpvotes)...; // N queries
  }));
  ```
  **Impact**: 50 threads = 1 + 50 + 50 + 50 = **151 queries** per page load

- ⚠️ **Missing JOIN optimization** - could use single query with LEFT JOINs
- ⚠️ **No query result caching** (e.g., Redis for hot threads)
- ⚠️ **View count increment** uses separate UPDATE query per view

**Optimization Opportunities:**
- Use Drizzle's relation query API for automatic JOINs
- Implement Redis caching for read-heavy endpoints (threads list, course details)
- Batch view count updates (e.g., queue and flush every 30 seconds)

### 1.5 Backup & Recovery 🔴 **CRITICAL GAP**

**Current State:**
- ❌ **No automated backups** (SQLite dev.db is 651KB, not backed up)
- ❌ **No point-in-time recovery** (SQLite has no built-in PITR)
- ❌ **No backup verification** (restore testing)
- ❌ **No retention policy** documented

**Production Requirements:**
- Postgres with AWS RDS:
  - Automated daily snapshots (7-day retention minimum)
  - Point-in-time recovery (PITR) enabled (1-35 days)
  - Cross-region replication for DR
  - Backup restore testing (monthly drill)

**Immediate Actions:**
1. Add SQLite backup script for dev environment:
   ```bash
   # .backup command with WAL checkpoint
   sqlite3 dev.db ".backup dev-backup-$(date +%Y%m%d).db"
   ```
2. Document RDS backup configuration in deployment guide
3. Create backup restore runbook

---

## 2. Logging Audit

### 2.1 Logging Framework ✅ **ADEQUATE**

**Current Setup** (Fastify with Pino):
```typescript
// backend/src/server.ts
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  },
});
```

**Strengths:**
- ✅ **Structured logging** with Pino (JSON output in production)
- ✅ **Log levels** configurable via env var (info, warn, error, debug)
- ✅ **Pretty-print** in development (pino-pretty)
- ✅ **Request logging** automatic (Fastify built-in)
- ✅ **Error context** includes requestId, statusCode, validation details

**Log Output Examples:**
```json
// Error log (production format)
{
  "level": 40,
  "time": 1697890234567,
  "pid": 12345,
  "hostname": "backend-prod-001",
  "requestId": "req-abc-123",
  "statusCode": 404,
  "err": {
    "type": "NotFoundError",
    "message": "Thread not found",
    "stack": "..."
  },
  "msg": "API Error: Thread not found"
}
```

### 2.2 PII & Sensitive Data 🟡 **MODERATE RISK**

**Current Logging Practices:**
```typescript
// error.plugin.ts - logs error details
request.log.warn({
  err: error,
  requestId,
  statusCode: error.statusCode,
}, `API Error: ${error.message}`);

// session.plugin.ts - logs session issues
request.log.warn("Invalid session cookie, ignoring");
```

**Potential PII Leaks:**
- ⚠️ **Validation errors** may log user input (names, emails) via `error.details`
- ⚠️ **Session cookies** logged on parse failure (contains user ID, email)
- ⚠️ **Database errors** may expose query parameters (e.g., search terms)
- ⚠️ **AI conversation content** not explicitly scrubbed from logs

**Recommendations:**
1. Implement PII scrubber middleware:
   ```typescript
   const piiFields = ['email', 'password', 'content', 'name'];
   const scrubbed = { ...data };
   piiFields.forEach(field => {
     if (scrubbed[field]) scrubbed[field] = '[REDACTED]';
   });
   ```
2. Add explicit `doNotLog: true` flag to sensitive routes (e.g., `/auth/login`)
3. Use `pino-pretty`'s `ignore` option to exclude sensitive fields in dev

### 2.3 Correlation IDs ⚠️ **INCOMPLETE**

**Current State:**
```typescript
// error.plugin.ts
const requestId = request.id || crypto.randomUUID();
```

**Issues:**
- ⚠️ Request IDs generated only on error, not on every request
- ⚠️ No propagation to downstream services (when calling external APIs)
- ⚠️ No user ID / session ID correlation in logs
- ⚠️ No trace context (e.g., OpenTelemetry spans)

**Ideal Implementation:**
```typescript
// Add correlation plugin
fastify.decorateRequest('correlationId', null);
fastify.addHook('onRequest', async (request) => {
  request.correlationId = request.headers['x-correlation-id'] || nanoid();
  request.log = request.log.child({ correlationId: request.correlationId });
});
```

### 2.4 Log Retention & Storage ❌ **NOT CONFIGURED**

**Current State:**
- Logs written to stdout (container environment assumed)
- No log aggregation service configured (CloudWatch, Datadog, Logtail)
- No retention policy (ephemeral container logs = lost on restart)

**Production Requirements:**
- **Aggregation**: Ship logs to CloudWatch Logs, Datadog, or Logtail
- **Retention**: 30 days minimum for audit/compliance, 90 days for security events
- **Indexing**: Make logs searchable by requestId, userId, endpoint, statusCode
- **Alerting**: Trigger alerts on error rate spikes (>1% 5xx errors)

**Cost Estimate** (AWS CloudWatch Logs):
- 10 GB/month ingestion: $5.00/month
- 30-day retention: $3.00/month
- Total: ~$8/month for basic logging

---

## 3. Observability Gaps

### 3.1 Health Checks ✅ **BASIC COVERAGE**

**Current Endpoints:**

| Endpoint | Purpose | Response | Issues |
|----------|---------|----------|--------|
| `GET /health` | Liveness probe | `{ status: "ok" }` | ✅ Works |
| `GET /api/v1/_status` | Readiness probe | `{ status: "healthy", database: "up" }` | ⚠️ Simplified (no real DB check) |
| `GET /api/v1/health` | Duplicate health | `{ status: "ok" }` | ⚠️ Redundant |
| `GET /api/v1/ready` | Readiness (simplified) | `{ status: "ready", uptime: 123 }` | ⚠️ Missing DB check |
| `GET /api/v1/ping` | Basic connectivity | `{ pong: true }` | ✅ Works |

**Issues:**
- ⚠️ `_status` endpoint **doesn't actually check database** (health.routes.ts doesn't call `isDatabaseHealthy()`)
- ⚠️ Missing dependency checks (Redis, external APIs)
- ⚠️ No startup probe (K8s best practice)

**Recommended Fix:**
```typescript
// backend/src/routes/v1/health.routes.ts
fastify.get('/ready', async () => {
  const dbHealthy = isDatabaseHealthy();
  if (!dbHealthy) {
    reply.code(503);
    return { status: 'unhealthy', database: 'down' };
  }
  return { status: 'ready', database: 'up', uptime: process.uptime() };
});
```

### 3.2 Metrics & Instrumentation 🔴 **CRITICAL GAP**

**Current State:**
- ❌ No metrics collection (Prometheus, StatsD, CloudWatch)
- ❌ No request duration tracking
- ❌ No database query performance monitoring
- ❌ No error rate tracking (4xx, 5xx)
- ❌ No resource usage metrics (CPU, memory, connections)

**What Should Be Tracked:**

**Application Metrics:**
- Request rate (requests/sec by endpoint, status code)
- Request duration (p50, p95, p99 latency)
- Error rates (4xx, 5xx by endpoint)
- Active connections (WebSocket, DB)

**Database Metrics:**
- Query duration (p50, p95, p99)
- Connection pool utilization (active/idle/waiting)
- Query errors (by error type)
- Slow queries (>500ms)

**Business Metrics:**
- Thread creation rate
- AI answer generation rate
- User signups/logins
- Cache hit rate (when implemented)

**Instrumentation Example** (Fastify + Prometheus):
```typescript
import fastifyMetrics from 'fastify-metrics';
await fastify.register(fastifyMetrics, {
  endpoint: '/metrics', // Prometheus scrape endpoint
  defaultMetrics: { enabled: true },
  routeMetrics: { enabled: true },
});
```

### 3.3 Dashboards ❌ **NONE**

**Current State:**
- No Grafana/Datadog/CloudWatch dashboards
- No SLO/SLI tracking (e.g., 99.9% uptime, <500ms p95 latency)

**Production Requirements:**
1. **Operational Dashboard**:
   - Request rate, error rate, latency (by endpoint)
   - Database connection pool health
   - Memory/CPU usage
   - Active users (concurrent sessions)

2. **Business Dashboard**:
   - Daily active users (DAU)
   - Threads created per day
   - AI answer generation rate
   - User engagement (posts per thread)

3. **SLO Dashboard**:
   - Availability (uptime %)
   - Latency (p95, p99)
   - Error budget burn rate

**Tool Recommendations:**
- **Grafana Cloud** (free tier: 10k metrics, 50GB logs)
- **Datadog** ($15/host/month)
- **AWS CloudWatch** (pay-as-you-go, ~$10/month for basic metrics)

### 3.4 Alerting ❌ **NONE**

**Current State:**
- No alert rules configured
- No on-call rotation
- No incident response playbook

**Critical Alerts Needed:**

| Alert | Threshold | Severity | Action |
|-------|-----------|----------|--------|
| API Error Rate | >1% 5xx errors | Critical | Page on-call |
| Database Down | Health check fails | Critical | Page on-call |
| High Latency | p95 >2s | Warning | Investigate |
| Disk Space | >80% full | Warning | Expand storage |
| Memory Usage | >85% | Warning | Check for leaks |
| Failed Logins | >10/min | Warning | Potential attack |

**Alerting Channels:**
- PagerDuty (on-call rotation)
- Slack (#alerts channel)
- Email (fallback)

---

## 4. Storage & File Uploads

### 4.1 S3 Configuration ❌ **NOT IMPLEMENTED**

**Current State:**
- No file upload endpoints
- No S3 integration (AWS SDK not in dependencies)
- No presigned URL generation for direct uploads
- No file size/type validation

**Use Cases Requiring Storage:**
- User avatars (profile pictures)
- Course material attachments (PDFs, videos)
- AI conversation exports (JSON, CSV)
- Instructor response template attachments

**Implementation Gap:**
```typescript
// backend/package.json - Missing dependencies
{
  "dependencies": {
    // ❌ Missing: "@aws-sdk/client-s3": "^3.x"
    // ❌ Missing: "@aws-sdk/s3-request-presigner": "^3.x"
    // ❌ Missing: "multer" or "@fastify/multipart" for file uploads
  }
}
```

**Recommendations:**
1. Add S3 client and multipart upload handling
2. Implement presigned URL generation for client-side uploads (avoid proxying large files)
3. Add file validation (MIME type, size limits, virus scanning)
4. Configure S3 bucket policies (private by default, signed URLs for access)

**Example Architecture:**
```typescript
// POST /api/v1/upload/avatar
// 1. Validate file type (image/jpeg, image/png)
// 2. Generate unique filename (userId-timestamp.ext)
// 3. Create presigned POST URL (S3)
// 4. Return URL to client for direct upload
// 5. On success callback, update user.avatar in DB
```

### 4.2 File Upload Security ⚠️ **HIGH RISK**

**Risks if Implemented Without Validation:**
- File type spoofing (upload .exe as .jpg)
- Malware uploads (ransomware, viruses)
- Path traversal attacks (../../etc/passwd)
- Oversized files (DoS via storage exhaustion)
- SSRF via SVG uploads (external resource fetching)

**Security Checklist:**
- [ ] MIME type validation (magic bytes, not just extension)
- [ ] File size limits (e.g., 5MB for avatars, 100MB for course materials)
- [ ] Virus scanning integration (ClamAV, VirusTotal)
- [ ] Content-Disposition headers (force download, prevent XSS)
- [ ] S3 bucket CORS policy (restrict origins)
- [ ] S3 lifecycle policies (auto-delete temp files after 7 days)

---

## 5. Environment Parity

### 5.1 Configuration Matrix

**Current Environments:**

| Environment | Frontend Deploy | Backend Deploy | Database | Session Storage | Logging |
|-------------|----------------|----------------|----------|-----------------|---------|
| **Local Dev** | localhost:3000 | localhost:3001 | SQLite (dev.db) | Signed cookies | Pino pretty-print |
| **CI/CD** | GitHub Actions | N/A (not deployed) | N/A | N/A | GitHub logs |
| **Staging** | ❌ Not configured | ❌ Not configured | ❌ N/A | ❌ N/A | ❌ N/A |
| **Production** | Netlify | ❌ Not deployed | ❌ Not configured | Signed cookies | Netlify logs |

**Issues:**
- 🔴 **No staging environment** (changes go straight to production)
- 🔴 **Backend not deployed** (frontend uses mock API client)
- 🔴 **No production database** configured (no RDS, no connection string)
- ⚠️ **Cookie domain mismatch** (localhost in dev, production domain needed)
- ⚠️ **CORS origins** hardcoded to localhost in `.env.example`

### 5.2 Environment Variables

**Backend (.env.example):**
```bash
NODE_ENV=development
PORT=3001
DATABASE_TYPE=sqlite
DATABASE_URL=./dev.db
SESSION_SECRET=your-32-character-secret-key-here-change-in-production
# REDIS_URL=redis://localhost:6379  # Commented out
LOG_LEVEL=info
```

**Frontend (.env.local.example):**
```bash
NEXT_PUBLIC_USE_LLM=false
NEXT_PUBLIC_LLM_PROVIDER=openai
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-...  # ⚠️ Client-exposed (demo only)
NEXT_PUBLIC_MAX_DAILY_COST=10.00
```

**Issues:**
- ⚠️ **SESSION_SECRET** default is weak ("demo-secret-change-in-production")
- 🔴 **API keys exposed to client** (NEXT_PUBLIC_* sent to browser)
- ⚠️ **No database connection pooling** config (max connections, timeout)
- ⚠️ **No Redis config** for production session storage
- ⚠️ **No feature flags** for gradual rollout (e.g., enable backend integration per user)

**Recommendations:**
1. Move LLM API keys to server-side API routes (Next.js /api routes)
2. Add staging environment config files (`.env.staging`)
3. Use AWS Secrets Manager or GitHub Secrets for sensitive values
4. Document required env vars in `backend/README.md` and frontend `README.md`

### 5.3 Deployment Configuration

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build  # Frontend only
      - uses: nwtgck/actions-netlify@v3.0
        with:
          publish-dir: '.next'
```

**Issues:**
- ⚠️ **Backend not deployed** (no AWS Lambda, ECS, or VM deployment)
- ⚠️ **No environment checks** (lint, type-check, tests before deploy)
- ⚠️ **No rollback mechanism** (if deploy fails, manual intervention needed)
- ⚠️ **No staging deploy** (all changes go to production)

**Missing Deployment Pieces:**
1. Backend deploy workflow (e.g., AWS Fargate, Railway, Render)
2. Database migration step (run `npm run db:migrate` before deploy)
3. Smoke tests (hit `/health` endpoint after deploy)
4. Blue-green or canary deployment strategy

---

## 6. Cost Analysis

### 6.1 Current Costs 💰 **$0/month (Demo)**

**Current Infrastructure:**
- Netlify Free Tier (frontend hosting)
- Local SQLite database (no hosting cost)
- No backend deployed
- No monitoring/logging services

### 6.2 Estimated Production Costs 💰 **~$50-100/month (MVP)**

**Breakdown:**

| Service | Provider | Cost/Month | Notes |
|---------|----------|-----------|-------|
| **Frontend Hosting** | Netlify Pro | $19 | 100GB bandwidth, custom domain |
| **Backend Hosting** | AWS Fargate (0.25 vCPU, 0.5GB) | $15 | 2 containers (blue-green) |
| **Database** | AWS RDS (db.t4g.micro) | $15 | Postgres, 20GB storage, daily backups |
| **Redis** (Sessions) | ElastiCache (t4g.micro) | $12 | 1 node, 1GB memory |
| **S3** (File Storage) | AWS S3 | $5 | 50GB storage + requests |
| **Logging** | CloudWatch Logs | $8 | 10GB/month ingestion, 30-day retention |
| **Monitoring** | Grafana Cloud (free tier) | $0 | 10k metrics, 50GB logs |
| **Domain** | AWS Route 53 | $1 | 1 hosted zone |
| **SSL Certs** | AWS ACM | $0 | Free with ACM |
| **Data Transfer** | AWS | $5 | Outbound data (1-10GB) |
| **Total** | | **$80/month** | **Estimated MVP costs** |

**Cost Optimization Opportunities:**
1. Use AWS Free Tier for first 12 months (RDS, Fargate credits)
2. Implement CloudFront CDN caching (reduce backend requests by 60%)
3. Use Lambda for backend (pay-per-request, $0 idle cost)
4. Compress logs before shipping (reduce CloudWatch ingestion by 50%)
5. Set S3 lifecycle policies (auto-delete temp files, reduce storage)

### 6.3 Resource Utilization ⚠️ **UNKNOWN**

**Current Metrics:**
- ❌ No CPU/memory profiling
- ❌ No database query performance metrics
- ❌ No request rate monitoring
- ❌ No cold start metrics (if using Lambda)

**Recommendations:**
1. Add Fastify metrics plugin (track request duration, active connections)
2. Profile SQLite performance (query execution time, lock contention)
3. Benchmark concurrent user load (use `artillery` or `k6`)
4. Estimate production traffic (users/day → requests/sec → cost)

**Example Load Estimate:**
```
Assumptions:
- 1,000 active users/day
- 50 requests/user/day (threads, posts, AI answers)
- Total: 50,000 requests/day ≈ 0.6 requests/sec average

Peak traffic (10x average): 6 requests/sec
Database queries: 5 queries/request → 30 queries/sec peak
```

---

## 7. Disaster Recovery Readiness

### 7.1 Backup Procedures 🔴 **CRITICAL GAP**

**Current State:**
- ❌ No automated backups (SQLite dev.db not backed up)
- ❌ No backup verification (restore testing)
- ❌ No offsite backups (single point of failure)

**Required Backups:**
- **Database**: Daily automated snapshots (RDS automated backups)
- **S3 Uploads**: Versioning enabled (recover deleted files)
- **Configuration**: Infrastructure-as-Code (Terraform/CloudFormation)
- **Secrets**: AWS Secrets Manager with rotation

**Backup Checklist:**
- [ ] RDS automated backups enabled (7-day retention)
- [ ] Point-in-time recovery (PITR) enabled (1-35 days)
- [ ] Cross-region replication (DR region)
- [ ] S3 versioning enabled (recover from accidental deletion)
- [ ] Monthly backup restore drill (test RTO/RPO)

### 7.2 Recovery Time Objectives (RTO/RPO)

**Current State:**
- ❌ No documented RTO/RPO
- ❌ No incident response playbook
- ❌ No disaster recovery runbook

**Recommended Targets:**

| Scenario | RTO (Recovery Time) | RPO (Data Loss) | Priority |
|----------|-------------------|-----------------|----------|
| **Database Failure** | 15 minutes | 1 hour | Critical |
| **Backend Service Down** | 5 minutes | 0 (stateless) | Critical |
| **Region Outage** | 4 hours | 1 hour | High |
| **Data Corruption** | 1 hour | 24 hours | High |
| **Account Compromise** | 24 hours | 24 hours | Medium |

**Recovery Procedures:**
1. **Database Failure**: Restore from latest RDS snapshot (automated)
2. **Service Outage**: Deploy to backup region (manual, 4-hour RTO)
3. **Data Corruption**: Restore from PITR (point-in-time recovery)
4. **Account Compromise**: Rotate all secrets, invalidate sessions

### 7.3 Disaster Recovery Score 🔴 **2/10**

**Score Breakdown:**

| Category | Score | Justification |
|----------|-------|---------------|
| **Backups** | 1/10 | No automated backups, no verification |
| **Monitoring** | 2/10 | Basic health checks, no metrics/alerts |
| **Redundancy** | 0/10 | Single-region, single-database |
| **Documentation** | 3/10 | Schema documented, no DR runbook |
| **Testing** | 0/10 | No backup restore testing, no failover drills |

**Minimum Viable DR (Quick Wins):**
1. Enable RDS automated backups (1-day retention)
2. Add CloudWatch alarms for critical failures (database down, high error rate)
3. Document backup restore procedure (test quarterly)
4. Create incident response Slack channel (#incidents)
5. Set up PagerDuty rotation (or equivalent)

---

## 8. Recommended Improvements (Prioritized)

### 🔴 Critical (Week 1)

**P0 - Blockers for Production:**

1. **Database Backups** (2 hours)
   - Enable RDS automated backups (7-day retention)
   - Test restore procedure (verify backup works)
   - Document restore runbook

2. **Connection Pooling** (4 hours)
   - Migrate SQLite → Postgres for production
   - Add `pg-pool` with max 20 connections
   - Add connection error handling (retry logic)

3. **PII Scrubbing** (3 hours)
   - Add log scrubber for sensitive fields (email, password, content)
   - Audit all log statements for PII leaks
   - Add `doNotLog: true` flag to auth routes

4. **Health Check Fix** (1 hour)
   - Make `/api/v1/ready` call `isDatabaseHealthy()` (actual DB check)
   - Add dependency checks (Redis, external APIs)
   - Return 503 if unhealthy (not 200)

### 🟡 High (Week 2)

**P1 - Observability Essentials:**

5. **Metrics Collection** (6 hours)
   - Add Fastify metrics plugin (Prometheus endpoint)
   - Track request rate, duration, error rate
   - Add database query duration tracking

6. **Alerting Setup** (4 hours)
   - Configure CloudWatch alarms (database down, high error rate)
   - Set up PagerDuty rotation (or email alerts)
   - Create incident response Slack channel

7. **Log Aggregation** (4 hours)
   - Ship logs to CloudWatch Logs (or Datadog, Logtail)
   - Set 30-day retention policy
   - Add correlation IDs to all logs

8. **Query Optimization** (8 hours)
   - Fix N+1 queries in `findByCourse()` (use JOINs)
   - Add composite indexes (courseId + status + createdAt)
   - Benchmark query performance (aim for <100ms p95)

### 🟢 Medium (Week 3-4)

**P2 - Production Hardening:**

9. **S3 Integration** (8 hours)
   - Add AWS SDK dependencies
   - Implement presigned URL generation
   - Add file upload validation (MIME type, size, virus scan)

10. **Staging Environment** (12 hours)
    - Create staging deployment pipeline
    - Configure staging RDS database (separate from prod)
    - Test backend deployment end-to-end

11. **Dashboards** (8 hours)
    - Create Grafana dashboards (operational, business, SLO)
    - Add business metrics (DAU, thread creation rate)
    - Set up SLO tracking (99.9% uptime, <500ms p95)

12. **DR Testing** (4 hours)
    - Conduct backup restore drill (test RTO/RPO)
    - Document disaster recovery runbook
    - Test failover to backup region (manual process)

### 🔵 Low (Month 2)

**P3 - Optimization & Scale:**

13. **Redis Session Storage** (6 hours)
    - Migrate from cookie-based sessions to Redis
    - Add connection pooling for Redis (ioredis)
    - Implement session expiration (7 days)

14. **Cost Monitoring** (4 hours)
    - Add AWS Cost Explorer alerts (budget thresholds)
    - Implement cost tags (environment, service)
    - Analyze query costs (slow queries = expensive)

15. **Multi-Region** (16 hours)
    - Deploy backend to secondary region (DR)
    - Set up Route 53 health-check failover
    - Test cross-region replication (RDS, S3)

---

## 9. Summary & Next Steps

### Infrastructure Readiness Matrix

| Area | Status | Production Ready? | Blocker? |
|------|--------|------------------|----------|
| Database Schema | 🟢 Strong | ✅ Yes | No |
| Migrations | 🟡 Adequate | ⚠️ Needs rollback | No |
| Connection Pooling | 🔴 Critical Gap | ❌ No | **Yes** |
| Backups | 🔴 None | ❌ No | **Yes** |
| Logging | 🟡 Adequate | ⚠️ Needs PII scrub | No |
| Monitoring | 🔴 None | ❌ No | **Yes** |
| Health Checks | 🟡 Basic | ⚠️ Needs fix | No |
| Alerting | 🔴 None | ❌ No | **Yes** |
| Storage/S3 | 🔴 Not Implemented | ❌ No | No (if no uploads) |
| DR Plan | 🔴 None | ❌ No | **Yes** |

**Production Blockers (Must-Fix):**
1. Database backups (no data loss protection)
2. Connection pooling (SQLite won't scale)
3. PII scrubbing (GDPR/compliance risk)
4. Monitoring (blind to production issues)
5. Alerting (no incident response)

**Estimated Time to Production-Ready:** **4-6 weeks** (1-2 engineers)

### Immediate Action Plan

**This Week:**
- [ ] Enable RDS automated backups (P0)
- [ ] Fix health check endpoints (P0)
- [ ] Audit logs for PII leaks (P0)
- [ ] Add connection pooling (P0)

**Next Week:**
- [ ] Set up Prometheus metrics (P1)
- [ ] Configure CloudWatch alarms (P1)
- [ ] Ship logs to aggregation service (P1)
- [ ] Optimize N+1 queries (P1)

**Week 3-4:**
- [ ] Deploy staging environment (P2)
- [ ] Create Grafana dashboards (P2)
- [ ] Test disaster recovery (P2)
- [ ] Document runbooks (P2)

---

## Appendix: Code Examples

### A. Production-Ready DB Client

```typescript
// backend/src/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

// Connection pool configuration
const sql = postgres(DATABASE_URL, {
  max: 20, // Max connections in pool
  idle_timeout: 30, // Close idle connections after 30s
  connect_timeout: 10, // Timeout connection attempts after 10s
  onnotice: () => {}, // Suppress Postgres notices
});

export const db = drizzle(sql, { schema });

// Graceful shutdown
export async function closeDatabase() {
  await sql.end({ timeout: 5 });
}

// Health check with timeout
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await sql`SELECT 1 as health`.timeout(1000);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
```

### B. PII Scrubber Middleware

```typescript
// backend/src/plugins/pii-scrubber.plugin.ts
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

const PII_FIELDS = ['email', 'password', 'name', 'content', 'message'];

function scrubPII(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const scrubbed = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in scrubbed) {
    if (PII_FIELDS.includes(key.toLowerCase())) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof scrubbed[key] === 'object') {
      scrubbed[key] = scrubPII(scrubbed[key]);
    }
  }

  return scrubbed;
}

async function piiScrubberPlugin(fastify: FastifyInstance) {
  // Scrub request bodies in error logs
  fastify.addHook('onError', async (request, reply, error) => {
    if (request.body) {
      request.body = scrubPII(request.body);
    }
  });
}

export default fp(piiScrubberPlugin, { name: 'pii-scrubber' });
```

### C. Metrics Integration

```typescript
// backend/src/server.ts
import fastifyMetrics from 'fastify-metrics';

await fastify.register(fastifyMetrics, {
  endpoint: '/metrics', // Prometheus scrape endpoint
  defaultMetrics: { enabled: true }, // CPU, memory, event loop
  routeMetrics: { enabled: true }, // Per-route request duration
  errorMetrics: { enabled: true }, // Error counts by type
});

// Custom business metrics
fastify.decorate('metrics', {
  threadCreated: new fastify.metrics.Counter({
    name: 'quokka_threads_created_total',
    help: 'Total threads created',
    labelNames: ['course_id'],
  }),
  aiAnswerGenerated: new fastify.metrics.Counter({
    name: 'quokka_ai_answers_total',
    help: 'Total AI answers generated',
    labelNames: ['confidence_level'],
  }),
  dbQueryDuration: new fastify.metrics.Histogram({
    name: 'quokka_db_query_duration_seconds',
    help: 'Database query duration',
    labelNames: ['query_type'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  }),
});
```

---

**Report End**

**Key Takeaways:**
- Infrastructure is **demo-ready** but requires significant hardening for production
- **Top 3 blockers**: Database backups, connection pooling, monitoring/alerting
- **Estimated cost**: $80/month for MVP production deployment
- **Time to production**: 4-6 weeks with 1-2 engineers

**Next Steps:**
1. Review this report with engineering team
2. Prioritize P0 critical issues (backups, connection pooling, PII scrubbing)
3. Create JIRA tickets for each recommended improvement
4. Schedule disaster recovery drill (test backup restore)
