# Plan 2: Production Roadmap
**Goal:** Make QuokkaQ commercially deployable and secure
**Scope:** All security, scalability, monitoring, and hardening issues
**Timeline:** 4-6 weeks with 1-2 engineers
**Priority:** Everything needed to safely handle real users and data

---

## Executive Summary

**Current State:** Demo works, but has 25 production blockers across 7 categories

**Production-Ready Definition:**
- ✅ No security vulnerabilities (authentication, authorization, data privacy)
- ✅ Scalable infrastructure (Postgres, Redis, multi-server capable)
- ✅ Full observability (monitoring, logging, alerting, incident response)
- ✅ Type-safe contracts (no `any`, validated I/O)
- ✅ Tested (>80% coverage on critical paths)
- ✅ Documented (runbooks, disaster recovery, onboarding)
- ✅ Cost-optimized (bundle sizes, caching, efficient queries)

**Gap Analysis:**
- 🔴 7 P0 critical security issues (session secret, RBAC, RLS, rate limiting)
- 🔴 5 infrastructure blockers (backups, monitoring, connection pooling)
- 🟡 12 type safety and contract issues
- 🟡 0% test coverage (need >80%)
- 🟡 3 performance optimizations (bundle size, N+1 queries)

---

## Phase 1: Critical Security & Auth (Week 1-2, 40 hours)

### Milestone: Safe to handle real user accounts and data

### 1.1 Real Password Authentication (8 hours)
**Current:** `dev-login` endpoint requires NO password
**Risk:** Anyone can impersonate any user
**Fix:** Implement bcrypt password hashing

**Implementation:**
```typescript
// backend/src/routes/v1/auth.routes.ts

// Add new endpoint
fastify.post('/api/v1/auth/register', async (request, reply) => {
  const { email, password, name, role } = request.body;

  // Validate password strength
  if (password.length < 8) {
    return reply.code(400).send({ error: 'Password must be at least 8 characters' });
  }

  // Hash password with bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await this.usersRepo.create({
    email,
    passwordHash, // Store hash, never plaintext
    name,
    role,
  });

  // Create session
  request.session.set('userId', user.id);

  return { user: { id: user.id, email, name, role } }; // Never return hash
});

// Replace dev-login with real login
fastify.post('/api/v1/auth/login', async (request, reply) => {
  const { email, password } = request.body;

  // Find user by email
  const user = await this.usersRepo.findByEmail(email);
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Create session
  request.session.set('userId', user.id);

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role } };
});
```

**Database Migration:**
```sql
-- Add passwordHash column to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- For existing demo users, set temporary hash
-- (they'll need to reset password or re-register)
```

**Testing:**
- [ ] Register new user with weak password (expect 400)
- [ ] Register new user with strong password (expect success)
- [ ] Login with wrong password (expect 401)
- [ ] Login with correct password (expect session created)
- [ ] Password hash never returned in API response

**Dependencies:** `npm install bcrypt @types/bcrypt`

**References:**
- Security audit report R6
- OWASP password guidelines

---

### 1.2 RBAC Enforcement (4 hours)
**Current:** No role validation - students can access instructor endpoints
**Risk:** Unauthorized access to metrics, moderation, grade data
**Fix:** Role-based access control middleware

**Implementation:**
```typescript
// backend/src/middleware/rbac.ts

export function requireRole(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Get user from session
    const userId = request.session.get('userId');
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const user = await request.server.usersRepo.findById(userId);
    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }

    // Check role
    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `This endpoint requires one of: ${allowedRoles.join(', ')}`,
      });
    }

    // Attach user to request for downstream use
    request.user = user;
  };
}

// Apply to routes
// backend/src/routes/v1/instructor.routes.ts
fastify.get(
  '/api/v1/instructor/metrics',
  {
    preHandler: requireRole(['instructor', 'ta']), // ✅ Only instructors/TAs
  },
  async (request, reply) => {
    // Implementation
  }
);
```

**Protected Endpoints:**
- `/api/v1/instructor/*` - Require `['instructor', 'ta']`
- `/api/v1/threads/:id/endorse` - Require `['instructor', 'ta']`
- `/api/v1/posts/:id/endorse` - Require `['instructor', 'ta']`
- `/api/v1/threads/:id/resolve` - Require `['instructor', 'ta']`

