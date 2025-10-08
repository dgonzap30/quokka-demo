# AI Answer Quality Standards by Confidence Level

**Purpose:** Define realistic AI-generated answer characteristics for mock data that demonstrate platform capabilities across three confidence tiers.

**Based on:**
- TypeScript interface: `lib/models/types.ts` (AIAnswer, Citation types)
- Current mock data: `mocks/ai-answers.json` (30 entries across 6 courses)
- Real AI behavior patterns from educational Q&A systems

---

## Overview

AI answers vary by confidence level, reflecting the system's ability to match questions with course materials and provide complete, accurate responses. Each tier has distinct characteristics in length, structure, code examples, citations, and tone.

**Confidence Mapping:**
- **High:** 85-95 score | "high" level
- **Medium:** 59-75 score | "medium" level
- **Low:** 35-45 score | "low" level

---

## High Confidence (85-95 score)

### Characteristics

**When to use:**
- Question directly matches lecture/textbook material
- Multiple strong citations available (relevance 80-95)
- Concepts well-covered in course materials
- Question is within core curriculum scope

**Answer Structure:**
1. **Opening** - Direct answer (1-2 sentences)
2. **Explanation** - Detailed breakdown with examples (2-3 paragraphs)
3. **Code/Math Examples** - Working examples with comments
4. **Summary** - Key takeaways or next steps (1 paragraph)

**Length:** 300-500 words (3-4 paragraphs + code block)

**Code Examples:**
- REQUIRED for CS courses
- Must be syntactically correct
- Include inline comments
- Show 2-3 related examples or variations
- For Math: Include worked examples with steps
- For Physics: Include formulas with variable definitions

**Citations:**
- **Required:** 2 citations minimum
- **Relevance:** 80-95
- **Source Mix:** At least one lecture + one textbook/slides
- **Excerpt Length:** 60-120 words (actual course content simulation)
- **Excerpt Quality:** Directly supports the answer, uses technical terminology

**Tone:**
- Confident and authoritative
- Uses course-specific terminology
- Educational but accessible
- NO disclaimers or hedging language

**Endorsements:**
- Instructor endorsed: 30% of high-confidence answers
- Student endorsements: 1-4 (correlates with correctness)
- Total endorsements: 2-7

---

### High Confidence Examples

#### CS Example: Binary Search Algorithm

```markdown
**Question:** "How does binary search work and what is its time complexity?"

**Answer Content:**

Binary search is a divide-and-conquer algorithm that efficiently finds a target value in a **sorted array** by repeatedly halving the search space. It works by comparing the target with the middle element and eliminating half of the remaining elements based on the comparison result.

The algorithm follows these steps: First, find the middle element of the current search range. If it matches the target, return its position. If the target is smaller, search the left half; if larger, search the right half. Repeat this process until the element is found or the search space is empty.

Here's a working implementation:

```python
def binary_search(arr, target):
    """
    Search for target in sorted array using binary search.
    Returns index if found, -1 otherwise.
    """
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2  # Find middle index

        if arr[mid] == target:
            return mid  # Found the target
        elif arr[mid] < target:
            left = mid + 1  # Search right half
        else:
            right = mid - 1  # Search left half

    return -1  # Target not found

# Example usage:
numbers = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78]
result = binary_search(numbers, 23)
print(f"Found at index: {result}")  # Output: Found at index: 5
```

The time complexity is **O(log n)** because the search space is halved with each iteration. For an array of 1,024 elements, binary search requires at most 10 comparisons (log₂ 1024 = 10), compared to 1,024 comparisons for linear search. This makes binary search extremely efficient for large sorted datasets. Remember that the array **must be sorted** for binary search to work correctly.

**Citations:**

1. **Lecture 5: Divide & Conquer Algorithms**
   - Source Type: lecture
   - Relevance: 93
   - Excerpt: "Binary search exemplifies the divide-and-conquer paradigm by recursively splitting the problem space in half. Each comparison eliminates 50% of remaining elements, yielding O(log n) time complexity. The prerequisite is a sorted array - without ordering, we cannot make informed decisions about which half to eliminate. When implementing iteratively, maintain left and right pointers and update them based on comparisons with the middle element."

2. **Introduction to Algorithms (Course Textbook) - Chapter 3.2**
   - Source Type: textbook
   - Relevance: 88
   - Excerpt: "The binary search algorithm maintains a search range [left, right] and compares the target with the middle element at each step. If the middle element equals the target, the search succeeds. Otherwise, the algorithm continues with either the left subarray (if target is smaller) or right subarray (if target is larger). The recurrence relation T(n) = T(n/2) + O(1) demonstrates logarithmic time complexity."
```

