# Engagement Patterns Research

**Author:** AI Planner
**Date:** 2025-10-07
**Task:** Design realistic view counts and endorsement patterns for mock data

---

## Overview

Current mock data uses arbitrary engagement metrics (views: 13-108, endorsements: random). We need realistic patterns that correlate with thread age, quality, answer completeness, and course enrollment.

---

## 1. View Count Formulas

### Base Formula

```
views = baseViews × ageFactor × qualityFactor × courseSizeFactor
```

### Component Definitions

#### 1.1 Base Views (by thread status)
- **Unanswered/Open threads**: 8-15 base views
- **Answered threads**: 15-25 base views
- **Resolved threads**: 20-35 base views

**Rationale:** Resolved threads indicate high-quality content worth revisiting. Answered threads attract more engagement than unanswered.

#### 1.2 Age Factor (time since creation)

```javascript
const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);

ageFactor = 1 + (daysSinceCreation / 7) × 0.5;
// Examples:
// - 1 day old: 1.07×
// - 7 days old: 1.5×
// - 14 days old: 2.0×
// - 21 days old: 2.5×
// - 28 days old: 3.0×
```

**Rationale:** Older threads accumulate more views organically. Factor grows linearly but capped at reasonable multiples.

#### 1.3 Quality Factor (indicators of helpfulness)

```javascript
qualityScore = 0;

// Thread has AI answer
if (hasAIAnswer) qualityScore += 0.3;

// Thread has replies
if (replyCount > 0) qualityScore += 0.2;

// Thread has endorsed posts
if (hasEndorsedPosts) qualityScore += 0.3;

// Thread has instructor activity
if (hasInstructorReply) qualityScore += 0.2;

// Thread is resolved
if (status === 'resolved') qualityScore += 0.25;

qualityFactor = 1 + qualityScore;
// Range: 1.0× to 2.25×
```

**Rationale:** High-quality threads (with answers, endorsements, instructor engagement) attract more views through recommendations, search rankings, and user sharing.

#### 1.4 Course Size Factor

```javascript
const enrollmentBrackets = {
  small: { max: 35, factor: 0.8 },   // < 35 students
  medium: { max: 50, factor: 1.0 },  // 35-50 students
  large: { max: 100, factor: 1.3 }   // > 50 students
};

// Example enrollment counts from courses.json:
// CS 301: 32 students → 0.8×
// ENG 101: 42 students → 1.0×
// CS 101: 52 students → 1.3×
```

**Rationale:** Larger courses generate more organic traffic. Small advanced courses (CS 301) have fewer but more focused viewers.

### Realistic View Ranges

| Thread Age | Course Size | Status | Quality | Estimated Views |
|------------|-------------|--------|---------|-----------------|
| 1 day | Small (32) | Open | Low | 8-12 |
| 7 days | Medium (42) | Answered | Medium | 25-40 |
| 14 days | Large (52) | Answered | High | 60-90 |
| 21 days | Medium (48) | Resolved | High | 80-120 |
| 28 days | Large (52) | Resolved | Very High | 120-180 |

**Ceiling:** Cap views at 200 to maintain realism (even viral threads in academic settings rarely exceed this in a single semester).

---

## 2. Post Endorsement Formulas

### What Makes a Post Endorsable?

**High Endorsement Probability (60-80%):**
- Contains code examples that work
- Provides step-by-step explanations
- Cites specific course materials
- Posted by TA or instructor
- Answers the question directly and completely
- Includes visual aids (diagrams, screenshots in text)

**Medium Endorsement Probability (20-40%):**
- Partially correct answer
- Helpful clarification or follow-up
- Asks good clarifying questions
- Shares relevant resources
- Posted early in thread (first responder advantage)

**Low Endorsement Probability (0-10%):**
- Generic encouragement ("good question!")
- Off-topic content
- Incomplete explanations
- Incorrect information
- Duplicates existing answers

### Post Endorsement Pattern

```javascript
function calculatePostEndorsementProbability(post, thread, author) {
  let probability = 0;

  // Role bonus
  if (author.role === 'instructor') probability += 0.5;
  if (author.role === 'ta') probability += 0.3;

  // Content quality (heuristics)
  if (post.content.length > 200) probability += 0.2; // Detailed
  if (post.content.includes('```')) probability += 0.25; // Has code
  if (post.content.match(/step \d/i)) probability += 0.2; // Step-by-step

  // Timing bonus (early helpful answers)
  const hoursSinceThread = (post.createdAt - thread.createdAt) / (1000 * 60 * 60);
  if (hoursSinceThread < 2) probability += 0.15; // First responder

  // Thread quality correlation
  if (thread.status === 'resolved') probability += 0.3; // Resolution indicates good answers

  // Cap at 0.95 (not all good posts get endorsed)
  return Math.min(probability, 0.95);
}

