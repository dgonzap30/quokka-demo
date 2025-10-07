# Task: Fix Mock Data Display Issues

**Created:** 2025-10-07
**Status:** In Progress

---

## Goal

Fix mock data not displaying properly after comprehensive data generation. Ensure all 24 threads, 30 AI answers, 40 notifications, and other data appear correctly in the UI.

---

## In-Scope

- Diagnose why new mock data isn't appearing
- Fix localStorage initialization issues
- Verify all data files load correctly
- Test all pages display correct data
- Clear browser cache if needed

---

## Out-of-Scope

- Adding new features beyond current mock data
- Changing data structure
- Backend integration

---

## Done When

- [x] Version-based seeding implemented in localStore.ts
- [x] SEED_VERSION constant added and documented
- [x] seedData() function updated to check version
- [x] README.md updated with clear-cache instructions
- [x] TypeScript/lint/build all pass
- [ ] Manual verification: Clear localStorage and verify 24 threads load
- [ ] Manual verification: Thread detail pages show AI answers
- [ ] Manual verification: Notifications panel shows 40 notifications

---

## Constraints

- Must maintain existing API contracts
- Cannot break existing functionality
- Must follow QDS design system
- Changes must be minimal and focused

---

## Acceptance Criteria

```
✅ localStorage clears and reseeds correctly
✅ All JSON files import without errors
✅ Thread list shows 20+ threads
✅ AI answers appear on thread detail pages
✅ Dashboards populate with real metrics
✅ No console errors
✅ Production build succeeds
```

---

## Known Risks

1. **localStorage caching** - Old data may persist, needs hard reset
2. **JSON import errors** - New files may have syntax issues
3. **Type mismatches** - AI answer/notification types may conflict
4. **React Query stale time** - Cached queries may not refetch

---

## Rollback Plan

If issues persist:
1. Restore original mock files from git
2. Clear localStorage manually
3. Verify seed function runs on fresh session

---

## Related Files

- `mocks/*.json` - All mock data files
- `lib/store/localStore.ts` - Data seeding logic
- `lib/api/client.ts` - API layer
- `lib/api/hooks.ts` - React Query hooks

---

## Decisions

### Decision 1: Version-Based Seeding Strategy
**Date:** 2025-10-07
**Context:** localStorage persists between sessions, blocking updates to mock data
**Decision:** Implement version-based seeding with `SEED_VERSION` constant
**Rationale:**
- Simple string comparison (fast, no performance impact)
- Backward compatible (keeps `initialized` flag)
- Allows controlled updates when mock data changes
- Developer-friendly (just increment version number)

**Files Modified:**
- `lib/store/localStore.ts` - Added SEED_VERSION, updated seedData() logic

### Decision 2: Keep `initialized` Flag for Compatibility
**Date:** 2025-10-07
**Context:** Existing code may check `initialized` flag
**Decision:** Keep both `initialized` and `seedVersion` flags
**Rationale:** No breaking changes, easy rollback if needed

---

## Changelog

- 2025-10-07 18:30 - ✅ Implemented version-based seeding with SEED_VERSION = 'v2.0.0'
- 2025-10-07 18:30 - ✅ Updated README.md with clear-cache instructions
- 2025-10-07 18:30 - ✅ All code changes complete, TypeScript and lint passing
- 2025-10-07 18:00 - Task created, investigating display issues