**Word Count:** ~340 words
**Code:** Complete working example with comments
**Structure:** Direct answer → Explanation → Code → Complexity analysis
**Tone:** Confident, educational, no hedging

---

#### Math Example: Integration by Parts

```markdown
**Question:** "When should I use integration by parts and how do I choose u and dv?"

**Answer Content:**

Integration by parts is used when integrating a product of two functions where standard techniques (substitution, direct integration) won't work. The formula ∫u dv = uv - ∫v du transforms a difficult integral into a simpler one by strategically choosing which part to differentiate and which to integrate.

The key to choosing u and dv effectively is the **LIATE priority rule**: Logarithmic, Inverse trigonometric, Algebraic, Trigonometric, Exponential. Choose u as the function that appears earliest in this list, and let the remaining part be dv. This ordering ensures that du (the derivative of u) is simpler than u, making the resulting integral ∫v du easier to solve.

Here's a worked example with ∫x·eˣ dx:

**Step 1:** Choose u and dv using LIATE
- u = x (algebraic - appears before exponential in LIATE)
- dv = eˣ dx

**Step 2:** Find du and v
- du = dx (derivative of u)
- v = eˣ (antiderivative of dv)

**Step 3:** Apply the formula
∫x·eˣ dx = x·eˣ - ∫eˣ dx
         = x·eˣ - eˣ + C
         = eˣ(x - 1) + C

Notice how the second integral (∫eˣ dx) is simpler than the original. If we had chosen u = eˣ and dv = x dx, we'd get ∫(x²/2)·eˣ dx, which is more complex than what we started with. The LIATE rule prevents this mistake and guides you toward productive choices that simplify the problem.

**Citations:**

1. **Lecture 8: Integration Techniques**
   - Source Type: lecture
   - Relevance: 91
   - Excerpt: "Integration by parts derives from the product rule for differentiation. When faced with ∫f(x)g(x)dx where neither function is the derivative of the other, we strategically choose u and dv such that du is simpler than u. The LIATE priority (Logarithmic, Inverse trig, Algebraic, Trig, Exponential) provides a systematic approach: assign u to the function appearing earliest in this hierarchy. This ensures the transformed integral ∫v du is tractable."

2. **Calculus: Early Transcendentals - Section 7.1**
   - Source Type: textbook
   - Relevance: 87
   - Excerpt: "The integration by parts formula ∫u dv = uv - ∫v du is particularly useful when integrating products like x·sin(x), x²·ln(x), or eˣ·cos(x). Success depends on choosing u such that its derivative du simplifies the problem. For products involving logarithms or inverse trigonometric functions, these should typically be chosen as u since their derivatives are algebraic expressions."
```

**Word Count:** ~385 words
**Structure:** Direct answer → Strategy (LIATE) → Worked example → Explanation
**Tone:** Instructional, step-by-step, confident

---

#### Physics Example: Electric Field

