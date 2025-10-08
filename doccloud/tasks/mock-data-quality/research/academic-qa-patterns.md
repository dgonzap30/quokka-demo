# Academic Q&A Patterns Research

**Date:** 2025-10-07
**Purpose:** Identify realistic question patterns for 6 course domains to replace generic templated content

---

## CS 101: Introduction to Computer Science

### Common Topics
- Variables, data types, type conversion
- Loops (for, while, do-while)
- Functions, parameters, return values
- Basic debugging (syntax errors, logic errors)
- Arrays and basic data structures
- String manipulation
- Conditional statements (if/else/switch)

### Realistic Question Patterns

1. **Code Debugging Questions**
   - Student posts broken code, asks why it doesn't work
   - Common issues: off-by-one errors, infinite loops, scope problems
   - Example: "My loop keeps running forever, what's wrong?"

2. **Conceptual Confusion**
   - Mixing up `=` (assignment) vs `==` (comparison)
   - Not understanding variable scope
   - Confusion about pass-by-value vs pass-by-reference
   - Example: "Why does my variable reset to 0 inside the function?"

3. **Syntax Errors**
   - Missing semicolons, brackets, or parentheses
   - Incorrect function declaration syntax
   - Example: "Getting 'unexpected token' error on line 5"

4. **Assignment-Specific Questions**
   - "How do I approach problem X from homework Y?"
   - Asking about specific requirements or edge cases
   - Example: "For the grade calculator, do we round up or down?"

5. **Comparison Questions**
   - "When should I use a for loop vs a while loop?"
   - "What's the difference between arrays and ArrayLists?"
   - Example: "Should I use recursion or iteration for this problem?"

### Example Transformations

**Generic:**
> "How does binary search work?"

**Specific:**
> "My binary search implementation keeps returning -1 even when the element exists. I'm calculating mid as `(left + right) / 2` - is this correct? Here's my code..."

**Generic:**
> "What is recursion?"

**Specific:**
> "I wrote a recursive factorial function but getting StackOverflowError for n=100000. Is there a way to fix this or should I use a loop instead?"

### Code Snippets Students Ask About

```java
// Off-by-one error
for (int i = 0; i <= arr.length; i++) {
    System.out.println(arr[i]); // ArrayIndexOutOfBoundsException
}

// Infinite loop
int i = 0;
while (i < 10) {
    System.out.println(i);
    // forgot i++
}

// Scope confusion
public void updateValue() {
    int x = 5; // local variable
}
// trying to access x here - doesn't work

// Integer division surprise
int result = 5 / 2; // Why is this 2, not 2.5?
```

---

## CS 201: Data Structures & Algorithms

### Common Topics
- Linked lists (singly, doubly, circular)
- Stacks and queues
- Trees (binary, BST, AVL, heaps)
- Hash tables and collision handling
- Big O notation and complexity analysis
- Recursion and backtracking
- Sorting algorithms (merge, quick, heap)
- Graph basics (BFS, DFS)

### Realistic Question Patterns

1. **Implementation Bugs**
   - Null pointer exceptions in linked list operations
   - Off-by-one errors in array-based structures
   - Memory leaks or dangling pointers (C/C++)
   - Example: "My linked list delete function crashes when deleting the head"

2. **Complexity Analysis Confusion**
   - Incorrect Big O calculations
   - Not understanding best/average/worst case
   - Confusion about space vs time complexity
   - Example: "Why is my nested loop O(n²) and not O(2n)?"

3. **Algorithm Design Questions**
   - How to approach a specific problem
   - Which data structure to use
   - Example: "Should I use a stack or queue to reverse a string?"

4. **Edge Cases**
   - Empty list/tree handling
   - Single-element structures
   - Circular references
   - Example: "How do I detect a cycle in a linked list?"

5. **Recursion Issues**
   - Base case mistakes
   - Stack overflow
   - Inefficient repeated computation
   - Example: "My recursive Fibonacci is too slow for n=40"

### Example Transformations

**Generic:**
> "How do linked lists work?"

**Specific:**
> "I'm implementing a `removeNthFromEnd` method for a singly linked list. I tried using two pointers n positions apart, but I get NullPointerException when n equals the list length. How do I handle removing the head node?"

**Generic:**
> "Explain Big O notation"

**Specific:**
> "I have a function that iterates through an array of size n, and for each element, it calls another function that does a binary search (log n). Is the total time complexity O(n log n) or O(n²)? I'm confused about how to combine them."

### Code Snippets Students Ask About

