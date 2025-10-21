# QuokkaQ STRIDE Threat Model
**Date:** 2025-10-21
**Scope:** Full-stack application (Browser → Next.js → Fastify → Database)
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

---

## Architecture Overview

```
┌─────────────┐      HTTPS       ┌──────────────┐      HTTP       ┌──────────────┐
│   Browser   │ ──────────────▶  │  Next.js     │ ──────────────▶ │   Fastify    │
│  (Client)   │ ◀────────────── │  Frontend    │ ◀────────────── │   Backend    │
└─────────────┘                  └──────────────┘                  └──────────────┘
      │                                 │                                 │
      │ localStorage                    │ Server Components               │
      │ sessionStorage                  │ API Routes                      │ SQL
      │ Cookies                         │                                 │
      │                                 │                           ┌─────▼────────┐
      │                                 │                           │   SQLite/    │
      │                                 │                           │  Postgres    │
      │                                 │                           └──────────────┘
      │
      │ WebSocket (future)
      │ LLM API (OpenAI/Anthropic)
      │
┌─────▼────────┐
│   External   │
│   Services   │
└──────────────┘
```

**Trust Boundaries:**
1. **Browser ↔ Next.js:** Public internet, untrusted
2. **Next.js ↔ Fastify:** Internal network (localhost in dev, VPC in prod), semi-trusted
3. **Fastify ↔ Database:** Internal network, trusted
4. **Browser ↔ LLM APIs:** Public internet, trusted service (but API key exposure risk)

---

## STRIDE Analysis by Component

### 1. Browser (Client-Side)

#### 1.1 Spoofing Identity

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Cookie theft via XSS** | Attacker injects script to steal `quokka.session` cookie | User impersonation | Low | 🟡 MEDIUM | ✅ HttpOnly cookies prevent JS access |
| **localStorage poisoning** | Attacker modifies localStorage data (mock conversations) | Data corruption | Medium | 🟢 LOW | ✅ Local-only, no server trust |
| **Session hijacking** | Attacker intercepts session cookie over HTTP | Full account takeover | Low | 🟡 MEDIUM | ✅ Secure=true in production |

**Residual Risk:** 🟢 LOW (mitigations in place)

#### 1.2 Tampering with Data

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **DOM manipulation** | Attacker uses DevTools to modify UI state | Client-side only | High | 🟢 LOW | ✅ Server validates all mutations |
| **Request tampering** | Attacker modifies API request payload | Invalid data submission | Medium | 🟡 MEDIUM | ✅ Zod validation on backend |
| **Cookie tampering** | Attacker modifies session cookie | Session validation fails | Low | 🟢 LOW | ✅ Signed cookies (HMAC) |

**Residual Risk:** 🟢 LOW (server-side validation)

#### 1.3 Repudiation

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Deny posting offensive content** | User claims "I didn't post that" | Accountability loss | Medium | 🟡 MEDIUM | ❌ No audit logs for posts |
| **Deny login activity** | User claims "Someone else logged in" | Forensic investigation impossible | Low | 🟡 MEDIUM | ❌ No login audit logs |

**Residual Risk:** 🟡 MEDIUM (no audit logging)

**Mitigation Plan:**
```typescript
// Add audit_logs table
export const auditLogs = sqliteTable("audit_logs", {
  id: uuidColumn("id"),
  userId: uuidRefNotNull("user_id"),
  action: text("action").notNull(), // 'login', 'post_create', 'thread_create'
  resourceType: text("resource_type"), // 'thread', 'post', 'session'
  resourceId: uuidRef("resource_id"),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  metadata: text("metadata"), // JSON
  createdAt: text("created_at").notNull(),
  tenantId: uuidRefNotNull("tenant_id"),
});
```

#### 1.4 Information Disclosure

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **API keys visible in browser** | Developer inspects network tab, finds `NEXT_PUBLIC_OPENAI_API_KEY` | API key theft, cost overruns | High | 🟡 MEDIUM | ⚠️ Documented as demo-only |
| **localStorage inspection** | Attacker reads conversations from localStorage | Privacy violation | Medium | 🟢 LOW | ✅ Local-only, no sensitive PII |
| **Source map leakage** | Production builds expose .map files with source code | Code logic disclosure | Low | 🟢 LOW | ℹ️ Check build config |

**Residual Risk:** 🟡 MEDIUM (API keys exposed)