```markdown
**Question:** "How do I calculate the electric field from a point charge?"

**Answer Content:**

The electric field **E** from a point charge is calculated using Coulomb's law in its field form: **E** = kq/r², where k is Coulomb's constant (8.99 × 10⁹ N·m²/C²), q is the source charge in coulombs, and r is the distance from the charge in meters. The field points radially outward from positive charges and inward toward negative charges.

The electric field is a **vector quantity**, so you must consider both magnitude and direction. For a point charge at the origin, the field at position **r** is:

**E** = (kq/r²) **r̂**

where **r̂** is the unit vector pointing from the charge to the point of interest.

**Example Problem:**
Calculate the electric field 0.5 meters from a +3.0 μC point charge.

**Solution:**
Given:
- q = +3.0 μC = 3.0 × 10⁻⁶ C
- r = 0.5 m
- k = 8.99 × 10⁹ N·m²/C²

**Step 1:** Calculate magnitude
E = kq/r²
E = (8.99 × 10⁹)(3.0 × 10⁻⁶) / (0.5)²
E = (2.697 × 10⁴) / 0.25
E = **1.08 × 10⁵ N/C**

**Step 2:** Determine direction
Since q is positive, the field points radially **outward** from the charge.

The field strength decreases with the square of distance - doubling the distance reduces the field to one-quarter of its original value. This inverse-square relationship is fundamental to all point-source fields in physics.

**Citations:**

1. **Lecture 4: Electric Fields and Forces**
   - Source Type: lecture
   - Relevance: 94
   - Excerpt: "The electric field E at a point in space is defined as the force per unit charge that would be experienced by a small positive test charge placed at that point. For a point charge q, the field magnitude is E = kq/r² where r is the distance from the source charge. The direction is radial: outward from positive charges (repulsion) and inward toward negative charges (attraction). Remember that E is independent of the test charge - it's a property of the source charge and the point in space."

2. **University Physics - Chapter 21.3**
   - Source Type: textbook
   - Relevance: 89
   - Excerpt: "Coulomb's constant k = 1/(4πε₀) = 8.99 × 10⁹ N·m²/C² appears in all electrostatic calculations. When solving problems, ensure charges are in coulombs (convert from μC, nC, etc.) and distances are in meters. The electric field obeys the principle of superposition: the total field from multiple charges is the vector sum of individual fields. For point charges, always express the answer in N/C with appropriate direction."
```

**Word Count:** ~395 words
**Structure:** Formula → Explanation → Worked example with steps → Key insight
**Tone:** Precise, uses proper notation, confidence in methodology

---

## Medium Confidence (59-75 score)

### Characteristics

**When to use:**
- Question partially covered in course materials
- Some gaps in available citations (relevance 65-80)
- Concept mentioned but not extensively explained in lectures
- Question requires synthesis across multiple topics

**Answer Structure:**
1. **Qualified Opening** - Answer with mild caveat (1 sentence)
2. **Core Explanation** - Main concept explanation (2 paragraphs)
3. **Limited Example** - One example or partial code (optional)
4. **Guidance** - Pointer to additional resources or related concepts (1 paragraph)

**Length:** 200-350 words (2-3 paragraphs, code optional)

**Code Examples:**
- OPTIONAL for CS courses (include if relevant)
- May be partial/pseudocode rather than complete
- Simpler than high-confidence examples
- For Math: May show formula without full derivation
- For Physics: May give formula without worked example

**Citations:**
- **Required:** 1 citation minimum
- **Relevance:** 65-80
- **Source Mix:** Often slides/readings rather than lectures
- **Excerpt Length:** 40-80 words
- **Excerpt Quality:** Supports answer but may be tangential

**Tone:**
- Helpful but cautious
- Light disclaimers: "This approach typically works...", "In most cases...", "Based on the course materials..."
- Suggests verification: "Check the lecture notes for..." or "You may also want to review..."

**Endorsements:**
- Instructor endorsed: 0% (medium confidence = needs review)
- Student endorsements: 0-2
- Total endorsements: 0-2

---

### Medium Confidence Examples

#### CS Example: Dynamic Programming

```markdown
**Question:** "What's the difference between memoization and tabulation in dynamic programming?"

**Answer Content:**

Based on the course materials, both memoization and tabulation are dynamic programming techniques that avoid redundant calculations by storing subproblem results, but they differ in their approach. Memoization uses a top-down recursive strategy with caching, while tabulation builds solutions bottom-up using iteration.

Memoization implements the recursive solution naturally and only computes subproblems that are actually needed (lazy evaluation). You start with the original problem and recursively break it down, storing results in a lookup table (often a hash map) as you go:

```python
def fibonacci_memo(n, memo={}):
    if n in memo:
        return memo[n]  # Use cached result
    if n <= 1:
        return n
    memo[n] = fibonacci_memo(n-1, memo) + fibonacci_memo(n-2, memo)
    return memo[n]
