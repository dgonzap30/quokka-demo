# Keep Clean - QuokkaQ Maintenance Checklist
**One-Page Quick Reference for Daily/Weekly/Monthly Hygiene**

---

## 📅 Daily (Before Each Commit)

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Format
npm run format:check

# 4. Build (if touching critical paths)
npm run build
```

**Manual Checks:**
- [ ] No `console.log()` statements in production code
- [ ] No `any` types added (use proper types)
- [ ] No hardcoded values (use props/config)
- [ ] No API keys in code (use env vars)

---

## 🗓️ Weekly (Friday Afternoon - 30 minutes)

### Security
```bash
# Check for vulnerabilities
npm audit
cd backend && npm audit

# Check for security alerts
gh api /repos/OWNER/REPO/dependabot/alerts
```

- [ ] Review Dependabot alerts (if enabled)
- [ ] No new high/critical CVEs introduced
- [ ] Update outdated dependencies with known fixes

### Code Quality
```bash
# Check for outdated deps
npm outdated

# Run full lint
npm run lint:all
```

- [ ] Review open PRs (none should be >3 days old)
- [ ] Check TypeScript errors in CI
- [ ] Review ESLint violations trend (should go down, not up)

### Infrastructure
- [ ] Review CloudWatch dashboard (once deployed)
- [ ] Check error rate (<1% target)
- [ ] Verify backups ran successfully
- [ ] Review RDS storage usage

---

## 📆 Monthly (First Monday - 2 hours)

### Dependencies
```bash
# Update all dependencies
npm update
cd backend && npm update

# Audit production deps only
npm audit --production
cd backend && npm audit --production
```

- [ ] Update major versions (test thoroughly)
- [ ] Regenerate lockfiles if needed
- [ ] Test full build + deploy to staging

### Documentation
- [ ] Update README if APIs changed
- [ ] Update CLAUDE.md with new patterns
- [ ] Archive completed tasks in `doccloud/`
- [ ] Update QDS.md if design tokens changed

### Tech Debt
- [ ] Review open GitHub issues
- [ ] Close stale issues (>30 days inactive)
- [ ] Review TODOs in codebase (`grep -r "TODO"`)
- [ ] Clean up unused feature flags

### Performance
```bash
# Analyze bundle sizes
npm run build --analyze

# Run Lighthouse audits
npx lighthouse http://localhost:3000 --view
```

- [ ] Check bundle sizes (<200KB per route)
- [ ] Lighthouse scores ≥90 (mobile), ≥95 (desktop)
- [ ] Review slow API endpoints (p95 latency)

---

## 🚨 Incident Response (When Things Break)

### 1. Immediate Triage (5 minutes)
```bash
# Check health endpoint
curl http://localhost:3001/api/v1/health

# Check recent errors in logs
docker logs quokka-backend --tail 100

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"
```

### 2. Rollback Decision (10 minutes)
- If last deploy <1 hour ago → **Rollback immediately**
- If bug is minor → **Fix forward with hotfix**
- If bug is critical → **Rollback + fix + redeploy**

```bash
# Rollback to previous tag
git checkout v1.2.3
npm run build && npm run deploy
```

### 3. Post-Incident (1 hour)
- [ ] Write incident report (what happened, why, how fixed)
- [ ] Update runbook with new learnings
- [ ] Add monitoring/alerting if gap identified
- [ ] Add test to prevent regression

---

## 🎯 Quality Gates (Never Violate)

### Pre-Commit (Automated via Husky)
- ✅ TypeScript compiles with zero errors
- ✅ ESLint passes with zero errors
- ✅ Prettier formatting applied
- ✅ No secrets in code (pre-commit hook scans)

### Pre-Deploy (Automated via CI/CD)
- ✅ All tests pass (unit + integration)
- ✅ Build succeeds in production mode
- ✅ Bundle sizes <200KB per route
- ✅ Lighthouse scores ≥90
- ✅ No high/critical security vulnerabilities

### Pre-Production (Manual Review)
- ✅ Staging deployment tested manually
- ✅ Database migration tested (if schema changed)
- ✅ Rollback plan documented
- ✅ Feature flags configured correctly
- ✅ Monitoring dashboards updated

---

## 🔧 Quick Fixes for Common Issues

### "Build is failing with TypeScript errors"
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### "ESLint is showing 500+ errors"
```bash
# Auto-fix what you can
npm run lint -- --fix

# Check if dist/ is being linted (it shouldn't be)
cat .eslintignore  # Should include dist/
```

### "Database connection pool exhausted"
```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Should be <20 connections (pg-pool max)
# If >20, restart backend or increase pool size
```

### "Frontend is slow (Lighthouse <80)"
```bash
# Analyze bundle
npm run build --analyze

# Check for heavy components not lazy-loaded
# Check for large dependencies not tree-shaken
```

### "Session cookies not working"
```bash
# Verify SESSION_SECRET is set
echo $SESSION_SECRET

# Check cookie settings in browser DevTools
# Ensure sameSite=lax, httpOnly=true, secure=true (prod)
```

---

## 📊 Health Metrics Dashboard (Target Values)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Uptime** | ≥99.9% | TBD | 🟡 Not monitored |
| **P95 Latency** | <500ms | TBD | 🟡 Not monitored |
| **Error Rate** | <1% | TBD | 🟡 Not monitored |
| **Build Time** | <2min | 9.5s ✅ | 🟢 Good |
| **Bundle Size** | <200KB | 280KB ❌ | 🔴 Needs work |
| **TypeScript Errors** | 0 | 5 ❌ | 🔴 Blocks deploy |
| **Test Coverage** | >80% | 0% ❌ | 🔴 Critical gap |
| **Security CVEs (High)** | 0 | 0 ✅ | 🟢 Good |
| **Security CVEs (Moderate)** | 0 | 4 🟡 | 🟡 Fix soon |

---

## 🚀 Pre-Launch Checklist

**Complete all before first production deployment:**

### Security
- [ ] All P0 security issues fixed (see RISK-REGISTER.md)
- [ ] No hardcoded secrets in code or git history
- [ ] SESSION_SECRET rotated to strong value
- [ ] RBAC enforced on all protected endpoints
- [ ] RLS implemented for tenant isolation
- [ ] Rate limiting enabled
- [ ] API keys moved to server-side

### Infrastructure
- [ ] Database backups enabled (7-day retention)
- [ ] Connection pooling configured (max 20)
- [ ] PII scrubber middleware active
- [ ] Health checks verify database
- [ ] Monitoring + dashboards deployed
- [ ] Alerting configured (PagerDuty/Slack)
- [ ] Staging environment deployed

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] >80% test coverage on critical paths
- [ ] All ESLint violations fixed
- [ ] No `any` types in production code
- [ ] FE/BE contracts aligned
- [ ] All routes <200KB

### Operational
- [ ] SLO targets defined and documented
- [ ] Incident response runbook written
- [ ] On-call rotation established
- [ ] Backup restoration tested successfully
- [ ] Load testing completed
- [ ] Security penetration testing done

---

## 📞 Contacts

**Incident Response:**
- On-Call: [PagerDuty rotation]
- Engineering Lead: @dgz
- DevOps/SRE: [Team slack channel]

**Escalation:**
- P0 (Critical): Page immediately
- P1 (High): Slack + email within 1 hour
- P2 (Medium): Create ticket, review in standup
- P3 (Low): Add to backlog

---

**Keep this checklist visible** - Pin to Slack, print, or add to team wiki.
**Review quarterly** - Update as systems evolve.
**Last Updated:** 2025-10-21