**Mitigation Plan:**
```typescript
// Move to server-side API route
// app/api/ai-chat/route.ts
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Server-only
  });

  // Rate limiting per user
  const rateLimitOk = await checkRateLimit(session.userId, "ai-chat", 20); // 20 req/hour
  if (!rateLimitOk) return new Response("Rate limit exceeded", { status: 429 });

  // Proxy request
  const stream = await openai.chat.completions.create({...});
  return new Response(stream);
}
```

#### 1.5 Denial of Service

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Client-side DoS** | Malicious script enters infinite loop | Browser tab freezes | Low | 🟢 LOW | ✅ React error boundaries |
| **LocalStorage bomb** | Attacker fills localStorage (5MB limit) | App stops working | Low | 🟢 LOW | ✅ Auto-purging old messages |

**Residual Risk:** 🟢 LOW (low impact)

#### 1.6 Elevation of Privilege

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Role manipulation in UI** | Student modifies localStorage `role: "student"` → `role: "instructor"` | UI shows instructor features | High | 🟢 LOW | ✅ Backend validates role |
| **Bypassing client-side checks** | Attacker disables UI validation to submit invalid data | Invalid data sent to server | Medium | 🟢 LOW | ✅ Server-side Zod validation |

**Residual Risk:** 🟢 LOW (server-side enforcement)

---

### 2. Next.js Frontend (Server Components + API Routes)

#### 2.1 Spoofing Identity

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Session cookie forgery** | Attacker crafts valid-looking cookie without signature | Authentication bypass | Low | 🟢 LOW | ✅ Backend validates signed cookies |
| **Server-side request forgery (SSRF)** | Attacker manipulates API route to make requests to internal services | Internal network access | Low | 🟢 LOW | ℹ️ No user-controlled URLs in API routes |

**Residual Risk:** 🟢 LOW (mitigations in place)

#### 2.2 Tampering with Data

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **React component props injection** | Attacker injects malicious props via URL parameters | XSS attack | Low | 🟢 LOW | ✅ React auto-escapes output |
| **Cache poisoning** | Attacker poisons Next.js data cache with malicious content | Serves bad data to users | Low | 🟢 LOW | ✅ Cache invalidation on mutations |

**Residual Risk:** 🟢 LOW (React security model)

#### 2.3 Repudiation

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Server action repudiation** | User denies triggering server action | Accountability loss | Low | 🟡 MEDIUM | ❌ No server action audit logs |

**Residual Risk:** 🟡 MEDIUM (no audit logging)

#### 2.4 Information Disclosure

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Environment variable leakage** | `.env.local` accidentally committed to git | Secret exposure | Low | 🟢 LOW | ✅ .gitignore includes .env* |
| **Error message disclosure** | Production error shows stack trace with file paths | Code structure revealed | Low | 🟡 MEDIUM | ⚠️ Check error handling in production |

**Residual Risk:** 🟡 MEDIUM (verify error handling)

**Mitigation Plan:**
```typescript
// app/error.tsx
export default function Error({ error }: { error: Error }) {
  if (process.env.NODE_ENV === 'production') {
    return <div>Something went wrong. Please try again.</div>;
  }
  return <div>{error.message}</div>; // Stack trace only in dev
}
```

#### 2.5 Denial of Service

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Infinite loop in server component** | Bug causes server component to hang | Server resources exhausted | Low | 🟡 MEDIUM | ⚠️ Add request timeout |
| **Large response body** | Attacker requests paginated list with limit=999999 | Memory exhaustion | Medium | 🟡 MEDIUM | ✅ Max limit capped at 100 |

**Residual Risk:** 🟡 MEDIUM (add timeout middleware)

#### 2.6 Elevation of Privilege

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Next.js middleware bypass** | Attacker finds unprotected route | Unauthorized access | Low | 🟢 LOW | ℹ️ No auth middleware in Next.js (handled by backend) |

**Residual Risk:** 🟢 LOW (stateless frontend)

---

### 3. Fastify Backend (API Server)

#### 3.1 Spoofing Identity

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Email enumeration** | Attacker tests `/auth/dev-login` to find valid emails | User enumeration | High | 🟡 MEDIUM | ❌ Returns "User not found" (leaks info) |
| **Session cookie prediction** | Attacker predicts session cookie value | Authentication bypass | Low | 🟢 LOW | ✅ Cryptographically random UUIDs |
| **Weak session secret** | Hardcoded secret allows forging cookies | Full system compromise | Medium | 🔴 HIGH | ❌ Fallback secret in code |

**Residual Risk:** 🔴 HIGH (hardcoded secret)