**Testing:**
- [ ] Student user calls instructor endpoint (expect 403)
- [ ] Instructor user calls instructor endpoint (expect 200)
- [ ] TA user calls instructor endpoint (expect 200)
- [ ] Unauthenticated user calls protected endpoint (expect 401)

**References:**
- Security audit report R4 (T2)
- Risk register R4

---

### 1.3 Row-Level Security (RLS) for Multi-Tenancy (8 hours)
**Current:** All queries ignore `tenantId` column
**Risk:** Cross-tenant data leakage (Course A students see Course B data)
**Fix:** Add tenant filtering to all repository queries

**Implementation:**
```typescript
// backend/src/repositories/base.repository.ts

// Add tenantId to all queries
protected async findAll(options: QueryOptions & { tenantId: string }) {
  const { tenantId, ...rest } = options;

  return this.db
    .select()
    .from(this.table)
    .where(eq(this.table.tenantId, tenantId)) // ✅ Always filter by tenant
    .limit(rest.limit || 100);
}

// Example: ThreadsRepository
async findByCourseId(courseId: string, tenantId: string, options: PaginationOptions) {
  return this.db
    .select()
    .from(threads)
    .where(
      and(
        eq(threads.courseId, courseId),
        eq(threads.tenantId, tenantId) // ✅ Multi-tenant safe
      )
    )
    .orderBy(desc(threads.createdAt))
    .limit(options.limit);
}
```

**Route Changes:**
```typescript
// Get tenantId from user session
fastify.get('/api/v1/threads', async (request, reply) => {
  const user = request.user; // From RBAC middleware
  const { courseId } = request.query;

  // Pass tenantId to repository
  const threads = await this.threadsRepo.findByCourseId(
    courseId,
    user.tenantId, // ✅ From authenticated user
    { limit: 100 }
  );

  return { threads };
});
```

**Affected Repositories (12 total):**
- ThreadsRepository
- PostsRepository
- CoursesRepository
- MaterialsRepository
- AIAnswersRepository
- ConversationsRepository
- NotificationsRepository
- (All others)

**Testing:**
- [ ] Create users in different tenants (tenant-a, tenant-b)
- [ ] Login as tenant-a user, verify only sees tenant-a data
- [ ] Login as tenant-b user, verify only sees tenant-b data
- [ ] Attempt to access tenant-a resource with tenant-b user (expect 404)

**References:**
- Security audit report R5 (T3)
- Risk register R5

---

### 1.4 Rate Limiting (4 hours)
**Current:** No rate limits - vulnerable to brute force attacks
**Risk:** Account takeover via password guessing, API abuse
**Fix:** Add rate limiting plugin

**Implementation:**
```typescript
// backend/src/server.ts

import rateLimit from '@fastify/rate-limit';

// Global rate limit
await fastify.register(rateLimit, {
  max: 100, // 100 requests
  timeWindow: '1 minute', // per minute
  allowList: ['127.0.0.1'], // Exclude localhost in dev
});

// Stricter rate limit for auth endpoints
fastify.register(
  async (authRoutes) => {
    authRoutes.register(rateLimit, {
      max: 5, // 5 attempts
      timeWindow: '15 minutes',
      errorResponseBuilder: (request, context) => ({
        error: 'Too many attempts',
        message: 'Please try again later',
        retryAfter: context.ttl,
      }),
    });

    authRoutes.post('/api/v1/auth/login', loginHandler);
    authRoutes.post('/api/v1/auth/register', registerHandler);
  },
  { prefix: '/api/v1' }
);
```

**Rate Limit Tiers:**
- Auth endpoints: 5 req/15min (prevent brute force)
- AI endpoints: 10 req/hour (prevent cost abuse)
- Read endpoints: 100 req/min (general API abuse)
- Write endpoints: 20 req/min (prevent spam)

**Testing:**
- [ ] Make 6 failed login attempts within 15 min (expect 429 on 6th)
- [ ] Wait 15 minutes, try again (expect 200)
- [ ] Make 101 API requests in 1 minute (expect 429)

**Dependencies:** `npm install @fastify/rate-limit`

**References:**
- Security audit report R10 (T4)
- Risk register R10

---

### 1.5 Move API Keys Server-Side (4 hours)
**Current:** LLM API keys exposed to browser via `NEXT_PUBLIC_*` env vars
**Risk:** Key theft, $1000s cost overrun
**Fix:** Proxy LLM calls through backend

