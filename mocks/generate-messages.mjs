/**
 * Generate AI Messages Mock Data
 * Creates 80 messages (4 per conversation) for 20 conversations
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Message templates for each conversation
const conversationTemplates = [
  // conv-1: Binary Search Implementation Help
  {
    conversationId: 'conv-1',
    messages: [
      { role: 'user', content: "I'm having trouble implementing binary search in Python. Can you help me understand the logic?" },
      { role: 'assistant', content: "I'd be happy to help with binary search! The key insight is dividing the search space in half each iteration. Here's a clean implementation:\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```\n\nThe time complexity is O(log n) because we eliminate half the elements each iteration." },
      { role: 'user', content: "Why do we use `left <= right` instead of `left < right`?" },
      { role: 'assistant', content: "Great question! Using `left <= right` ensures we check the case where the search space narrows to a single element (left == right). If we used `left < right`, we'd exit the loop when left == right, potentially missing the target if it's at that position. This is a common edge case that trips up many students!" }
    ]
  },
  // conv-2: Recursion vs Iteration Question
  {
    conversationId: 'conv-2',
    messages: [
      { role: 'user', content: "When should I use recursion vs iteration? My professor says recursion is elegant but iteration is faster." },
      { role: 'assistant', content: "Both your professor and the elegance argument are correct! Here's the trade-off:\n\n**Use Recursion when:**\n- Problem has natural recursive structure (trees, graphs, divide-and-conquer)\n- Code clarity is more important than performance\n- Stack depth won't be too large\n\n**Use Iteration when:**\n- Performance is critical\n- You might hit stack overflow (deep recursion)\n- Problem is naturally iterative (simple loops)\n\n**Example:** Fibonacci is naturally recursive but inefficient without memoization. An iterative solution is O(n) time and O(1) space." },
      { role: 'user', content: "Can you show me both approaches for factorial?" },
      { role: 'assistant', content: "Absolutely! Here are both:\n\n**Recursive:**\n```python\ndef factorial_recursive(n):\n    if n <= 1:\n        return 1\n    return n * factorial_recursive(n - 1)\n```\n\n**Iterative:**\n```python\ndef factorial_iterative(n):\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result\n```\n\nThe recursive version is cleaner but uses O(n) stack space. The iterative version uses O(1) space and is faster for large n." }
    ]
  },
  // conv-3: Big O Notation Clarification
  {
    conversationId: 'conv-3',
    messages: [
      { role: 'user', content: "I'm confused about Big O notation. How do I determine the time complexity of nested loops?" },
      { role: 'assistant', content: "Big O measures how runtime grows with input size. For nested loops, multiply the complexities:\n\n**Rule of thumb:**\n- Single loop iterating n times: O(n)\n- Nested loop both iterating n times: O(n²)\n- Three nested loops: O(n³)\n\n**Example:**\n```python\nfor i in range(n):        # O(n)\n    for j in range(n):    # O(n)\n        print(i, j)       # O(1)\n# Total: O(n) * O(n) = O(n²)\n```\n\n**Tricky case:**\n```python\nfor i in range(n):\n    for j in range(i):    # Only goes to i, not n\n        print(i, j)\n# Still O(n²) because: 1+2+3+...+n = n(n+1)/2\n```" },
      { role: 'user', content: "What about a loop that divides n by 2 each time?" },
      { role: 'assistant', content: "That's O(log n)! When you repeatedly divide by a constant (usually 2), you get logarithmic complexity.\n\n**Example:**\n```python\nwhile n > 1:\n    n = n // 2\n    print(n)\n```\n\nThis loop runs log₂(n) times. For n=1024, it only runs 10 times! That's why binary search is so efficient. Any time you see \"divide the problem in half,\" think O(log n)." }
    ]
  },
  // conv-4: Merge Sort Time Complexity
  {
    conversationId: 'conv-4',
    messages: [
      { role: 'user', content: "Why is merge sort O(n log n)? I understand the merging is O(n) but where does the log n come from?" },
      { role: 'assistant', content: "Excellent question! The log n comes from the recursive tree depth.\n\n**Visualization:**\n```\n[8 elements]           1 level (divide)\n[4] [4]                2 levels (divide)\n[2][2] [2][2]          3 levels (divide)\n[1][1][1][1]...        log₂(8) = 3 levels\n```\n\nAt each level, we merge all n elements total: O(n) work per level.\nNumber of levels: log₂(n)\nTotal: O(n) * O(log n) = **O(n log n)**\n\nThis holds for best, average, and worst case - unlike quicksort which can degrade to O(n²)." },
      { role: 'user', content: "Is merge sort always better than quicksort then?" },
      { role: 'assistant', content: "Not necessarily! Here's the comparison:\n\n**Merge Sort:**\n- ✅ Guaranteed O(n log n) worst case\n- ✅ Stable (preserves order of equal elements)\n- ❌ Requires O(n) extra space\n\n**Quicksort:**\n- ✅ O(1) space (in-place)\n- ✅ Better cache locality (faster in practice)\n- ❌ O(n²) worst case (rare with good pivot selection)\n\n**In practice:** Most libraries use a hybrid approach - quicksort for most cases, switching to heapsort if recursion gets too deep. Python's Timsort combines merge sort and insertion sort for real-world data." }
    ]
  },
  // conv-5: Hash Table Collision Strategies
  {
    conversationId: 'conv-5',
    messages: [
      { role: 'user', content: "What's the difference between chaining and open addressing for hash table collisions?" },
      { role: 'assistant', content: "Great data structures question! Both solve the problem of multiple keys hashing to the same index:\n\n**Chaining:**\n- Each bucket holds a linked list\n- Collisions add to the list\n- Simple to implement\n- No limit on load factor\n- Extra memory for pointers\n\n**Open Addressing:**\n- Store everything in the array itself\n- On collision, probe for next empty slot\n- Better cache locality\n- Must handle deletions carefully\n- Performance degrades at high load factors\n\nPython's dict uses open addressing with a sophisticated probing strategy." },
      { role: 'user', content: "What probing strategies exist for open addressing?" },
      { role: 'assistant', content: "Three main strategies:\n\n**1. Linear Probing:** `(hash + i) % size`\n- Check next slot, then next, etc.\n- Simple but causes clustering\n\n**2. Quadratic Probing:** `(hash + i²) % size`\n- Reduces primary clustering\n- Can fail to find empty slots\n\n**3. Double Hashing:** `(hash1 + i * hash2) % size`\n- Uses second hash function\n- Best distribution, more complex\n\n**Example:**\nInsert key with hash=3, size=10\n- Linear: Try 3, 4, 5, 6...\n- Quadratic: Try 3, 4, 7, 12...\n- Double: Try 3, 8, 3, 8... (depends on hash2)\n\nChoose based on your load factor and performance needs!" }
    ]
  },
  // conv-6: Dynamic Programming Approach
  {
    conversationId: 'conv-6',
    messages: [
      { role: 'user', content: "How do I know when to use dynamic programming?" },
      { role: 'assistant', content: "DP is perfect when you have **overlapping subproblems** and **optimal substructure**. Here's how to spot it:\n\n**Overlapping Subproblems:**\nYou solve the same smaller problem multiple times.\n\n**Optimal Substructure:**\nThe optimal solution uses optimal solutions to subproblems.\n\n**Classic Signs:**\n- \"Find the maximum/minimum way to...\"\n- \"Count the number of ways to...\"\n- \"Find the longest/shortest...\"\n- You notice recursion solving same inputs repeatedly\n\n**Example:** Fibonacci is a simple DP problem - fib(5) calls fib(3) multiple times." },
      { role: 'user', content: "Can you show me the memoization approach?" },
      { role: 'assistant', content: "Sure! Memoization = recursion + caching:\n\n**Without Memoization (O(2ⁿ)):**\n```python\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n```\n\n**With Memoization (O(n)):**\n```python\ndef fib(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]\n```\n\n**Alternative - Bottom-up Tabulation:**\n```python\ndef fib(n):\n    if n <= 1:\n        return n\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]\n```\n\nMemoization is top-down (recursive), tabulation is bottom-up (iterative)." }
    ]
  },
  // conv-7: SQL JOIN Types Explanation
  {
    conversationId: 'conv-7',
    messages: [
      { role: 'user', content: "I'm confused about the different types of SQL JOINs. When do I use each one?" },
      { role: 'assistant', content: "Great question! Here's a practical breakdown:\n\n**INNER JOIN:** Only matching rows from both tables\n```sql\nSELECT * FROM students s\nINNER JOIN enrollments e ON s.id = e.student_id\n```\nUse when: You only want students who are enrolled\n\n**LEFT JOIN:** All rows from left table, matches from right\n```sql\nSELECT * FROM students s\nLEFT JOIN enrollments e ON s.id = e.student_id\n```\nUse when: Show all students, even those not enrolled\n\n**RIGHT JOIN:** All rows from right table, matches from left\n(Same as LEFT JOIN with tables swapped)\n\n**FULL OUTER JOIN:** All rows from both tables\nUse when: You want everything, matched or not" },
      { role: 'user', content: "What happens to the NULL values in a LEFT JOIN?" },
      { role: 'assistant', content: "Excellent follow-up! When a left table row has no match in the right table, the right table columns are filled with NULL.\n\n**Example:**\n```sql\nSELECT s.name, e.course_id\nFROM students s\nLEFT JOIN enrollments e ON s.id = e.student_id\n```\n\n**Result:**\n```\nname     | course_id\n---------|----------\nAlice    | CS101\nBob      | NULL      <- Bob not enrolled\nCarol    | DATA201\n```\n\n**Common pattern - find unmatched rows:**\n```sql\nSELECT s.name\nFROM students s\nLEFT JOIN enrollments e ON s.id = e.student_id\nWHERE e.student_id IS NULL  -- Students with no enrollments\n```\n\nThis is a very common interview question!" }
    ]
  },
  // conv-8: Database Normalization Forms
  {
    conversationId: 'conv-8',
    messages: [
      { role: 'user', content: "Can you explain database normalization? I understand 1NF but 2NF and 3NF are confusing." },
      { role: 'assistant', content: "Normalization reduces redundancy and improves data integrity. Here's a practical breakdown:\n\n**1NF (First Normal Form):**\n- Atomic values (no lists in a cell)\n- Each column has a single value\n- Each row is unique\n\n**2NF:**\n- Already in 1NF\n- No partial dependencies (non-key columns fully depend on the whole primary key)\n\n**3NF:**\n- Already in 2NF\n- No transitive dependencies (non-key columns don't depend on other non-key columns)\n\n**Example violation:**\n```\nstudents(id, name, course_id, course_name, instructor_id, instructor_name)\n```\n`course_name` depends on `course_id` (transitive dependency) - violates 3NF!" },
      { role: 'user', content: "How would you normalize that table?" },
      { role: 'assistant', content: "Split into three tables to achieve 3NF:\n\n**students:**\n```\nid | name  | course_id\n---|-------|----------\n1  | Alice | CS101\n```\n\n**courses:**\n```\ncourse_id | course_name      | instructor_id\n----------|------------------|-------------\nCS101     | Data Structures  | 10\n```\n\n**instructors:**\n```\ninstructor_id | instructor_name\n--------------|----------------\n10            | Dr. Smith\n```\n\n**Benefits:**\n- Update instructor name once, not for every student\n- No anomalies when adding/deleting data\n- Clear relationships\n\n**Trade-off:** More JOINs needed for queries, but modern databases handle this efficiently." }
    ]
  },
  // conv-9: Index Performance Tuning
  {
    conversationId: 'conv-9',
    messages: [
      { role: 'user', content: "When should I add indexes to my database tables? My queries are getting slow." },
      { role: 'assistant', content: "Indexes speed up reads but slow down writes. Here's when to use them:\n\n**Add indexes on columns that:**\n- Appear in WHERE clauses frequently\n- Are used in JOINs\n- Are used in ORDER BY\n- Have high cardinality (many unique values)\n\n**Example:**\n```sql\n-- Slow without index\nSELECT * FROM students WHERE email = 'alice@example.com';\n\n-- Create index\nCREATE INDEX idx_students_email ON students(email);\n\n-- Now O(log n) instead of O(n)\n```\n\n**Don't index:**\n- Small tables (<1000 rows)\n- Columns with low cardinality (e.g., gender)\n- Columns that change frequently\n- Everything (indexes have maintenance cost)" },
      { role: 'user', content: "What's the difference between a clustered and non-clustered index?" },
      { role: 'assistant', content: "This is a key concept for database optimization!\n\n**Clustered Index:**\n- Physical ordering of data on disk\n- One per table (usually the primary key)\n- Faster for range queries\n- The table IS the index\n\n**Non-Clustered Index:**\n- Separate structure with pointers to data\n- Many per table allowed\n- Extra lookup step to get data\n- Like a book's index\n\n**Analogy:**\n- Clustered: Dictionary (words sorted A-Z)\n- Non-Clustered: Book index (references page numbers)\n\n**Performance tip:** Put your most common query column as clustered index. For users table, email might be better than auto-increment ID if you always search by email!" }
    ]
  },
  // conv-10: React Hooks Best Practices
  {
    conversationId: 'conv-10',
    messages: [
      { role: 'user', content: "What are the best practices for using React hooks? I keep running into issues with useEffect." },
      { role: 'assistant', content: "useEffect is tricky! Here are the key rules:\n\n**1. Always include dependencies:**\n```javascript\n// ❌ Missing dependencies\nuseEffect(() => {\n  console.log(userId);\n}, []); // userId not in array!\n\n// ✅ Include all dependencies\nuseEffect(() => {\n  console.log(userId);\n}, [userId]);\n```\n\n**2. Clean up side effects:**\n```javascript\nuseEffect(() => {\n  const timer = setInterval(() => {...}, 1000);\n  return () => clearInterval(timer); // Cleanup!\n}, []);\n```\n\n**3. Don't put objects/arrays in dependencies:**\n```javascript\n// ❌ Infinite loop - new object every render\nuseEffect(() => {...}, [{ userId }]);\n\n// ✅ Use primitive values\nuseEffect(() => {...}, [userId]);\n```" },
      { role: 'user', content: "When should I use useCallback vs useMemo?" },
      { role: 'assistant', content: "Both memoize values, but for different purposes:\n\n**useCallback:** Memoize functions\n```javascript\nconst handleClick = useCallback(() => {\n  doSomething(id);\n}, [id]);\n// Returns same function unless id changes\n```\n\n**useMemo:** Memoize computed values\n```javascript\nconst expensiveValue = useMemo(() => {\n  return computeExpensiveValue(a, b);\n}, [a, b]);\n// Recomputes only when a or b changes\n```\n\n**When to use:**\n- useCallback: Passing callbacks to optimized child components\n- useMemo: Expensive calculations, avoiding re-renders\n\n**Rule of thumb:** Don't optimize prematurely! Use these only when profiling shows performance issues. Most apps don't need them." }
    ]
  },
  // conv-11: useEffect Dependency Array
  {
    conversationId: 'conv-11',
    messages: [
      { role: 'user', content: "Why does my useEffect run on every render even though I have a dependency array?" },
      { role: 'assistant', content: "This usually happens because your dependencies are objects or arrays that get recreated every render!\n\n**Common causes:**\n\n**1. Inline objects:**\n```javascript\n// ❌ New object every render - infinite loop!\nuseEffect(() => {\n  fetchData(options);\n}, [{ userId, filter }]); // New object each time\n\n// ✅ Use primitive values\nuseEffect(() => {\n  fetchData({ userId, filter });\n}, [userId, filter]);\n```\n\n**2. Array dependencies:**\n```javascript\n// ❌ New array every render\nuseEffect(() => {...}, [[1, 2, 3]]);\n\n// ✅ Use useMemo\nconst items = useMemo(() => [1, 2, 3], []);\nuseEffect(() => {...}, [items]);\n```\n\n**Debug tip:** Add console.log in useEffect to see when it runs!" },
      { role: 'user', content: "What if I want to run an effect only once on mount?" },
      { role: 'assistant', content: "Use an empty dependency array:\n\n```javascript\nuseEffect(() => {\n  // Runs once on mount\n  fetchInitialData();\n  \n  return () => {\n    // Cleanup on unmount\n    cleanup();\n  };\n}, []); // Empty array = run once\n```\n\n**Important:** In React 18+ Strict Mode, this runs TWICE in development to help find bugs. This is intentional! In production, it only runs once.\n\n**Common use cases:**\n- Initialize data fetching\n- Set up event listeners\n- Start timers/animations\n- Subscribe to external data sources\n\n**Warning:** ESLint will complain if you use variables inside but don't include them in dependencies. Either include them or use useRef to store mutable values." }
    ]
  },
  // conv-12: State Management with Context
  {
    conversationId: 'conv-12',
    messages: [
      { role: 'user', content: "Should I use Context API or a state management library like Redux?" },
      { role: 'assistant', content: "Great question! The answer depends on your app's complexity:\n\n**Use Context API when:**\n- Sharing simple state (user, theme, locale)\n- Small to medium apps\n- Few state updates\n- Don't need time-travel debugging\n\n**Use Redux/Zustand when:**\n- Complex state logic\n- Many state updates (performance matters)\n- Need middleware (logging, API calls)\n- Large team needs predictable patterns\n\n**Context API Example:**\n```javascript\nconst UserContext = createContext();\n\nfunction App() {\n  const [user, setUser] = useState(null);\n  return (\n    <UserContext.Provider value={{ user, setUser }}>\n      {children}\n    </UserContext.Provider>\n  );\n}\n```\n\n**Modern approach:** Try Context first, migrate to Redux only when needed!" },
      { role: 'user', content: "Doesn't Context cause unnecessary re-renders?" },
      { role: 'assistant', content: "Yes, but only if you're not careful! Context triggers re-renders for ALL consumers when ANY value changes.\n\n**Problem:**\n```javascript\n// ❌ Everything re-renders when either user OR theme changes\n<AppContext.Provider value={{ user, theme, setUser, setTheme }}>\n```\n\n**Solutions:**\n\n**1. Split contexts:**\n```javascript\n// ✅ Independent contexts\n<UserContext.Provider value={{ user, setUser }}>\n  <ThemeContext.Provider value={{ theme, setTheme }}>\n    {children}\n  </ThemeContext.Provider>\n</UserContext.Provider>\n```\n\n**2. Memoize values:**\n```javascript\nconst userValue = useMemo(\n  () => ({ user, setUser }),\n  [user]\n);\n```\n\n**3. Use React Query for server state** (my recommendation):\nContext for UI state, React Query for server data!" }
    ]
  },
  // conv-13: Linear Regression Implementation
  {
    conversationId: 'conv-13',
    messages: [
      { role: 'user', content: "I'm trying to implement linear regression from scratch for my ML course. Where do I start?" },
      { role: 'assistant', content: "Great learning exercise! Linear regression finds the line y = mx + b that best fits your data.\n\n**Steps:**\n\n1. **Define the hypothesis:** h(x) = θ₀ + θ₁x\n2. **Cost function:** J(θ) = (1/2m) Σ(h(x⁽ⁱ⁾) - y⁽ⁱ⁾)²\n3. **Gradient descent:** θⱼ := θⱼ - α ∂J(θ)/∂θⱼ\n\n**Python implementation:**\n```python\nimport numpy as np\n\ndef linear_regression(X, y, alpha=0.01, iterations=1000):\n    m = len(y)\n    theta = np.zeros(2)  # [θ₀, θ₁]\n    \n    for _ in range(iterations):\n        h = theta[0] + theta[1] * X  # Hypothesis\n        error = h - y\n        theta[0] -= alpha * (1/m) * np.sum(error)\n        theta[1] -= alpha * (1/m) * np.sum(error * X)\n    \n    return theta\n```" },
      { role: 'user', content: "How do I choose the learning rate alpha?" },
      { role: 'assistant', content: "Alpha is critical! Too large = divergence, too small = slow convergence.\n\n**Guidelines:**\n\n**Start with α = 0.01, then try:**\n- If loss decreases steadily: Good! ✅\n- If loss oscillates: α too large, try α/10\n- If loss decreases slowly: α too small, try α*10\n\n**Try multiple values:**\n```python\nalphas = [0.001, 0.01, 0.1, 1.0]\nfor alpha in alphas:\n    theta, costs = gradient_descent(X, y, alpha)\n    plot_cost_curve(costs)\n```\n\n**Pro tip:** Use adaptive learning rates like Adam optimizer - they adjust α automatically!\n\n**Debugging:** Plot cost vs iterations. Should decrease monotonically. If it goes up, α is too large or there's a bug." }
    ]
  },
  // conv-14: Overfitting Prevention Techniques
  {
    conversationId: 'conv-14',
    messages: [
      { role: 'user', content: "My model has 95% training accuracy but only 65% test accuracy. How do I fix overfitting?" },
      { role: 'assistant', content: "That's a classic sign of overfitting! Your model memorized the training data instead of learning patterns. Here's how to fix it:\n\n**1. Regularization:**\n- L1 (Lasso): Sparse features\n- L2 (Ridge): Prevents large weights\n```python\nmodel = Ridge(alpha=1.0)  # sklearn\n```\n\n**2. More training data:**\n- Data augmentation (images)\n- Synthetic data generation\n\n**3. Reduce model complexity:**\n- Fewer layers/neurons\n- Feature selection\n\n**4. Dropout (neural networks):**\n```python\nmodel.add(Dropout(0.5))  # Drop 50% of neurons\n```\n\n**5. Early stopping:**\nStop training when validation loss stops improving.\n\n**6. Cross-validation:**\nUse k-fold CV to detect overfitting early." },
      { role: 'user', content: "What's the difference between L1 and L2 regularization?" },
      { role: 'assistant', content: "They both penalize large weights but in different ways:\n\n**L1 (Lasso):**\n- Penalty: Σ|θᵢ|\n- Effect: Drives some weights to exactly 0\n- Use: Feature selection (sparse models)\n- Example: 1000 features → 50 non-zero weights\n\n**L2 (Ridge):**\n- Penalty: Σθᵢ²\n- Effect: Shrinks weights toward 0 (but rarely exactly 0)\n- Use: When all features are relevant\n- Example: All 1000 features have small weights\n\n**Visual difference:**\n```\nL1: |w₁| + |w₂| ≤ C  (Diamond constraint)\nL2: w₁² + w₂² ≤ C   (Circle constraint)\n```\n\n**In practice:** Try both! L2 is more common as a default. Use L1 when you suspect many irrelevant features.\n\n**Elastic Net:** Combines both: λ₁|θᵢ| + λ₂θᵢ²" }
    ]
  },
  // conv-15: Neural Network Activation Functions
  {
    conversationId: 'conv-15',
    messages: [
      { role: 'user', content: "Which activation function should I use in my neural network? I've heard ReLU is popular but don't understand why." },
      { role: 'assistant', content: "Great question! Activation functions introduce non-linearity. Without them, deep networks would just be fancy linear regression!\n\n**Common activation functions:**\n\n**1. ReLU (most popular):**\n```python\nf(x) = max(0, x)\n```\n- Fast to compute\n- Solves vanishing gradient\n- Issue: \"Dying ReLU\" (neurons stuck at 0)\n\n**2. Sigmoid:**\n```python\nf(x) = 1 / (1 + e^(-x))\n```\n- Output range [0, 1]\n- Use: Binary classification output layer\n- Issue: Vanishing gradient for deep networks\n\n**3. Tanh:**\n```python\nf(x) = (e^x - e^(-x)) / (e^x + e^(-x))\n```\n- Output range [-1, 1]\n- Zero-centered (better than sigmoid)\n- Still has vanishing gradient\n\n**Rule of thumb:**\n- Hidden layers: ReLU or variants (LeakyReLU, ELU)\n- Output layer: Depends on task (sigmoid for binary, softmax for multi-class)" },
      { role: 'user', content: "What's the vanishing gradient problem?" },
      { role: 'assistant', content: "The vanishing gradient problem makes deep networks hard to train!\n\n**The problem:**\nDuring backpropagation, gradients get multiplied layer by layer. With sigmoid/tanh, gradients are always <1, so they shrink exponentially:\n\n```\nLayer 10: gradient = 0.1\nLayer 9:  gradient = 0.1 * 0.3 = 0.03\nLayer 8:  gradient = 0.03 * 0.2 = 0.006\n...\nLayer 1:  gradient ≈ 0.000001 (vanished!)\n```\n\nEarly layers learn very slowly or not at all!\n\n**Why ReLU helps:**\n- ReLU derivative is either 0 or 1 (no shrinking)\n- Gradients flow through unchanged\n- Deep networks train much faster\n\n**Other solutions:**\n- Batch normalization\n- Residual connections (ResNet)\n- Better initialization (Xavier/He)\n- Modern optimizers (Adam)\n\nThis breakthrough enabled 100+ layer networks!" }
    ]
  },
  // conv-16: General Study Tips for CS Courses
  {
    conversationId: 'conv-16',
    messages: [
      { role: 'user', content: "I'm struggling to keep up with my CS courses. Any study tips?" },
      { role: 'assistant', content: "CS courses require a different approach than other subjects! Here's what works:\n\n**1. Practice, don't just read:**\n- Code along with examples\n- Redo problems from scratch\n- Type out code, don't copy-paste\n\n**2. Understand, don't memorize:**\n- Ask \"why\" not just \"how\"\n- Explain concepts to others\n- Draw diagrams\n\n**3. Space your learning:**\n- Study 1 hour daily > 7 hours once/week\n- Review old topics regularly\n- Sleep helps consolidate memory\n\n**4. Debug systematically:**\n- Read error messages carefully\n- Use print statements/debugger\n- Rubber duck debugging\n\n**5. Use the right resources:**\n- Official documentation\n- LeetCode/HackerRank for practice\n- Office hours (professors love helping!)" },
      { role: 'user', content: "How long should I struggle with a problem before asking for help?" },
      { role: 'assistant', content: "Great question! There's a balance between productive struggle and wasted time.\n\n**The 15-30-60 rule:**\n\n**15 minutes:** Try on your own\n- Read the problem carefully\n- Try different approaches\n- Look up syntax if needed\n\n**30 minutes:** Research\n- Check documentation\n- Search for similar problems\n- Review lecture notes\n\n**60 minutes:** Ask for help\n- You've made a real effort\n- You can explain what you've tried\n- You have specific questions\n\n**Red flags to ask sooner:**\n- Completely stuck on where to start\n- Making no progress after 3 different attempts\n- Same error keeps appearing\n\n**How to ask good questions:**\n1. What you're trying to do\n2. What you've tried\n3. The specific error/issue\n4. Your current understanding\n\nInstructors appreciate students who've done the work!" }
    ]
  },
  // conv-17: Career Advice for Software Engineering
  {
    conversationId: 'conv-17',
    messages: [
      { role: 'user', content: "What skills should I focus on to become a good software engineer?" },
      { role: 'assistant', content: "Focus on fundamentals + practical skills:\n\n**Core fundamentals (lifetime value):**\n- Data structures & algorithms\n- System design principles\n- Debugging & problem-solving\n- Version control (Git)\n- Testing strategies\n\n**Language skills:**\n- Master ONE language deeply first\n- Learn 2-3 more (different paradigms)\n- Recommended: Python/JavaScript + Java/C++ + SQL\n\n**Soft skills (often overlooked!):**\n- Communication (code reviews, docs)\n- Collaboration (teamwork beats solo genius)\n- Learning how to learn\n- Time management\n\n**Build projects:**\n- Contribute to open source\n- Build something people use\n- Learn deployment (AWS/Vercel)\n\n**Don't chase every trend:**\nReact vs Vue vs Angular matters less than solid fundamentals!" },
      { role: 'user', content: "Should I do internships or focus on personal projects?" },
      { role: 'assistant', content: "Do BOTH if possible, but prioritize differently by stage:\n\n**Freshman/Sophomore:**\n- Focus: Personal projects + fundamentals\n- Why: Build portfolio, learn without pressure\n- Goal: 2-3 solid projects on GitHub\n\n**Junior year:**\n- Focus: Internships\n- Why: Real codebases, mentorship, networking\n- Goal: 1-2 internships at companies you'd work for\n\n**Senior year:**\n- Focus: Return offers or new applications\n- Why: Internship → full-time is easiest path\n\n**Projects vs Internships:**\n\n**Projects show:**\n- Self-motivation\n- Technical skills\n- Creativity\n\n**Internships show:**\n- Can work on teams\n- Handle real production code\n- Professional communication\n\n**Best of both:** Open source contributions! Shows collaboration + coding skills. Plus, free mentorship from experienced devs!" }
    ]
  },
  // conv-18: Comparing Different Programming Languages
  {
    conversationId: 'conv-18',
    messages: [
      { role: 'user', content: "I know Python but my friend says I should learn C++ or Rust. Which language should I focus on?" },
      { role: 'assistant', content: "All three have their place! Here's when to use each:\n\n**Python:**\n- Best for: Data science, scripting, web backends, ML\n- Pros: Fast development, huge libraries, readable\n- Cons: Slow execution, no type safety (without mypy)\n- Learn if: You want to get things done quickly\n\n**C++:**\n- Best for: Systems programming, game engines, HPC\n- Pros: Maximum performance, full control\n- Cons: Steep learning curve, manual memory management\n- Learn if: You need performance or want to understand computers deeply\n\n**Rust:**\n- Best for: Systems programming, WebAssembly, safe concurrency\n- Pros: Memory safety without garbage collection, modern syntax\n- Cons: Steeper learning curve than Python\n- Learn if: You want C++ performance with Python-like safety\n\n**My advice:** Master Python first, then add C++ OR Rust depending on your career goals." },
      { role: 'user', content: "What about JavaScript? Everyone says I need to know it for web dev." },
      { role: 'assistant', content: "JavaScript is essential for web development - it's the ONLY language browsers run natively!\n\n**When JavaScript is mandatory:**\n- Frontend development (React, Vue, Angular)\n- Full-stack web apps (Node.js)\n- Mobile apps (React Native)\n- Desktop apps (Electron)\n\n**JavaScript's evolution:**\n- 2015+: Modern JS (ES6+) is actually nice!\n- TypeScript: Adds type safety (game-changer)\n- Node.js: JS on the server\n\n**Should you learn it?**\n\n**Yes if:**\n- You want web/mobile dev jobs\n- You're building user interfaces\n- You want startup/product jobs\n\n**Maybe not if:**\n- Pure ML/data science career\n- Systems programming focus\n- Academic research\n\n**The polyglot approach:**\nMost engineers know 3-5 languages:\n- Python (scripting/ML)\n- JavaScript/TypeScript (web)\n- One systems language (C++/Rust/Go)\n- SQL (databases)\n\nLearn as you need them!" }
    ]
  },
  // conv-19: Project Management Best Practices
  {
    conversationId: 'conv-19',
    messages: [
      { role: 'user', content: "My team's software project is a mess. How do professional teams organize their work?" },
      { role: 'assistant', content: "Great question! Most teams follow Agile methodologies:\n\n**Scrum basics:**\n- **Sprints:** 1-2 week work cycles\n- **Daily standups:** 15 min sync (what you did, what you're doing, blockers)\n- **Sprint planning:** Choose tasks for next sprint\n- **Sprint review:** Demo completed work\n- **Retrospective:** What went well/badly\n\n**Tools:**\n- Jira/Linear for task tracking\n- GitHub/GitLab for code\n- Slack/Discord for communication\n- Notion/Confluence for docs\n\n**Git workflow:**\n```\nmain (production) ← Never commit directly!\n  ↑\ndevelop (staging)\n  ↑\nfeature/user-auth ← Create branch per feature\n```\n\n**Code review process:**\n1. Write code on feature branch\n2. Create pull request\n3. Get 2 reviews\n4. Merge to develop\n5. Deploy to production\n\nNever push directly to main!" },
      { role: 'user', content: "How do you handle merge conflicts?" },
      { role: 'assistant', content: "Merge conflicts are normal! Here's how to handle them:\n\n**Prevention (best approach):**\n- Pull from main frequently\n- Keep branches short-lived (<3 days)\n- Communicate with team about file changes\n- Small, focused commits\n\n**Resolution:**\n```bash\n# 1. Pull latest changes\ngit pull origin main\n\n# 2. Git shows conflicts:\n<<<<<<< HEAD\nyour code\n=======\ntheir code\n>>>>>>> main\n\n# 3. Manually resolve - keep one or merge both\n# 4. Test that it works!\n# 5. Commit the resolution\ngit add .\ngit commit -m \"Resolve merge conflict in auth.js\"\n```\n\n**Pro tips:**\n- **Use VS Code's merge conflict UI** - much easier!\n- **When in doubt, ask the other developer**\n- **Test after resolving** - don't just pick one blindly\n- **Rebase vs merge:** Rebase for cleaner history, merge for safety\n\n**Complex conflicts?** Delete your branch and recreate from latest main - sometimes faster!" }
    ]
  },
  // conv-20: Interview Preparation Strategies
  {
    conversationId: 'conv-20',
    messages: [
      { role: 'user', content: "I have a technical interview next month. How should I prepare?" },
      { role: 'assistant', content: "One month is perfect! Here's a structured plan:\n\n**Week 1: Fundamentals review**\n- Arrays, strings, hash tables\n- Linked lists, stacks, queues\n- Trees (BST, traversals)\n- Big O notation\n- Practice 2 easy LeetCode/day\n\n**Week 2: Intermediate patterns**\n- Two pointers, sliding window\n- BFS/DFS (graphs & trees)\n- Binary search variations\n- Dynamic programming basics\n- Practice 2 medium/day\n\n**Week 3: Advanced + system design**\n- DP (harder problems)\n- Backtracking, recursion\n- System design primers\n- Mock interviews with friends\n- 1 hard + 1 medium/day\n\n**Week 4: Company-specific prep**\n- Research company's tech stack\n- Practice their common questions\n- Prepare behavioral answers (STAR method)\n- Mock interviews\n- Review your own solutions\n\n**Resources:**\n- LeetCode (patterns)\n- Cracking the Coding Interview\n- Pramp (mock interviews)" },
      { role: 'user', content: "What if I can't solve a problem during the interview?" },
      { role: 'assistant', content: "This happens to everyone! How you handle it matters more than solving perfectly.\n\n**Do this:**\n\n**1. Think out loud:**\n```\n\"I'm thinking we could use a hash map to store...\"\n\"Hmm, that would be O(n²), let me see if we can optimize...\"\n```\nInterviewers want to see your thought process!\n\n**2. Start with brute force:**\n\"I can solve this in O(n²) with nested loops. Let me code that first, then we can optimize.\"\n\n**3. Ask clarifying questions:**\n- \"Can I assume the array is sorted?\"\n- \"What should I return for empty input?\"\n- \"Are there memory constraints?\"\n\n**4. Work through an example:**\nWrite out input → output on whiteboard\n\n**5. If truly stuck, ask for a hint:**\n\"I'm stuck on how to avoid the O(n²) solution. Can you give me a hint?\"\n\n**Don't do this:**\n- ❌ Stay silent for 5 minutes\n- ❌ Give up immediately\n- ❌ Make excuses\n\n**Remember:** Interviews test problem-solving, not memorization. Show you can work through ambiguity!" }
    ]
  },
];

// Generate messages with timestamps
const messages = [];
const baseDate = new Date('2025-09-12T08:00:00.000Z');

conversationTemplates.forEach((template, convIndex) => {
  const convDate = new Date(baseDate.getTime() + convIndex * 24 * 60 * 60 * 1000); // Space conversations 1 day apart

  template.messages.forEach((msg, msgIndex) => {
    const msgDate = new Date(convDate.getTime() + msgIndex * 5 * 60 * 1000); // Space messages 5 minutes apart

    messages.push({
      id: `msg-${convIndex + 1}-${msgIndex + 1}`,
      conversationId: template.conversationId,
      role: msg.role,
      content: msg.content,
      timestamp: msgDate.toISOString(),
    });
  });
});

// Write to file
const outputPath = join(__dirname, 'ai-messages.json');
writeFileSync(outputPath, JSON.stringify(messages, null, 2));

console.log(`✅ Generated ${messages.length} messages across ${conversationTemplates.length} conversations`);
console.log(`📝 Saved to: ${outputPath}`);