**Mitigation Plan:**
```typescript
// Remove fallback
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set and at least 32 characters");
}

// Generic error messages
if (!user) {
  throw new UnauthorizedError("Invalid credentials"); // Don't say "User not found"
}
```

#### 3.2 Tampering with Data

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **SQL injection** | Attacker injects SQL in query parameters | Database takeover | Low | 🟢 LOW | ✅ Drizzle ORM uses parameterized queries |
| **Request body tampering** | Attacker modifies JSON payload to inject malicious data | Data corruption | Medium | 🟡 MEDIUM | ✅ Zod validation rejects invalid schemas |
| **Path traversal** | Attacker uses `../` in file paths | Access to arbitrary files | Low | 🟢 LOW | ℹ️ No file upload/download endpoints |

**Residual Risk:** 🟢 LOW (ORM + validation)

**Evidence (SQL Injection Protection):**
```typescript
// Drizzle ORM uses parameterized queries automatically
const thread = await db
  .select()
  .from(threads)
  .where(eq(threads.id, id)) // Safe: id is passed as parameter
  .limit(1);

// NOT vulnerable to:
// SELECT * FROM threads WHERE id = '1' OR '1'='1' --
```

#### 3.3 Repudiation

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Deny API abuse** | User denies making 10,000 requests | Accountability loss | Medium | 🟡 MEDIUM | ❌ No request audit logs |
| **Deny data modification** | User denies deleting thread | Forensic investigation impossible | Low | 🟡 MEDIUM | ❌ No modification audit logs |

**Residual Risk:** 🟡 MEDIUM (no audit logging)

**Mitigation Plan:**
```typescript
// Pino logger with request tracking
fastify.addHook("onRequest", async (request, reply) => {
  request.log.info({
    userId: request.session?.userId,
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });
});
```

#### 3.4 Information Disclosure

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Tenant ID leakage** | Attacker guesses another tenant's ID and accesses their data | Data breach | Medium | 🔴 HIGH | ❌ No RLS enforcement |
| **Error stack traces** | Production API returns stack traces | Code structure revealed | Low | 🟡 MEDIUM | ⚠️ Check error handler |
| **Database schema disclosure** | Attacker infers schema from error messages | Easier targeted attacks | Low | 🟢 LOW | ✅ Generic error messages |

**Residual Risk:** 🔴 HIGH (no RLS)

**Mitigation Plan:**
```typescript
// Enforce RLS in every query
fastify.addHook("onRequest", async (request) => {
  if (request.session) {
    request.tenantId = request.session.tenantId;
  }
});

// BaseRepository.buildWhere()
if (this.request.tenantId) {
  conditions.push(eq(this.table.tenantId, this.request.tenantId));
}
```

#### 3.5 Denial of Service

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Brute-force login** | Attacker tries 1,000 passwords/second | Account lockout, server overload | High | 🔴 HIGH | ❌ No rate limiting |
| **Large payload attack** | Attacker sends 100MB JSON body | Memory exhaustion | Medium | 🟡 MEDIUM | ⚠️ Add body size limit |
| **Regex DoS (ReDoS)** | Attacker sends input that causes regex catastrophic backtracking | CPU exhaustion | Low | 🟢 LOW | ✅ No user-controlled regex |

**Residual Risk:** 🔴 HIGH (no rate limiting)

**Mitigation Plan:**
```typescript
// Add rate limiting
await fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
});

// Add body size limit
await fastify.register(fastify, {
  bodyLimit: 1048576, // 1MB
});
```

#### 3.6 Elevation of Privilege

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **RBAC bypass** | Student accesses instructor-only endpoint `/api/v1/instructor/metrics` | Unauthorized data access | High | 🔴 HIGH | ❌ No role checks on instructor routes |
| **Session role tampering** | Attacker modifies session cookie to change role | Privilege escalation | Low | 🟢 LOW | ✅ Signed cookies prevent tampering |
| **Missing authorization checks** | Endpoints only check authentication, not authorization | Horizontal privilege escalation | High | 🔴 HIGH | ❌ No resource ownership checks |

**Residual Risk:** 🔴 HIGH (no RBAC enforcement)

**Mitigation Plan:**
```typescript
// Add RBAC middleware
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.session) {
      throw new UnauthorizedError("Not authenticated");
    }
    if (!roles.includes(request.session.role)) {
      throw new ForbiddenError(`Required roles: ${roles.join(", ")}`);
    }
  };
}

// Apply to routes
server.get(
  "/instructor/metrics",
  {
    preHandler: requireRole("instructor", "ta"),
  },
  async (request, reply) => {
    // ...
  }
);

// Add resource ownership checks
const thread = await threadsRepository.findById(threadId);
if (thread.authorId !== request.session.userId) {
  throw new ForbiddenError("You can only edit your own threads");
}
```

