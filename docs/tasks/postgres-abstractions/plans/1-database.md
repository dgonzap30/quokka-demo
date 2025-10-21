# Phase 1: Database Migration to Postgres

**Status:** In Progress
**Estimated:** 1 hour
**Last Updated:** 2025-10-21

---

## Objective

Migrate Drizzle schema from SQLite to Postgres while maintaining dual-mode support for local development.

## Current State Analysis

**Schema File:** `backend/src/db/schema.ts` (719 lines)
- Uses `sqliteTable` from `drizzle-orm/sqlite-core`
- 18 tables total
- Uses text() for all string/UUID columns
- Uses text() for timestamps (ISO 8601 strings)
- Uses integer() for numbers

**Client File:** `backend/src/db/client.ts`
- Hardcoded to better-sqlite3
- No Postgres support

**Packages Installed:**
- ✅ `postgres@3.4.7` (already installed)
- ✅ `better-sqlite3@11.10.0` (already installed)
- ✅ `drizzle-orm@0.33.0` (already installed)

---

## Migration Strategy

### Approach: Dual-Mode with Runtime Detection

**Why:** Allows developers to use SQLite locally (zero setup) while production uses Postgres (Aurora-compatible).

**How:**
1. Convert schema to use `pgTable` from `drizzle-orm/pg-core`
2. Update client to detect DATABASE_URL format
3. Use postgres.js driver when URL starts with `postgresql://`
4. Fall back to SQLite for local dev when no URL or file path

###  Type Mapping: SQLite → Postgres

| SQLite Type | Postgres Type | Drizzle Method | Use Case |
|-------------|---------------|----------------|----------|
| `text()` (UUID) | `uuid` | `uuid()` | Primary keys, foreign keys |
| `text()` (timestamp) | `timestamp` | `timestamp()` | created_at, updated_at |
| `text()` (varchar) | `varchar` | `varchar(255)` | name, email, title |
| `text()` (large text) | `text` | `text()` | content, description |
| `integer()` | `integer` | `integer()` | counts, numbers |

### Schema Changes Required

1. **Imports**
```typescript
// OLD
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// NEW
import { pgTable, uuid, timestamp, varchar, text, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
```

2. **UUID Columns**
```typescript
// OLD
function uuidColumn(name: string) {
  return text(name).notNull().primaryKey().$defaultFn(() => randomUUID());
}

// NEW
function uuidColumn(name: string) {
  return uuid(name).notNull().primaryKey().defaultRandom();
}
```

3. **Timestamp Columns**
```typescript
// OLD
createdAt: text("created_at").notNull()

// NEW
createdAt: timestamp("created_at").notNull().defaultNow()
```

4. **Varchar vs Text**
```typescript
// OLD
name: text("name").notNull()
content: text("content").notNull()

// NEW
name: varchar("name", { length: 255 }).notNull()  // Short strings
content: text("content").notNull()  // Long text
```

5. **Table Definitions**
```typescript
// OLD
export const users = sqliteTable("users", { ... });

// NEW
export const users = pgTable("users", { ... });
```

---

## Implementation Steps

### Step 1: Backup Current Schema
```bash
cp src/db/schema.ts src/db/schema.ts.sqlite.backup
```

### Step 2: Update Schema Imports
Replace sqlite-core imports with pg-core imports.

### Step 3: Convert UUID Helpers
Update helper functions to use Postgres UUID type.

### Step 4: Convert All 18 Tables

**Tables to Convert:**
1. users
2. courses
3. auth_sessions
4. enrollments
5. threads
6. posts
7. course_materials
8. assignments
9. ai_answers
10. ai_answer_citations
11. ai_conversations
12. ai_messages
13. thread_endorsements
14. thread_upvotes
15. post_endorsements
16. ai_answer_endorsements
17. response_templates
18. notifications

**For Each Table:**
- Change `sqliteTable` → `pgTable`
- Change UUID columns to `uuid()`
- Change timestamps to `timestamp()`
- Change short strings to `varchar(255)`
- Keep long text as `text()`
- Keep integers as `integer()`
- Keep indexes unchanged
- Keep relations unchanged

### Step 5: Update Database Client

**File:** `backend/src/db/client.ts`

```typescript
import Database from "better-sqlite3";
import postgres from "postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL || "./dev.db";

// Detect database type from URL
const isPostgres = DATABASE_URL.startsWith("postgresql://") || DATABASE_URL.startsWith("postgres://");

let db: ReturnType<typeof drizzlePostgres> | ReturnType<typeof drizzleSqlite>;
let closeDatabase: () => void;
let isDatabaseHealthy: () => boolean;

if (isPostgres) {
  // Postgres mode (production)
  const sql = postgres(DATABASE_URL);
  db = drizzlePostgres(sql, { schema });

  closeDatabase = async () => await sql.end();

  isDatabaseHealthy = async () => {
    try {
      const result = await sql`SELECT 1 as health`;
      return result[0]?.health === 1;
    } catch {
      return false;
    }
  };
} else {
  // SQLite mode (local dev)
  const sqlite = new Database(DATABASE_URL);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");

  db = drizzleSqlite(sqlite, { schema });

  closeDatabase = () => sqlite.close();

  isDatabaseHealthy = () => {
    try {
      const result = sqlite.prepare("SELECT 1 as health").get();
      return result.health === 1;
    } catch {
      return false;
    }
  };
}

export { db, closeDatabase, isDatabaseHealthy };
```

### Step 6: Update Drizzle Config

**File:** `backend/drizzle.config.ts`

```typescript
import type { Config } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL || "./dev.db";
const isPostgres = DATABASE_URL.startsWith("postgresql://") || DATABASE_URL.startsWith("postgres://");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: isPostgres ? "pg" : "better-sqlite",
  dbCredentials: isPostgres
    ? { connectionString: DATABASE_URL }
    : { url: DATABASE_URL },
} satisfies Config;
```

### Step 7: Test with SQLite (Backward Compat)

```bash
# Should still work with SQLite
npm run db:migrate
npm run db:seed
npm run dev

# Test health endpoint
curl http://localhost:3001/health
```

### Step 8: Prepare for Postgres Testing

Create `.env` with Postgres URL for testing:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/quokka_demo
```

---

## Testing Checklist

- [ ] Schema compiles (TypeScript)
- [ ] Drizzle migrations generate
- [ ] SQLite mode works (local dev)
- [ ] Seed script runs successfully
- [ ] All endpoints return data
- [ ] No type errors
- [ ] Health check passes

---

## Rollback Plan

If migration fails:
```bash
cp src/db/schema.ts.sqlite.backup src/db/schema.ts
npm run db:migrate
npm run dev
```

---

## Known Risks

1. **Type mismatches** - Postgres is stricter with types than SQLite
2. **Migration complexity** - 719 lines to convert accurately
3. **Seed data** - May need adjustments for Postgres types

## Mitigation

- Backup before changes
- Test with SQLite first (prove backward compat)
- Convert systematically (table by table)
- Verify TypeScript compilation after each change

---

## Next Steps (After Phase 1)

1. Deploy to Railway with Postgres service
2. Test migrations on actual Postgres
3. Verify seed data loads correctly
4. Move to Phase 2 (Storage abstraction)
