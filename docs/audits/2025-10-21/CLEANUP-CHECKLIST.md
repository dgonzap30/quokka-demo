# Cleanup Checklist - QuokkaQ Quick Wins
**Date:** 2025-10-21
**Total Time:** 12 hours (15 items, all <2h each)
**Priority:** Start here before tackling larger refactors

---

## Instructions

✅ **Check off items as you complete them**
⏱️ **All items are <2 hours of effort**
🎯 **Start with "Critical" items first**

---

## Critical Quick Wins (4 items, 5.5 hours)

### ✅ 1. Remove Hardcoded Session Secret Fallback
**Effort:** 30 minutes
**Impact:** Prevents session forgery attacks
**Risk Level:** 🔴 Critical
**File:** `backend/src/plugins/session.plugin.ts`

**Steps:**
```typescript
// Current (line 15)
const secret = process.env.SESSION_SECRET || "demo-secret-change-in-production";

// Fix
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const secret = process.env.SESSION_SECRET;
```

**Validation:**
- [ ] Server fails to start without `SESSION_SECRET` env var
- [ ] No hardcoded secrets in codebase (`grep -r "demo-secret"`)
- [ ] Update `.env.example` with note about required secret

**PR Title:** `security: enforce SESSION_SECRET environment variable`

---

### ✅ 2. Fix TypeScript Build Errors
**Effort:** 2 hours
**Impact:** Unblocks production deployment
**Risk Level:** 🔴 Critical
**Files:** `app/api/chat/route.ts`, `app/api/conversations/restructure/route.ts`, `lib/api/client/ai-answers.ts`

**Steps:**
1. Update AI SDK package: `npm install ai@latest`
2. Replace deprecated options:
   ```typescript
   // Old
   maxSteps: 5,
   maxTokens: 2000,

   // New
   maxRetries: 5,
   maxCompletionTokens: 2000,
   ```
3. Add missing field to `lib/models/types.ts`:
   ```typescript
   export interface AIAnswer {
     // ... existing fields
     materialReferences?: MaterialReference[];  // Add this
   }
   ```

**Validation:**
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] All 5 compilation errors resolved
- [ ] Production build starts successfully (`npm start`)

**PR Title:** `fix: resolve TypeScript build errors (AI SDK compatibility)`

---

### ✅ 3. Enable RDS Automated Backups
**Effort:** 2 hours (assumes RDS already deployed)
**Impact:** Protects against data loss
**Risk Level:** 🔴 Critical
**Platform:** AWS Console or Terraform

**Steps (AWS Console):**
1. Navigate to RDS → Databases → quokka-db
2. Click "Modify"
3. Enable automated backups:
   - Backup retention: 7 days minimum
   - Backup window: 02:00-03:00 UTC (low traffic)
   - Copy tags to snapshots: Yes
4. Apply immediately (or during maintenance window)

**Steps (Terraform):**
```hcl
resource "aws_db_instance" "quokka" {
  # ... existing config
  backup_retention_period = 7
  backup_window          = "02:00-03:00"
  copy_tags_to_snapshot  = true
}
```

**Validation:**
- [ ] Automated backups enabled in RDS console
- [ ] Test restoration: Create snapshot → Restore to new instance → Verify data
- [ ] Document restoration procedure in runbook

**PR Title:** `infra: enable RDS automated backups (7-day retention)`

---

### ✅ 4. Fix Health Check Endpoints
**Effort:** 1 hour
**Impact:** Accurate health monitoring
**Risk Level:** 🟡 High
**File:** `backend/src/routes/v1/health.routes.ts`

**Steps:**
```typescript
// Current (simplified, doesn't check DB)
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Fix (actually verify database)
fastify.get('/health', async (request, reply) => {
  try {
    // Verify database connectivity
    const result = await fastify.db.execute(sql`SELECT 1 as health_check`);

    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    reply.status(503);
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});
```

**Validation:**
- [ ] `/health` endpoint returns 200 when DB is connected
- [ ] `/health` endpoint returns 503 when DB is down (test by stopping DB)
- [ ] Load balancer configured to use health check

**PR Title:** `fix: health check endpoint now verifies database connectivity`

---

## High Priority Quick Wins (5 items, 4.5 hours)

### ✅ 5. Add .eslintignore for Backend
**Effort:** 15 minutes
**Impact:** Eliminates 250+ false positive ESLint violations
**Risk Level:** 🟡 Medium
**File:** `backend/.eslintignore` (create new)

**Steps:**
1. Create `backend/.eslintignore`:
   ```
   # Compiled output
   dist/
   build/

   # Dependencies
   node_modules/

   # Database files
   *.db
   *.db-journal

   # Generated files
   drizzle/
   .drizzle/
   ```

2. Update `backend/.eslintrc.json`:
   ```json
   {
     "extends": ["eslint:recommended", "@typescript-eslint/recommended"],
     "ignorePatterns": ["dist/", "node_modules/"]
   }
   ```

**Validation:**
- [ ] `cd backend && npm run lint` shows <50 violations (down from 423)
- [ ] No violations in `dist/` folder

**PR Title:** `chore: add .eslintignore to exclude compiled output`