---

### 4. Database (SQLite / PostgreSQL)

#### 4.1 Spoofing Identity

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Database credential theft** | Attacker steals `DATABASE_URL` from environment | Full database access | Low | 🟡 MEDIUM | ✅ .env files gitignored |

**Residual Risk:** 🟡 MEDIUM (secure credentials management)

#### 4.2 Tampering with Data

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Direct database modification** | Attacker with DB access modifies records | Data integrity loss | Low | 🟡 MEDIUM | ⚠️ No integrity checks |
| **Database backup tampering** | Attacker modifies backup files | Corrupted restore | Low | 🟢 LOW | ℹ️ Not implemented yet |

**Residual Risk:** 🟡 MEDIUM (add integrity checks)

**Mitigation Plan:**
```sql
-- Add triggers for audit trail (PostgreSQL)
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY,
  table_name TEXT,
  record_id UUID,
  operation TEXT, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER threads_audit
AFTER UPDATE ON threads
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
```

#### 4.3 Repudiation

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Deny database changes** | DBA claims "I didn't delete that table" | Accountability loss | Low | 🟡 MEDIUM | ❌ No database audit logs |

**Residual Risk:** 🟡 MEDIUM (enable PostgreSQL audit logs)

#### 4.4 Information Disclosure

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Database file theft** | Attacker accesses `dev.db` file on server | Full data breach | Low | 🔴 HIGH | ❌ No encryption at rest |
| **Backup exposure** | Backup files stored in public S3 bucket | Full data breach | Low | 🔴 HIGH | ⚠️ Ensure backups are encrypted |

**Residual Risk:** 🔴 HIGH (no encryption at rest)

**Mitigation Plan:**
```bash
# PostgreSQL encryption at rest
# Enable pgcrypto extension
CREATE EXTENSION pgcrypto;

# Encrypt sensitive columns
ALTER TABLE users
  ADD COLUMN email_encrypted BYTEA;

UPDATE users
  SET email_encrypted = pgp_sym_encrypt(email, current_setting('app.encryption_key'));

# SQLite encryption
# Use SQLCipher for encryption at rest
npm install @journeyapps/sqlcipher
```

#### 4.5 Denial of Service

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Database connection exhaustion** | Attacker opens 10,000 connections | Database unavailable | Medium | 🟡 MEDIUM | ⚠️ Add connection pool limits |
| **Expensive query attack** | Attacker triggers query without indexes | Slow queries, timeouts | Low | 🟢 LOW | ✅ Indexes on common queries |

**Residual Risk:** 🟡 MEDIUM (add connection limits)

**Mitigation Plan:**
```typescript
// Drizzle connection pool
const db = drizzle(new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}));
```

#### 4.6 Elevation of Privilege

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **SQL injection to admin** | Attacker injects SQL to grant themselves admin role | Full system takeover | Low | 🟢 LOW | ✅ ORM prevents injection |

**Residual Risk:** 🟢 LOW (ORM protection)

---

### 5. External Services (LLM APIs)

#### 5.1 Spoofing Identity

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Man-in-the-Middle (MITM)** | Attacker intercepts API requests to OpenAI | API key theft | Low | 🟢 LOW | ✅ HTTPS enforced by API providers |

**Residual Risk:** 🟢 LOW (HTTPS)

#### 5.2 Tampering with Data

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Prompt injection** | User crafts prompt to manipulate AI output | AI generates malicious content | Medium | 🟡 MEDIUM | ⚠️ Add content moderation |

**Residual Risk:** 🟡 MEDIUM (add content filters)

**Mitigation Plan:**
```typescript
// Add prompt sanitization
function sanitizePrompt(prompt: string): string {
  // Remove system-level commands
  return prompt
    .replace(/^system:/gi, "")
    .replace(/ignore previous instructions/gi, "");
}

// Add content moderation
const response = await openai.moderations.create({
  input: userMessage,
});

if (response.results[0].flagged) {
  throw new Error("Content violates usage policy");
}
```

#### 5.3 Repudiation

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Deny AI abuse** | User denies sending 1,000 AI requests | Cost attribution impossible | Low | 🟡 MEDIUM | ❌ No AI request audit logs |

**Residual Risk:** 🟡 MEDIUM (log AI requests)

