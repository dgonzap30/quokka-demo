# Profile & Settings Simplification - Task Context

**Created:** 2025-10-14
**Status:** In Progress

---

## Goal

Simplify the ProfileSettingsDropdown and create dedicated profile and settings pages for a more professional, streamlined user experience.

---

## In-Scope

**Modal Simplification:**
- Remove Dashboard link from Profile tab
- Remove Quokka Points section from modal
- Reduce modal width (w-80 → w-64)
- Simplify Profile tab to just show user info + links

**Profile Page:**
- Create `/profile` route with full profile view
- Display user info, avatar, role, stats
- Add "View Profile" link in Profile tab

**Settings Pages:**
- `/settings` - main settings hub
- `/settings/notifications` - notification preferences
- `/settings/appearance` - theme and display
- `/settings/privacy` - privacy controls
- `/settings/help` - help & support

**Icon Simplification:**
- Use more professional icon (CircleUser or similar)

---

## Out-of-Scope

- User profile editing functionality (display-only for now)
- Complex settings logic (basic structure only)
- Backend integration

---

## Acceptance Criteria

**Done When:**
- [x] ProfileSettingsDropdown simplified (no Dashboard, no Points, smaller)
- [x] Profile page created at `/profile`
- [x] Settings pages created (5 routes)
- [x] Modal width reduced to w-64
- [x] "View Profile" link added to Profile tab
- [x] Professional icon used
- [x] Types pass, lint clean
- [x] All pages responsive and QDS compliant

---

## Changelog

- `2025-10-14` | [Setup] | Created task context for profile/settings simplification
- `2025-10-14` | [Implementation] | Simplified ProfileSettingsDropdown - removed Dashboard link, Quokka Points, reduced width from w-80 to w-64
- `2025-10-14` | [Implementation] | Changed icon from User to CircleUser for more professional appearance
- `2025-10-14` | [Implementation] | Simplified button styling - removed scale animations, simplified hover states
- `2025-10-14` | [Implementation] | Created Profile page at `/profile` with user info, account details, activity overview
- `2025-10-14` | [Implementation] | Created Settings hub page at `/settings` with 4 category cards
- `2025-10-14` | [Implementation] | Created `/settings/notifications` page with email and push notification controls
- `2025-10-14` | [Implementation] | Created `/settings/appearance` page with theme selection and display options
- `2025-10-14` | [Implementation] | Created `/settings/privacy` page with visibility, data, and content privacy controls
- `2025-10-14` | [Implementation] | Created `/settings/help` page with help resources, FAQs, and system info
- `2025-10-14` | [Verification] | Added shadcn/ui components: Label, Switch, RadioGroup
- `2025-10-14` | [Verification] | TypeScript typecheck passed (0 errors)
- `2025-10-14` | [Verification] | ESLint passed (0 new warnings)
- `2025-10-14` | [Enhancement] | Fixed settings navigation - each settings option now navigates to its specific page (notifications, appearance, privacy, help)
- `2025-10-14` | [Enhancement] | Replaced CircleUser icon with simple User icon for more professional appearance
- `2025-10-14` | [Verification] | TypeScript typecheck passed (0 errors)
- `2025-10-14` | [Verification] | ESLint passed (0 new warnings)