---

### ✅ 6. Create .prettierrc for Consistent Formatting
**Effort:** 15 minutes
**Impact:** Consistent code formatting across team
**Risk Level:** 🟢 Low
**File:** `.prettierrc` (root)

**Steps:**
1. Create `.prettierrc`:
   ```json
   {
     "semi": true,
     "singleQuote": false,
     "tabWidth": 2,
     "trailingComma": "es5",
     "printWidth": 100,
     "arrowParens": "always"
   }
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
       "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
     }
   }
   ```

3. Run: `npm run format`

**Validation:**
- [ ] All files formatted consistently
- [ ] CI runs `npm run format:check`

**PR Title:** `chore: add Prettier configuration for consistent formatting`

---

### ✅ 7. Add PR Template
**Effort:** 30 minutes
**Impact:** Better code review process
**Risk Level:** 🟢 Low
**File:** `.github/pull_request_template.md` (create new)

**Steps:**
1. Create `.github/pull_request_template.md`:
   ````markdown
   ## Description
   <!-- Brief summary of changes -->

   ## Type of Change
   - [ ] Bug fix (non-breaking)
   - [ ] New feature (non-breaking)
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed

   ## Checklist
   - [ ] TypeScript compiles with no errors (`npm run build`)
   - [ ] ESLint passes (`npm run lint`)
   - [ ] No console.log statements in production code
   - [ ] Documentation updated (if needed)
   - [ ] Screenshots attached (for UI changes)

   ## Screenshots (if applicable)
   <!-- Add screenshots here -->
   ````

**Validation:**
- [ ] Template appears when creating new PR
- [ ] All sections filled out in next PR

**PR Title:** `chore: add pull request template`

---

### ✅ 8. Add CODEOWNERS File
**Effort:** 30 minutes
**Impact:** Automatic reviewer assignment
**Risk Level:** 🟢 Low
**File:** `.github/CODEOWNERS` (create new)

**Steps:**
1. Create `.github/CODEOWNERS`:
   ```
   # Default owners for everything
   * @dgz

   # Frontend
   /app/ @dgz
   /components/ @dgz
   /lib/ @dgz

   # Backend
   /backend/ @dgz

   # Infrastructure
   /infra/ @dgz
   *.tf @dgz

   # Documentation
   *.md @dgz
   /docs/ @dgz

   # CI/CD
   /.github/ @dgz
   ```

2. Enable "Require review from Code Owners" in GitHub branch protection

**Validation:**
- [ ] CODEOWNERS file recognized by GitHub
- [ ] PRs automatically assign reviewers

**PR Title:** `chore: add CODEOWNERS for automatic PR review assignment`

---

### ✅ 9. Install Husky + lint-staged for Pre-commit Hooks
**Effort:** 1 hour
**Impact:** Prevents committing broken code
**Risk Level:** 🟡 Medium

**Steps:**
1. Install dependencies:
   ```bash
   npm install --save-dev husky lint-staged
   npx husky install
   npm pkg set scripts.prepare="husky install"
   ```

2. Create `.husky/pre-commit`:
   ```bash
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   npx lint-staged
   ```

3. Add to `package.json`:
   ```json
   {
     "lint-staged": {
       "*.{ts,tsx}": [
         "eslint --fix",
         "prettier --write"
       ],
       "*.{json,md}": [
         "prettier --write"
       ]
     }
   }
   ```

**Validation:**
- [ ] Committing broken code triggers hook and fails
- [ ] Hook auto-fixes ESLint violations
- [ ] Team members can commit successfully

**PR Title:** `chore: add Husky pre-commit hooks for code quality`

---

### ✅ 10. Fix Backend ESLint Config Conflict
**Effort:** 1 hour
**Impact:** Enables linting in backend
**Risk Level:** 🟡 Medium
**File:** `backend/.eslintrc.json`

**Steps:**
1. Update `backend/.eslintrc.json`:
   ```json
   {
     "root": true,
     "parser": "@typescript-eslint/parser",
     "parserOptions": {
       "ecmaVersion": 2022,
       "sourceType": "module",
       "project": "./tsconfig.json"
     },
     "extends": [
       "eslint:recommended",
       "plugin:@typescript-eslint/recommended"
     ],
     "plugins": ["@typescript-eslint"],
     "env": {
       "node": true,
       "es2022": true
     },
     "ignorePatterns": ["dist/", "node_modules/", "*.js"],
     "rules": {
       "@typescript-eslint/no-explicit-any": "warn",
       "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
     }
   }
   ```

2. Remove `extends: ['next/core-web-vitals']` (Next.js specific)

3. Run: `cd backend && npm run lint`

**Validation:**
- [ ] `npm run lint` completes without errors
- [ ] Config errors resolved
- [ ] Violations show as warnings (not errors)

**PR Title:** `fix: resolve backend ESLint configuration conflict`

---

## Medium Priority Quick Wins (4 items, 1.5 hours)

### ✅ 11. Remove Deprecated Function
**Effort:** 15 minutes
**Impact:** Reduces tech debt
**Risk Level:** 🟢 Low
**File:** `lib/api/client/conversations.ts`