#### 5.4 Information Disclosure

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **API key exposure** | API key visible in browser network tab | Unauthorized API usage | High | 🟡 MEDIUM | ❌ Client-side API keys |
| **PII leakage to LLM** | User content with PII sent to OpenAI | Privacy violation | Medium | 🟡 MEDIUM | ⚠️ Add PII detection |

**Residual Risk:** 🟡 MEDIUM (move keys server-side + PII detection)

**Mitigation Plan:**
```typescript
// PII detection before sending to LLM
import { pinataPiiDetector } from 'pii-detector';

const piiFound = pinataPiiDetector.detect(userMessage);
if (piiFound.length > 0) {
  return {
    error: "Please don't include personal information (email, SSN, phone) in messages",
  };
}
```

#### 5.5 Denial of Service

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Cost-based DoS** | Attacker sends 10,000 AI requests | $1,000+ bill | High | 🔴 HIGH | ❌ No cost limits per user |

**Residual Risk:** 🔴 HIGH (add cost caps)

**Mitigation Plan:**
```typescript
// Track costs per user
const costTracker = {
  async addCost(userId: string, cost: number): Promise<void> {
    const dailyCost = await redis.get(`cost:${userId}:${today}`);
    if ((dailyCost || 0) + cost > MAX_DAILY_COST) {
      throw new Error("Daily cost limit exceeded");
    }
    await redis.incrby(`cost:${userId}:${today}`, cost);
  },
};
```

#### 5.6 Elevation of Privilege

| Threat | Attack Scenario | Impact | Likelihood | Risk | Mitigation |
|--------|-----------------|--------|------------|------|------------|
| **Jailbreak prompts** | User tricks AI into revealing system prompts | System knowledge disclosure | Low | 🟢 LOW | ℹ️ OpenAI has built-in protections |

**Residual Risk:** 🟢 LOW (provider handles)

---

## Summary of Critical Threats

### P0 - Critical (Fix Before Production)

| ID | Threat | Component | STRIDE Category | Risk | Mitigation |
|----|--------|-----------|-----------------|------|------------|
| T1 | Hardcoded session secret | Backend | Spoofing | 🔴 HIGH | Remove fallback, require env var |
| T2 | No RBAC on instructor endpoints | Backend | Elevation of Privilege | 🔴 HIGH | Add `requireRole()` middleware |
| T3 | No row-level security (RLS) | Backend/DB | Information Disclosure | 🔴 HIGH | Enforce tenantId in all queries |
| T4 | No rate limiting on login | Backend | Denial of Service | 🔴 HIGH | Add `@fastify/rate-limit` |
| T5 | API keys in browser | Frontend | Information Disclosure | 🟡 MEDIUM | Move to server-side API routes |
| T6 | No cost caps on AI requests | External | Denial of Service | 🔴 HIGH | Implement per-user cost tracking |
| T7 | No encryption at rest | Database | Information Disclosure | 🔴 HIGH | Use SQLCipher or pgcrypto |

### P1 - High (Fix Within 1 Month)

| ID | Threat | Component | STRIDE Category | Risk | Mitigation |
|----|--------|-----------|-----------------|------|------------|
| T8 | No audit logging | Backend | Repudiation | 🟡 MEDIUM | Add audit_logs table |
| T9 | Email enumeration | Backend | Spoofing | 🟡 MEDIUM | Generic error messages |
| T10 | Prompt injection | External | Tampering | 🟡 MEDIUM | Sanitize prompts, add moderation |
| T11 | PII leakage to LLM | External | Information Disclosure | 🟡 MEDIUM | PII detection before LLM calls |
| T12 | No resource ownership checks | Backend | Elevation of Privilege | 🟡 MEDIUM | Verify user owns resource before edit |

---

## Threat Modeling Process

**Methodology:** STRIDE (Microsoft Security Development Lifecycle)

1. **Identify assets:** User accounts, threads, posts, AI conversations, API keys
2. **Decompose application:** Browser → Next.js → Fastify → Database → External APIs
3. **Identify threats:** Apply STRIDE to each component
4. **Document threats:** Record attack scenarios, impact, likelihood
5. **Rate threats:** Risk = Impact × Likelihood
6. **Mitigation:** Propose controls for each threat

**Next Steps:**
1. Implement P0 mitigations (7 critical threats)
2. Re-run threat model after mitigations
3. Conduct penetration testing
4. Update threat model quarterly

---

**Threat Model Version:** 1.0
**Last Updated:** 2025-10-21
**Next Review:** 2026-01-21 (quarterly)