// Apply probability
const endorsed = Math.random() < probability;
```

### Distribution Targets

- **Across all posts:** 20-30% should be endorsed
- **TA posts:** 50-70% endorsed
- **Instructor posts:** 70-90% endorsed
- **Student posts:** 10-25% endorsed
- **Resolved threads:** 40-60% of posts endorsed

**Rationale:** Endorsements signal helpfulness. Not every post deserves one, but high-quality threads should have at least one endorsed response.

---

## 3. AI Answer Endorsement Formulas

### Student Endorsement Pattern

**High Confidence (85-95) AI Answers:**
```javascript
studentEndorsements = Math.floor(
  (confidenceScore / 100) ×
  (thread.views / 10) ×
  random(0.3, 0.6)
);
// Example: 90% confidence, 80 views → 4-7 student endorsements
```

**Medium Confidence (60-75) AI Answers:**
```javascript
studentEndorsements = Math.floor(
  (confidenceScore / 100) ×
  (thread.views / 20) ×
  random(0.2, 0.4)
);
// Example: 70% confidence, 60 views → 1-2 student endorsements
```

**Low Confidence (35-45) AI Answers:**
```javascript
studentEndorsements = Math.floor(
  random(0, 2)
);
// Example: 40% confidence → 0-1 student endorsements
```

**Rationale:** Students endorse AI answers that help them understand. Higher confidence = more helpful = more endorsements. Views indicate exposure.

### Instructor Endorsement Pattern

**Conditions for Instructor Endorsement:**

```javascript
function shouldInstructorEndorse(aiAnswer, thread) {
  // Must be high confidence
  if (aiAnswer.confidenceScore < 80) return false;

  // Must have quality citations (2+ citations, relevance > 85)
  const qualityCitations = aiAnswer.citations.filter(c => c.relevance >= 85);
  if (qualityCitations.length < 2) return false;

  // Thread must have some engagement (not brand new)
  const daysSinceCreation = (Date.now() - new Date(thread.createdAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 1) return false;

  // Thread should have views (instructor noticed it)
  if (thread.views < 20) return false;

  // Probabilistic approval (instructors are selective)
  return Math.random() < 0.4; // 40% of qualifying answers get instructor endorsement
}

instructorEndorsements = shouldInstructorEndorse(aiAnswer, thread) ? 1 : 0;
```

**Rationale:** Instructors only endorse AI answers that are:
1. Highly confident and accurate
2. Well-cited from course materials
3. Have demonstrated student value (views/engagement)
4. They've personally reviewed

Only ~40% of high-quality AI answers get instructor endorsement because instructors review selectively.

### Total Endorsement Calculation

```javascript
totalEndorsements = studentEndorsements + instructorEndorsements;

// Boost total if instructor endorsed (signals quality)
if (instructorEndorsements > 0) {
  totalEndorsements += Math.floor(studentEndorsements * 0.3); // 30% boost
}
```

**Rationale:** Instructor endorsement increases student trust, leading to more subsequent student endorsements.

### AI Answer Endorsement Ranges

| Confidence | Views | Student Endorsements | Instructor Endorsement | Total |
|------------|-------|----------------------|------------------------|-------|
| Low (35-45) | 15-30 | 0-1 | 0 | 0-1 |
| Medium (60-75) | 30-60 | 1-3 | 0 | 1-3 |
| High (85-95), New | 20-40 | 2-5 | 0-1 | 2-6 |
| High (85-95), Popular | 80-120 | 6-12 | 1 | 8-16 |
| High (85-95), Viral | 150-200 | 12-20 | 1 | 16-26 |

---

## 4. Example Calculations

### Example 1: Fresh Thread (1 day old, CS 101)

```javascript
// Thread: "How does binary search work?"
// Course: CS 101 (52 students)
// Age: 1 day
// Status: open
// Has AI Answer: Yes (high confidence, 89%)
// Replies: 1 student reply

// View Calculation
baseViews = 12; // Open thread
ageFactor = 1 + (1/7) × 0.5 = 1.07;
qualityFactor = 1 + 0.3 (AI) + 0.2 (replies) = 1.5;
courseSizeFactor = 1.3; // Large course

views = 12 × 1.07 × 1.5 × 1.3 = 25 views

// AI Answer Endorsements
studentEndorsements = Math.floor((89/100) × (25/10) × 0.4) = 0-1
instructorEndorsements = 0 // Too new, low views
totalEndorsements = 0-1
```

**Result:** 25 views, 0-1 endorsements (realistic for day-old thread)

### Example 2: Established Thread (14 days old, Math 221)

```javascript
// Thread: "Integration by parts confusion"
// Course: Math 221 (48 students)
// Age: 14 days
// Status: answered
// Has AI Answer: Yes (high confidence, 92%)
// Replies: 3 posts, 1 endorsed

// View Calculation
baseViews = 20; // Answered thread
ageFactor = 1 + (14/7) × 0.5 = 2.0;
qualityFactor = 1 + 0.3 (AI) + 0.2 (replies) + 0.3 (endorsed) = 1.8;
courseSizeFactor = 1.0; // Medium course

views = 20 × 2.0 × 1.8 × 1.0 = 72 views

// AI Answer Endorsements
studentEndorsements = Math.floor((92/100) × (72/10) × 0.5) = 3-4
instructorEndorsements = shouldInstructorEndorse() → 40% chance → 0 or 1
totalEndorsements = 3-5 (with 30% boost if instructor endorsed)
```

**Result:** 72 views, 3-5 endorsements (realistic for popular answered thread)

### Example 3: Viral Resolved Thread (21 days old, CS 101)

```javascript
// Thread: "Thesis statement tips"
// Course: ENG 101 (42 students)
// Age: 21 days
// Status: resolved
// Has AI Answer: Yes (high confidence, 88%)
// Replies: 5 posts, 2 endorsed, 1 instructor reply

// View Calculation
baseViews = 30; // Resolved thread
ageFactor = 1 + (21/7) × 0.5 = 2.5;
qualityFactor = 1 + 0.3 (AI) + 0.2 (replies) + 0.3 (endorsed) + 0.2 (instructor) + 0.25 (resolved) = 2.25;
courseSizeFactor = 1.0; // Medium course

views = 30 × 2.5 × 2.25 × 1.0 = 169 views (cap at 200)

// AI Answer Endorsements
studentEndorsements = Math.floor((88/100) × (169/10) × 0.55) = 8-9
instructorEndorsements = shouldInstructorEndorse() → PASS → 1
totalEndorsements = (8 + 1) + (8 × 0.3) = 11-12
```

**Result:** 169 views, 11-12 endorsements (realistic for high-quality resolved thread)

### Example 4: Advanced Course Low Traffic (7 days old, CS 301)

```javascript
// Thread: "NP-completeness proof strategies"
// Course: CS 301 (32 students)
// Age: 7 days
// Status: answered
// Has AI Answer: Yes (medium confidence, 68%)
// Replies: 2 posts, 1 TA reply

// View Calculation
baseViews = 18; // Answered thread
ageFactor = 1 + (7/7) × 0.5 = 1.5;
qualityFactor = 1 + 0.3 (AI) + 0.2 (replies) = 1.5;
courseSizeFactor = 0.8; // Small course

views = 18 × 1.5 × 1.5 × 0.8 = 32 views

// AI Answer Endorsements
studentEndorsements = Math.floor((68/100) × (32/20) × 0.3) = 0-1
instructorEndorsements = 0 // Medium confidence
totalEndorsements = 0-1
```

**Result:** 32 views, 0-1 endorsements (realistic for niche advanced topic)

---

## 5. Edge Cases & Constraints

### Edge Case 1: Brand New Thread (< 4 hours)
- **Views:** 0-5 (only author and early viewers)
- **Endorsements:** 0 (not enough time for review)
- **AI Answer Endorsements:** 0 (no instructor review yet)

### Edge Case 2: Stale Unanswered Thread (14+ days, no activity)
- **Views:** Apply age factor but reduce quality factor (no answers = low quality)
- **Range:** 15-30 views (curiosity but no value)
- **Endorsements:** 0 (no posts to endorse)

### Edge Case 3: Incorrect AI Answer (low confidence, no instructor endorsement)
- **Student Endorsements:** 0-1 max (students recognize it's unhelpful)
- **Instructor Endorsements:** 0
- **Pattern:** Low engagement despite high views

### Edge Case 4: Thread with Only Instructor Reply (no student activity)
- **Views:** Higher than average (instructor reply signals importance)
- **Post Endorsements:** Instructor posts are 80% endorsed
- **AI Endorsements:** Normal pattern

### Edge Case 5: Duplicate/Similar Questions
- **Views:** Lower than formula suggests (students found answer elsewhere)
- **Apply penalty:** Reduce views by 20-30%
- **Endorsements:** Lower (less novel content)

---

## 6. Implementation Strategy

### Step 1: Calculate Thread Age
```javascript
const now = new Date('2025-10-07T12:00:00Z'); // Demo "now"
const createdAt = new Date(thread.createdAt);
const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
```

### Step 2: Gather Thread Context
```javascript
const context = {
  hasAIAnswer: thread.hasAIAnswer,
  replyCount: posts.filter(p => p.threadId === thread.id).length,
  hasEndorsedPosts: posts.some(p => p.threadId === thread.id && p.endorsed),
  hasInstructorReply: posts.some(p => p.threadId === thread.id && users[p.authorId].role === 'instructor'),
  status: thread.status,
  courseSize: courses[thread.courseId].enrollmentCount,
  aiAnswer: aiAnswers.find(a => a.id === thread.aiAnswerId)
};
```

### Step 3: Calculate Views
```javascript
const baseViews = getBaseViews(thread.status);
const ageFactor = 1 + (daysSinceCreation / 7) * 0.5;
const qualityFactor = calculateQualityFactor(context);
const courseSizeFactor = getCourseSizeFactor(context.courseSize);

const calculatedViews = Math.floor(baseViews * ageFactor * qualityFactor * courseSizeFactor);
const views = Math.min(calculatedViews, 200); // Cap at 200
```

### Step 4: Calculate Post Endorsements
```javascript
posts.forEach(post => {
  const probability = calculatePostEndorsementProbability(post, thread, users[post.authorId]);
  post.endorsed = Math.random() < probability;
});
```

### Step 5: Calculate AI Answer Endorsements
```javascript
if (context.aiAnswer) {
  const studentEndorsements = calculateStudentEndorsements(context.aiAnswer, views);
  const instructorEndorsements = shouldInstructorEndorse(context.aiAnswer, thread) ? 1 : 0;

  context.aiAnswer.studentEndorsements = studentEndorsements;
  context.aiAnswer.instructorEndorsements = instructorEndorsements;
  context.aiAnswer.totalEndorsements = studentEndorsements + instructorEndorsements;

  if (instructorEndorsements > 0) {
    context.aiAnswer.totalEndorsements += Math.floor(studentEndorsements * 0.3);
    context.aiAnswer.instructorEndorsed = true;
  }
}
```

---

## 7. Validation Checklist

After applying formulas, verify:

- [ ] No thread has 0 views (minimum 1-2 from author)
- [ ] View counts correlate with age (older = more views generally)
- [ ] Resolved threads have higher average views than open threads
- [ ] Large courses (CS 101: 52) have higher views than small courses (CS 301: 32)
- [ ] No thread exceeds 200 views
- [ ] 20-30% of all posts are endorsed
- [ ] 70-90% of instructor posts are endorsed
- [ ] 50-70% of TA posts are endorsed
- [ ] 10-25% of student posts are endorsed
- [ ] High confidence AI answers (85-95) have 3-15 endorsements
- [ ] Medium confidence AI answers (60-75) have 0-4 endorsements
- [ ] Low confidence AI answers (35-45) have 0-2 endorsements
- [ ] Only high-quality AI answers (80+ confidence, 2+ quality citations, 20+ views) have instructor endorsements
- [ ] ~40% of qualifying AI answers have instructor endorsement
- [ ] Total endorsements boost by ~30% when instructor endorses

---

## 8. Summary for Implementation

### View Count Formula
```
views = cap(
  baseViews(status) ×
  ageFactor(daysSinceCreation) ×
  qualityFactor(features) ×
  courseSizeFactor(enrollment),
  200
)
```

### Post Endorsement Logic
```
endorsed = random() < probability(role, contentQuality, timing, threadStatus)
```

### AI Answer Endorsements
```
studentEndorsements = f(confidenceScore, views, random)
instructorEndorsements = shouldEndorse(confidence, citations, views, age) ? 1 : 0
totalEndorsements = student + instructor + boost(instructor × 0.3)
```

### Key Ranges
- **Views:** 5-200 (most threads 20-120)
- **Post Endorsement Rate:** 20-30% overall
- **AI Student Endorsements:** 0-20 (most 2-8)
- **AI Instructor Endorsements:** 0-1 (40% of high-quality answers)

---

**Next Steps:**
1. Implement calculation functions in script
2. Apply formulas to all 24 threads
3. Validate distributions match targets
4. Adjust random seeds for deterministic demo data
