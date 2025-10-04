# Task: Initial UI Foundation

**Goal:** Build the foundational UI for QuokkaQ including authentication, course selection, thread views, and AI agent Quokka.

**In-Scope:**
- Mock authentication system (login, signup, session management)
- Course selection dashboard (leverage existing course-dashboard plans)
- Thread listing and detail views
- Thread creation (Ask page)
- AI agent Quokka chat interface
- Navigation integration
- QDS v2.0 glassmorphism styling throughout
- Full responsive design (360-1280px)

**Out-of-Scope:**
- Real backend integration (all data mocked)
- Real authentication (mock auth only)
- Real AI/LLM integration (keyword matching)
- File uploads
- Real-time features
- Email notifications
- LTI integration

**Done When:**
- [ ] Users can login/signup with mock authentication
- [ ] Course dashboard displays enrolled courses with glass styling
- [ ] Thread list shows Q&A threads filtered by course
- [ ] Thread detail shows full conversation with replies
- [ ] Users can create new threads via Ask page
- [ ] Users can reply to existing threads
- [ ] Quokka AI chat responds to questions with mock responses
- [ ] All UI follows QDS v2.0 glassmorphism design system
- [ ] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Demo script updated (README section)

---

## Constraints

1. **Frontend-only scope** - All data mocked in-memory
2. **No breaking changes to existing code** - Additive only
3. **QDS v2.0 compliance** - Glassmorphism tokens, spacing, radius, shadows
4. **Type safety** - No `any` types, strict mode throughout
5. **Component reusability** - Props-driven, no hardcoded values
6. **Performance** - Keep bundle <200KB per route
7. **Leverage existing plans** - Use course-dashboard research and plans

---

## Decisions

### Authentication Architecture (2025-10-04)

**Context-Based State Management:**
- Use React Context + useState for global auth state (not React Query)
- AuthProvider wraps app, exposes useAuth hook with user, login, signup, logout
- Session stored in-memory only (resets on refresh) for security demo
- Rationale: Auth is persistent global state, not cache-based server data

**Component Architecture:**
- LoginForm + SignupForm: Small, props-driven components (<200 LOC each)
- Reuse existing shadcn primitives: Input (glass-enabled), Button (glass-primary), Card (glass-strong)
- AuthLayout: Shared wrapper with title/subtitle/footer slots
- FieldError: Inline error utility for client-side validation
- Files: research/auth-component-patterns.md, plans/auth-component-design.md

**QDS v2.0 Glassmorphism:**
- Form containers use Card variant="glass-strong" with optional liquid-border
- Submit buttons use Button variant="glass-primary" with glow on hover
- Inputs already glass-compliant (backdrop-blur on focus, glass shadows)
- All colors via semantic tokens, zero hardcoded hex values

**Validation Strategy:**
- Client-side: Lightweight inline validation (email format, password length, required fields)
- NO form libraries (react-hook-form, zod) - simple useState sufficient for 2-3 field forms
- API errors lifted to page level, passed as error prop
- Field errors stored locally, cleared on input change

### Type Safety - Authentication (2025-10-04)

**Zero `any` Types, 100% Strict Mode Compliance:**
- 7 new auth interfaces: AuthSession, AuthState, LoginInput, SignupInput, AuthResponse, AuthError, AuthResult
- Discriminated union (AuthResult) enables exhaustive type checking with success: true | false literal
- Type guards: isAuthSuccess(result), isAuthError(result) for safe union narrowing
- Explicit null handling: user: User | null (not user?: User) for clear unauthenticated state
- Type composition: Reuses existing User, UserRole types (zero duplication)
- Files: research/auth-type-patterns.md, plans/auth-type-design.md

### Authentication API & Storage Design (2025-10-04)

**API Layer Design:**
- Mock methods: login(), signup(), logout(), getCurrentUser(), validateSession()
- Network delays: 300-500ms login, 400-600ms signup, 50-100ms logout, 200-400ms getCurrentUser
- Password validation: Plain text comparison (WARNING: mock only, not production-ready)
- Error handling: Throw Error with JSON-stringified AuthError object
- Backend-ready: Clean abstraction, easy swap to fetch('/api/auth/login') in future
- Files: lib/api/client.ts, research/auth-api-patterns.md, plans/auth-api-design.md

**Storage Layer (localStorage):**
- Persistence keys: "quokkaq.users", "quokkaq.session", "quokkaq.initialized"
- Session management: 7-day expiry, auto-clear on logout/expiry, persist across reloads
- User seed: 8 demo users (student@demo.com, instructor@demo.com, ta@demo.com) + 5 test users
- All passwords: "demo123" for easy demo (mock only, not secure)
- Helper functions: seedData(), getSession(), setSession(), clearSession(), validateCredentials(), createUser()
- Files: lib/store/localStore.ts, mocks/users.json

**Integration Strategy:**
- AuthProvider Context wraps API methods (login → api.login() → setSession())
- useAuth hook fetches from getCurrentUser() for session restoration on app load
- Session validation on route changes catches expired sessions
- Logout clears both Context state and localStorage session atomically

**Backend Migration Path:**
- Replace localStorage with JWT tokens in HTTP-only cookies
- Replace api.login() mock with fetch('/api/auth/login', { method: 'POST' })
- Add bcrypt/argon2 password hashing on backend
- Add refresh token logic, CSRF protection, rate limiting
- Environment variable: NEXT_PUBLIC_API_URL switches mock/real API

---

## Risks & Rollback

**Risks:**
1. **Scope creep** - Four major features could expand beyond estimates
2. **Integration complexity** - Auth, courses, threads, AI need to work together
3. **Mock data consistency** - Need deterministic seed data across all features
4. **Performance** - Multiple data layers could impact bundle size

**Rollback:**
- All routes are additive (won't break existing pages)
- Can disable individual features via navigation links
- Mock data can be reset via seed script
- Each feature is independently testable

---

## Related Files

- `lib/models/types.ts` - Will add all type definitions
- `lib/api/client.ts` - Will add all API methods
- `lib/api/hooks.ts` - Will add all React Query hooks
- `lib/store/localStore.ts` - Will add in-memory state management
- `mocks/` - Will add all JSON seed data
- `app/layout.tsx` - Will add auth provider
- `components/` - Will add all new components
- `doccloud/tasks/course-dashboard/` - Existing plans to leverage

---

## TODO

- [x] Create task context and folder structure
- [ ] Launch agents for authentication planning
- [ ] Implement authentication system
- [ ] Implement course dashboard (use existing plans)
- [ ] Launch agents for thread view planning
- [ ] Implement thread views
- [ ] Launch agents for AI Quokka planning
- [ ] Implement AI Quokka
- [ ] Integration and quality checks
- [ ] Final verification and documentation

---

## Changelog

- `2025-10-04` | [Course Dashboard] | Implemented course data layer (types, API, hooks), created courses page with glass cards, updated home page to redirect based on auth state
- `2025-10-04` | [Auth Data Layer] | Implemented authentication types, API client, React Query hooks, and localStorage persistence
- `2025-10-04` | [Auth UI] | Created login page with glass styling, added React Query providers to layout
- `2025-10-04` | [Setup] | Created task context and folder structure