```

Tabulation starts with the smallest subproblems and builds up to the final solution iteratively, filling a table in a predetermined order. This approach typically uses less stack space since it's iterative rather than recursive.

The slides mention that tabulation can be more efficient in practice due to better cache locality, but memoization is often easier to implement since it closely matches the recursive problem structure. For the problems in this course, either approach should work - choose based on which feels more intuitive for the specific problem structure.

**Citations:**

1. **Slides: Dynamic Programming Strategies**
   - Source Type: slides
   - Relevance: 74
   - Excerpt: "Dynamic programming optimizes recursive solutions by storing previously computed results. Two main implementations exist: top-down (memoization) and bottom-up (tabulation). Memoization adds caching to recursive calls, while tabulation iteratively fills a table. Choice depends on problem structure and implementation preference."
```

**Word Count:** ~285 words
**Code:** Partial example (only memoization shown, not both)
**Structure:** Explanation → One code example → Comparison → Suggestion
**Tone:** "Based on course materials...", "typically", "should work"

---

#### Math Example: Convergence Tests

```markdown
**Question:** "When should I use the ratio test versus the root test for series convergence?"

**Answer Content:**

The course materials suggest that both the ratio test and root test can determine absolute convergence for many series, but they have different strengths. The ratio test works well when your series involves factorials or exponential terms, while the root test is often easier when the general term is raised to the nth power.

For the **ratio test**, you compute lim(n→∞) |aₙ₊₁/aₙ|. If this limit L < 1, the series converges absolutely; if L > 1, it diverges; if L = 1, the test is inconclusive. This test is particularly useful for series like Σ(nⁿ/n!) where the ratio simplifies nicely.

The **root test** uses lim(n→∞) ⁿ√|aₙ| with the same convergence criteria (L < 1 converges, L > 1 diverges, L = 1 inconclusive). It's effective for series like Σ(2n/3n+1)ⁿ where the nth root cancels the exponent.

In practice, try the ratio test first for most series since the computation is often more straightforward. If you see nth powers in the general term, the root test might simplify the work. The lecture notes also mention that if one test is inconclusive (L = 1), the other test will usually be inconclusive too, so you'd need to try a different convergence test like comparison or integral test.

**Citations:**

1. **Reading: Series Convergence Tests Summary**
   - Source Type: reading
   - Relevance: 71
   - Excerpt: "The ratio and root tests are closely related - both examine the limiting behavior of term magnitudes. Ratio test: compute limit of consecutive term ratios. Root test: compute limit of nth root of terms. Use ratio test for factorials/products, root test for nth powers. Both yield L < 1 for convergence, L > 1 for divergence."
```

**Word Count:** ~295 words
**Structure:** Conditional answer → Explain both tests → Practical guidance
**Tone:** "Course materials suggest...", "often", "In practice, try...", "might"

---

#### Physics Example: Kirchhoff's Laws

