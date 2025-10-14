# Q&A Companion Component Patterns Research

**Date:** 2025-10-13
**Task:** Dashboard Q&A Companion Refocus
**Agent:** Component Architect

---

## Executive Summary

Analyzed existing dashboard components to identify reusability opportunities for Q&A-focused redesign. Current dashboard has LMS-like feel with study streaks and deadline tracking. Need to refocus on:
1. AI-powered Q&A engagement metrics (Quokka Points)
2. Peer collaboration opportunities (assignment-linked Q&A)
3. Q&A-first action hierarchy

---

## 1. Existing Component Audit

### Components to Replace

#### `StudyStreakCard` (`components/dashboard/study-streak-card.tsx`)
**Current Approach:**
- Tracks consecutive days with activity
- Weekly activity goal progress (Progress component)
- Flame icon for streak visualization
- Achievement badges (optional)

**LMS-Like Issues:**
- Emphasizes generic "study streak" (not Q&A specific)
- Weekly goal feels academic performance focused
- Flame icon doesn't connect to Q&A collaboration

**Reusable Patterns:**
- Props interface structure (clear separation of data/UI)
- Loading skeleton with `glass-panel` aesthetic
- Progress bar pattern with percentage calculation
- Motivational messaging based on metric values
- Achievement display (badges in row)

**What to Keep:**
- Clean props-driven architecture
- Glass aesthetic (Card variant="glass-hover")
- Skeleton loading states
- Accessibility (aria-labels, semantic HTML)

---

#### `UpcomingDeadlines` (`components/dashboard/upcoming-deadlines.tsx`)
**Current Approach:**
- Timeline visualization with dots and connecting lines
- Deadline urgency colors (red ≤1 day, yellow ≤3 days, primary default)
- Type icons (assignment, exam, quiz, project, office-hours)
- Relative time display ("Due in X days")

**LMS-Like Issues:**
- Focus on deadlines/dates (not Q&A opportunities)
- Course-centric framing (assignments as tasks to complete)
- No connection to Q&A activity or peer help

**Reusable Patterns:**
- Timeline visualization (dot + connecting line CSS)
- Urgency color system (danger/warning/primary)
- Date calculation utilities (diffDays, relative time)
- Optional link wrapper pattern
- Empty state handling

**What to Keep:**
- Timeline visual pattern (repurpose for Q&A activity)
- Urgency color system (apply to question age/unanswered status)
- Card composition within timeline
- Relative time formatting

---

#### `QuickActionsPanel` (`components/dashboard/quick-actions-panel.tsx`)
**Current Approach:**
- 2x2 or 4-column grid of action buttons
- Icon + label layout
- Optional badge counts
- Variant-based styling (default/primary/success)
- Link vs onClick flexibility

**Current Actions:**
1. Ask Question (primary variant, MessageSquarePlus icon)
2. Browse Threads (BookOpen icon)
3. Notifications (Bell icon, badge count)
4. Search (Search icon)

**Issues:**
- Equal visual weight to all actions
- Missing Q&A-specific actions (Help Answer, Share Conversation)
- Doesn't emphasize AI collaboration

**What Works:**
- Flexible action configuration (href vs onClick)
- Badge count support
- Variant system for emphasis
- Grid responsiveness (2 cols mobile, 4 cols desktop)

**Reusable Patterns:**
- `QuickActionButton` interface (id, label, icon, href, onClick, badgeCount, variant)
- Dynamic action generation from data
- Icon + label + badge composition
- Hover states on glass background

---

### Components to Keep (Minimal Changes)

#### `StatCard` (`components/dashboard/stat-card.tsx`)
**Strengths:**
- Flexible metric display (value, trend, sparkline)
- Variant system (default/warning/success/accent)
- Optional CTA button
- Icon support with colored background
- Glass aesthetic compatible

**Potential Use:**
- Display Quokka Points balance
- Show endorsement counts
- Track Q&A participation metrics

**No major changes needed** - works well for metrics display

---

#### `EnhancedCourseCard` (`components/dashboard/enhanced-course-card.tsx`)
**Current Focus:**
- Q&A metrics already present (Questions, New, Unanswered)
- AI badge when AI coverage >30%
- Glass hover effect

