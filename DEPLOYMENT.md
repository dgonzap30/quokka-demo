# QuokkaQ Deployment Guide

**Last Updated:** 2025-10-21
**Status:** Production Demo Ready

---

## Overview

QuokkaQ uses a **split deployment architecture** optimized for demo showcases:

- **Frontend**: Netlify (Next.js 15 with SSR)
- **Backend**: Railway.app (Fastify + SQLite)
- **Database**: SQLite on Railway persistent volume (demo data)

This setup provides **full demo functionality** with real backend integration while keeping costs at $0/month.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        NETLIFY                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Next.js Frontend (SSR + SSG)                      │    │
│  │  - React Query for data fetching                    │    │
│  │  - Feature flags for backend switching              │    │
│  │  - Vercel AI SDK for LLM integration                │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ HTTPS                             │
│                          ▼                                   │
└──────────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       RAILWAY.APP                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Fastify Backend                                    │    │
│  │  - RESTful API (12/44 endpoints active)             │    │
│  │  - Session management (cookie-based)                │    │
│  │  - CORS configured for Netlify                      │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  SQLite Database (Persistent Volume)               │    │
│  │  - 636KB seed data                                  │    │
│  │  - 18 tables with foreign keys                      │    │
│  │  - Demo users, threads, posts, AI answers           │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Deployment Steps

### Part 1: Backend Deployment (Railway)

#### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `quokka-demo` repository
4. Railway will auto-detect the Node.js project

#### Step 2: Configure Railway Service

1. **Root Directory**: Set to `backend/`
   - Railway Settings → Service Settings → Root Directory: `backend`

2. **Build Command**: Railway auto-detects from `railway.toml`, but verify:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Persistent Volume** (for SQLite database):
   - Go to **Volumes** tab
   - Click **"New Volume"**
   - Name: `quokka-db`
   - Mount Path: `/app/backend`
   - Size: 1GB (more than enough for demo)

#### Step 3: Set Environment Variables

Go to **Variables** tab and add:

```bash
# Required
NODE_ENV=production
PORT=3001
SESSION_SECRET=<generate-random-32-char-string>

# Frontend URL (get this after Railway deployment)
FRONTEND_URL=https://your-app.netlify.app

# Optional (for production logging)
LOG_LEVEL=info
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 4: Deploy Backend

1. Railway will auto-deploy when you push to GitHub
2. Wait for deployment to complete (~2-3 minutes)
3. Copy your Railway app URL: `https://quokka-backend-production-xxxx.up.railway.app`

#### Step 5: Seed Database

Railway doesn't run seed automatically, so you need to:

**Option A: Via Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed
railway run npm run db:migrate
railway run npm run db:seed
```

**Option B: Add to Start Command (Temporary)**

Update `backend/package.json` start script temporarily:
```json
"start": "npm run db:migrate && npm run db:seed && node dist/server.js"
```

Then trigger redeploy in Railway. After first successful deploy, revert this change.

#### Step 6: Verify Backend Health

Test your Railway backend:
```bash
curl https://your-app.up.railway.app/health

# Expected response:
{"status":"ok","timestamp":"2025-10-21T..."}
```

---

### Part 2: Frontend Deployment (Netlify)

#### Step 1: Update Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your QuokkaQ site
3. Go to **Site settings** → **Environment variables**
4. Update/add these variables:

```bash
# Backend Integration (CRITICAL - must be true for demo)
NEXT_PUBLIC_USE_BACKEND=true

# Railway Backend URL (from Part 1, Step 4)
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app

# Optional: LLM Integration (for AI chat)
NEXT_PUBLIC_LLM_PROVIDER=openai
NEXT_PUBLIC_USE_LLM=true
# Only if using LLM:
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-...
```

#### Step 2: Trigger Netlify Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for build to complete (~2-3 minutes)

#### Step 3: Verify Frontend

Visit your Netlify URL and check:
1. ✅ Login page appears
2. ✅ Can login with `student@demo.com`
3. ✅ Thread list loads from backend (not mocks)
4. ✅ Instructor dashboard shows metrics

---

## Verification Checklist

### Backend Checks
- [ ] Railway deployment successful
- [ ] Health endpoint returns 200: `GET /health`
- [ ] Status endpoint returns healthy: `GET /api/v1/_status`
- [ ] Database seeded (20 users, 24 threads, 131 posts)
- [ ] CORS allows Netlify domain

### Frontend Checks
- [ ] Netlify build successful
- [ ] Environment variables set correctly
- [ ] Feature flag `NEXT_PUBLIC_USE_BACKEND=true`
- [ ] Network tab shows API calls to Railway (not `http://localhost`)
- [ ] No CORS errors in browser console

