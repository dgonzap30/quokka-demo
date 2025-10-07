# Mock Data Display Investigation

## Hypothesis

The new mock data may not be loading due to:
1. localStorage already initialized with old data (initialized flag prevents reseed)
2. JSON import errors
3. Type mismatches causing runtime errors
4. React Query cache serving stale data

## Investigation Steps

### 1. Check localStorage initialization logic

The `seedData()` function in `localStore.ts` has this guard:
```typescript
const initialized = localStorage.getItem(KEYS.initialized);
if (initialized) return; // Already seeded ← THIS PREVENTS RESEEDING
```

**FINDING:** Once localStorage is seeded, it never updates even if JSON files change!

### 2. Solutions

**Option A: Force Reseed (Development)**
- Delete the initialized flag check temporarily
- Or add version check: `if (initialized === 'v1.0.0') return;`

**Option B: Manual Clear (User Action)**
- User must run `localStorage.clear()` in console
- Then refresh page

**Option C: Version-based Seeding (Production-Ready)**
- Add version to seed data
- Re-seed when version changes
- Preserves user-created data in future

## Recommended Approach

Implement **Option C** - version-based seeding:
1. Add `SEED_VERSION` constant
2. Check version on load
3. Re-seed if version mismatch
4. Preserves localStorage between sessions but allows updates

## Next Steps

1. Update `localStore.ts` with version checking
2. Test with browser dev tools
3. Verify all data loads correctly
4. Document clear-cache instructions in README