**Minimal Changes:**
- Update copy to emphasize "Ask about this course"
- Add Q&A engagement sparkline (optional)

---

### Pattern: Glass Aesthetic Integration

**All components use QDS glass system:**
```tsx
// Standard glass card
<Card variant="glass" className="...">

// Glass hover effect
<Card variant="glass-hover" className="...">

// Glass panel utility
<div className="glass-panel">

// Glass text shadow for readability
<p className="glass-text">
```

**Key Design Tokens:**
- `--glass-medium`: Default translucent background
- `--glass-strong`: Enhanced blur for emphasis
- `--border-glass`: Subtle glass border
- `--shadow-glass-md`: Diffuse shadow for depth
- `backdrop-filter: blur(12px)`: Standard blur value

**Accessibility:**
- `.glass-text` adds text-shadow for readability
- Fallback to solid `--card` background when backdrop-filter unsupported
- WCAG AA contrast maintained (4.5:1 minimum)

---

## 2. Q&A Companion Patterns from Instructor Dashboard

### Endorsement UI Patterns

**From `PriorityQueueCard` (instructor):**
- Endorsement button with ThumbsUp icon
- Endorsement count display
- Visual feedback on endorsed state
- Bulk endorsement checkbox pattern

**Applicability to Student Dashboard:**
- Show "Your endorsed answers" count
- Display community endorsement stats
- Highlight peer-endorsed helpful answers

---

### AI Answer Integration

**From AI answer components:**
- AI badge with confidence level
- Citation count display
- "Request Human Review" CTA
- Confidence chip (high/medium/low with color coding)

**Student Dashboard Use:**
- Show AI answer quality across courses
- Highlight high-confidence answers available
- Track questions with AI + peer validation

---

## 3. Gamification Patterns (Educational, Not Gamey)

### Good Examples (Educational Feel)

**LinkedIn Learning Style:**
- Progress towards skill milestones
- "X people found this helpful"
- Subtle badges for contributions
- Emphasis on learning outcomes

**Stack Overflow Reputation:**
- Point system tied to community value
- Reputation = trust + expertise
- Visible contribution history
- Badges for specific Q&A behaviors

**GitHub Contributions:**
- Visual contribution graph
- Streak-like without pressure
- Focus on activity patterns
- Green squares = participation

---

### Anti-Patterns to Avoid

**Duolingo-Style Streaks:**
- Pressure to maintain daily activity
- Loss aversion mechanics
- Fire/danger framing
- Competitive leaderboards

**Mobile Game Mechanics:**
- Loot boxes / random rewards
- Energy systems / cooldowns
- Pay-to-win elements
- Aggressive notifications

---

### Quokka Points Philosophy

**Educational Framing:**
- Points = community contribution value
- Tied to helping peers (endorsements, answers)
- No punishment for inactivity
- Milestones celebrate learning journey

**Point Sources (Proposed):**
- +10: Post helpful answer
- +5: Receive peer endorsement
- +20: Receive instructor endorsement
- +15: Share AI conversation as thread
- +10: First answer in a course
- +5: Ask well-formed question (with details, tags)

