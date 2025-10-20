# QuokkaQ Dependency Audit

**Last Audit:** 2025-10-20
**Next Audit:** 2026-01-20 (Quarterly)

---

## Table of Contents

1. [Frontend Dependencies](#frontend-dependencies)
2. [Backend Dependencies](#backend-dependencies)
3. [Audit Process](#audit-process)
4. [Dependency Guidelines](#dependency-guidelines)
5. [Security](#security)
6. [Changelog](#changelog)

---

## Frontend Dependencies

### UI Framework

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `react` | 19.1.0 | Core UI library | ~45 KB (shared) |
| `react-dom` | 19.1.0 | DOM rendering | ~130 KB (shared) |
| `next` | 15.5.4 | Framework, SSR, routing | ~200 KB |

**Rationale:** Latest React 19 with Next.js 15 for modern features and performance.

---

### Component Library (Radix UI)

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-accordion` | ^1.2.12 | Collapsible sections |
| `@radix-ui/react-alert-dialog` | ^1.1.15 | Modal confirmations |
| `@radix-ui/react-avatar` | ^1.1.10 | User avatars |
| `@radix-ui/react-checkbox` | ^1.3.3 | Checkbox inputs |
| `@radix-ui/react-dialog` | ^1.1.15 | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Dropdown menus |
| `@radix-ui/react-focus-scope` | ^1.1.7 | Focus management |
| `@radix-ui/react-hover-card` | ^1.1.15 | Hover tooltips |
| `@radix-ui/react-label` | ^2.1.7 | Form labels |
| `@radix-ui/react-popover` | ^1.1.15 | Popover menus |
| `@radix-ui/react-progress` | ^1.1.7 | Progress bars |
| `@radix-ui/react-radio-group` | ^1.3.8 | Radio buttons |
| `@radix-ui/react-scroll-area` | ^1.2.10 | Custom scrollbars |
| `@radix-ui/react-select` | ^2.2.6 | Select dropdowns |
| `@radix-ui/react-separator` | ^1.1.7 | Visual separators |
| `@radix-ui/react-slot` | ^1.2.3 | Composition utility |
| `@radix-ui/react-switch` | ^1.2.6 | Toggle switches |
| `@radix-ui/react-tabs` | ^1.1.13 | Tab navigation |
| `@radix-ui/react-tooltip` | ^1.2.8 | Tooltips |

**Rationale:** Accessible, unstyled components following WAI-ARIA standards.

**Bundle Impact:** ~40-50 KB total (tree-shakeable)

---

### Data Fetching & State

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `@tanstack/react-query` | ^5.62.14 | Server state, caching | ~40 KB |

**Rationale:** Industry standard for server state management. Eliminates custom fetch logic.

---

### AI/LLM Integration

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `ai` | ^5.0.76 | Vercel AI SDK core | ~35 KB |
| `@ai-sdk/anthropic` | ^2.0.33 | Claude integration | ~15 KB |
| `@ai-sdk/openai` | ^2.0.52 | OpenAI integration | ~15 KB |
| `@ai-sdk/react` | ^2.0.76 | React hooks for AI | ~10 KB |

**Rationale:** Unified SDK for multiple LLM providers with streaming support.

---

### Styling

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `tailwindcss` | ^4 | Utility-first CSS | 0 KB (build-time) |
| `class-variance-authority` | ^0.7.1 | Component variants | ~3 KB |
| `clsx` | ^2.1.1 | ClassName utility | ~1 KB |
| `tailwind-merge` | ^2.6.0 | Class deduplication | ~8 KB |

**Rationale:** Modern styling approach with minimal runtime cost.

---

### UI Utilities

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `cmdk` | ^1.1.1 | Command palette | ~15 KB |
| `embla-carousel-react` | ^8.6.0 | Carousel component | ~20 KB |
| `sonner` | ^2.0.7 | Toast notifications | ~8 KB |
| `lucide-react` | ^0.468.0 | Icon library | ~5 KB (tree-shakeable) |

**Rationale:** Best-in-class UI utilities with good DX.

---

### Utilities

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `date-fns` | ^4.1.0 | Date formatting | ~10 KB (tree-shakeable) |
| `nanoid` | ^5.1.6 | ID generation | ~1 KB |
| `zod` | ^4.1.12 | Schema validation | ~15 KB |
| `streamdown` | ^1.4.0 | Markdown streaming | ~8 KB |
| `use-stick-to-bottom` | ^1.1.1 | Auto-scroll hook | ~2 KB |
| `chalk` | ^5.6.2 | Terminal colors (test scripts) | 0 KB (dev-only) |

**Rationale:** Focused utilities for specific needs.

---

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | Type safety |
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 15.5.4 | Next.js ESLint rules |
| `@eslint/eslintrc` | ^3 | ESLint config |
| `@tailwindcss/postcss` | ^4 | Tailwind v4 PostCSS |
| `tw-animate-css` | ^1.4.0 | Tailwind animations |
| `msw` | ^2.7.0 | Mock Service Worker |
| `@netlify/plugin-nextjs` | ^5.13.5 | Netlify deployment |
| `@types/*` | Various | TypeScript types |

**Rationale:** Development tooling for type safety, linting, and deployment.

---

## Backend Dependencies

### Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `fastify` | ^4.28.1 | Fast, low-overhead web framework |
| `@fastify/cookie` | ^9.3.1 | Cookie parsing |
| `@fastify/secure-session` | ^7.5.1 | Session management |
| `@fastify/swagger` | ^8.15.0 | API documentation |
| `@fastify/swagger-ui` | ^4.1.0 | Swagger UI |
| `@fastify/cors` | ^9.0.1 | CORS handling |
| `fastify-type-provider-zod` | ^2.0.0 | Zod integration |

**Rationale:** Fastify chosen for performance (~30% faster than Express) and excellent TypeScript support.

---

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.33.0 | Type-safe ORM |
| `better-sqlite3` | ^11.3.0 | SQLite driver (dev) |
| `postgres` | ^3.4.4 | PostgreSQL driver (prod) |
| `drizzle-kit` | ^0.24.2 | Migration toolkit |

**Rationale:** Drizzle ORM provides type safety without runtime overhead. SQLite for development, Postgres for production.

---

### Validation & Logging

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^3.23.8 | Schema validation |
| `pino` | ^9.4.0 | Fast JSON logger |
| `pino-pretty` | ^11.2.2 | Pretty logging (dev) |

**Rationale:** Zod for runtime validation, Pino for high-performance logging.

---

### Infrastructure

| Package | Version | Purpose |
|---------|---------|---------|
| `ioredis` | ^5.4.1 | Redis client (caching, sessions) |
| `dotenv` | ^16.4.5 | Environment variables |

**Rationale:** Production-ready Redis client and environment management.

---

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.6.2 | Type safety |
| `tsx` | ^4.19.1 | TypeScript execution |
| `eslint` | ^9.11.0 | Code linting |
| `@typescript-eslint/*` | ^8.6.0 | TypeScript linting |
| `@types/*` | Various | TypeScript types |

**Rationale:** Development tooling for backend TypeScript development.

---

## Audit Process

### Quarterly Audit (Every 3 months)

**Schedule:** January, April, July, October

**Steps:**

1. **Check for Unused Dependencies**
   ```bash
   npx depcheck
   ```
   - Review output
   - Verify false positives by searching codebase
   - Remove confirmed unused dependencies

2. **Security Audit**
   ```bash
   npm audit
   npm audit --production
   ```
   - Address critical and high vulnerabilities immediately
   - Plan fixes for medium vulnerabilities
   - Document low-risk items

3. **Version Updates**
   ```bash
   npm outdated
   ```
   - Update patch versions automatically
   - Test minor versions in development
   - Plan major version upgrades carefully

4. **Bundle Size Analysis**
   ```bash
   npm run build
   ```
   - Check bundle sizes (target: <200 KB per route)
   - Identify large dependencies
   - Consider alternatives for bloated packages

5. **License Compliance**
   ```bash
   npx license-checker --summary
   ```
   - Verify all licenses are compatible
   - Document any GPL/AGPL dependencies
   - Update LICENSE file if needed

6. **Documentation Update**
   - Update this file with changes
   - Document rationale for new dependencies
   - Remove obsolete dependencies from list

---

### Adding New Dependencies

**Before adding a dependency:**

1. **Evaluate Alternatives**
   - Is the functionality needed?
   - Can it be implemented in <100 lines?
   - Are there lighter alternatives?

2. **Check Bundle Size**
   ```bash
   npx bundlephobia <package-name>
   ```
   - Minified size
   - Minified + Gzipped size
   - Tree-shakeable?

3. **Verify Quality**
   - Weekly downloads (npm trends)
   - Last update date (<6 months old)
   - GitHub stars and issues
   - TypeScript support

4. **License Check**
   - Must be MIT, Apache 2.0, BSD, or ISC
   - Avoid GPL/AGPL for commercial use

5. **Document**
   - Add to this file
   - Note rationale and bundle impact
   - Update README if user-facing

---

## Dependency Guidelines

### ✅ Good Dependency

- **Small:** <50 KB minified + gzipped
- **Maintained:** Updated within last 6 months
- **Popular:** >100K weekly downloads
- **Typed:** Built-in TypeScript or @types available
- **Licensed:** MIT, Apache 2.0, BSD, ISC

### ⚠️ Acceptable with Justification

- **Medium:** 50-100 KB (must be critical)
- **Less Active:** 6-12 months since last update
- **Moderate Usage:** 10K-100K weekly downloads

### ❌ Avoid

- **Bloated:** >100 KB for simple functionality
- **Abandoned:** No updates in >12 months
- **Obscure:** <1K weekly downloads
- **Untyped:** No TypeScript support
- **Restrictive:** GPL/AGPL licenses

---

## Security

### Current Status (2025-10-20)

```bash
npm audit
# Found 0 vulnerabilities
```

**Production Dependencies:** ✅ 0 vulnerabilities
**Dev Dependencies:** ✅ 0 vulnerabilities

### Security Best Practices

1. **Run `npm audit` before every deployment**
2. **Enable Dependabot alerts (GitHub)**
3. **Review security advisories monthly**
4. **Update dependencies within 1 week of critical CVE**
5. **Use `npm ci` in production for lockfile integrity**

### Sensitive Dependencies

**None currently** - No dependencies access sensitive data or credentials.

---

## Changelog

### 2025-10-20 (Q4 2025 Audit)

**Removed:**
- `@xyflow/react` - Unused flow chart library (~12 MB)
- `motion` - Unused animation library (~3 MB)
- `tokenlens` - Unused token counting library (~1 MB)
- `@radix-ui/react-collapsible` - Unused component
- `@radix-ui/react-use-controllable-state` - Unused hook

**Added:**
- `chalk` - Terminal colors for test scripts
- `@radix-ui/react-focus-scope` - Focus management utility

**Savings:** -15 MB node_modules, -13 total packages

**Bundle Impact:** Frontend bundle reduced by ~18 KB

---

### 2025-08-01 (Initial Setup)

**Frontend Dependencies:** 40 packages
**Backend Dependencies:** 19 packages
**Total:** 59 packages

---

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Frontend Bundle** | ~291 KB | <300 KB | ✅ |
| **Backend Bundle** | N/A (Node.js) | N/A | - |
| **node_modules Size** | 730 MB | <800 MB | ✅ |
| **Total Dependencies** | 59 | <80 | ✅ |
| **Vulnerabilities** | 0 | 0 | ✅ |
| **Outdated Packages** | 0 critical | 0 | ✅ |

---

## Tools

### Recommended Tools

```bash
# Check unused dependencies
npx depcheck

# Security audit
npm audit

# Check outdated packages
npm outdated

# Analyze bundle size
npx bundlephobia <package-name>

# License checker
npx license-checker --summary

# Visualize dependencies
npx npm-why <package-name>
```

---

## Support

For questions about dependencies:
- **Slack:** #engineering
- **Email:** tech-lead@example.com
- **Docs:** `/CLAUDE.md`, `/backend/docs/API_REFERENCE.md`

**Dependency Change Requests:** Open PR with justification and bundle size impact analysis.

---

**Next Audit:** 2026-01-20 (Quarterly)
**Responsible:** Tech Lead / DevOps