**Implementation:**
```typescript
// backend/src/routes/v1/ai.routes.ts (new file)

import { generateText } from 'ai'; // Vercel AI SDK
import { openai } from '@ai-sdk/openai';

fastify.post('/api/v1/ai/chat', async (request, reply) => {
  const { messages, courseId } = request.body;
  const user = request.user;

  // Check user's cost cap
  const usage = await this.aiUsageRepo.getMonthlyUsage(user.id);
  if (usage.cost > 10.00) { // $10/month cap
    return reply.code(429).send({
      error: 'Monthly AI usage limit exceeded',
      limit: '$10.00',
      used: `$${usage.cost.toFixed(2)}`,
    });
  }

  // Generate response (API key read from backend env)
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages,
    // API key never sent to browser
  });

  // Track usage
  await this.aiUsageRepo.create({
    userId: user.id,
    tokens: result.usage.totalTokens,
    cost: result.usage.totalTokens * 0.00001, // $0.01/1K tokens
  });

  return { response: result.text, usage: result.usage };
});
```

**Environment Variables:**
```bash
# backend/.env (server-side only)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# ❌ Remove from frontend .env.local
# NEXT_PUBLIC_OPENAI_API_KEY (delete)
```

**Frontend Changes:**
```typescript
// app/api/chat/route.ts
// Instead of calling OpenAI directly, proxy to backend
const response = await fetch('http://localhost:3001/api/v1/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Send session cookie
  body: JSON.stringify({ messages, courseId }),
});
```

**Database Migration:**
```sql
-- Add AI usage tracking table
CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  cost REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at);
```

**Testing:**
- [ ] API keys not visible in browser DevTools
- [ ] AI chat works via backend proxy
- [ ] Usage tracked per user
- [ ] Monthly cost cap enforced (expect 429 when exceeded)

**References:**
- Security audit report R9 (T5)
- Risk register R9

---

### 1.6 Secure Session Storage (Redis) (8 hours)
**Current:** Cookie-only sessions, no persistence
**Risk:** Won't scale to multi-server deployments
**Fix:** Add Redis session backend

**Implementation:**
```typescript
// backend/src/plugins/session.plugin.ts

import RedisStore from 'connect-redis';
import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: false,
});

await redisClient.connect();

// Configure session with Redis
await fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET!, // Required (no fallback)
  store: new RedisStore({
    client: redisClient,
    ttl: 7 * 24 * 60 * 60, // 7 days
    prefix: 'sess:',
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
```

**Infrastructure:**
```yaml
# docker-compose.yml (dev environment)
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Production (AWS ElastiCache):**
```terraform
# terraform/redis.tf
resource "aws_elasticache_cluster" "sessions" {
  cluster_id           = "quokka-sessions"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.sessions.name
  security_group_ids   = [aws_security_group.redis.id]
}
```

**Testing:**
- [ ] Start Redis: `docker compose up redis -d`
- [ ] Login, verify session stored in Redis: `redis-cli GET sess:*`
- [ ] Restart backend server, verify session persists
- [ ] Test with 2 backend instances (multi-server mode)

**Dependencies:**
- `npm install redis connect-redis`
- Redis server (Docker locally, ElastiCache prod)

**Cost:** ~$12/month (ElastiCache t3.micro)

**References:**
- Infrastructure audit report R8 (session storage)
- Risk register R13

---

### 1.7 Remove Hardcoded Secrets (1 hour)
**Current:** Session secret defaults to `"demo-secret-change-in-production"`
**Risk:** Session forgery attacks
**Fix:** Enforce environment variable

**Implementation:**
```typescript
// backend/src/plugins/session.plugin.ts

// ❌ OLD (dangerous)
const secret = process.env.SESSION_SECRET || "demo-secret-change-in-production";

// ✅ NEW (safe)
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}
const secret = process.env.SESSION_SECRET;
```

**Startup Validation:**
```typescript
// backend/src/server.ts