**Visual Design:**
- Quokka icon (friendly, approachable)
- Warm color palette (primary: #8A6B3D)
- Progress arc (not full circle = less pressure)
- Subtle animations (no explosions/confetti)
- Milestone markers (100, 250, 500, 1000 points)

---

## 4. Assignment Q&A Opportunities Pattern

### Concept Shift

**From:** Deadline = task to complete alone
**To:** Assignment = opportunity for collaborative Q&A

### Data Structure (Proposed)

```typescript
interface AssignmentQAMetrics {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  dueDate: string; // ISO 8601

  // Q&A Metrics
  totalQuestions: number;
  unansweredQuestions: number;
  yourQuestions: number;
  yourAnswers: number;
  aiAnswersAvailable: number;

  // Engagement Signals
  activeStudents: number; // How many asking/answering
  recentActivity: string; // "5 questions in last hour"

  // Call to Action
  suggestedAction: "ask" | "answer" | "review";
  actionReason: string; // "3 unanswered questions" or "High activity - join discussion"
}
```

### Visual Design Options

**Option A: Timeline (Like Current Deadlines)**
- Vertical timeline with assignment milestones
- Q&A metrics in card content
- Urgency = question age, not deadline proximity
- Color coding: unanswered (warning), active (accent), resolved (success)

**Option B: Card Grid**
- 2-column grid of assignment cards
- Larger space for Q&A stats
- CTA button ("Ask Question" / "Help Answer")
- Better for rich content (sparklines, avatars)

**Option C: Hybrid Timeline with Expandable Cards**
- Timeline dots show assignments
- Cards expand to show Q&A details
- Compact by default, detailed on click
- Best of both worlds

**Recommendation:** **Option C** - maintains timeline familiarity while allowing rich Q&A content

---

## 5. Reusability Strategy

### Shared Primitives (Keep Using)

**From shadcn/ui:**
- `Card` with glass variants
- `Badge` for status/counts
- `Button` for CTAs
- `Progress` for goals
- `Skeleton` for loading states

**From dashboard components:**
- `StatCard` - perfect for metrics
- `MiniSparkline` - trend visualization
- Timeline dot + line pattern (CSS utilities)

### New Shared Components (Create Once, Use Everywhere)

**`QuokkaPointsBadge`:**
- Inline point display with icon
- Animated on point gain
- Tooltip with breakdown
- Reusable in nav, dashboard, thread detail

**`EndorsementButton`:**
- ThumbsUp icon + count
- Endorsement state (you endorsed, others endorsed)
- Hover tooltip ("15 students found this helpful")
- Used in answers, AI responses

**`QAMetricChip`:**
- Small badge showing Q&A stats
- Icon + number (e.g., "5 💬" for 5 questions)
- Semantic colors (warning for unanswered, success for resolved)
- Used in course cards, assignments, nav badges

### Component Composition Hierarchy

```
StudentDashboard
├── QuokkaPointsCard (NEW)
│   ├── Card (shadcn)
│   ├── QuokkaPointsBadge (NEW)
│   ├── Progress (shadcn)
│   └── MiniSparkline (existing)
├── QuickActionsPanel (REDESIGN)
│   ├── Card (shadcn)
│   └── QuickActionButton[] (updated actions)
├── AssignmentQAOpportunities (NEW)
│   ├── Timeline visualization (CSS)
│   ├── AssignmentQACard (NEW)
│   │   ├── Card (shadcn)
│   │   ├── QAMetricChip[] (NEW)
│   │   └── Button CTA (shadcn)
│   └── Empty state
└── (existing components remain)
```

---

## 6. Accessibility Considerations

### Screen Reader Patterns

**Point Display:**
```tsx
<div aria-label={`${points} Quokka Points`}>
  <span aria-hidden="true">🦘 {points}</span>
</div>
```

**Q&A Metrics:**
```tsx
<span className="sr-only">
  {unanswered} unanswered questions, {active} students discussing
</span>
```

**Timeline:**
```tsx
<ol aria-label="Assignment Q&A opportunities">
  <li>
    <time dateTime={dueDate}>{relativeDate}</time>
    <div role="status">{qaMetrics}</div>
  </li>
</ol>
```

### Keyboard Navigation

- All action buttons keyboard accessible
- Focus indicators visible on glass backgrounds
- Tab order: points → actions → assignments → courses
- Escape to close expanded cards

### Color + Text (Never Color Alone)

- Urgency communicated by icon + text + color
- Point milestones have both visual + text labels
- Status badges include icon + text

---

## 7. Performance Considerations

### Glass Effect Optimization

**Current Implementation:**
- Max 3 blur layers per view (QDS guideline)
- `will-change: backdrop-filter` on glass elements
- `transform: translateZ(0)` for GPU acceleration
- Reduced motion support disables animations

**Dashboard Glass Layers:**
1. Background gradient (no blur)
2. Card surfaces (`backdrop-blur-md` = 12px)
3. Hover effects (`backdrop-blur-lg` = 16px on hover only)

### Data Loading Strategy

**Existing Pattern:**
- React Query for server state
- Skeleton loading states
- Optimistic updates for mutations
- 5min stale time for dashboard metrics

**For New Components:**
- `useQuokkaPoints(userId)` - cached, updates on activity
- `useAssignmentQAMetrics(courseId)` - refetch on interval (30s)
- Prefetch on route enter, stale while revalidate

---

## 8. Dark Mode Compatibility

All new components must support dark theme:

```css
/* Light theme glass */
--glass-medium: rgba(255, 255, 255, 0.7)
--border-glass: rgba(255, 255, 255, 0.18)

/* Dark theme glass */
.dark --glass-medium: rgba(23, 21, 17, 0.7)
.dark --border-glass: rgba(255, 255, 255, 0.08)
```

**Text Shadows:**
- Light: `0 1px 2px rgba(0, 0, 0, 0.1)`
- Dark: `0 1px 2px rgba(0, 0, 0, 0.3)`

**Point Colors:**
- Use semantic tokens (`--primary`, `--warning`, `--success`)
- Auto-adapt in dark mode

---

## 9. Mobile Responsiveness

### Breakpoint Strategy

```
360px  - Mobile small (1 column, compact cards)
640px  - Mobile large (actions 2x2)
768px  - Tablet (assignment timeline shows)
1024px - Desktop (3-column layout)
```

### Mobile-First Adaptations

**QuokkaPointsCard:**
- Compact: Just point value + small progress
- Expanded: Tap to see breakdown

**QuickActionsPanel:**
- 2x2 grid on mobile
- Primary action (Ask Question) larger
- Icons + labels always visible (no icon-only mode)

**AssignmentQAOpportunities:**
- Simplified timeline on mobile
- Swipe to expand cards (optional)
- CTA buttons stack vertically

---

## 10. Key Insights & Recommendations

### Patterns to Replicate

1. **Props-driven architecture** - All existing components follow this; maintain consistency
2. **Glass aesthetic** - Use existing utilities, no custom CSS
3. **Loading states** - Skeleton with `bg-glass-medium` works well
4. **Icon + text + color** - Accessibility pattern used throughout
5. **Timeline visualization** - CSS-based, performant, accessible

### Patterns to Avoid

1. **Hardcoded data** - Current components all use props; don't break this
2. **Complex state** - Keep component state minimal; lift to parent
3. **Inline styles** - Use Tailwind + QDS tokens only
4. **Custom animations** - Use QDS animations or none (reduced motion)

### Design System Compliance Checklist

For each new component:

- [ ] Uses QDS color tokens (no hardcoded hex)
- [ ] Uses QDS spacing scale (gap-1, gap-2, gap-4, gap-6, gap-8)
- [ ] Uses QDS radius scale (rounded-md, rounded-lg, rounded-xl)
- [ ] Uses QDS shadows (shadow-e1, shadow-e2, shadow-e3, shadow-glass-md)
- [ ] Glass effects use predefined utilities (.glass-panel, .glass-text)
- [ ] Typography uses Tailwind classes (text-sm, text-lg, font-semibold)
- [ ] Interactive states defined (hover, focus, disabled)
- [ ] Accessibility attributes present (aria-label, role, semantic HTML)
- [ ] Keyboard navigation tested
- [ ] Dark mode verified
- [ ] Mobile responsive (tested at 360px, 768px, 1024px)

---

## Conclusion

Existing dashboard components provide strong foundation for Q&A refocus:

- **StudyStreakCard** → Replace with **QuokkaPointsCard** (similar structure, Q&A framing)
- **UpcomingDeadlines** → Replace with **AssignmentQAOpportunities** (reuse timeline pattern, Q&A metrics)
- **QuickActionsPanel** → Redesign with Q&A-first actions (minimal structural change)

All components share:
- Glass aesthetic (QDS 2.0 glassmorphism)
- Props-driven architecture (no hardcoded values)
- Accessibility patterns (WCAG AA, keyboard nav)
- Performance optimizations (GPU acceleration, reduced motion)
- Mobile-first responsiveness

Next step: Detailed component design with TypeScript interfaces, file structure, and usage examples.
