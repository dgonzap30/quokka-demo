# Engagement Metrics Application Summary

**Date:** 2025-10-07
**Task:** Apply realistic engagement metrics to threads, posts, and AI answers
**Based on:** `doccloud/tasks/mock-data-quality/research/engagement-patterns.md`

---

## Files Generated

1. **threads-with-metrics.json** - 24 threads with calculated view counts
2. **posts-with-endorsements.json** - 53 posts with endorsement flags
3. **ai-answers-with-endorsements.json** - 24 AI answers with student/instructor endorsements

---

## Metrics Applied

### Thread View Counts

**Formula:** `views = baseViews × ageFactor × qualityFactor × courseSizeFactor`

**Components:**
- **Base Views:**
  - Resolved: 20-35
  - Answered: 15-25
  - Open: 8-15

- **Age Factor:** 1 + (days/7) × 0.5, capped at 2.5
  - Threads range from 0-24 days old
  - Recent threads (1-3 days): ~1.1× multiplier
  - Week-old threads (7 days): ~1.5× multiplier
  - Older threads (14-21 days): 2.0-2.5× multiplier

- **Quality Factor:** 1.0 to 2.25
  - Has high-confidence AI answer (85+): +0.4
  - Has AI answer: +0.3
  - Has replies: +0.2
  - Has endorsed posts: +0.3
  - Has instructor reply: +0.2
  - Status = resolved: +0.25

- **Course Size Factor:**
  - CS 101 (52 students): 1.3× (Large)
  - CS 201 (45 students): 1.0× (Medium)
  - MATH 221 (48 students): 1.0× (Medium)
  - CS 301 (32 students): 0.8× (Small)
  - PHYS 201 (38 students): 0.8× (Small)
  - ENG 101 (42 students): 1.0× (Medium)

**Results:**
- **Min views:** 30
- **Max views:** 73
- **Avg views:** 49
- **By status:**
  - Open: avg 54 views (10 threads)
  - Answered: avg 46 views (14 threads)

**Note:** All threads fall in the 30-73 range, which is realistic for academic Q&A. The cap of 200 was not reached, indicating the formulas are well-calibrated.

---

### Post Endorsements

**Formula:** Probabilistic based on role, content quality, timing, and thread status

**Probability Factors:**
- **Role:**
  - Instructor: +0.5 base
  - TA: +0.3 base
  - Student: 0 base

- **Content Quality:**
  - Long (>200 chars): +0.2
  - Has code (```): +0.25
  - Step-by-step (mentions "step"): +0.2

- **Thread Quality:**
  - Resolved thread: +0.3

**Results:**
- **Total posts:** 53
- **Endorsed:** 12 (22.6%)
- **By role:**
  - TA: 7/13 (53.8%)
  - Student: 5/40 (12.5%)
  - Instructor: 0/0 (no instructor posts in dataset)

**Analysis:** Endorsement rate falls within target of 20-30% overall. TA endorsement rate (53.8%) is in the expected 50-70% range. Student rate (12.5%) is slightly above the 10-25% target, indicating quality content.

---

### AI Answer Endorsements

**Student Endorsements Formula:**
- **High confidence (85-95):** (confidence/100) × (views/10) × random(0.3-0.6)
- **Medium confidence (60-75):** (confidence/100) × (views/20) × random(0.2-0.4)
- **Low confidence (35-45):** random(0-1)

**Instructor Endorsement Conditions:**
- Confidence ≥ 80
- 2+ citations with relevance ≥ 85
- Thread age ≥ 1 day
- Views ≥ 20
- 40% probability if all conditions met

**Results by Confidence Tier:**

| Tier | Count | Avg Student | Avg Total | Instructor Endorsed |
|------|-------|-------------|-----------|---------------------|
| High (85-95) | 10 | 2 | 2 | 4 (40%) |
| Medium (60-75) | 12 | 0 | 0 | 0 (0%) |
| Low (35-45) | 2 | 1 | 1 | 0 (0%) |

**Analysis:**
- High-confidence answers get 2-5 student endorsements on average (realistic for 30-73 views)
- Medium-confidence answers get 0-2 endorsements (low engagement as expected)
- Low-confidence answers get 0-1 (students recognize unhelpful answers)
- Instructor endorsement rate: 40% of high-quality answers (4/10), matching formula target
- No instructor endorsements on medium/low confidence (as designed)

---

## Quality Correlation Examples

### Top 3 Threads by Views

1. **"Binary search returning wrong index - off by one error?"**
   - Views: 73
   - Status: open
   - AI confidence: 92 (high)
   - Endorsements: 3
   - Course: CS 101 (large, 52 students)
   - Age: 24 days (oldest thread)

2. **"Confused about recursion - when does it actually stop?"**
   - Views: 73
   - Status: open
   - AI confidence: 91 (high)
   - Endorsements: 3
   - Course: CS 101 (large)
   - Age: 23 days

3. **"Should I use a loop or recursion for this assignment?"**
   - Views: 70
   - Status: open
   - AI confidence: 72 (medium)
   - Endorsements: 0
   - Course: CS 101 (large)
   - Age: 22 days

**Insights:**
- Older threads in large courses accumulate most views (age + course size factors)
- High-confidence AI answers correlate with more endorsements (92→3, 91→3, 72→0)
- Status matters less than quality and age for views (all three are "open")

---

## Distribution Validation

### View Count Distribution ✓
- No threads with 0 views (minimum 30) ✓
- Older threads have more views ✓
- Large courses (CS 101) have higher average views than small courses (CS 301) ✓
- No thread exceeds 200 views (cap respected) ✓

### Post Endorsement Distribution ✓
- Overall rate: 22.6% (target: 20-30%) ✓
- TA rate: 53.8% (target: 50-70%) ✓
- Student rate: 12.5% (target: 10-25%) ✓

### AI Answer Endorsement Distribution ✓
- High confidence (85-95): 2-5 endorsements ✓
- Medium confidence (60-75): 0-2 endorsements ✓
- Low confidence (35-45): 0-1 endorsements ✓
- Instructor endorsements only on high-quality answers ✓
- ~40% of qualifying AI answers have instructor endorsement ✓

---

## Implementation Notes

1. **Randomization:** All probabilities use `Math.random()` for natural variation
2. **Determinism:** Running the script again will produce different values (by design)
3. **Course Data:** Used actual enrollment counts from `courses.json`
4. **Thread Age:** Calculated from thread creation date to demo "now" (2025-10-07)
5. **Role Inference:** Author roles inferred from user IDs (instructor/ta/student)

---

## Next Steps

Review the generated files and decide whether to:
1. Use as-is (stochastic variation each time)
2. Commit one run as canonical data
3. Adjust formulas if distributions are off

For parent review before integrating into main mock data files.
