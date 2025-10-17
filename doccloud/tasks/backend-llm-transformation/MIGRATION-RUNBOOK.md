# Backend LLM Migration Runbook

**Version:** 1.0
**Last Updated:** 2025-10-17
**Status:** Ready for Production Integration

---

## Overview

This runbook provides step-by-step instructions for migrating the QuokkaQ demo from its current **mock LLM implementation** to a **production-ready backend** with real LLM integration, course materials, and conversation storage.

### Current Architecture (Mock)

```
Client (Browser)
  ├── React Query Hooks (lib/api/hooks.ts)
  ├── Mock API Client (lib/api/client.ts)
  │   ├── LLM Provider Layer (lib/llm/)
  │   │   ├── BaseLLMProvider (abstract)
  │   │   ├── OpenAIProvider (GPT-4o-mini)
  │   │   └── AnthropicProvider (Claude 3 Haiku)
  │   ├── Context Builder (lib/context/)
  │   │   ├── CourseContextBuilder (single course)
  │   │   └── MultiCourseContextBuilder (multi-course with auto-detection)
  │   └── localStorage (lib/store/localStore.ts)
  │       ├── Threads (public)
  │       ├── Conversations (private)
  │       └── Messages
  └── Course Materials (mocks/course-materials.json)
```

### Target Architecture (Production)

```
Client (Browser)
  ├── React Query Hooks (NO CHANGES)
  └── API Routes (app/api/*)
      └── Backend API
          ├── LLM Service
          │   ├── AWS Bedrock (Claude 3)
          │   └── Context Builder
          ├── Database (PostgreSQL)
          │   ├── Threads
          │   ├── Conversations
          │   ├── Messages
          │   └── Course Materials
          └── Vector Store (Pinecone/pgvector)
              └── Course Material Embeddings
```

---

## Migration Phases

### Phase 1: Backend API Setup (Backend Team)

**Estimate:** 1-2 weeks

#### 1.1 Database Schema

Create tables for:

```sql
-- Threads (public discussions)
CREATE TABLE threads (
  id VARCHAR(50) PRIMARY KEY,
  course_id VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  tags TEXT[],
  views INTEGER DEFAULT 0,
  has_ai_answer BOOLEAN DEFAULT false,
  ai_answer_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- AI Conversations (private)
CREATE TABLE ai_conversations (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  course_id VARCHAR(50),
  title TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- AI Messages
CREATE TABLE ai_messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

-- Course Materials
CREATE TABLE course_materials (
  id VARCHAR(50) PRIMARY KEY,
  course_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'lecture' | 'slide' | 'reading' | 'assignment' | 'note'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[],
  week INTEGER,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Material Embeddings (for semantic search)
CREATE TABLE material_embeddings (
  id SERIAL PRIMARY KEY,
  material_id VARCHAR(50) NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  FOREIGN KEY (material_id) REFERENCES course_materials(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_threads_course ON threads(course_id);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_materials_course ON course_materials(course_id);
```

#### 1.2 API Routes

Create Next.js API routes matching the mock API:

```typescript
// app/api/threads/route.ts
export async function GET(request: Request) {
  // Fetch threads from database
  const threads = await db.query.threads.findMany();
  return Response.json(threads);
}

// app/api/threads/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, params.id),
  });
  return Response.json(thread);
}

// app/api/conversations/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const conversation = await db.insert(aiConversations).values({
    id: generateId('conv'),
    userId: body.userId,
    courseId: body.courseId,
    title: body.title,
    messageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return Response.json(conversation);
}

// app/api/conversations/[id]/messages/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  // Create user message
  const userMessage = await db.insert(aiMessages).values({
    id: generateId('msg'),
    conversationId: params.id,
    role: 'user',
    content: body.content,
    timestamp: new Date(),
  });

  // Generate AI response (call LLM service)
  const aiResponse = await generateAIResponse(params.id, body.content);

  const aiMessage = await db.insert(aiMessages).values({
    id: generateId('msg'),
    conversationId: params.id,
    role: 'assistant',
    content: aiResponse.content,
    timestamp: new Date(),
  });

  return Response.json({ userMessage, aiMessage });
}
```

#### 1.3 LLM Service (Server-Side)

Move LLM provider layer to server:

```typescript
// lib/server/llm/index.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export async function generateAIResponse(
  conversationId: string,
  userMessage: string
): Promise<{ content: string; citations: Citation[] }> {
  const client = new BedrockRuntimeClient({ region: "us-east-1" });

  // Fetch conversation context
  const conversation = await db.query.aiConversations.findFirst({
    where: eq(aiConversations.id, conversationId),
  });

  // Build course context
  const materials = await db.query.courseMaterials.findMany({
    where: eq(courseMaterials.courseId, conversation.courseId),
  });

  const context = buildCourseContext(
    conversation.course,
    materials,
    userMessage,
    { maxMaterials: 5, minRelevance: 30, maxTokens: 2000 }
  );

  // Call Bedrock Claude 3
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: buildUserPromptWithContext(
            userMessage,
            context.materials,
            conversation.course.code,
            conversation.course.name
          ),
        },
      ],
      system: buildSystemPrompt(),
    }),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));

  return {
    content: result.content[0].text,
    citations: extractCitations(context.materials),
  };
}
```

---

### Phase 2: Frontend Migration (Frontend Team)

**Estimate:** 1 week

#### 2.1 Update API Client

Replace mock implementation with HTTP fetch:

```typescript
// lib/api/client.ts (BEFORE)
export const api = {
  async getThreads(): Promise<Thread[]> {
    await delay(200 + Math.random() * 300);
    seedData();
    return getThreads();
  },
};

// lib/api/client.ts (AFTER)
export const api = {
  async getThreads(): Promise<Thread[]> {
    const response = await fetch('/api/threads', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch threads');
    return response.json();
  },
};
```

#### 2.2 Remove localStorage Persistence

Delete `lib/store/localStore.ts` - no longer needed since data is in database.

#### 2.3 Update React Query Hooks

**NO CHANGES REQUIRED!** Hooks remain identical - they already use the API client abstraction.

```typescript
// lib/api/hooks.ts (NO CHANGES)
export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads,
    queryFn: () => api.getThreads(), // ← Already abstracted!
    staleTime: 2 * 60 * 1000,
  });
}
```

#### 2.4 Remove LLM Environment Variables

Remove client-side LLM configuration from `.env.local`:

```bash
# DELETE these (move to server-side .env):
NEXT_PUBLIC_OPENAI_API_KEY=...
NEXT_PUBLIC_ANTHROPIC_API_KEY=...
NEXT_PUBLIC_USE_LLM=...
```

Add server-side environment variables:

```bash
# Server-side only (not exposed to client)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
DATABASE_URL=postgresql://user:pass@host:5432/quokkaq
```

---

### Phase 3: Data Migration

**Estimate:** 3-5 days

#### 3.1 Export Mock Data

Run script to export current localStorage data:

```typescript
// scripts/export-mock-data.ts
import fs from 'fs';

const data = {
  threads: localStorage.getItem('quokkaq.threads'),
  conversations: localStorage.getItem('quokkaq.aiConversations'),
  messages: localStorage.getItem('quokkaq.conversationMessages'),
  materials: localStorage.getItem('quokkaq.courseMaterials'),
};

fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
```

#### 3.2 Import to Database

```typescript
// scripts/import-to-database.ts
import { db } from '@/lib/db';
import data from './data-export.json';

// Import threads
for (const thread of JSON.parse(data.threads)) {
  await db.insert(threads).values(thread);
}

// Import conversations
for (const conv of JSON.parse(data.conversations)) {
  await db.insert(aiConversations).values(conv);
}

// Import messages
for (const msg of JSON.parse(data.messages)) {
  await db.insert(aiMessages).values(msg);
}

// Import course materials
for (const material of JSON.parse(data.materials)) {
  await db.insert(courseMaterials).values(material);
}
```

#### 3.3 Generate Embeddings

```typescript
// scripts/generate-embeddings.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const materials = await db.query.courseMaterials.findMany();

for (const material of materials) {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: `${material.title}\n\n${material.content}`,
  });

  await db.insert(materialEmbeddings).values({
    materialId: material.id,
    embedding: embedding.data[0].embedding,
  });
}
```

---

### Phase 4: Testing & Validation

**Estimate:** 1 week

#### 4.1 Integration Tests

```typescript
// tests/api/threads.test.ts
import { test, expect } from '@playwright/test';

test('should fetch threads from API', async ({ request }) => {
  const response = await request.get('/api/threads');
  expect(response.ok()).toBeTruthy();
  const threads = await response.json();
  expect(threads.length).toBeGreaterThan(0);
});

test('should create conversation and send message', async ({ request }) => {
  const conv = await request.post('/api/conversations', {
    data: { userId: 'user-1', courseId: 'course-1', title: 'Test' },
  });
  const { id } = await conv.json();

  const msg = await request.post(`/api/conversations/${id}/messages`, {
    data: { content: 'What is binary search?' },
  });
  const { userMessage, aiMessage } = await msg.json();

  expect(userMessage.content).toBe('What is binary search?');
  expect(aiMessage.role).toBe('assistant');
  expect(aiMessage.content.length).toBeGreaterThan(0);
});
```

#### 4.2 Load Testing