```markdown
**Question:** "How do I know when to use Kirchhoff's voltage law versus current law?"

**Answer Content:**

According to the course materials, you typically use both of Kirchhoff's laws together when analyzing circuits, but they apply to different aspects of the circuit. Kirchhoff's current law (KCL) applies at nodes (junctions where wires meet), while Kirchhoff's voltage law (KVL) applies to loops (closed paths in the circuit).

**Kirchhoff's Current Law (KCL):** At any node, the sum of currents entering equals the sum of currents leaving. Use this when you need to relate currents in different branches that meet at a junction. For example, if three wires meet at a point and you know two of the currents, KCL lets you find the third.

**Kirchhoff's Voltage Law (KVL):** Around any closed loop, the sum of voltage rises equals the sum of voltage drops (or equivalently, the sum of all voltages is zero). Use this when you need to relate voltages across different components in a path. Trace around a loop, adding voltages from batteries (rises) and subtracting voltages across resistors (drops).

For complex circuits, you usually write multiple equations using both laws and solve them simultaneously. The slides mention setting up one KCL equation per node and one KVL equation per independent loop. Make sure to define your current directions consistently - if the calculated current comes out negative, it just means the actual direction is opposite to what you assumed.

**Citations:**

1. **Slides: Circuit Analysis Methods**
   - Source Type: slides
   - Relevance: 69
   - Excerpt: "Kirchhoff's laws form the foundation of circuit analysis. KCL (current law): sum of currents at any node is zero - charge is conserved. KVL (voltage law): sum of voltages around any closed loop is zero - energy is conserved. Apply these systematically to write equations for unknown currents and voltages."
```

**Word Count:** ~315 words
**Structure:** Comparison → KCL explanation → KVL explanation → Practical tips
**Tone:** "According to course materials...", "typically", "usually", "Make sure to..."

---

## Low Confidence (35-45 score)

### Characteristics

**When to use:**
- Question not directly covered in course materials
- Only tangentially related citations available (relevance 50-65)
- Instructor-specific content (grading, policies, assignment details)
- Question too specific or advanced for current course level
- Ambiguous question requiring clarification

**Answer Structure:**
1. **Disclaimer Opening** - Acknowledge uncertainty (1 sentence)
2. **General Information** - What can be said based on limited materials (1-2 paragraphs)
3. **Recommendations** - Direct to instructor or specific resources (1 paragraph)

**Length:** 100-200 words (2-3 short paragraphs, NO code examples)

**Code Examples:**
- **NONE** - Low confidence shouldn't provide code
- May reference where code examples can be found
- May mention concepts that would be in code without showing it

**Citations:**
- **Required:** 1 citation minimum
- **Relevance:** 50-65
- **Source Mix:** Often assignment guidelines or tangential lecture mentions
- **Excerpt Length:** 30-60 words
- **Excerpt Quality:** Provides context but not complete answer

**Tone:**
- Cautious and transparent about limitations
- Strong disclaimers: "This is a preliminary answer...", "I don't have enough information...", "You should check with your instructor..."
- Explicitly recommends human follow-up

**Endorsements:**
- Instructor endorsed: 0% (requires instructor clarification)
- Student endorsements: 0
- Total endorsements: 0

---

### Low Confidence Examples

#### CS Example: Assignment Clarification

```markdown
**Question:** "For Problem 3 on Homework 2, do we need to handle negative inputs?"

**Answer Content:**

This is a preliminary answer - specific homework requirements should be confirmed with your instructor. Based on the assignment guidelines, Problem 3 asks you to implement input validation, which generally means checking for invalid inputs including negative numbers when they don't make sense for the problem domain.

The assignment document mentions that "all functions should include appropriate error handling," which typically includes checking for negative inputs when working with problems that expect non-negative values (like array indices, counts, or physical measurements). However, the exact specification for Problem 3 isn't detailed in the available course materials.

I recommend posting a follow-up question on the discussion board or asking during office hours to get definitive guidance from the instructor. You might also check if there are any test cases provided with the assignment that would clarify the expected behavior for edge cases.

**Citations:**

1. **Assignment 2 Guidelines**
   - Source Type: assignment
   - Relevance: 58
   - Excerpt: "All submitted functions must include appropriate error handling and input validation. Functions should fail gracefully with informative error messages when given invalid inputs rather than producing incorrect results or crashing."
```

**Word Count:** ~175 words
**Code:** None
**Structure:** Disclaimer → General guidance → Explicit recommendation for follow-up
**Tone:** "preliminary answer", "should be confirmed", "typically", "I recommend..."

---

#### Math Example: Grading Policy

