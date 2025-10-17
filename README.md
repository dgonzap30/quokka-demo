# QuokkaQ Demo

A **frontend-only demo** of QuokkaQ, an AI-powered Q&A platform for course discussions. This demo showcases UX flows and UI quality using mocked data and services—no real backend, auth, or data security layers.

**Built with the Quokka Design System (QDS) v1.0** — A warm, approachable, and academic-grade design language.

---

## 🚀 Quick Start (2 Minutes)

### Installation & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the demo.

### 🌐 Live Demo

**Production URL**: [https://quokka-demo.netlify.app](https://quokka-demo.netlify.app)

Deployed on Netlify with continuous deployment from the `main` branch.

### Explore the Demo

- **Home (`/`)** - Browse discussion threads with filtering
- **Thread Detail (`/threads/thread-1`)** - View Q&A with AI answer
- **Ask Question (`/ask`)** - Get AI answer preview with similar questions
- **Instructor Dashboard (`/instructor`)** - View metrics and moderation tools

---

## 🧠 LLM Integration (Optional)

By default, QuokkaQ uses **template-based AI responses** with keyword matching. You can optionally enable **real LLM integration** with OpenAI or Anthropic for production-quality AI answers powered by course materials.

### Quick Setup

1. **Copy environment template:**
```bash
cp .env.local.example .env.local
```

2. **Add your API key** (choose one):
```bash
# Option A: OpenAI (recommended for cost/speed)
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-your-key-here
NEXT_PUBLIC_LLM_PROVIDER=openai

# Option B: Anthropic (alternative provider)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_LLM_PROVIDER=anthropic
```

3. **Enable LLM mode:**
```bash
NEXT_PUBLIC_USE_LLM=true
```

4. **Restart dev server:**
```bash
npm run dev
```

### How It Works

When LLM is enabled:
- **AI-Powered Responses:** Generates answers using GPT-4o-mini or Claude 3 Haiku
- **Course Context:** Automatically builds context from course materials (lectures, slides, assignments)
- **Multi-Course Awareness:** Detects relevant courses based on question keywords and content
- **Smart Citations:** References actual course content with relevance scoring
- **Citation Display:** Inline `[1] [2]` markers with clickable sources panel
  - Highlighted citation markers scroll to source
  - Hover tooltips show material titles
  - Keyboard navigable (Tab, Enter, Space)
  - QDS-compliant styling with accent colors
- **Confidence Scoring:** Confidence levels based on material relevance (0-100)
- **Private Conversations:** Store AI chat sessions per-user with localStorage
- **Conversation → Thread:** Convert private conversations to public threads
- **Automatic Fallback:** Falls back to templates on LLM errors

**Architecture:**
- **Context Builder:** Ranks course materials by relevance (60% keyword, 40% content matching)
- **Auto-Detection:** Scores courses by mentions (100 pts), keyword matches (10 pts), content matches (5 pts)
- **Token Budget:** Proportional allocation across courses (default 2000 tokens)
- **Retry Logic:** 3 attempts with exponential backoff (1s, 2s, 4s delays)
- **Cost Tracking:** Token usage monitoring with per-model pricing

**Security Warning:** This demo uses client-side API keys (`NEXT_PUBLIC_*`) for simplicity. **Production apps should use server-side API routes** to protect keys. See `.env.local.example` for details.

### Configuration Options

See `.env.local.example` for full configuration including:
- Model selection (GPT-4o-mini, Claude Haiku, etc.)
- Temperature and token limits
- Cost monitoring and rate limiting
- Context size and relevance thresholds

---

## 🤖 Agentic Development Workflow

This project includes a **production-ready agentic workflow** with 8 specialized AI agents for systematic development.

### Quick Agent Selector

| I need to... | Use Agent |
|--------------|-----------|
| ✨ Check design system compliance | **QDS Compliance Auditor** |
| ♿ Validate accessibility | **Accessibility Validator** |
| 🏗️ Design new component | **Component Architect** |
| 🔌 Add API endpoint | **Mock API Designer** |
| ⚡ Optimize data fetching | **React Query Strategist** |
| 🛡️ Fix TypeScript errors | **Type Safety Guardian** |
| 📦 Reduce bundle size | **Bundle Optimizer** |
| 🔄 Prepare for backend swap | **Integration Readiness Checker** |

### Get Started with Agentic Workflow

1. **Read:** [AGENTIC-WORKFLOW-GUIDE.md](AGENTIC-WORKFLOW-GUIDE.md) (15 min comprehensive guide)
2. **Quick Ref:** [doccloud/AGENT-QUICK-REFERENCE.md](doccloud/AGENT-QUICK-REFERENCE.md) (agent prompts)
3. **Try it:** Follow the first task tutorial in the guide

**Benefits:**
- ✅ Catch issues before implementation (10x faster)
- ✅ Enforce quality (QDS, WCAG 2.2 AA, TypeScript strict)
- ✅ Context persists across sessions
- ✅ Backend-ready architecture

---

## 🎯 Purpose

This is a proof-of-concept to demonstrate:
- Student discussion threads with Q&A
- AI-powered answer generation with citations
- Similar question suggestions (as-you-type)
- Instructor dashboard with metrics
- Post endorsement and flagging

---

## 📚 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Design System**: Quokka Design System (QDS) v1.0
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui + Radix UI
- **State**: React Query (TanStack Query)
- **Mock Data**: Static JSON files + in-memory state
- **Fonts**: Geist Sans & Geist Mono
- **Icons**: Lucide React

---

## 🏗️ Architecture

```
quokka-demo/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Threads list
│   ├── ask/               # Ask question page
│   ├── threads/[id]/      # Thread detail page
│   └── instructor/        # Instructor dashboard
├── components/            # React components
│   ├── nav-header.tsx
│   ├── thread-card.tsx
│   ├── ai-answer-card.tsx
│   └── post-item.tsx
├── lib/
│   ├── api/              # Mock API client & hooks
│   ├── models/           # TypeScript types
│   └── utils/            # Helper functions
├── mocks/                # Seed data (JSON)
│   ├── threads.json
│   ├── users.json
│   ├── kb-docs.json
│   └── ai-responses.json
└── doccloud/             # Agentic workflow context
    ├── SPECIALIZED-AGENTS.md
    ├── AGENT-QUICK-REFERENCE.md
    └── tasks/
```

---

## 🎬 Demo Flows

### Flow 1: Browse & View Threads
1. Visit `/` to see thread list
2. Filter by status (All, Open, Answered)
3. Click a thread to view details
4. See AI answer with citations
5. Read community replies

### Flow 2: Ask a Question
1. Visit `/ask` page
2. Type question title
3. See similar threads appear (debounced)
4. Get AI answer preview (~800ms)
5. View citations and confidence level
6. Post to forum if needed

### Flow 3: Instructor Dashboard
1. Visit `/instructor` (logged in as Dr. Sarah Chen)
2. View metrics cards (unanswered, response time)
3. Check unanswered questions queue
4. Review endorsed/flagged posts
5. See active student stats

### Flow 4: Moderate Content
1. Open any thread as instructor
2. Endorse helpful replies (Award icon)
3. Flag inappropriate content (Flag icon)
4. Mark replies as "Answer"
5. Resolve threads

---

## 🔄 Data & State

- **Seed Data**: Pre-loaded from `/mocks/*.json`
- **localStorage Persistence**: Data persists across sessions in browser storage
- **Reset**: Clear localStorage to reseed with latest data
- **Version-Based Seeding**: Automatically reseeds when mock data version changes

### Viewing New Mock Data

When new mock data is added or updated, you may need to clear your browser's localStorage to see the changes:

**Method 1: Browser Console**
```javascript
localStorage.clear()
// Then refresh the page
```

**Method 2: DevTools**
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Application tab
3. Select "Local Storage" → `http://localhost:3000`
4. Right-click and select "Clear"
5. Refresh the page

The app will automatically reseed with the latest data from `/mocks/*.json` files.

### Mock AI Responses

The AI uses keyword matching to return canned responses:
- **"binary search"** → Implementation guide with Python code
- **"list comprehension"** → Syntax and examples
- **"gil"** → Global Interpreter Lock explanation
- **Default** → Generic "insufficient info" response

---

## 📝 Available Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm start        # Run production server
npm run lint     # Lint code
npx tsc --noEmit # Type check
npm run seed     # Display seed info
```

### 🚀 Deployment

**Quick Deploy:**
```bash
./scripts/deploy.sh  # Build, push to GitHub, and deploy to Netlify
```

**Manual Deploy:**
```bash
npm run build        # Build the project
netlify deploy --prod  # Deploy to production
```

**GitHub Actions (Optional):**
The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that can automatically deploy on push to `main`. To enable:

1. Go to your repository settings → Secrets and variables → Actions
2. Add these secrets:
   - `NETLIFY_AUTH_TOKEN`: Get from https://app.netlify.com/user/applications#personal-access-tokens
   - `NETLIFY_SITE_ID`: `39644280-e882-4bdb-8c03-baeb54de787b`

---

## 🔗 API Endpoints (Mocked)

All API calls go through `/lib/api/client.ts`:

### Thread Endpoints
| Endpoint | Method | Description | Delay |
|----------|--------|-------------|-------|
| `getThreads()` | GET | Fetch all threads | 200-500ms |
| `getThread(id)` | GET | Fetch single thread | 200-500ms |
| `createThread()` | POST | Create new thread (auto-generates AI answer) | 200-500ms |
| `createPost()` | POST | Add reply to thread | 200-500ms |
| `endorsePost(id)` | PUT | Toggle endorsement | 100ms |
| `flagPost(id)` | PUT | Toggle flag | 100ms |
| `resolveThread(id)` | PUT | Mark resolved | 100ms |
| `getSimilarThreads()` | GET | Find similar questions | 300ms |

### AI Endpoints
| Endpoint | Method | Description | Delay |
|----------|--------|-------------|-------|
| `askQuestion()` | POST | Get AI answer preview | 800ms |
| `generateAIPreview()` | POST | Generate answer without saving | 800ms |
| `endorseAIAnswer()` | PUT | Toggle AI answer endorsement | 100ms |

### Conversation Endpoints (Private AI Chat)
| Endpoint | Method | Description | Delay |
|----------|--------|-------------|-------|
| `createConversation()` | POST | Create new private conversation | 100ms |
| `getAIConversations()` | GET | Fetch user's conversations | 200-500ms |
| `getConversationMessages()` | GET | Fetch messages for conversation | 100ms |
| `sendMessage()` | POST | Send user message + generate AI response | 800ms |
| `deleteAIConversation()` | DELETE | Delete conversation (cascade) | 100ms |
| `convertConversationToThread()` | POST | Convert conversation to public thread | 300ms |

### Course & Dashboard Endpoints
| Endpoint | Method | Description | Delay |
|----------|--------|-------------|-------|
| `getCourse(id)` | GET | Fetch single course | 200-500ms |
| `getCourseMaterials(id)` | GET | Fetch course materials for context | 200-500ms |
| `getInstructorMetrics()` | GET | Dashboard stats | 200-500ms |

---

## 🚧 Future Backend Integration

To swap in a real backend:
1. Replace `/lib/api/client.ts` with HTTP fetch calls
2. Update React Query hooks to use real endpoints
3. Add authentication & session management
4. Wire up Bedrock for real AI responses
5. Implement S3 for file uploads
6. Add database (PostgreSQL + Prisma/Drizzle)

The component layer and UI flows are designed to work seamlessly once the client is swapped.

---

## 📖 Documentation

### Getting Started
- **[README.md](README.md)** ← You are here
- **[AGENTIC-WORKFLOW-GUIDE.md](AGENTIC-WORKFLOW-GUIDE.md)** ⭐ Complete agentic workflow guide

### Agentic Workflow
- **[AGENTIC-WORKFLOW-GUIDE.md](AGENTIC-WORKFLOW-GUIDE.md)** - Complete guide with tutorials
- **[doccloud/SPECIALIZED-AGENTS.md](doccloud/SPECIALIZED-AGENTS.md)** - Full agent specifications
- **[doccloud/AGENT-QUICK-REFERENCE.md](doccloud/AGENT-QUICK-REFERENCE.md)** - Fast agent lookup
- **[doccloud/TASK-TEMPLATE.md](doccloud/TASK-TEMPLATE.md)** - Template for new tasks
- **[doccloud/AGENT-TASK-TEMPLATE.md](doccloud/AGENT-TASK-TEMPLATE.md)** - Template for sub-agents

### Design System
- **[QDS.md](QDS.md)** - Complete Quokka Design System implementation guide
- **[QDS-QUICK-REFERENCE.md](QDS-QUICK-REFERENCE.md)** - Quick reference for developers

### Development
- **[CLAUDE.md](CLAUDE.md)** - AI instruction file (for Claude Code)
- **[ANALYSIS.md](ANALYSIS.md)** - Technical analysis and architecture decisions

### Navigation Tips
- **New developer?** Start with this README, then [AGENTIC-WORKFLOW-GUIDE.md](AGENTIC-WORKFLOW-GUIDE.md)
- **Need an agent?** Go to [doccloud/AGENT-QUICK-REFERENCE.md](doccloud/AGENT-QUICK-REFERENCE.md)
- **Design tokens?** Check [QDS-QUICK-REFERENCE.md](QDS-QUICK-REFERENCE.md)
- **Coding standards?** See [CLAUDE.md](CLAUDE.md)

---

## 🎨 Design System

This project implements the **Quokka Design System (QDS) v1.0**, featuring:

- **Warm Color Palette**: Quokka Brown (primary), Rottnest Olive (secondary), Clear Sky (accent)
- **4pt Spacing Grid**: Consistent spacing throughout
- **Accessibility First**: WCAG 2.2 AA minimum, full keyboard navigation
- **Light & Dark Themes**: Automatic theme switching
- **QDS Tokens**: Semantic color tokens, shadows, radius scales

See [QDS.md](QDS.md) for complete documentation.

---

## ⚠️ Non-Goals (Out of Scope)

This demo does **NOT** include:
- Real backend/database
- Authentication or LTI integration
- File uploads or S3 storage
- Actual AI/RAG (Bedrock Knowledge Base)
- Security (RLS, rate limits, etc.)
- Production hardening

---

## 🧪 Quality Checks

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build (validates all routes)
npm run build

# Run in production mode
npm run build && npm start
```

---

## 📄 License

This is a demo project for evaluation purposes.
