# Task: Postgres + Abstractions Migration

**Created:** 2025-10-21
**Status:** In Progress - Stage 1
**Estimated:** 4.5 hours total

---

## Goal

Migrate from SQLite to Postgres and add production-ready abstraction layers to eliminate throwaway work and align with AWS production target (Aurora Postgres, S3, Bedrock).

## Scope

### In-Scope
- Database: SQLite → Postgres with dual-mode support
- Storage: Add S3/R2 abstraction layer
- Sessions: JWT cookie strategy (stateless)
- AI Provider: OpenAI/Bedrock abstraction
- Railway deployment with Postgres service

### Out-of-Scope
- Multi-region deployment
- Full RBAC implementation (Plan 2)
- Redis session store (future option)
- Real-time features

## Constraints

- **No Breaking Changes:** SQLite must still work for local development
- **Zero Downtime:** Netlify can rollback instantly via env var
- **AWS-Aligned:** All choices must map to Aurora/S3/Bedrock/Lambda
- **Production Ready:** No throwaway prototypes

## Implementation Stages

### Stage 1: Database Dual-Mode (1 hour) - IN PROGRESS
- [ ] Update schema: `sqliteTable` → `pgTable`
- [ ] Update client: Add Postgres driver detection
- [ ] Update drizzle config
- [ ] Test with SQLite (backward compat)
- [ ] Document migration steps

### Stage 2: Abstractions (1.5 hours) - PENDING
- [ ] Add storage abstraction (S3/R2)
- [ ] Update session plugin (JWT)
- [ ] Add AI provider abstraction
- [ ] Test all abstractions

### Stage 3: Deployment + Testing (2 hours) - PENDING
- [ ] Update Railway config (Postgres service)
- [ ] Update documentation
- [ ] Deploy to Railway
- [ ] Run migrations and seed
- [ ] Full integration testing

## Acceptance Criteria

- [ ] Database works with both SQLite (dev) and Postgres (production)
- [ ] All 18 tables migrated to Postgres-compatible schema
- [ ] Seed script works with Postgres
- [ ] Storage abstraction functional
- [ ] Sessions use JWT (stateless, Lambda-ready)
- [ ] AI provider abstraction in place
- [ ] Railway deployment successful
- [ ] Frontend integration working
- [ ] All choices AWS-aligned (Aurora/S3/Bedrock)

## Decisions

**2025-10-21:** Chose dual-mode database client over hard cutover to maintain local dev experience with SQLite while production uses Postgres.

**2025-10-21:** Selected JWT cookies over Redis sessions for demo - stateless, Lambda-ready, simpler deployment.

**2025-10-21:** Chose S3-compatible storage from start (Railway S3 plugin or R2) to avoid migration later.

**2025-10-21:** Implementing in 3 stages with checkpoints to validate database migration before adding abstractions.

## Changelog

- **2025-10-21 14:45 UTC** - Created task context, starting Stage 1 (database migration)

## Related Files

### Backend Core
- `backend/src/db/client.ts` - Database connection (dual-mode)
- `backend/src/db/schema.ts` - Table definitions (Postgres)
- `backend/drizzle.config.ts` - ORM configuration
- `backend/src/db/migrate.ts` - Migration runner
- `backend/src/db/seed.ts` - Seed script

### Services (New)
- `backend/src/services/storage/*` - Storage abstraction
- `backend/src/services/ai/*` - AI provider abstraction
- `backend/src/plugins/session.plugin.ts` - JWT sessions

### Deployment
- `backend/railway.toml` - Railway configuration
- `DEPLOYMENT.md` - Deployment guide
- `backend/.env.example` - Environment variables

### Documentation
- `docs/tasks/postgres-abstractions/plans/1-database.md` - Database migration plan
- `docs/tasks/postgres-abstractions/research/postgres-migration.md` - Research notes