function validateEnv() {
  const required = [
    'SESSION_SECRET',
    'DATABASE_URL', // For production
    'REDIS_URL', // For production
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Call before starting server
validateEnv();
await fastify.listen({ port: 3001, host: '0.0.0.0' });
```

**Deployment:**
```bash
# Generate strong secret
openssl rand -base64 32

# Set in production environment
export SESSION_SECRET="<generated-secret>"

# Or use AWS Secrets Manager
aws secretsmanager create-secret \
  --name quokka/session-secret \
  --secret-string "<generated-secret>"
```

**Testing:**
- [ ] Start backend without `SESSION_SECRET` (expect error + exit)
- [ ] Start backend with `SESSION_SECRET` (expect success)

**References:**
- Security audit report R3 (T1)
- Risk register R3

---

### 1.8 Audit Logging (4 hours)
**Current:** No audit trail for user actions
**Risk:** Can't investigate security incidents, compliance issues
**Fix:** Log all authentication and sensitive actions

**Implementation:**
```typescript
// backend/src/utils/audit-logger.ts

export async function logAuditEvent(event: AuditEvent) {
  await db.insert(auditLogs).values({
    id: generateId(),
    userId: event.userId,
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId,
    metadata: JSON.stringify(event.metadata),
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    createdAt: new Date(),
  });

  // Also log to CloudWatch for centralized monitoring
  console.log(JSON.stringify({
    type: 'audit',
    ...event,
  }));
}

// Usage in routes
fastify.post('/api/v1/auth/login', async (request, reply) => {
  // ... login logic

  await logAuditEvent({
    userId: user.id,
    action: 'auth.login',
    resource: 'user',
    resourceId: user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { success: true },
  });
});

fastify.post('/api/v1/threads/:id/resolve', async (request, reply) => {
  // ... resolve logic

  await logAuditEvent({
    userId: request.user.id,
    action: 'thread.resolve',
    resource: 'thread',
    resourceId: request.params.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
});
```

**Database Migration:**
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at);
```

**Events to Log:**
- `auth.login`, `auth.logout`, `auth.register`
- `thread.create`, `thread.resolve`, `thread.endorse`
- `post.create`, `post.endorse`, `post.flag`
- `user.role_change`, `user.delete`

**Testing:**
- [ ] Login, check `audit_logs` table for `auth.login` entry
- [ ] Create thread, check for `thread.create` entry
- [ ] Query logs by user: `SELECT * FROM audit_logs WHERE user_id = ?`

**Retention:** Keep 1 year for compliance

**References:**
- Security audit report R22
- Risk register R22

---

## Phase 2: Infrastructure & Scalability (Week 2-3, 40 hours)

### Milestone: Production-ready infrastructure (Postgres, backups, monitoring)

### 2.1 Postgres Migration (8 hours)
**Current:** SQLite (single file, file locking)
**Risk:** Can't scale to multiple servers
**Fix:** Deploy Postgres database

**Implementation:**
```typescript
// backend/src/db/client.ts

// ✅ Already designed for this - just set DATABASE_URL

// SQLite (dev)
// DATABASE_URL not set → uses SQLite

// Postgres (prod)
// DATABASE_URL=postgres://user:pass@host:5432/quokka → uses Postgres
```

**Infrastructure (AWS RDS):**
```terraform
# terraform/rds.tf
resource "aws_db_instance" "quokka" {
  identifier              = "quokka-postgres"
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  storage_encrypted       = true

  # Backups
  backup_retention_period = 7
  backup_window           = "02:00-03:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Networking
  db_subnet_group_name    = aws_db_subnet_group.quokka.name
  vpc_security_group_ids  = [aws_security_group.postgres.id]
  publicly_accessible     = false

  # Database
  db_name  = "quokka"
  username = "quokka_admin"
  password = random_password.db_password.result

  # Performance Insights
  enabled_cloudwatch_logs_exports = ["postgresql"]
  performance_insights_enabled    = true
}
```

**Migration Steps:**
1. Create RDS instance (Terraform or Console)
2. Set `DATABASE_URL` env var
3. Run migrations: `npm run db:migrate`
4. Seed database: `npm run db:seed`
5. Test connections
6. Enable SSL in production

**Connection Pooling (pg-pool):**
```typescript
// backend/src/db/client.ts

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
});

export const db = drizzle(pool, { schema });
```

**Cost:** ~$15/month (RDS db.t3.micro)

**Testing:**
- [ ] Deploy RDS instance
- [ ] Connect from backend: `psql $DATABASE_URL`
- [ ] Run migrations, verify 18 tables created
- [ ] Seed database, verify data loaded
- [ ] Test with multiple backend instances (connection pooling)

**References:**
- Infrastructure audit report R1 (connection pooling)
- Risk register R7

---

### 2.2 Automated Backups & Disaster Recovery (4 hours)
**Current:** No backups
**Risk:** Data loss
**Fix:** Enable automated backups + test restoration

**AWS RDS Backups (Automatic):**
- ✅ Configured in Terraform (see 2.1)
- Retention: 7 days
- Window: 02:00-03:00 UTC
- Point-in-time recovery (PITR) enabled

**Disaster Recovery Runbook:**
```markdown
# DR-001: Database Restoration

## Scenario: Database Corruption or Data Loss

**RTO:** 2 hours (Recovery Time Objective)
**RPO:** 1 hour (Recovery Point Objective - max data loss)

### Steps:

1. **Identify Incident**
   - Check CloudWatch alarms
   - Verify database unavailable: `psql $DATABASE_URL`

2. **Assess Damage**
   - If read-only outage → promote read replica
   - If corruption → restore from backup

3. **Restore from Backup**
   ```bash
   # Option A: Restore latest snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier quokka-postgres-restored \
     --db-snapshot-identifier <latest-snapshot>

   # Option B: Point-in-time recovery
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier quokka-postgres \
     --target-db-instance-identifier quokka-postgres-restored \
     --restore-time 2025-10-21T14:30:00Z
   ```

4. **Update Application**
   - Update DATABASE_URL to point to restored instance
   - Redeploy backend with new connection string

5. **Verify**
   - Test critical queries
   - Check data integrity (row counts)
   - Notify users of potential data loss window

6. **Post-Incident**
   - Document what happened
   - Update runbook with learnings
   - Schedule DR drill for next quarter
```

**Testing:**
- [ ] Weekly: Verify automated backup ran (`aws rds describe-db-snapshots`)
- [ ] Monthly: Test restoration to staging environment
- [ ] Quarterly: Full DR drill with team

**References:**
- Infrastructure audit report R1 (backups)
- Risk register R1

---

### 2.3 Monitoring & Alerting (12 hours)
**Current:** No metrics collection
**Risk:** Blind to production issues
**Fix:** CloudWatch metrics + dashboards + PagerDuty alerts

**Metrics to Collect:**
```typescript
// backend/src/utils/metrics.ts

import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'us-east-1' });

export async function recordMetric(metric: {
  name: string;
  value: number;
  unit: 'Count' | 'Milliseconds' | 'Percent';
  dimensions?: Record<string, string>;
}) {
  await cloudwatch.putMetricData({
    Namespace: 'QuokkaQ',
    MetricData: [
      {
        MetricName: metric.name,
        Value: metric.value,
        Unit: metric.unit,
        Timestamp: new Date(),
        Dimensions: Object.entries(metric.dimensions || {}).map(([key, value]) => ({
          Name: key,
          Value: value,
        })),
      },
    ],
  });
}

// Usage in routes
fastify.addHook('onResponse', (request, reply, done) => {
  recordMetric({
    name: 'RequestDuration',
    value: reply.getResponseTime(),
    unit: 'Milliseconds',
    dimensions: {
      Route: request.routerPath,
      Method: request.method,
      StatusCode: reply.statusCode.toString(),
    },
  });
  done();
});
```

**Key Metrics:**
1. Request rate (requests/min)
2. Error rate (errors/min, % of total)
3. Response time (p50, p95, p99)
4. Database connection pool utilization
5. Active sessions count
6. AI API usage (tokens/hour, cost/hour)

**CloudWatch Dashboard:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "Request Rate",
        "metrics": [
          ["QuokkaQ", "RequestCount", { "stat": "Sum", "period": 60 }]
        ]
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Error Rate",
        "metrics": [
          ["QuokkaQ", "ErrorCount", { "stat": "Sum", "period": 60 }]
        ]
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Response Time (p95)",
        "metrics": [
          ["QuokkaQ", "RequestDuration", { "stat": "p95" }]
        ]
      }
    }
  ]
}
```

**PagerDuty Alerts:**
```yaml
# CloudWatch Alarms
alarms:
  - name: HighErrorRate
    metric: QuokkaQ/ErrorCount
    threshold: 10 # 10 errors in 5 minutes
    period: 300
    evaluation_periods: 1
    action: pagerduty-critical

  - name: SlowResponseTime
    metric: QuokkaQ/RequestDuration
    statistic: p95
    threshold: 1000 # 1 second p95
    period: 300
    action: pagerduty-warning

  - name: DatabaseConnectionPoolExhausted
    metric: AWS/RDS/DatabaseConnections
    threshold: 18 # 90% of max (20)
    action: pagerduty-critical