```markdown
**Question:** "Will partial credit be given on the midterm if I show my work but get the wrong answer?"

**Answer Content:**

I don't have detailed information about the specific grading rubric for the midterm exam. The course syllabus mentions that "partial credit will be awarded based on demonstrated understanding of concepts and methods," which suggests that showing your work is important and can earn points even if the final answer is incorrect.

In general mathematics courses, instructors typically give partial credit for correct methodology, proper setup of problems, and valid intermediate steps, even when arithmetic errors or minor mistakes lead to a wrong final answer. However, the exact grading policy varies by instructor and by the type of problem.

Your best approach is to contact Professor Martinez directly via email or during office hours to get specific guidance on the midterm grading criteria. You might also ask about whether formula sheets are permitted and how much partial credit is typically awarded for different types of errors.

**Citations:**

1. **Course Syllabus - Grading Policy**
   - Source Type: assignment
   - Relevance: 53
   - Excerpt: "Assessment will evaluate both procedural fluency and conceptual understanding. Partial credit will be awarded based on demonstrated understanding of concepts and methods. Students are encouraged to show all work clearly for maximum credit consideration."
```

**Word Count:** ~190 words
**Code:** None
**Structure:** Disclaimer → General info from syllabus → Recommendation to contact instructor
**Tone:** "I don't have detailed information", "suggests", "typically", "varies by instructor"

---

#### Physics Example: Lab Procedure

```markdown
**Question:** "In Lab 4, what should I do if my measured capacitance is more than 20% off from the theoretical value?"

**Answer Content:**

This is a preliminary answer - specific lab procedures should be verified with your TA or instructor. The lab manual mentions that experimental error is expected and that your lab report should include error analysis, but it doesn't specify exact thresholds for when measurements are acceptable versus when you should remeasure.

Typical sources of error in capacitance measurements include multimeter calibration, component tolerances, environmental factors, and measurement technique. A 20% discrepancy could be within acceptable limits depending on the equipment precision and the type of capacitor being tested (electrolytic capacitors often have ±20% tolerance).

You should check the lab manual's error analysis section and consult with your TA during the lab session. They can advise whether your measurement technique is correct and whether you should retake measurements or simply document the discrepancy in your error analysis section. Include your measurement procedure and calculations when asking so they can identify any issues.

**Citations:**

1. **Lab 4 Procedure**
   - Source Type: lab
   - Relevance: 60
   - Excerpt: "Measure capacitance values using the provided multimeters and compare with theoretical calculations. Document all measurements in your data table. Your lab report should include error analysis discussing sources of experimental uncertainty and comparing measured values with expected results."
```

**Word Count:** ~195 words
**Code:** None
**Structure:** Disclaimer → General error sources → Recommendation to consult TA
**Tone:** "preliminary answer", "should be verified", "Typical sources", "could be", "You should check..."

---

## Citation Excerpt Quality Standards

### High-Confidence Citations (Relevance 80-95)

**Length:** 60-120 words
**Content:**
- Directly explains the concept being asked about
- Uses precise technical terminology from the course
- Contains specific formulas, algorithms, or definitions
- Clearly connects to the answer provided
- Comes from primary sources (lectures, textbook chapters)

**Example Excerpt:**
> "Binary search exemplifies the divide-and-conquer paradigm by recursively splitting the problem space in half. Each comparison eliminates 50% of remaining elements, yielding O(log n) time complexity. The prerequisite is a sorted array - without ordering, we cannot make informed decisions about which half to eliminate."

---

### Medium-Confidence Citations (Relevance 65-80)

**Length:** 40-80 words
**Content:**
- Mentions the concept but may not fully explain it
- Provides context or related information
- May be from secondary sources (slides, readings)
- Connects to answer but requires interpretation
- Less technical precision than high-confidence

**Example Excerpt:**
> "Dynamic programming optimizes recursive solutions by storing previously computed results. Two main implementations exist: top-down (memoization) and bottom-up (tabulation). Choice depends on problem structure and implementation preference."

---

### Low-Confidence Citations (Relevance 50-65)

**Length:** 30-60 words
**Content:**
- Tangentially related to the question
- Often from assignment guidelines or policies
- Provides general context without specifics
- May address broader topic area, not exact question
- Requires significant interpretation or extension