### Integration Checks
- [ ] Login flow works end-to-end
- [ ] Session persists across page refreshes
- [ ] Thread list displays real data from backend
- [ ] Instructor dashboard shows correct metrics
- [ ] AI chat works (if LLM keys configured)

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | development | Set to `production` for Railway |
| `PORT` | ✅ | 3001 | Railway will override this automatically |
| `SESSION_SECRET` | ✅ | demo-secret | **MUST change** - use 32-char random string |
| `FRONTEND_URL` | ✅ | - | Your Netlify URL (e.g., `https://your-app.netlify.app`) |
| `LOG_LEVEL` | ❌ | info | Logging verbosity (debug, info, warn, error) |
| `DATABASE_URL` | ❌ | ./dev.db | SQLite file path (default works with volume) |

### Frontend (Netlify)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_USE_BACKEND` | ✅ | false | **MUST be true** for demo with real backend |
| `NEXT_PUBLIC_API_URL` | ✅ | - | Railway backend URL (e.g., `https://your-app.up.railway.app`) |
| `NEXT_PUBLIC_LLM_PROVIDER` | ❌ | - | `openai`, `anthropic`, or `google` |
| `NEXT_PUBLIC_USE_LLM` | ❌ | false | Enable real LLM (vs template responses) |
| `OPENAI_API_KEY` | ❌ | - | OpenAI API key (if using OpenAI) |
| `ANTHROPIC_API_KEY` | ❌ | - | Anthropic API key (if using Claude) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ❌ | - | Google AI API key (if using Gemini) |

---

## Troubleshooting

### Issue: CORS Errors in Browser

**Symptom:** `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy`

**Fix:**
1. Verify `FRONTEND_URL` is set correctly in Railway
2. Ensure it matches your Netlify domain exactly (including https://)
3. Check backend logs in Railway for CORS error messages
4. Redeploy backend after changing `FRONTEND_URL`

### Issue: Session Not Persisting

**Symptom:** Login works but session lost on page refresh

**Fix:**
1. Check `SESSION_SECRET` is set in Railway
2. Verify cookies are enabled in browser
3. Ensure backend is using HTTPS (Railway provides this automatically)
4. Check Network tab → Headers → Response Headers for `Set-Cookie`

### Issue: Database Empty

**Symptom:** API returns empty arrays for threads/posts

**Fix:**
1. Run seed script: `railway run npm run db:seed`
2. Verify volume is mounted at `/app/backend`
3. Check Railway logs for database errors
4. Restart Railway service

### Issue: 404 on API Requests

**Symptom:** Frontend shows 404 errors for all API calls

**Fix:**
1. Verify `NEXT_PUBLIC_API_URL` in Netlify
2. Ensure Railway backend is running (check Railway dashboard)
3. Test backend health directly: `curl https://your-app.up.railway.app/health`
4. Check for typos in environment variable (missing `https://`, extra `/api`, etc.)

---

## Rollback Plan

If deployment causes issues, you can immediately rollback:

### Quick Rollback (2 minutes)
1. Go to Netlify dashboard → Environment variables
2. Change `NEXT_PUBLIC_USE_BACKEND` from `true` to `false`
3. Trigger redeploy
4. Frontend will use mock data (zero downtime)

### Full Rollback (5 minutes)
1. Revert commits: `git revert HEAD`
2. Push to GitHub
3. Railway and Netlify auto-redeploy
4. Previous version restored

---

## Cost Breakdown

| Service | Plan | Cost | Usage Limits |
|---------|------|------|-------------|
| Netlify | Starter (Free) | $0/month | 100GB bandwidth, 300 build minutes |
| Railway | Hobby (Free Tier) | $0/month | $5/month credit included (enough for demo) |
| **Total** | - | **$0/month** | Sufficient for demo showcase |

### Railway Usage Estimates
- **Backend**: ~$3/month ($0.000463/hour × 720 hours)
- **Database Volume**: $0.25/GB/month (1GB = $0.25)
- **Total**: ~$3.25/month (well under $5 free tier)

---

## Migration to Commercial Deployment (Future - Plan 2)

When ready to scale beyond demo:

### Phase 1: Database Migration
1. Upgrade Railway to Postgres
2. Update `backend/src/db/client.ts` to support Postgres
3. Run migrations: `npm run db:migrate`
4. Re-seed with production data

### Phase 2: Session Storage
1. Add Redis instance (Railway addon or external)
2. Update session plugin to use Redis
3. Enable horizontal scaling

### Phase 3: Monitoring
1. Add Sentry for error tracking
2. Configure Railway health checks
3. Set up uptime monitoring (UptimeRobot)

### Phase 4: Security
1. Implement rate limiting
2. Add API authentication (beyond sessions)
3. Enable RBAC (role-based access control)
4. Audit security (refer to Plan 2)

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Netlify Docs**: https://docs.netlify.com
- **Fastify Docs**: https://fastify.dev
- **Drizzle ORM Docs**: https://orm.drizzle.team

**Deployment Issues?** Check `docs/audits/2025-10-21/PLAN-2-PRODUCTION-ROADMAP.md` for production hardening plan.

---

**Deployed By:** Claude Code
**Deployment Date:** 2025-10-21
**Status:** ✅ Demo Ready