```bash
# Use k6 or Artillery to test LLM latency
k6 run load-tests/ai-conversations.js
```

#### 4.3 Cost Monitoring

```typescript
// lib/server/monitoring/cost-tracking.ts
export async function trackLLMCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
) {
  const cost = calculateCost(modelId, inputTokens, outputTokens);

  await db.insert(llmCosts).values({
    timestamp: new Date(),
    modelId,
    inputTokens,
    outputTokens,
    cost,
  });

  // Alert if daily cost exceeds threshold
  const dailyCost = await getDailyCost();
  if (dailyCost > 100) {
    sendAlert(`Daily LLM cost exceeded: $${dailyCost}`);
  }
}
```

---

### Phase 5: Deployment

**Estimate:** 2-3 days

#### 5.1 Pre-Deployment Checklist

- [ ] All environment variables migrated to server-side
- [ ] Database schema applied and tested
- [ ] Course material embeddings generated
- [ ] API routes deployed and accessible
- [ ] LLM service tested with AWS Bedrock
- [ ] Cost monitoring and alerting enabled
- [ ] Load testing passed (< 2s p95 latency)
- [ ] Integration tests passing (100%)
- [ ] Security audit completed (API keys, RLS, rate limiting)

#### 5.2 Deployment Steps

1. **Deploy Database:**
   ```bash
   # Run migrations
   npm run db:migrate

   # Seed with production data
   npm run db:seed:prod
   ```

2. **Deploy Backend:**
   ```bash
   # Build and deploy
   npm run build
   vercel --prod
   ```

3. **Monitor:**
   ```bash
   # Watch logs
   vercel logs --follow

   # Monitor LLM costs
   npm run monitor:costs
   ```

#### 5.3 Rollback Plan

If issues occur:

1. **Switch API client back to mock:**
   ```typescript
   // lib/api/client.ts
   export const USE_MOCK_API = true; // Emergency rollback
   ```

2. **Revert database:**
   ```bash
   npm run db:rollback
   ```

3. **Monitor error rates:**
   - Check Sentry/DataDog for spikes
   - Review LLM latency metrics
   - Check database query performance

---

## Validation Checklist

Before marking migration complete:

### Functionality
- [ ] All thread operations work (create, read, update)
- [ ] Conversations create and store messages
- [ ] AI responses generate correctly
- [ ] Conversation → thread conversion works
- [ ] Citations reference correct course materials
- [ ] Multi-course auto-detection works

### Performance
- [ ] API response times < 500ms (p95)
- [ ] LLM response times < 2s (p95)
- [ ] Database queries optimized (indexes added)
- [ ] No N+1 queries

### Security
- [ ] API keys stored server-side only
- [ ] Row-level security (RLS) enabled
- [ ] Rate limiting per user (20 req/min)
- [ ] Input validation and sanitization
- [ ] CORS configured correctly

### Monitoring
- [ ] LLM cost tracking enabled
- [ ] Error logging configured
- [ ] Performance metrics collected
- [ ] Alerting rules set up

---

## Maintenance

### Daily
- Monitor LLM costs
- Check error logs
- Review slow queries

### Weekly
- Analyze conversation patterns
- Review cost trends
- Update course materials

### Monthly
- Optimize vector search performance
- Regenerate embeddings if materials updated
- Review and tune LLM prompts

---

## Support Contacts

- **Backend Lead:** [Name] - [Email]
- **Frontend Lead:** [Name] - [Email]
- **DevOps:** [Name] - [Email]
- **AWS Support:** [Account Manager]

---

## Appendix

### A. Mock vs Production Comparison

| Feature | Mock (Current) | Production (Target) |
|---------|----------------|---------------------|
| **Storage** | localStorage | PostgreSQL + pgvector |
| **LLM** | OpenAI/Anthropic (client) | AWS Bedrock Claude 3 (server) |
| **Auth** | Mock sessions | NextAuth.js + LTI |
| **Context** | In-memory ranking | Vector search + reranking |
| **Cost** | Free (own API keys) | $0.25/1M tokens (Bedrock) |
| **Latency** | Simulated (800ms) | Real (<2s p95) |

### B. Environment Variables Reference

**Client-side (NEXT_PUBLIC_*):**
```bash
# Remove all LLM config - move to server
```

**Server-side (.env):**
```bash
# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Database
DATABASE_URL=postgresql://...

# Monitoring
SENTRY_DSN=...
DATADOG_API_KEY=...

# Limits
MAX_DAILY_LLM_COST=100
MAX_REQUESTS_PER_MINUTE=20
```

### C. API Response Format

All API responses follow this format:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests",
    details: { retryAfter: 60 }
  }
}
```

---

**End of Runbook**

For questions or issues during migration, contact the development team or file an issue in the project repository.