```

**SLO Targets:**
- Uptime: 99.9% (< 43 min downtime/month)
- p95 latency: < 500ms
- Error rate: < 1%

**Cost:** ~$8/month (CloudWatch metrics + logs)

**Testing:**
- [ ] Deploy metrics collection
- [ ] View dashboard in CloudWatch console
- [ ] Trigger test alert (make 11 API calls that 500)
- [ ] Verify PagerDuty notification

**References:**
- Infrastructure audit report R2 (monitoring)
- Risk register R2

---

### 2.4 Logging & PII Scrubbing (6 hours)
**Current:** Validation errors log user input (GDPR violation)
**Risk:** PII in logs
**Fix:** Scrub sensitive fields before logging

**Implementation:**
```typescript
// backend/src/utils/pii-scrubber.ts

const SENSITIVE_FIELDS = ['email', 'password', 'passwordHash', 'apiKey', 'secret', 'token'];

export function redactPII(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  }

  const redacted = { ...obj };
  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactPII(redacted[key]);
    }
  }
  return redacted;
}

// Apply to Pino logger
// backend/src/server.ts
fastify.register(require('@fastify/sensible'));

fastify.addHook('onRequest', (request, reply, done) => {
  request.log = request.log.child({
    reqId: request.id,
    req: redactPII({
      method: request.method,
      url: request.url,
      headers: redactPII(request.headers),
      query: redactPII(request.query),
      // ❌ DO NOT log request.body (may contain passwords)
    }),
  });
  done();
});
```

**Validation Error Scrubbing:**
```typescript
// backend/src/plugins/validation.plugin.ts

fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    // Redact values from Zod error messages
    const scrubbedError = {
      ...error,
      message: redactPII(error.message),
      validation: error.validation.map((v) => ({
        ...v,
        value: '[REDACTED]', // Never log user input
      })),
    };

    request.log.warn(scrubbedError, 'Validation error');
    return reply.code(400).send({ error: 'Validation failed', issues: scrubbedError.validation });
  }

  // ...
});
```

**Testing:**
- [ ] Login with invalid email, check logs (expect `email: '[REDACTED]'`)
- [ ] Create post with profanity, check logs (expect `content: '[REDACTED]'`)
- [ ] Search logs for actual email addresses (expect 0 results)

**References:**
- Infrastructure audit report R8 (PII logs)
- Risk register R8

---

### 2.5 Health Checks & Readiness Probes (2 hours)
**Current:** Health check doesn't verify database
**Risk:** Load balancer routes traffic to broken servers
**Fix:** Add deep health checks

**Implementation:**
```typescript
// backend/src/routes/v1/health.routes.ts

// Liveness probe (is process running?)
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Readiness probe (can handle traffic?)
fastify.get('/ready', async (request, reply) => {
  const checks = {
    database: false,
    redis: false,
  };

  // Check database
  try {
    await fastify.db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch (error) {
    request.log.error(error, 'Database health check failed');
  }

  // Check Redis
  try {
    await fastify.redis.ping();
    checks.redis = true;
  } catch (error) {
    request.log.error(error, 'Redis health check failed');
  }

  const isReady = Object.values(checks).every((v) => v === true);

  return reply.code(isReady ? 200 : 503).send({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});
```

**Load Balancer Configuration:**
```yaml
# ALB Health Check
HealthCheck:
  Path: /ready
  Protocol: HTTP
  Port: 3001
  HealthyThreshold: 2
  UnhealthyThreshold: 3
  Timeout: 5
  Interval: 30
```

**Testing:**
- [ ] `/health` returns 200 (always)
- [ ] `/ready` returns 200 when DB + Redis up
- [ ] Stop database, verify `/ready` returns 503
- [ ] Load balancer removes unhealthy instance from pool

**References:**
- Infrastructure audit report R4 (health checks)
- Risk register R4

---

### 2.6 S3 File Upload Support (8 hours)
**Current:** No file uploads (avatars, attachments blocked)
**Risk:** Missing core feature
**Fix:** Presigned URL uploads to S3

**Implementation:**
```typescript
// backend/src/routes/v1/uploads.routes.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

fastify.post('/api/v1/uploads/presign', async (request, reply) => {
  const { filename, contentType } = request.body;
  const user = request.user;

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return reply.code(400).send({ error: 'Invalid file type' });
  }

  // Validate file size (client sends size)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (request.body.size > maxSize) {
    return reply.code(400).send({ error: 'File too large (max 10MB)' });
  }

  // Generate unique key
  const key = `uploads/${user.id}/${Date.now()}-${filename}`;

  // Create presigned URL (valid for 5 minutes)
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    uploadUrl,
    key,
    expiresIn: 300,
  };
});
```

**S3 Bucket Configuration:**
```terraform
resource "aws_s3_bucket" "uploads" {
  bucket = "quokka-uploads-${var.environment}"

  # Block public access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policy (delete after 90 days)
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    id     = "delete-old-uploads"
    status = "Enabled"
    expiration {
      days = 90
    }
  }
}
```

**Frontend Integration:**
```typescript
// Upload flow
const { uploadUrl, key } = await fetch('/api/v1/uploads/presign', {
  method: 'POST',
  body: JSON.stringify({ filename: file.name, contentType: file.type }),
});