```java
// Linked list insertion bug
public void insertAfter(Node node, int data) {
    Node newNode = new Node(data);
    newNode.next = node.next;
    node.next = newNode;
    // What if node is null?
}

// Big O confusion
for (int i = 0; i < n; i++) {
    for (int j = i; j < n; j++) {
        // Is this O(n²)? Looks different from i=0, j=0
    }
}

// Recursive stack overflow
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2); // Exponential time!
}

// Tree traversal mistake
void inorder(Node root) {
    inorder(root.left);
    System.out.print(root.data);
    inorder(root.right);
    // Forgot base case - stack overflow on null
}
```

---

## MATH 221: Calculus II

### Common Topics
- Integration techniques (substitution, parts, partial fractions, trig substitution)
- Improper integrals
- Sequences and series
- Convergence tests (ratio, root, comparison, integral test)
- Taylor and Maclaurin series
- Parametric equations and polar coordinates
- Arc length and surface area

### Realistic Question Patterns

1. **Integration Technique Selection**
   - Not knowing which method to apply
   - Trying substitution when parts is needed (or vice versa)
   - Example: "I tried u-substitution on ∫x·eˣ dx but got stuck"

2. **Algebraic Manipulation Errors**
   - Sign errors in integration by parts
   - Mistakes in partial fraction decomposition
   - Trig identity confusion
   - Example: "I keep getting the wrong sign when integrating ∫x·sin(x) dx by parts"

3. **Convergence Test Confusion**
   - Choosing the wrong convergence test
   - Incorrectly applying ratio test
   - Forgetting divergence test first
   - Example: "I used the ratio test on Σ(1/n²) and got 1 - does that mean inconclusive?"

4. **Setup Questions**
   - How to set up integrals for word problems
   - Determining limits of integration
   - Example: "For the area between y=x² and y=x, which function is on top?"

5. **Series Representation**
   - Finding Taylor series coefficients
   - Determining radius of convergence
   - Example: "How do I find the Taylor series for ln(1+x) centered at 0?"

### Example Transformations

**Generic:**
> "How do I solve improper integrals?"

**Specific:**
> "I'm trying to evaluate ∫₁^∞ (1/x²) dx. I rewrote it as lim(b→∞) ∫₁^b (1/x²) dx and got lim(b→∞) [-1/x]₁^b. When I plug in the limits, I get lim(b→∞) (-1/b + 1), but I'm not sure if this equals 1 or diverges?"

**Generic:**
> "Explain partial fractions"

**Specific:**
> "I'm decomposing (3x+5)/((x-1)(x+2)) into partial fractions. I set it up as A/(x-1) + B/(x+2) and got the equation 3x+5 = A(x+2) + B(x-1). When I solve, I get A=2, B=1, but the answer key says A=8/3, B=1/3. What am I doing wrong?"

### Formula Examples Students Ask About

```
Integration by parts:
∫u dv = uv - ∫v du
Common mistake: forgetting the negative sign

Partial fractions setup:
(2x+3)/((x-1)(x+2)) = A/(x-1) + B/(x+2)
Common mistake: not clearing denominators correctly

Series convergence (ratio test):
lim(n→∞) |aₙ₊₁/aₙ| = L
L < 1: converges, L > 1: diverges, L = 1: inconclusive
Common mistake: using ratio test when L=1

Taylor series:
f(x) = Σ(fⁿ(a)/n!) · (x-a)ⁿ
Common mistake: wrong factorial or power

Improper integral:
∫ₐ^∞ f(x)dx = lim(b→∞) ∫ₐ^b f(x)dx
Common mistake: not taking the limit properly
```

---

## CS 301: Advanced Algorithms

### Common Topics
- Dynamic programming (knapsack, longest subsequence, edit distance)
- Graph algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall, minimum spanning tree)
- Greedy algorithms
- NP-completeness and reductions
- Approximation algorithms
- Network flow
- Divide and conquer

### Realistic Question Patterns

1. **DP Recurrence Relations**
   - Difficulty identifying subproblems
   - Wrong base cases
   - Not recognizing overlapping subproblems
   - Example: "I can't figure out the recurrence relation for the coin change problem"

2. **Graph Algorithm Edge Cases**
   - Handling negative weights
   - Disconnected graphs
   - Self-loops and parallel edges
   - Example: "Why does Dijkstra's algorithm fail on graphs with negative edges?"

3. **Complexity Proofs**
   - NP-completeness reductions
   - Proving correctness of greedy algorithms
   - Example: "How do I prove the activity selection greedy algorithm is optimal?"

