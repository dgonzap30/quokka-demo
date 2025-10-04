# QuokkaQ Demo - Analysis Report

## Executive Summary

This document provides a technical analysis of the **quokka-demo** frontend application, detailing the implementation decisions, data architecture, and comparison with the original **quokka-dev** codebase.

## 1. Source Analysis: quokka-dev

### Current State

The `quokka-dev` application is a minimal Next.js 15 implementation with:

- **Single Page**: Basic Q&A interface at `/`
- **Core Functionality**:
  - Text input for questions
  - AI-powered answers via AWS Bedrock Knowledge Base
  - Citation display from retrieved documents
  - Confidence scoring (high/medium/low)
- **Backend Services**:
  - LTI authentication service (ltijs + PostgreSQL)
  - Lambda functions for S3 upload handling
  - Bedrock RAG integration
- **Tech Stack**:
  - Next.js 15 (App Router)
  - React 19
  - Tailwind CSS v4 (PostCSS plugin)
  - Geist fonts (Sans & Mono)
  - Dark mode support

### Gaps Identified

The prompt describes features not present in quokka-dev:
- ❌ Discussion threads/forum
- ❌ User roles (student/instructor/TA)
- ❌ Post replies and conversations
- ❌ Instructor dashboard
- ❌ Endorsement/flagging system
- ❌ Similar question suggestions
- ❌ Metrics and analytics

## 2. quokka-demo Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           UI Layer (React Components)           │
├─────────────────────────────────────────────────┤
│        React Query (State Management)           │
├─────────────────────────────────────────────────┤
│          Mock API Client (/lib/api)             │
├─────────────────────────────────────────────────┤
│         Seed Data (JSON fixtures)               │
└─────────────────────────────────────────────────┘
```

### Routes Implemented

| Route | Purpose | Features |
|-------|---------|----------|
| `/` | Threads List | Browse, filter (all/open/answered), view metadata |
| `/threads/[id]` | Thread Detail | View question, AI answer, replies, post responses |
| `/ask` | New Question | Similar suggestions, AI preview, post to forum |
| `/instructor` | Dashboard | Metrics, unanswered queue, moderation tools |

### Data Models

#### Core Entities

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'ta';
  avatar?: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: User;
  status: 'open' | 'answered' | 'resolved';
  createdAt: string;
  updatedAt: string;
  posts: Post[];
  aiAnswer?: AiAnswer;
  tags?: string[];
  views: number;
  endorsed?: boolean;
}

interface Post {
  id: string;
  threadId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
  isAnswer?: boolean;
  endorsed?: boolean;
  flagged?: boolean;
}

interface AiAnswer {
  id: string;
  threadId: string;
  text: string;
  citations: Citation[];
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface Citation {
  url: string;
  snippet: string;
  title?: string;
}
```

### API Endpoints Inventory

All endpoints are mocked in `/lib/api/client.ts`:

| Endpoint | Method | Input | Output | Example Payload |
|----------|--------|-------|--------|-----------------|
| `getThreads()` | GET | - | `Thread[]` | Array of threads sorted by updatedAt |
| `getThread(id)` | GET | `id: string` | `Thread \| null` | Full thread with posts and aiAnswer |
| `createThread()` | POST | `CreateThreadInput` | `Thread` | `{ title, content, authorId }` |
| `createPost()` | POST | `CreatePostInput` | `Post` | `{ threadId, content, authorId, isAnswer? }` |
| `endorsePost(id)` | PUT | `id: string` | `void` | Toggles `post.endorsed` |
| `flagPost(id)` | PUT | `id: string` | `void` | Toggles `post.flagged` |
| `resolveThread(id)` | PUT | `id: string` | `void` | Sets `thread.status = 'resolved'` |
| `askQuestion()` | POST | `AskQuestionInput` | `AiAnswer` | `{ question: string }` → AI response |
| `getSimilarThreads()` | GET | `query: string` | `SimilarThread[]` | `[{ id, title, similarity, hasAnswer }]` |
| `getInstructorMetrics()` | GET | - | `InstructorMetrics` | Dashboard statistics |
| `getUnansweredThreads()` | GET | - | `Thread[]` | Threads with `status: 'open'` |
| `getCurrentUser()` | GET | - | `User` | Dr. Sarah Chen (instructor) |

### Mock Data Strategy

#### Seed Files

- **`mocks/users.json`**: 8 users (1 instructor, 1 TA, 6 students)
- **`mocks/threads.json`**: 7 threads with varying states
  - 3 with AI answers
  - 4 with student/instructor replies
  - Mix of open/answered/resolved statuses
- **`mocks/kb-docs.json`**: 5 knowledge base documents
- **`mocks/ai-responses.json`**: Keyword-based response map

#### AI Simulation

The mock AI uses keyword matching:

```javascript
// Input: "How to implement binary search?"
// Matches: "binary search" → returns binary_search response

{
  "binary search": {
    "text": "Binary search implementation...",
    "citations": [...],
    "confidence": 0.92,
    "confidenceLevel": "high"
  },
  "default": {
    "text": "I don't have enough information...",
    "citations": [],
    "confidence": 0.35,
    "confidenceLevel": "low"
  }
}
```

#### Similar Questions

Debounced search with keyword matching:

```javascript
// Input: "list comprehension"
// Returns: [{ id: "thread-6", title: "Confused about list comprehensions", similarity: 0.95, hasAnswer: false }]
```

### Component Architecture

