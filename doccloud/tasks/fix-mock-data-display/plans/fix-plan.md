# Fix Plan: Mock Data Display

## Root Cause

The `seedData()` function in `lib/store/localStore.ts` only seeds once per browser. The `initialized` flag prevents re-seeding even when JSON files are updated.

**Current code:**
```typescript
const initialized = localStorage.getItem(KEYS.initialized);
if (initialized) return; // ← Blocks all updates!
```

## Solution: Version-Based Seeding

Implement a versioning system that re-seeds when mock data version changes.

---

## Implementation Steps

### Step 1: Add Seed Version Constant
**File:** `lib/store/localStore.ts`
**Action:** Add version constant at top of file
```typescript
const SEED_VERSION = 'v2.0.0'; // Increment when mock data changes
```

### Step 2: Update Version Check Logic
**File:** `lib/store/localStore.ts`
**Action:** Replace simple boolean check with version comparison
```typescript
const currentVersion = localStorage.getItem(KEYS.seedVersion);
if (currentVersion === SEED_VERSION) return; // Same version, skip
```

### Step 3: Store Version After Seeding
**File:** `lib/store/localStore.ts`
**Action:** Save version after successful seed
```typescript
localStorage.setItem(KEYS.seedVersion, SEED_VERSION);
localStorage.setItem(KEYS.initialized, 'true'); // Keep for compatibility
```

### Step 4: Add seedVersion to KEYS
**File:** `lib/store/localStore.ts`
**Action:** Add to KEYS object
```typescript
const KEYS = {
  // ... existing keys
  seedVersion: 'quokkaq.seedVersion',
  initialized: 'quokkaq.initialized',
} as const;
```

### Step 5: Test Sequence
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Verify data loads (24 threads should appear)
4. Check localStorage in DevTools
5. Refresh again - should NOT re-seed
6. Change version to v2.0.1
7. Refresh - SHOULD re-seed

### Step 6: Document Clear-Cache Instructions
**File:** `README.md`
**Action:** Add section on viewing new mock data

---

## Verification

✅ All JSON files import without errors
✅ seedData() runs on first load
✅ seedData() skips on subsequent loads (same version)
✅ seedData() re-runs when version changes
✅ 24 threads visible on home page
✅ AI answers display on thread detail
✅ Notifications panel shows 40 items
✅ Dashboards populate correctly

---

## Files to Modify

1. `lib/store/localStore.ts` - Add versioning logic
2. `README.md` - Add clear-cache instructions

---

## Risk Mitigation

- Keep old `initialized` flag for backward compatibility
- Version check is simple string comparison (fast)
- No breaking changes to API surface
- Easy to rollback (just remove version check)