4. **Implementation Issues**
   - Priority queue operations in Dijkstra
   - Memoization vs tabulation
   - Example: "My DP solution is still exponential - am I not memoizing correctly?"

5. **Problem Recognition**
   - Not recognizing which algorithm pattern applies
   - Confusing similar problems
   - Example: "Is the subset sum problem solved with DP or greedy?"

### Example Transformations

**Generic:**
> "How does dynamic programming work?"

**Specific:**
> "I'm solving the 0/1 knapsack problem using DP. I set up my table as dp[i][w] = maximum value using first i items and weight limit w. My recurrence is dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i]), but I'm getting array out of bounds errors when weight[i] > w. Should I add a condition to check this?"

**Generic:**
> "Explain NP-completeness"

**Specific:**
> "I need to show that the Hamiltonian Path problem is NP-complete. I understand I need to reduce from a known NP-complete problem, and I'm thinking of using 3-SAT. But I'm stuck on how to construct a graph from a 3-SAT instance. Should each clause become a vertex or each variable?"

### Code Snippets Students Ask About

```python
# DP - Longest Common Subsequence
def lcs(X, Y, m, n):
    if m == 0 or n == 0:
        return 0
    if X[m-1] == Y[n-1]:
        return 1 + lcs(X, Y, m-1, n-1)
    else:
        return max(lcs(X, Y, m-1, n), lcs(X, Y, m, n-1))
# Problem: Exponential time without memoization

# Dijkstra's algorithm bug
def dijkstra(graph, start):
    dist = {v: float('inf') for v in graph}
    dist[start] = 0
    visited = set()

    while len(visited) < len(graph):
        u = min((v for v in graph if v not in visited), key=lambda x: dist[x])
        # This is O(V) - should use priority queue for O(log V)
        visited.add(u)

        for v, weight in graph[u]:
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight

# Greedy activity selection
def activity_selection(activities):
    activities.sort(key=lambda x: x[1])  # Sort by finish time
    selected = [activities[0]]

    for activity in activities[1:]:
        if activity[0] >= selected[-1][1]:
            selected.append(activity)
    # Why does sorting by finish time work? Proof needed

# DP with memoization
memo = {}
def fibonacci(n):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci(n-1) + fibonacci(n-2)
    return memo[n]
```

---

## PHYS 201: Electricity & Magnetism