#### Shared Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `NavHeader` | Main navigation | Role badge, conditional instructor link |
| `ThreadCard` | Thread preview | Status badges, metadata, endorsement indicator |
| `AiAnswerCard` | AI response display | Collapsible, citations, confidence badge |
| `PostItem` | Reply display | Author info, moderation buttons (instructor only) |

#### Page Components

- **`app/page.tsx`**: Threads list with filtering
- **`app/threads/[id]/page.tsx`**: Thread detail with reply form
- **`app/ask/page.tsx`**: Question form with sidebar suggestions
- **`app/instructor/page.tsx`**: Dashboard with metrics grid

### State Management

- **React Query**: Caching, mutations, invalidation
- **In-Memory**: Changes persist until page refresh
- **No Persistence**: LocalStorage/IndexedDB not used

### Design System

Reuses quokka-dev foundations:
- Geist Sans/Mono fonts
- CSS custom properties for theming
- Dark mode via system preference
- Tailwind v4 utility classes
- shadcn/ui components (Button, Card, Badge, Input, etc.)

## 3. Comparison: quokka-dev vs quokka-demo

| Feature | quokka-dev | quokka-demo |
|---------|-----------|-------------|
| **Routes** | 1 (`/`) | 4 (`/`, `/threads/[id]`, `/ask`, `/instructor`) |
| **Data Model** | Implicit (Question, Answer) | Explicit (User, Thread, Post, AiAnswer) |
| **UI Complexity** | Single input + answer display | Forum-style with navigation, filters, moderation |
| **User Roles** | None | Student, Instructor, TA |
| **AI Integration** | Real (Bedrock KB) | Mocked (keyword matching) |
| **Backend** | AWS Lambda, RDS, S3 | None (in-memory) |
| **Auth** | LTI (ltijs) | Mocked (fixed user) |
| **State** | Component state | React Query |
| **Design System** | Basic Tailwind | Tailwind v4 + shadcn/ui |

## 4. Key Implementation Decisions

### Why In-Memory State?

- **Simplicity**: No backend setup required
- **Demo-Friendly**: Changes are visible immediately
- **Reset**: Refresh to restore initial state
- **Future-Proof**: Easy to swap with real API

### Why React Query?

- **Developer Experience**: Hooks-based API
- **Caching**: Automatic deduplication
- **Mutations**: Optimistic updates, invalidation
- **Type Safety**: Full TypeScript support

### Why Not MSW?

Initially planned, but static JSON + in-memory proved simpler:
- No service worker setup
- No HTTPS requirements
- Faster development
- Easier to understand for demo purposes

### Design Tokens Reuse

All CSS variables from quokka-dev are preserved:
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --radius: 0.625rem;
  /* ... */
}
```

## 5. Acceptance Criteria Validation

✅ **No network calls**: All data from static JSON
✅ **Offline capable**: Works after initial load
✅ **Mock data**: Threads, users, AI responses
✅ **End-to-end flows**: Browse → View → Reply → Ask → Dashboard
✅ **Visual coherence**: Same fonts, colors, spacing
✅ **Accessibility**: Semantic HTML, ARIA labels, keyboard nav
✅ **Responsive**: Mobile, tablet, desktop layouts
✅ **Documentation**: README, Demo Script, API inventory
✅ **Stable states**: Deterministic AI, repeatable flows

## 6. Handoff Notes

### For Backend Integration

1. **Replace `/lib/api/client.ts`**:
   - Change from in-memory to `fetch()` calls
   - Add error handling, loading states
   - Implement retry logic

2. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.example.com
   BEDROCK_KB_ID=...
   AWS_REGION=...
   ```

3. **Update Hooks**:
   - Keep React Query structure
   - Adjust query keys if needed
   - Add authentication headers

4. **Add Real Auth**:
   - Replace `getCurrentUser()` with session check
   - Implement LTI launch flow
   - Add role-based access control

### Component Reusability

All components accept data via props—no hardcoded values:
```tsx
<ThreadCard thread={thread} />  // Works with any Thread shape
<AiAnswerCard answer={answer} />  // Works with any AiAnswer
```

### Type Safety

All API responses are typed:
```typescript
const { data: threads } = useThreads();  // threads: Thread[] | undefined
```

## 7. Future Enhancements (Out of Scope)

- **Real-time updates** (WebSockets, Server-Sent Events)
- **Rich text editor** (Markdown, code blocks)
- **File attachments** (S3 uploads)
- **Search/filtering** (full-text, tags)
- **Pagination** (infinite scroll, cursor-based)
- **Notifications** (email, in-app)
- **Analytics** (usage tracking, A/B tests)
- **Internationalization** (i18n)

## 8. Performance Metrics

### Build Output

```
Route (app)              Size    First Load JS
┌ ○ /                    6.69 kB   151 kB
├ ○ /ask                 7.72 kB   152 kB
├ ○ /instructor          7.17 kB   151 kB
└ ƒ /threads/[id]        8.30 kB   152 kB
```

### Bundle Analysis

- **Shared chunks**: 133 kB (React, Next.js, React Query)
- **Route-specific**: ~7-8 kB per page
- **Total JS**: ~150 kB average First Load

### Optimization Opportunities

- Code splitting (dynamic imports)
- Image optimization (next/image)
- Tree shaking (Radix UI selective imports)
- Font subsetting (Geist)

## Conclusion

The **quokka-demo** successfully demonstrates a production-ready UX for an AI-powered Q&A platform, using entirely frontend technologies. The architecture is designed for easy backend swap-in, with clean separation between UI, state, and data layers.

All acceptance criteria are met, and the demo provides a compelling showcase of the product vision without requiring any infrastructure setup.