**Steps:**
1. Search for usage: `grep -r "convertConversationToThread" .`
2. If unused, delete function from `conversations.ts`
3. If used, replace with new implementation

**Validation:**
- [ ] Function removed or replaced
- [ ] No references remain in codebase
- [ ] Build succeeds

**PR Title:** `chore: remove deprecated convertConversationToThread function`

---

### ✅ 12. Update Dependency Vulnerabilities
**Effort:** 1 hour
**Impact:** Fixes 4 moderate CVEs
**Risk Level:** 🟡 Medium

**Steps:**
1. Backend: `cd backend && npm audit`
2. Update drizzle-kit: `npm install drizzle-kit@latest`
3. Run audit fix: `npm audit fix`
4. Test backend: `npm run dev`
5. Commit lockfile changes

**Validation:**
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] Backend starts successfully
- [ ] All tests pass (if tests exist)

**PR Title:** `security: update dependencies to fix moderate CVEs`

---

### ✅ 13. Consolidate Feature Flags
**Effort:** 30 minutes (analysis only, implementation deferred)
**Impact:** Single source of truth for feature flags
**Risk Level:** 🟢 Low
**Files:** `lib/config/features.ts`, `lib/config/backend.ts`

**Analysis Steps:**
1. Compare `features.ts` and `backend.ts`
2. Document duplicate flags
3. Propose migration plan in issue/ticket

**Deliverable:** Create GitHub issue with:
- List of duplicate flags
- Proposed consolidated structure
- Migration plan (breaking change?)

**PR Title:** `docs: analyze feature flag fragmentation` (documentation only)

---

### ✅ 14. Remove Unused Dev Dependencies
**Effort:** 30 minutes
**Impact:** Reduces install time, bundle bloat
**Risk Level:** 🟢 Low

**Steps:**
1. Audit unused deps:
   ```bash
   npm install -g depcheck
   depcheck
   ```

2. Remove identified unused packages:
   ```bash
   npm uninstall msw tw-animate-css @netlify/plugin-nextjs
   ```

3. Run `npm prune`

**Validation:**
- [ ] Build succeeds after removal
- [ ] Dev server starts successfully
- [ ] No import errors

**PR Title:** `chore: remove unused dev dependencies`

---

## Low Priority Quick Wins (2 items, 30 minutes)

### ✅ 15. Add npm Scripts for Common Tasks
**Effort:** 15 minutes
**Impact:** Better DX for common operations
**Risk Level:** 🟢 Low
**File:** `package.json` (root)

**Steps:**
Add to `package.json`:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"npm run dev --workspace=backend\"",
    "build:all": "npm run build && npm run build --workspace=backend",
    "lint:all": "npm run lint && npm run lint --workspace=backend",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .next backend/dist node_modules/.cache"
  }
}
```

**Validation:**
- [ ] `npm run dev:all` starts both frontend and backend
- [ ] `npm run typecheck` validates all TypeScript

**PR Title:** `chore: add npm scripts for common development tasks`

---

## Summary

| Priority | Count | Total Time |
|----------|-------|------------|
| Critical | 4 | 5.5 hours |
| High | 5 | 4.5 hours |
| Medium | 4 | 1.5 hours |
| Low | 2 | 0.5 hours |
| **Total** | **15** | **12 hours** |

---

## Recommended Order

**Day 1 (Morning - 3 hours):**
1. Remove hardcoded session secret (30min) ✅ Blocks production
2. Fix TypeScript build errors (2h) ✅ Blocks deployment
3. Add .eslintignore (15min) ✅ Quick win
4. Add .prettierrc (15min) ✅ Quick win

**Day 1 (Afternoon - 3 hours):**
5. Enable RDS backups (2h) ✅ Critical
6. Fix health check endpoints (1h) ✅ High priority

**Day 2 (Morning - 3 hours):**
7. Add PR template (30min)
8. Add CODEOWNERS (30min)
9. Install Husky + lint-staged (1h)
10. Fix backend ESLint config (1h)

**Day 2 (Afternoon - 3 hours):**
11. Remove deprecated function (15min)
12. Update dependency vulnerabilities (1h)
13. Consolidate feature flags analysis (30min)
14. Remove unused dev deps (30min)
15. Add npm scripts (15min)

---

## Keep Clean Checklist (Daily/Weekly Maintenance)

Copy this to your team wiki or README:

### Daily
- [ ] Run `npm run lint` before committing
- [ ] Run `npm run typecheck` before pushing
- [ ] Check for new TypeScript errors in CI
- [ ] Review security alerts (Dependabot)

### Weekly
- [ ] Run `npm audit` in frontend and backend
- [ ] Check for outdated dependencies (`npm outdated`)
- [ ] Review open PRs (no PR should be open >3 days)
- [ ] Update documentation for new features

### Monthly
- [ ] Update all dependencies (`npm update`)
- [ ] Run full security audit (`npm audit --production`)
- [ ] Review and close stale issues
- [ ] Clean up unused feature flags
- [ ] Review and update this checklist

---

**Document Owner:** Engineering Team
**Last Updated:** 2025-10-21
**Next Review:** 2025-11-04