### Common Topics
- Electric fields and Gauss's law
- Electric potential and potential energy
- Capacitors and dielectrics
- Current, resistance, Ohm's law
- DC circuits (series, parallel, Kirchhoff's laws)
- Magnetic fields and Lorentz force
- Ampere's law and Faraday's law
- Inductors and AC circuits
- Electromagnetic waves

### Realistic Question Patterns

1. **Sign Convention Errors**
   - Wrong direction for electric field
   - Incorrect polarity on capacitors
   - Sign errors in Kirchhoff's voltage law
   - Example: "I'm getting a negative voltage across the resistor - is that possible?"

2. **Conceptual Confusion**
   - Mixing up potential and field
   - Confusion about current direction vs electron flow
   - Not understanding when to use Gauss vs direct integration
   - Example: "If the electric field is zero, does that mean the potential is also zero?"

3. **Circuit Analysis Mistakes**
   - Incorrectly combining resistors
   - Wrong equivalent capacitance formula
   - Not applying Kirchhoff's laws systematically
   - Example: "For capacitors in series, do I add them like resistors or take the reciprocal?"

4. **Vector Problems**
   - Forgetting to account for direction
   - Incorrect cross product in magnetic force
   - Example: "I calculated the force magnitude correctly but got the wrong direction"

5. **Unit Conversion**
   - Mixing up μF, nF, pF for capacitors
   - Forgetting to convert mA to A
   - Example: "My answer is off by a factor of 1000 - did I mess up units?"

### Example Transformations

**Generic:**
> "How does Kirchhoff's voltage law work?"

**Specific:**
> "I'm analyzing a circuit with a 12V battery, a 4Ω resistor, and two parallel resistors (6Ω and 3Ω). I used KVL going clockwise and got: 12V - 4I₁ - 6I₂ = 0, but my friend says the signs should be different. When do I use + vs - for voltage drops across resistors?"

**Generic:**
> "Explain electric fields"

**Specific:**
> "I'm trying to find the electric field at a point P located 5cm from a charged rod of length 10cm with uniform charge density λ = 2 μC/m. I set up the integral E = ∫(kλ dx)/(r²) but I'm not sure what limits to use and how r relates to x. Should I use Gauss's law instead?"

### Formula Examples Students Ask About

```
Ohm's Law:
V = IR
Common mistake: Mixing up which resistance to use in complex circuits

Resistors in series vs parallel:
Series: Rₑq = R₁ + R₂ + R₃
Parallel: 1/Rₑq = 1/R₁ + 1/R₂ + 1/R₃
Common mistake: Using series formula for parallel (or vice versa)

Capacitors (opposite of resistors):
Series: 1/Cₑq = 1/C₁ + 1/C₂ + 1/C₃
Parallel: Cₑq = C₁ + C₂ + C₃
Common mistake: Treating capacitors like resistors

Kirchhoff's Voltage Law:
ΣV = 0 around any closed loop
Common mistake: Sign errors (voltage rise vs drop)

Electric field from point charge:
E = kQ/r²  (direction: away from + charge)
Common mistake: Forgetting it's a vector

Magnetic force on moving charge:
F = qv × B  (cross product!)
Common mistake: Using dot product or forgetting direction

Gauss's Law:
Φₑ = ∮E·dA = Qₑₙc/ε₀
Common mistake: Using when symmetry doesn't apply
```

---

## ENG 101: Academic Writing

### Common Topics
- Thesis statement construction
- Essay structure (introduction, body, conclusion)
- Paragraph development and topic sentences
- Citation formats (MLA, APA, Chicago)
- Research paper organization
- Argument vs exposition
- Avoiding plagiarism
- Source integration (quotes, paraphrases, summaries)
- Grammar and style

### Realistic Question Patterns

1. **Thesis Statement Problems**
   - Too broad or too narrow
   - Not arguable (statement of fact)
   - Multiple unrelated claims
   - Example: "Is 'Social media affects society' a good thesis statement?"

2. **Citation Confusion**
   - When to cite vs when it's common knowledge
   - Format errors (MLA vs APA)
   - In-text citation placement
   - Example: "Do I need to cite the definition of 'democracy' from the dictionary?"

3. **Organization Issues**
   - Unclear paragraph structure
   - No topic sentences
   - Ideas not flowing logically
   - Example: "How do I transition between paragraphs that cover different points?"

4. **Source Integration**
   - Too many quotes, not enough analysis
   - Block quotes used incorrectly
   - Not introducing sources
   - Example: "I have a really long quote (6 sentences) - how do I format this?"

5. **Argument vs Summary**
   - Just summarizing sources instead of arguing
   - No clear position
   - Example: "My professor says I'm just summarizing - how do I make it more argumentative?"

### Example Transformations

**Generic:**
> "How do I write a thesis statement?"

**Specific:**
> "I'm writing an essay on climate change for my argumentative paper. My current thesis is 'Climate change is a serious problem that affects everyone.' My professor said it's too vague and not arguable. How can I make it more specific and debatable? Should I focus on a specific solution or policy?"

**Generic:**
> "What's the difference between MLA and APA?"

**Specific:**
> "I'm citing a journal article with three authors in my research paper. In MLA, I wrote (Smith, Jones, and Brown 45), but my friend says in APA it should be (Smith, Jones, & Brown, 2023, p. 45). Which is correct, and do I need the page number for a paraphrase or only for direct quotes?"

### Common Student Questions

```
Thesis Statement Issues:
❌ "The American Revolution was important."
   (Not arguable - statement of fact)

❌ "Social media is bad because it causes depression, ruins relationships,
    and lowers grades."
   (Too many unrelated claims for one paper)

✅ "While social media platforms claim to connect users, the algorithmic
    curation of content actually creates echo chambers that polarize
    political discourse."

Citation Format:
MLA: (Author Page)
Example: (Smith 23)

APA: (Author, Year, Page)
Example: (Smith, 2020, p. 23)

Common mistakes:
- Forgetting to cite paraphrases
- Citing common knowledge
- Wrong punctuation in citations

Paragraph Structure:
Topic Sentence → Evidence → Analysis → Transition

Common mistakes:
- Starting with a quote instead of topic sentence
- Providing evidence without explaining its significance
- No connection between paragraphs

Source Integration:
✅ According to Smith, "..." (23).
✅ The research shows that "..." (Smith 23).
❌ "..." (This quote has no introduction)

Block Quote Format (MLA):
For quotes 4+ lines, indent 0.5" and remove quotation marks

Common mistakes:
- Using block quotes for short quotes
- Not introducing the block quote
- Forgetting to cite after
```

### Common Grammar/Style Issues

```
Passive vs Active Voice:
❌ "The experiment was conducted by the researchers."
✅ "The researchers conducted the experiment."

Subject-Verb Agreement:
❌ "The collection of essays are on the shelf."
✅ "The collection of essays is on the shelf."

Comma Splices:
❌ "I finished the essay, I submitted it online."
✅ "I finished the essay, and I submitted it online."
✅ "I finished the essay; I submitted it online."

Vague Pronouns:
❌ "When students use Wikipedia, it can be unreliable."
   (What is "it"? Wikipedia or student usage?)
✅ "When students use Wikipedia, the information can be unreliable."

Informal Language:
❌ "The author's argument is kind of weak."
✅ "The author's argument lacks sufficient evidence."

Apostrophe Errors:
❌ "The essay's were graded yesterday." (its vs it's, their vs they're)
✅ "The essays were graded yesterday."
```

---

## Cross-Domain Question Characteristics

### What Makes Questions Realistic

1. **Specificity**
   - Include actual code, formulas, or text
   - Reference specific homework problems or lecture topics
   - Mention attempted solutions

2. **Context**
   - What they've already tried
   - Where they're stuck
   - What they understand vs don't understand

3. **Common Mistakes**
   - Off-by-one errors (CS)
   - Sign errors (Math, Physics)
   - Format confusion (Writing)
   - Boundary conditions (CS, Math)

4. **Natural Language**
   - Questions often start with "Why..." or "How do I..."
   - Include uncertainty ("I think...", "Is it correct that...")
   - Show partial understanding

5. **Assignment-Driven**
   - Reference homework, labs, or projects
   - Ask about requirements or edge cases
   - Request clarification on instructions

### Generic → Specific Transformation Pattern

**Template Questions (❌):**
- "How does X work?"
- "What is Y?"
- "Explain Z"

**Realistic Questions (✅):**
- "I tried X but got error Y, here's my code..."
- "I understand that Y does A, but why doesn't it do B?"
- "When comparing X and Y, which should I use for situation Z?"

### Question Complexity Levels

**Level 1: Conceptual (Beginner)**
- "What's the difference between X and Y?"
- "When should I use X instead of Y?"
- Simple definitions with context

**Level 2: Application (Intermediate)**
- "I'm implementing X for problem Y, should I use approach A or B?"
- "My implementation of X works for case A but fails for case B, why?"
- Specific scenarios with attempted solutions

**Level 3: Debugging (Advanced)**
- "Here's my code for X. It fails when Y. I've tried Z but..."
- Full context, multiple attempts, specific failure points

**Level 4: Design/Proof (Advanced)**
- "How do I prove that algorithm X is optimal?"
- "What's the best approach to solve problem Y given constraints Z?"
- Open-ended design questions

---

## Recommendations for Mock Data

### Question Distribution

**CS 101 (Intro level):**
- 40% Level 1 (conceptual)
- 40% Level 2 (application)
- 20% Level 3 (debugging)

**CS 201, MATH 221, PHYS 201 (Intermediate):**
- 20% Level 1
- 50% Level 2
- 30% Level 3

**CS 301 (Advanced):**
- 10% Level 1
- 40% Level 2
- 30% Level 3
- 20% Level 4 (design/proof)

**ENG 101 (Skill-based):**
- 30% Level 1 (format/rules)
- 50% Level 2 (application/examples)
- 20% Level 3 (revision/improvement)

### Code/Formula Inclusion

- **CS 101**: 60% include code snippets
- **CS 201**: 70% include code snippets
- **CS 301**: 80% include code or pseudocode
- **MATH 221**: 70% include formulas or equations
- **PHYS 201**: 60% include formulas, 30% include circuit diagrams (described)
- **ENG 101**: 40% include example sentences/paragraphs

### Common Student Behaviors

1. **Incomplete attempts** - Show partial work, ask how to continue
2. **Misunderstanding** - Demonstrate wrong approach, ask for correction
3. **Edge cases** - Ask about specific boundary conditions
4. **Comparison** - Request help choosing between approaches
5. **Verification** - "Is my approach correct?"

### Realistic Reply Patterns

**Student replies:**
- Short clarifications or follow-up questions
- "That worked, thanks!"
- Sharing alternative solutions
- Asking for further explanation

**TA replies:**
- Hints without full solutions
- References to lecture/textbook
- Questions to guide thinking ("What happens when X is 0?")
- Code review with suggestions

**Instructor replies:**
- Endorsing correct answers
- Pointing out important concepts
- Adding context or extensions
- Correcting misconceptions

---

## End of Research

This research should provide sufficient patterns to create realistic, domain-specific questions across all 6 courses. Each domain has distinct characteristics, common pitfalls, and authentic student question patterns that can replace the current generic templates.