**Example Excerpt:**
> "All submitted functions must include appropriate error handling and input validation. Functions should fail gracefully with informative error messages when given invalid inputs."

---

## Implementation Guidelines

### Answer Distribution

For 30 AI answers across 6 courses (CS101, CS201, CS301, MATH221, PHYS201, ENG101):

**High Confidence (33%):** 10 answers
- CS courses: 6 answers (algorithms, data structures, core concepts)
- Math: 2 answers (integration, derivatives)
- Physics: 2 answers (electric fields, circuits)

**Medium Confidence (40%):** 12 answers
- CS courses: 5 answers (advanced topics, edge cases)
- Math: 3 answers (series, convergence tests)
- Physics: 3 answers (magnetism, waves)
- Writing: 1 answer (structure, citations)

**Low Confidence (27%):** 8 answers
- Assignment clarifications: 4 answers
- Policy questions: 2 answers
- Advanced/out-of-scope: 2 answers

### Code Example Requirements by Domain

**Computer Science:**
- **High confidence:** Complete, runnable code with comments (10-30 lines)
- **Medium confidence:** Partial code or pseudocode (5-15 lines)
- **Low confidence:** No code

**Mathematics:**
- **High confidence:** Complete worked example with all steps
- **Medium confidence:** Formula with partial derivation
- **Low confidence:** Formula reference only (no derivation)

**Physics:**
- **High confidence:** Worked numerical example with units
- **Medium confidence:** Formula with variable definitions
- **Low confidence:** Concept explanation only

**Writing/Humanities:**
- **High confidence:** Multiple paragraph examples or templates
- **Medium confidence:** Brief example or structure outline
- **Low confidence:** General guidance only

---

## Consistency Checks

**Before marking high confidence:**
- [ ] Answer is 300-500 words
- [ ] Includes working code/math example (domain appropriate)
- [ ] Has 2+ citations with 80+ relevance
- [ ] Uses confident tone (no disclaimers)
- [ ] Provides complete, actionable answer

**Before marking medium confidence:**
- [ ] Answer is 200-350 words
- [ ] May include partial example
- [ ] Has 1+ citations with 65+ relevance
- [ ] Uses cautious language ("typically", "often")
- [ ] Suggests verification or additional resources

**Before marking low confidence:**
- [ ] Answer is 100-200 words
- [ ] No code examples
- [ ] Has 1 citation with 50+ relevance
- [ ] Includes strong disclaimer
- [ ] Explicitly recommends instructor follow-up

---

## Sample Content Templates

### High Confidence Opening Patterns

- "[Concept] is [definition/explanation]. It works by [mechanism]..."
- "To [solve/calculate/implement] this, you [specific approach]..."
- "The key difference between X and Y is [precise distinction]..."

### Medium Confidence Opening Patterns

- "Based on the course materials, [concept] typically [behavior]..."
- "This approach usually works by [mechanism], though [caveat]..."
- "In most cases, you would [approach]. Check [resource] for..."

### Low Confidence Opening Patterns

- "This is a preliminary answer - [what's needed for certainty]..."
- "I don't have enough information about [specific aspect], but..."
- "Specific [type of information] should be confirmed with your instructor..."

---

## Next Steps

This standards document should be used to:

1. **Rewrite existing AI answers** in `mocks/ai-answers.json` with realistic content
2. **Create citation excerpts** that match relevance scores and confidence levels
3. **Generate code examples** that are syntactically correct and pedagogically sound
4. **Ensure engagement correlation** - high confidence + instructor endorsement
5. **Validate domain accuracy** - have technical content reviewed

**Related files to update:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/ai-answers.json`
- `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/threads.json` (question quality affects answer confidence)

**Success metrics:**
- All 30 AI answers have unique, realistic content
- Citations contain actual course-like excerpts (not "Relevant excerpt...")
- Code examples run without syntax errors
- Confidence levels match answer completeness
- Demo viewers can read answers and understand the platform's value