// Upload directly to S3 (no proxy through backend)
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});

// Save key to database
await createPost({ content, attachmentKey: key });
```

**Virus Scanning (Optional):**
- Use AWS S3 Antivirus Lambda (https://github.com/upsidetravel/bucket-antivirus-function)
- Scans files on upload, deletes if malware detected

**Cost:** ~$5/month (S3 storage + requests)

**Testing:**
- [ ] Request presigned URL
- [ ] Upload file to S3 via presigned URL
- [ ] Verify file exists in S3 bucket
- [ ] Attempt to upload 11MB file (expect 400)
- [ ] Attempt to upload `.exe` file (expect 400)

**References:**
- Infrastructure audit report R17 (S3 uploads)
- Risk register R18

---

## Phase 3: Type Safety & Testing (Week 3-4, 40 hours)

### Milestone: >80% test coverage, zero `any` types

### 3.1 Fix Type Safety Issues (12 hours)
**Current:** 94 `any` instances, 5 build errors
**Fix:** Remove all `any`, add proper types

**See:** `docs/audits/2025-10-21/types/TYPE-SAFETY-REPORT.md`

**Priority Fixes:**
1. Repository `fieldEquals` signature (4 hours)
2. Remove `as any` from route handlers (6 hours)
3. Fix frontend AI SDK errors (2 hours)

**References:**
- Type safety audit report
- Risk register R11, R12

---

### 3.2 Add Test Framework (8 hours)
**Current:** 0% test coverage
**Fix:** Vitest + Playwright

**Backend Unit Tests (Vitest):**
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

**Frontend E2E Tests (Playwright):**
```bash
npx playwright install
```

**Target Coverage:** >80% for:
- All repository methods
- All route handlers
- All API client modules
- Critical user flows (login, create thread, AI chat)

**References:**
- DX audit report
- Risk register R10

---

### 3.3 Fix FE/BE Contract Drift (6 hours)
**Current:** Thread tags, post endorsements, AI answer fields mismatched
**Fix:** Align DTOs with frontend types

**See:** `docs/audits/2025-10-21/contracts/FE-BE-CONTRACT-REPORT.md`

**References:**
- Contract audit report
- Risk register R14, R15

---

### 3.4 Create Shared Type Library (6 hours)
**Current:** Types duplicated between FE and BE
**Fix:** Extract `packages/types` from Zod schemas

**References:**
- Contract audit report
- Risk register R25

---

### 3.5 Add Pre-Commit Hooks (2 hours)
**Current:** No quality gates
**Fix:** Husky + lint-staged

**See:** `docs/audits/2025-10-21/CLEANUP-CHECKLIST.md` #9

**References:**
- DX audit report

---

### 3.6 Add CI/CD Pipeline (6 hours)
**Current:** No automation
**Fix:** GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

---

## Phase 4: Performance & Cost Optimization (Week 4-5, 20 hours)

### 4.1 Bundle Optimization (8 hours)
**See:** `docs/audits/2025-10-21/performance/BUNDLE-REPORT.md`

**Targets:**
- All routes <200KB
- Lighthouse >95 (desktop), >90 (mobile)

**References:**
- Performance audit report
- Risk register R16

---

### 4.2 Database Query Optimization (6 hours)
**Current:** N+1 queries (50 threads = 151 queries)
**Fix:** Add eager loading, composite indexes

**References:**
- Infrastructure audit report Section 2

---

### 4.3 Add Caching Layer (6 hours)
**Fix:** Redis caching for hot threads, course materials

**Expected Savings:** 60% reduction in DB queries

**Cost:** Already included (ElastiCache used for sessions)

---

## Phase 5: Documentation & Deployment (Week 5-6, 20 hours)

### 5.1 Deployment Infrastructure (12 hours)
- AWS ECS Fargate for backend
- Postgres RDS
- ElastiCache Redis
- S3 for uploads
- CloudFront CDN
- Route53 DNS

**Cost:** ~$200-300/month moderate traffic

---

### 5.2 Write Runbooks (4 hours)
- Disaster recovery
- Incident response
- Deployment procedures
- Database migrations
- Rollback procedures

---

### 5.3 Update Documentation (4 hours)
- API documentation (Swagger UI)
- Architecture diagrams
- Onboarding guide for new engineers

---

## Total Effort Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| **Phase 1: Security & Auth** | Week 1-2 | 40 hours | P0 |
| **Phase 2: Infrastructure** | Week 2-3 | 40 hours | P0 |
| **Phase 3: Type Safety & Testing** | Week 3-4 | 40 hours | P1 |
| **Phase 4: Performance** | Week 4-5 | 20 hours | P2 |
| **Phase 5: Deployment & Docs** | Week 5-6 | 20 hours | P1 |
| **TOTAL** | **6 weeks** | **160 hours** | |

**Team Size:** 1-2 engineers
**Timeline:** 4-6 weeks (with 2 engineers working in parallel)

---

## Production Readiness Checklist

### Security ✅
- [ ] Real password authentication (bcrypt)
- [ ] RBAC enforcement on protected endpoints
- [ ] Row-level security (RLS) for multi-tenancy
- [ ] Rate limiting (auth, AI, general API)
- [ ] API keys moved server-side
- [ ] Redis session storage
- [ ] Hardcoded secrets removed
- [ ] Audit logging enabled
- [ ] CSRF protection
- [ ] No dependency vulnerabilities

### Infrastructure ✅
- [ ] Postgres database deployed (RDS)
- [ ] Connection pooling configured
- [ ] Automated backups enabled (7-day retention)
- [ ] Disaster recovery runbook documented
- [ ] Monitoring & dashboards deployed
- [ ] Alerting configured (PagerDuty)
- [ ] PII scrubbing in logs
- [ ] Health checks verify dependencies
- [ ] S3 file uploads working
- [ ] Staging environment deployed

### Code Quality ✅
- [ ] Zero TypeScript errors
- [ ] No `any` types in production code
- [ ] >80% test coverage on critical paths
- [ ] All ESLint violations fixed
- [ ] FE/BE contracts aligned
- [ ] Shared type library created
- [ ] Pre-commit hooks installed
- [ ] CI/CD pipeline deployed

### Performance ✅
- [ ] All routes <200KB
- [ ] Lighthouse scores ≥95 (desktop), ≥90 (mobile)
- [ ] Database queries optimized (no N+1)
- [ ] Redis caching implemented
- [ ] CDN configured (CloudFront)

### Operational ✅
- [ ] SLO targets defined (99.9% uptime, <500ms p95)
- [ ] Incident response runbook written
- [ ] On-call rotation established
- [ ] Backup restoration tested
- [ ] Load testing completed
- [ ] Security penetration testing done
- [ ] API documentation published (Swagger)
- [ ] Architecture diagrams updated

---

## Cost Estimate (Production)

| Service | Type | Cost/Month |
|---------|------|------------|
| **Compute** | ECS Fargate (2 tasks) | $30 |
| **Database** | RDS Postgres (db.t3.micro) | $15 |
| **Cache** | ElastiCache Redis (t3.micro) | $12 |
| **Storage** | S3 (uploads + backups) | $5 |
| **CDN** | CloudFront | $10 |
| **Monitoring** | CloudWatch | $8 |
| **Misc** | Route53, Secrets Manager | $5 |
| **TOTAL** | | **~$85/month** |

**Scaling:** +$50/month per 10K active users

---

## Success Metrics

**Before Production:**
- Type safety: 75/100 → 100/100
- Test coverage: 0% → >80%
- Security score: 60/100 → 95/100
- Infrastructure score: 20/100 → 95/100
- Production readiness: 65/100 → 95/100

**After Production Launch:**
- Uptime: >99.9%
- p95 latency: <500ms
- Error rate: <1%
- Mean time to recovery (MTTR): <30 minutes
- Customer satisfaction: >4.5/5

---

**Plan Owner:** Engineering Leadership
**Timeline:** 6 weeks
**Status:** Ready to execute after Plan 1 (demo fixes) complete
**Next Review:** After Phase 1 completion (Week 2)
