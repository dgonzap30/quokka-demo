import type {
  User,
  LoginInput,
  SignupInput,
  AuthResult,
  AuthSession,
  AuthError,
  Course,
  Thread,
  ThreadWithAIAnswer,
  Post,
  Notification,
  CourseInsight,
  CourseMetrics,
  CreateThreadInput,
  CreatePostInput,
  StudentDashboardData,
  InstructorDashboardData,
  ActivityItem,
  CourseWithActivity,
  CourseWithMetrics,
  AIAnswer,
  Citation,
  ConfidenceLevel,
  GenerateAIAnswerInput,
  EndorseAIAnswerInput,
  FrequentlyAskedQuestion,
  TrendingTopic,
  InstructorInsight,
  ResponseTemplate,
  BulkEndorseInput,
  BulkActionResult,
  SearchQuestionsInput,
  QuestionSearchResult,
  CreateResponseTemplateInput,
  UrgencyLevel,
  TrendDirection,
  CourseMaterial,
  SearchCourseMaterialsInput,
  CourseMaterialSearchResult,
  AIConversation,
  AIMessage,
  CreateConversationInput,
  SendMessageInput,
  ConversationToThreadInput,
  ConversationToThreadResult,
} from "@/lib/models/types";

import {
  createStatWithTrend,
  createGoal,
  generateSparkline,
  getCurrentWeekRange,
  getPreviousWeekRange,
  countInDateRange,
  calculateAICoverage,
} from "@/lib/utils/dashboard-calculations";

import { calculateQuokkaPoints } from "@/lib/utils/quokka-points";
import { calculateAllAssignmentQA } from "@/lib/utils/assignment-qa";

// LLM imports
import { getLLMProvider, isLLMProviderAvailable } from "@/lib/llm";
import { buildCourseContext } from "@/lib/context";
import { buildSystemPrompt, buildUserPromptWithContext, extractKeywords as extractLLMKeywords } from "@/lib/llm/utils";
import type { MaterialReference } from "@/lib/models/types";

import {
  seedData,
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  getUserByEmail,
  validateCredentials,
  createUser,
  getCourses,
  getCourseById,
  getEnrollments,
  getThreads,
  getThreadsByCourse,
  getThreadById,
  addThread,
  updateThread,
  getPosts,
  getPostsByThread,
  addPost,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUsers,
  getAIAnswerById,
  getAIAnswerByThread,
  getAIAnswers,
  addAIAnswer,
  updateAIAnswer,
  getResponseTemplatesByUser,
  addResponseTemplate,
  deleteResponseTemplate as deleteResponseTemplateFromStore,
  incrementTemplateUsage,
  getAssignments,
  getCourseMaterialsByCourse,
  getUserConversations,
  getConversationById,
  addConversation,
  updateConversation,
  deleteConversation,
  getConversationMessages,
  addMessage,
} from "@/lib/store/localStore";

// ============================================
// Helper Functions
// ============================================

/**
 * Simulates network delay for mock API
 */
function delay(ms?: number): Promise<void> {
  const baseDelay = ms ?? 200 + Math.random() * 300; // Default 200-500ms
  return new Promise((resolve) => setTimeout(resolve, baseDelay));
}

/**
 * Generates unique ID with prefix
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// AI Generation Helper Functions
// ============================================

/**
 * Extract keywords from text (lowercase, >2 chars, common words removed)
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

/**
 * Calculate keyword match ratio between question and template
 */
function calculateMatchRatio(questionKeywords: string[], templateKeywords: string[]): number {
  const matches = questionKeywords.filter(k => templateKeywords.includes(k)).length;
  return questionKeywords.length > 0 ? matches / questionKeywords.length : 0;
}

/**
 * Generate excerpt from material content around matched keywords
 */
function generateExcerpt(content: string, keywords: string[]): string {
  const lowerContent = content.toLowerCase();

  // Find first occurrence of any keyword
  let startIdx = -1;
  for (const keyword of keywords) {
    const idx = lowerContent.indexOf(keyword.toLowerCase());
    if (idx !== -1 && (startIdx === -1 || idx < startIdx)) {
      startIdx = idx;
    }
  }

  if (startIdx === -1) {
    // No keyword found, return beginning
    return content.slice(0, 150).trim() + '...';
  }

  // Extract context around keyword (150 chars)
  const start = Math.max(0, startIdx - 40);
  const end = Math.min(content.length, start + 150);
  let excerpt = content.slice(start, end).trim();

  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt;
}

/**
 * Generate snippet from material content for search results
 */
function generateSnippet(content: string, keywords: string[], maxLength: number): string {
  const lowerContent = content.toLowerCase();

  // Find first occurrence of any keyword
  let startIdx = -1;
  for (const keyword of keywords) {
    const idx = lowerContent.indexOf(keyword.toLowerCase());
    if (idx !== -1 && (startIdx === -1 || idx < startIdx)) {
      startIdx = idx;
    }
  }

  if (startIdx === -1) {
    // No keyword found, return beginning
    return content.slice(0, maxLength).trim() + (content.length > maxLength ? '...' : '');
  }

  // Extract context around keyword
  const start = Math.max(0, startIdx - 50);
  const end = Math.min(content.length, start + maxLength);
  let snippet = content.slice(start, end).trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Map CourseMaterialType to CitationSourceType
 */
function mapMaterialTypeToCitationType(materialType: CourseMaterial['type']): Citation['sourceType'] {
  // Handle the mapping between the two type systems
  // CourseMaterialType uses "slide" (singular), CitationSourceType uses "slides" (plural)
  if (materialType === 'slide') return 'slides';

  // All other types match exactly
  return materialType as Citation['sourceType'];
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Generate citations for AI answer
 */
function generateCitations(courseCode: string, keywords: string[]): Citation[] {
  const courseMaterials: Record<string, Array<{ source: string; type: "lecture" | "textbook" | "slides" | "lab" | "assignment" | "reading"; keywords: string[] }>> = {
    CS: [
      { source: "Lecture 5: Binary Search & Sorting Algorithms", type: "lecture", keywords: ['binary', 'search', 'sorting', 'algorithm', 'complexity', 'divide', 'conquer'] },
      { source: "Introduction to Algorithms (CLRS) - Chapter 3", type: "textbook", keywords: ['algorithm', 'analysis', 'notation', 'complexity', 'runtime'] },
      { source: "Lecture 8: Data Structures Overview", type: "lecture", keywords: ['array', 'linked', 'list', 'stack', 'queue', 'tree', 'graph', 'hash'] },
      { source: "Lab 3: Implementing Search Algorithms", type: "lab", keywords: ['binary', 'search', 'linear', 'implementation', 'practice'] },
      { source: "Slides: Big O Notation and Complexity", type: "slides", keywords: ['big', 'notation', 'complexity', 'time', 'space', 'analysis'] },
    ],
    MATH: [
      { source: "Lecture 10: Integration Techniques", type: "lecture", keywords: ['integration', 'integral', 'substitution', 'parts', 'partial', 'fractions'] },
      { source: "Calculus: Early Transcendentals - Chapter 5", type: "textbook", keywords: ['derivative', 'differentiation', 'chain', 'rule', 'product', 'quotient'] },
      { source: "Lecture 12: Derivatives and Applications", type: "lecture", keywords: ['derivative', 'rate', 'change', 'tangent', 'slope', 'optimization'] },
      { source: "Practice Problems: Integration by Parts", type: "assignment", keywords: ['integration', 'parts', 'practice', 'liate', 'rule'] },
      { source: "Reading: Fundamental Theorem of Calculus", type: "reading", keywords: ['fundamental', 'theorem', 'calculus', 'antiderivative', 'definite'] },
    ],
  };

  const materials = courseMaterials[courseCode.substring(0, 2)] || [];

  // Score materials by keyword match
  const scoredMaterials = materials.map(material => {
    const matches = keywords.filter(k => material.keywords.includes(k)).length;
    const relevance = Math.min(95, 60 + (matches * 10));
    return { ...material, relevance, matches };
  });

  // Sort by relevance and take top 3-5
  const topMaterials = scoredMaterials
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 citations

  // Generate citations
  return topMaterials.map((material) => ({
    id: generateId('cite'),
    sourceType: material.type,
    source: material.source,
    excerpt: `Covers ${keywords.slice(0, 3).join(', ')} concepts in detail...`,
    relevance: material.relevance,
    link: undefined, // Mock - would link to actual course material
  }));
}

/**
 * CS course templates
 */
const CS_TEMPLATES = [
  {
    keywords: ['binary', 'search', 'algorithm', 'sorted', 'array'],
    content: `Binary search is an efficient algorithm for finding a target value in a **sorted array**. It uses the divide-and-conquer strategy:

**How it works:**
1. Start with the middle element of the array
2. If the target equals the middle element, you're done
3. If the target is less than the middle element, search the left half
4. If the target is greater, search the right half
5. Repeat until found or the search space is empty

**Time Complexity:** O(log n) - much faster than linear search O(n) for large datasets

**Key Requirement:** The array MUST be sorted first. If unsorted, you need to sort it first (O(n log n)) or use linear search.

**Example:**
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1  # Not found
\`\`\``,
  },
  {
    keywords: ['linked', 'list', 'array', 'data', 'structure', 'difference'],
    content: `**Arrays vs Linked Lists** - Both are fundamental data structures with different trade-offs:

**Arrays:**
- Fixed size (in most languages)
- **O(1) random access** - can access any element instantly by index
- O(n) insertion/deletion (need to shift elements)
- Contiguous memory (cache-friendly)
- Better for: Frequent lookups, known size

**Linked Lists:**
- Dynamic size (grows/shrinks easily)
- O(n) access by index (must traverse from head)
- **O(1) insertion/deletion** at known position
- Non-contiguous memory
- Better for: Frequent insertions/deletions, unknown size

**When to use which:**
- Use **arrays** when you need fast lookups and know the size
- Use **linked lists** when you need frequent insertions/deletions at the beginning/middle

**Memory:**
- Arrays: Compact, better cache locality
- Linked Lists: Extra memory for pointers/references`,
  },
  {
    keywords: ['big', 'notation', 'complexity', 'time', 'space', 'analysis'],
    content: `**Big O Notation** measures algorithm efficiency by describing how runtime/space grows as input size increases.

**Common Complexities (best to worst):**
- **O(1)** - Constant: Array access, hash table lookup
- **O(log n)** - Logarithmic: Binary search, balanced tree operations
- **O(n)** - Linear: Simple loops, linear search
- **O(n log n)** - Linearithmic: Efficient sorting (merge sort, quicksort average)
- **O(n²)** - Quadratic: Nested loops, bubble sort
- **O(2ⁿ)** - Exponential: Recursive Fibonacci (avoid!)

**Key Rules:**
1. Drop constants: O(2n) → O(n)
2. Drop lower terms: O(n² + n) → O(n²)
3. Focus on worst-case unless specified otherwise

**Example:**
\`\`\`python
for i in range(n):      # O(n)
    for j in range(n):  # O(n)
        print(i, j)     # O(1)
# Total: O(n²)
\`\`\``,
  },
];

/**
 * MATH course templates
 */
const MATH_TEMPLATES = [
  {
    keywords: ['integration', 'integral', 'techniques', 'substitution', 'parts'],
    content: `**Integration Techniques** - Essential methods for solving integrals:

**1. U-Substitution:**
Best for: Composite functions where the derivative of inner function appears
\`\`\`
∫ 2x·e^(x²) dx
Let u = x², then du = 2x dx
= ∫ e^u du = e^u + C = e^(x²) + C
\`\`\`

**2. Integration by Parts:** ∫u dv = uv - ∫v du
Use **LIATE** to choose u:
- **L**ogarithmic (ln x)
- **I**nverse trig (arcsin x)
- **A**lgebraic (x², x³)
- **T**rigonometric (sin x, cos x)
- **E**xponential (e^x)

**3. Partial Fractions:**
For rational functions: decompose into simpler fractions

**4. Trigonometric Substitution:**
For expressions with √(a² - x²), √(a² + x²), or √(x² - a²)

**Common Mistake:** Forgetting the constant of integration (+C)!`,
  },
  {
    keywords: ['derivative', 'differentiation', 'chain', 'rule', 'product', 'quotient'],
    content: `**Derivatives and Differentiation Rules:**

**Power Rule:** d/dx[x^n] = nx^(n-1)
- Example: d/dx[x³] = 3x²

**Product Rule:** d/dx[f(x)·g(x)] = f'(x)·g(x) + f(x)·g'(x)
- Example: d/dx[x²·sin(x)] = 2x·sin(x) + x²·cos(x)

**Quotient Rule:** d/dx[f(x)/g(x)] = [f'(x)·g(x) - f(x)·g'(x)] / [g(x)]²

**Chain Rule:** d/dx[f(g(x))] = f'(g(x))·g'(x)
- Example: d/dx[sin(x²)] = cos(x²)·2x

**Common Derivatives:**
- d/dx[e^x] = e^x
- d/dx[ln x] = 1/x
- d/dx[sin x] = cos x
- d/dx[cos x] = -sin x
- d/dx[tan x] = sec²x

**Tip:** For complex functions, apply chain rule repeatedly (outside to inside)`,
  },
];

/**
 * General fallback template
 */
const GENERAL_TEMPLATE = {
  keywords: [],
  content: `I understand your question, and I'd be happy to help guide you through this concept.

**Approach:**
1. Review the relevant course materials (lectures, textbook sections)
2. Break down the problem into smaller steps
3. Identify the key concepts or formulas needed
4. Work through examples to build understanding
5. Practice with similar problems

**Next Steps:**
- Check the course materials cited below for detailed explanations
- Attend office hours if you need personalized help
- Work through practice problems to reinforce the concepts
- Post follow-up questions if specific parts are unclear

Remember: Understanding takes time and practice. Don't hesitate to ask for clarification on specific steps!`,
};

/**
 * Generate AI response using template system (synchronous fallback)
 */
function generateAIResponse(
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): { content: string; confidence: { level: ConfidenceLevel; score: number }; citations: Citation[] } {
  const questionText = `${title} ${content} ${tags.join(' ')}`;
  const keywords = extractKeywords(questionText);

  // Select template based on course type
  type Template = { keywords: string[]; content: string };
  let templateList: Template[] = [];

  if (courseCode.startsWith('CS')) {
    templateList = CS_TEMPLATES;
  } else if (courseCode.startsWith('MATH')) {
    templateList = MATH_TEMPLATES;
  }

  // Find best matching template
  let bestMatch: Template = GENERAL_TEMPLATE;
  let bestMatchRatio = 0;

  if (templateList.length > 0) {
    for (const template of templateList) {
      const ratio = calculateMatchRatio(keywords, template.keywords);
      if (ratio > bestMatchRatio) {
        bestMatchRatio = ratio;
        bestMatch = template;
      }
    }
  }

  // Calculate confidence (55% base + up to 40% from match ratio)
  const confidenceScore = Math.round(55 + (bestMatchRatio * 40));
  const confidenceLevel = getConfidenceLevel(confidenceScore);

  // Generate citations using hardcoded materials (fallback)
  const citations = generateCitations(courseCode, keywords);

  return {
    content: bestMatch.content,
    confidence: {
      level: confidenceLevel,
      score: confidenceScore,
    },
    citations,
  };
}

/**
 * Generate AI response with course material references (LLM-powered)
 *
 * Uses actual LLM (OpenAI/Anthropic) when enabled, with fallback to template system.
 * Implements provider fallback chain: LLM → Templates
 */
async function generateAIResponseWithMaterials(
  courseId: string,
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): Promise<{
  content: string;
  confidence: { level: ConfidenceLevel; score: number };
  citations: Citation[];
}> {
  const questionText = `${title} ${content} ${tags.join(' ')}`;

  // Check if LLM is enabled and available
  if (!isLLMProviderAvailable()) {
    console.log('[AI] LLM not available, using template fallback');
    return generateAIResponseWithTemplates(courseId, courseCode, title, content, tags);
  }

  try {
    // Get course and materials
    const course = await api.getCourse(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const materials = await api.getCourseMaterials(courseId);

    // Build course context with ranked materials
    const context = buildCourseContext(course, materials, questionText, {
      maxMaterials: 5,
      minRelevance: 30,
      maxTokens: 2000,
    });

    // Prepare material references for prompt
    const materialRefs: MaterialReference[] = context.materials.map(m => ({
      materialId: m.id,
      title: m.title,
      type: m.type,
      excerpt: m.content.substring(0, 300),
      relevanceScore: m.relevanceScore,
    }));

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPromptWithContext(
      questionText,
      materialRefs,
      course.code,
      course.name
    );

    // Get LLM provider and generate response
    const llmProvider = getLLMProvider();
    const llmResponse = await llmProvider.generate({
      systemPrompt,
      userPrompt,
      maxTokens: 1000,
      temperature: 0.7,
    });

    if (!llmResponse.success) {
      console.warn('[AI] LLM generation failed:', llmResponse.error);
      return generateAIResponseWithTemplates(courseId, courseCode, title, content, tags);
    }

    // Extract citations from ranked materials
    const keywords = extractKeywords(questionText);
    const citations: Citation[] = context.materials
      .slice(0, 3) // Top 3 materials
      .map(material => ({
        id: generateId('cite'),
        sourceType: mapMaterialTypeToCitationType(material.type),
        source: material.title,
        excerpt: generateExcerpt(material.content, keywords),
        relevance: material.relevanceScore,
        link: undefined,
      }));

    // Calculate confidence from material relevance
    const avgRelevance = context.materials.length > 0
      ? context.materials.reduce((sum, m) => sum + m.relevanceScore, 0) / context.materials.length
      : 50;

    const confidenceScore = Math.min(95, Math.max(40, Math.round(avgRelevance)));
    const confidenceLevel = getConfidenceLevel(confidenceScore);

    console.log('[AI] LLM response generated successfully', {
      provider: llmResponse.provider,
      model: llmResponse.model,
      tokens: llmResponse.usage.totalTokens,
      cost: llmResponse.usage.estimatedCost,
      materialsUsed: context.materials.length,
    });

    return {
      content: llmResponse.content,
      confidence: { level: confidenceLevel, score: confidenceScore },
      citations,
    };
  } catch (error) {
    console.error('[AI] LLM generation error:', error);
    console.log('[AI] Falling back to template system');
    return generateAIResponseWithTemplates(courseId, courseCode, title, content, tags);
  }
}

/**
 * Generate AI response using template system (fallback)
 *
 * Original template-based logic used as fallback when LLM is unavailable.
 */
async function generateAIResponseWithTemplates(
  courseId: string,
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): Promise<{
  content: string;
  confidence: { level: ConfidenceLevel; score: number };
  citations: Citation[];
}> {
  const questionText = `${title} ${content} ${tags.join(' ')}`;
  const keywords = extractKeywords(questionText);

  // 1. Select template based on course type
  type Template = { keywords: string[]; content: string };
  let templateList: Template[] = [];

  if (courseCode.startsWith('CS')) {
    templateList = CS_TEMPLATES;
  } else if (courseCode.startsWith('MATH')) {
    templateList = MATH_TEMPLATES;
  }

  // 2. Find best matching template
  let bestMatch: Template = GENERAL_TEMPLATE;
  let bestMatchRatio = 0;

  if (templateList.length > 0) {
    for (const template of templateList) {
      const ratio = calculateMatchRatio(keywords, template.keywords);
      if (ratio > bestMatchRatio) {
        bestMatchRatio = ratio;
        bestMatch = template;
      }
    }
  }

  // 3. Calculate confidence
  const confidenceScore = Math.round(55 + (bestMatchRatio * 40));
  const confidenceLevel = getConfidenceLevel(confidenceScore);

  // 4. Get materials from database
  let materials: CourseMaterial[] = [];
  try {
    materials = await api.getCourseMaterials(courseId);
  } catch (error) {
    console.warn('Failed to load course materials:', error);
    const citations = generateCitations(courseCode, keywords);
    return {
      content: bestMatch.content,
      confidence: { level: confidenceLevel, score: confidenceScore },
      citations,
    };
  }

  // 5. Score materials by keyword matches
  const scoredMaterials = materials.map(material => {
    const materialKeywords = material.keywords;
    const matches = keywords.filter(k => materialKeywords.includes(k)).length;
    const relevance = Math.min(95, 60 + (matches * 10));
    return { material, relevance, matches };
  });

  // 6. Sort by relevance and take top 2-3
  const topMaterials = scoredMaterials
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 2 + Math.floor(Math.random() * 2));

  // 7. Generate citations using actual materials
  const citations: Citation[] = topMaterials.map(({ material, relevance }) => ({
    id: generateId('cite'),
    sourceType: mapMaterialTypeToCitationType(material.type),
    source: material.title,
    excerpt: generateExcerpt(material.content, keywords),
    relevance,
    link: undefined,
  }));

  return {
    content: bestMatch.content,
    confidence: { level: confidenceLevel, score: confidenceScore },
    citations,
  };
}

// ============================================
// API Client
// ============================================

/**
 * Mock API client for authentication
 *
 * WARNING: This is a mock implementation for frontend-only demos.
 * Production must use:
 * - bcrypt/argon2 for password hashing
 * - JWT tokens for sessions
 * - HTTPS only
 * - HTTP-only cookies
 * - CSRF protection
 */
export const api = {
  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    await delay(300 + Math.random() * 200); // 300-500ms

    seedData(); // Ensure data is seeded

    const user = validateCredentials(input.email, input.password);

    if (!user) {
      const error: AuthError = {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
      return error;
    }

    // Create session (7 days expiry for mock)
    const session: AuthSession = {
      user: {
        ...user,
        password: "", // Never expose password in session
      },
      token: `mock-token-${generateId("tok")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAuthSession(session);

    return {
      success: true,
      session,
      message: "Login successful",
    };
  },

  /**
   * Register new user account
   */
  async signup(input: SignupInput): Promise<AuthResult> {
    await delay(400 + Math.random() * 200); // 400-600ms

    seedData(); // Ensure data is seeded

    // Check if user exists
    const existingUser = getUserByEmail(input.email);
    if (existingUser) {
      const error: AuthError = {
        success: false,
        error: "Email already registered",
        code: "USER_EXISTS",
      };
      return error;
    }

    // Validate passwords match
    if (input.password !== input.confirmPassword) {
      const error: AuthError = {
        success: false,
        error: "Passwords do not match",
        code: "VALIDATION_ERROR",
      };
      return error;
    }

    // Create new user
    const newUser: User = {
      id: generateId("user"),
      name: input.name,
      email: input.email,
      password: input.password, // Mock only - would hash in production
      role: input.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`,
      createdAt: new Date().toISOString(),
    };

    createUser(newUser);

    // Create session
    const session: AuthSession = {
      user: {
        ...newUser,
        password: "", // Never expose password
      },
      token: `mock-token-${generateId("tok")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAuthSession(session);

    return {
      success: true,
      session,
      message: "Account created successfully",
    };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await delay(50 + Math.random() * 50); // 50-100ms
    clearAuthSession();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    await delay(200 + Math.random() * 200); // 200-400ms

    const session = getAuthSession();
    if (!session) return null;

    return session.user;
  },

  /**
   * Restore session from localStorage
   */
  async restoreSession(): Promise<AuthSession | null> {
    await delay(100 + Math.random() * 100); // 100-200ms

    return getAuthSession();
  },

  // ============================================
  // Course API Methods
  // ============================================

  /**
   * Get all active courses
   */
  async getAllCourses(): Promise<Course[]> {
    await delay();
    seedData();

    const courses = getCourses();
    return courses
      .filter((c) => c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  /**
   * Get courses for a specific user
   */
  async getUserCourses(userId: string): Promise<Course[]> {
    await delay();
    seedData();

    const enrollments = getEnrollments(userId);
    const allCourses = getCourses();

    const courseIds = enrollments.map((e) => e.courseId);
    return allCourses
      .filter((c) => courseIds.includes(c.id) && c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<Course | null> {
    await delay();
    seedData();

    return getCourseById(courseId);
  },

  /**
   * Get threads for a course with embedded AI answers
   *
   * Returns ThreadWithAIAnswer[] where threads with AI answers have
   * the aiAnswer property populated. Threads without AI answers have
   * aiAnswer: undefined.
   */
  async getCourseThreads(courseId: string): Promise<ThreadWithAIAnswer[]> {
    await delay();
    seedData();

    const threads = getThreadsByCourse(courseId);

    // Enrich threads with AI answer data
    const enrichedThreads = threads.map((thread): ThreadWithAIAnswer => {
      // Check if thread has an AI answer
      if (thread.hasAIAnswer && thread.aiAnswerId) {
        const aiAnswer = getAIAnswerById(thread.aiAnswerId);
        if (aiAnswer) {
          // Return thread with embedded AI answer
          return { ...thread, aiAnswer };
        }
      }
      // Return thread without aiAnswer (will be undefined)
      return thread as ThreadWithAIAnswer;
    });

    return enrichedThreads.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /**
   * Get course metrics
   */
  async getCourseMetrics(courseId: string): Promise<CourseMetrics> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const threads = getThreadsByCourse(courseId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get unique student authors
    const users = getUsers();
    const studentAuthors = new Set(
      threads
        .map((t) => t.authorId)
        .filter((authorId) => {
          const user = users.find((u) => u.id === authorId);
          return user?.role === "student";
        })
    );

    const recentThreads = threads.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    );

    return {
      threadCount: threads.length,
      unansweredCount: threads.filter((t) => t.status === "open").length,
      answeredCount: threads.filter((t) => t.status === "answered").length,
      resolvedCount: threads.filter((t) => t.status === "resolved").length,
      activeStudents: studentAuthors.size,
      recentActivity: recentThreads.length,
    };
  },

  /**
   * Get AI-generated course insights
   */
  async getCourseInsights(courseId: string): Promise<CourseInsight> {
    await delay(600 + Math.random() * 200); // 600-800ms (AI simulation)
    seedData();

    const threads = getThreadsByCourse(courseId);
    const activeThreads = threads.filter(
      (t) => t.status === "open" || t.status === "answered"
    ).length;

    // Get top questions by view count
    const topQuestions = threads
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((t) => t.title);

    // Get trending topics from tags
    const allTags = threads.flatMap((t) => t.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendingTopics = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    // Generate summary based on activity
    const unansweredCount = threads.filter((t) => t.status === "open").length;
    const summary =
      unansweredCount > 5
        ? `High activity with ${unansweredCount} open questions. Students are actively engaging with ${trendingTopics[0] || "course"} topics.`
        : `Moderate activity. Most questions are answered. Focus areas: ${trendingTopics.slice(0, 2).join(", ") || "general concepts"}.`;

    return {
      id: `insight-${courseId}-${Date.now()}`,
      courseId,
      summary,
      activeThreads,
      topQuestions,
      trendingTopics,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Get all course materials for a course
   *
   * Returns all educational content (lectures, slides, assignments, readings, etc.)
   * for the specified course. Materials include full content for AI context.
   */
  async getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
    await delay(); // 200-500ms
    seedData();

    // Get materials from store
    const materials = getCourseMaterialsByCourse(courseId);

    // Sort by type order, then title
    const typeOrder: CourseMaterial['type'][] = ["lecture", "slide", "assignment", "reading", "lab", "textbook"];
    return materials.sort((a, b) => {
      const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      if (typeComparison !== 0) return typeComparison;
      return a.title.localeCompare(b.title);
    });
  },

  /**
   * Search course materials by keywords
   *
   * Performs keyword-based search across material titles and content.
   * Returns results scored by relevance with matched keywords highlighted.
   */
  async searchCourseMaterials(
    input: SearchCourseMaterialsInput
  ): Promise<CourseMaterialSearchResult[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const { courseId, query, types, limit = 20, minRelevance = 20 } = input;

    // Validate query length
    if (query.trim().length < 3) {
      throw new Error("Search query must be at least 3 characters");
    }

    // Extract keywords from query
    const queryKeywords = extractKeywords(query);

    // Get all materials for course
    const allMaterials = await this.getCourseMaterials(courseId);

    // Filter by type if specified
    const materialsToSearch = types && types.length > 0
      ? allMaterials.filter(m => types.includes(m.type))
      : allMaterials;

    // Score each material
    const results: CourseMaterialSearchResult[] = materialsToSearch.map(material => {
      // Combine title and content for matching
      const materialText = `${material.title} ${material.content}`.toLowerCase();
      const materialKeywords = material.keywords; // Pre-computed keywords

      // Count matches
      const matchedKeywords = queryKeywords.filter(k =>
        materialKeywords.includes(k) || materialText.includes(k)
      );

      // Calculate relevance score
      const relevanceScore = queryKeywords.length > 0
        ? Math.round((matchedKeywords.length / queryKeywords.length) * 100)
        : 0;

      // Generate snippet (first 150 chars with matched keywords)
      const snippet = generateSnippet(material.content, matchedKeywords, 150);

      return {
        material,
        relevanceScore,
        matchedKeywords,
        snippet,
      };
    });

    // Filter by minimum relevance and sort
    return results
      .filter(r => r.relevanceScore >= minRelevance)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },

  // ============================================
  // Notification API Methods
  // ============================================

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    courseId?: string
  ): Promise<Notification[]> {
    await delay(200 + Math.random() * 200); // 200-400ms
    seedData();

    const notifications = getNotifications(userId, courseId);
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await delay(50); // Quick action
    seedData();

    markNotificationRead(notificationId);
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(
    userId: string,
    courseId?: string
  ): Promise<void> {
    await delay(100);
    seedData();

    markAllNotificationsRead(userId, courseId);
  },

  // ============================================
  // Thread API Methods
  // ============================================

  /**
   * Get thread by ID with posts AND AI ANSWER
   */
  async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[]; aiAnswer: AIAnswer | null } | null> {
    await delay();
    seedData();

    const thread = getThreadById(threadId);
    if (!thread) return null;

    const posts = getPostsByThread(threadId);
    const aiAnswer = thread.aiAnswerId ? getAIAnswerById(thread.aiAnswerId) : null;

    // Increment view count
    updateThread(threadId, { views: thread.views + 1 });

    return {
      thread: { ...thread, views: thread.views + 1 },
      posts: posts.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      aiAnswer, // NEW: Include AI answer
    };
  },

  /**
   * Create new thread with auto-generated AI answer
   * Returns both thread and aiAnswer for React Query cache pre-population
   */
  async createThread(input: CreateThreadInput, authorId: string): Promise<{ thread: Thread; aiAnswer: AIAnswer | null }> {
    await delay(400 + Math.random() * 200); // 400-600ms
    seedData();

    const newThread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      courseId: input.courseId,
      title: input.title,
      content: input.content,
      authorId,
      status: "open",
      tags: input.tags || [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addThread(newThread);

    // Auto-generate AI answer for the new thread
    let aiAnswer: AIAnswer | null = null;
    try {
      aiAnswer = await this.generateAIAnswer({
        threadId: newThread.id,
        courseId: input.courseId,
        title: input.title,
        content: input.content,
        tags: input.tags,
      });

      // Fetch updated thread with AI answer flags
      const updatedThread = getThreadById(newThread.id);
      return { thread: updatedThread || newThread, aiAnswer };
    } catch (error) {
      console.error("Failed to generate AI answer:", error);
      // Return thread without AI answer if generation fails (graceful degradation)
      return { thread: newThread, aiAnswer: null };
    }
  },

  /**
   * Create new post/reply
   */
  async createPost(input: CreatePostInput, authorId: string): Promise<Post> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      threadId: input.threadId,
      authorId,
      content: input.content,
      endorsed: false,
      flagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addPost(newPost);

    // Update thread's updatedAt timestamp
    updateThread(input.threadId, { updatedAt: new Date().toISOString() });

    return newPost;
  },

  // ============================================
  // Dashboard API Methods
  // ============================================

  /**
   * Get student dashboard data (aggregated)
   */
  async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
    await delay(200 + Math.random() * 200); // 200-400ms (faster for landing page)
    seedData();

    const enrollments = getEnrollments(userId);
    const allCourses = getCourses();
    const allThreads = getThreads();
    const allPosts = getPosts();
    const notifications = getNotifications(userId);
    const users = getUsers();

    // Get enrolled courses with recent activity
    const enrolledCourses: CourseWithActivity[] = enrollments.map((enrollment) => {
      const course = allCourses.find((c) => c.id === enrollment.courseId);
      if (!course) return null;

      const courseThreads = allThreads.filter((t) => t.courseId === course.id);
      const recentThreads = courseThreads
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      const unreadCount = notifications.filter(
        (n) => n.courseId === course.id && !n.read
      ).length;

      return {
        ...course,
        recentThreads,
        unreadCount,
      };
    }).filter((c): c is CourseWithActivity => c !== null);

    // Generate recent activity (last 10 items)
    const userThreads = allThreads.filter((t) => t.authorId === userId);
    const userPosts = allPosts.filter((p) => p.authorId === userId);

    const activities: ActivityItem[] = [];

    // Add thread creations
    userThreads.forEach((thread) => {
      const course = allCourses.find((c) => c.id === thread.courseId);
      const author = users.find((u) => u.id === thread.authorId);
      if (course && author) {
        activities.push({
          id: `activity-${thread.id}`,
          type: 'thread_created',
          courseId: course.id,
          courseName: course.name,
          threadId: thread.id,
          threadTitle: thread.title,
          authorId: author.id,
          authorName: author.name,
          timestamp: thread.createdAt,
          summary: `You created a thread: "${thread.title}"`,
        });
      }
    });

    // Add post creations
    userPosts.forEach((post) => {
      const thread = allThreads.find((t) => t.id === post.threadId);
      const course = thread ? allCourses.find((c) => c.id === thread.courseId) : null;
      const author = users.find((u) => u.id === post.authorId);
      if (thread && course && author) {
        activities.push({
          id: `activity-${post.id}`,
          type: 'post_created',
          courseId: course.id,
          courseName: course.name,
          threadId: thread.id,
          threadTitle: thread.title,
          authorId: author.id,
          authorName: author.name,
          timestamp: post.createdAt,
          summary: `You replied to "${thread.title}"`,
        });
      }
    });

    // Add endorsed posts
    userPosts.filter((p) => p.endorsed).forEach((post) => {
      const thread = allThreads.find((t) => t.id === post.threadId);
      const course = thread ? allCourses.find((c) => c.id === thread.courseId) : null;
      const author = users.find((u) => u.id === post.authorId);
      if (thread && course && author) {
        activities.push({
          id: `activity-endorsed-${post.id}`,
          type: 'post_endorsed',
          courseId: course.id,
          courseName: course.name,
          threadId: thread.id,
          threadTitle: thread.title,
          authorId: author.id,
          authorName: author.name,
          timestamp: post.updatedAt,
          summary: `Your reply to "${thread.title}" was endorsed`,
        });
      }
    });

    // Sort by timestamp and take last 10
    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Calculate current week stats
    const currentWeek = getCurrentWeekRange();
    const previousWeek = getPreviousWeekRange();

    const currentCourses = enrolledCourses.length;
    const previousCourses = enrolledCourses.length; // Courses don't change weekly in mock

    const currentThreads = countInDateRange(userThreads, currentWeek);
    const previousThreads = countInDateRange(userThreads, previousWeek);

    const currentPosts = countInDateRange(userPosts, currentWeek);
    const previousPosts = countInDateRange(userPosts, previousWeek);

    const currentEndorsed = userPosts.filter(
      (p) => p.endorsed && new Date(p.createdAt) >= currentWeek.start
    ).length;
    const previousEndorsed = userPosts.filter(
      (p) => p.endorsed && new Date(p.createdAt) >= previousWeek.start && new Date(p.createdAt) < currentWeek.start
    ).length;

    // Generate sparklines
    const threadSparkline = generateSparkline(`student-${userId}-threads`, 7, userThreads.length / 7);
    const postSparkline = generateSparkline(`student-${userId}-posts`, 7, userPosts.length / 7);
    const courseSparkline = generateSparkline(`student-${userId}-courses`, 7, enrolledCourses.length / 7);
    const endorsedSparkline = generateSparkline(`student-${userId}-endorsed`, 7, userPosts.filter((p) => p.endorsed).length / 7);

    // Create stats with trends
    const stats = {
      totalCourses: createStatWithTrend(currentCourses, previousCourses, "Courses", courseSparkline),
      totalThreads: createStatWithTrend(currentThreads, previousThreads, "Threads", threadSparkline),
      totalPosts: createStatWithTrend(currentPosts, previousPosts, "Replies", postSparkline),
      endorsedPosts: createStatWithTrend(currentEndorsed, previousEndorsed, "Endorsed", endorsedSparkline),
    };

    // Create student goals
    const goals = [
      createGoal(
        "weekly-participation",
        "Weekly Participation",
        "Post in 2 threads per week",
        currentPosts,
        2,
        "weekly",
        "participation"
      ),
      createGoal(
        "weekly-endorsements",
        "Get Endorsed",
        "Receive 1 endorsement per week",
        currentEndorsed,
        1,
        "weekly",
        "quality"
      ),
      createGoal(
        "weekly-questions",
        "Ask Questions",
        "Ask 1 question per week",
        currentThreads,
        1,
        "weekly",
        "engagement"
      ),
    ];

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Calculate Quokka Points
    const quokkaPoints = calculateQuokkaPoints(userId, userThreads, userPosts);

    // Calculate Assignment Q&A Opportunities
    const assignments = getAssignments();
    const assignmentQA = calculateAllAssignmentQA(
      assignments,
      allThreads,
      allPosts,
      users,
      userId,
      enrolledCourses.map(c => ({ id: c.id, name: c.name }))
    );

    return {
      enrolledCourses,
      recentActivity,
      notifications: notifications.slice(0, 5), // Top 5 notifications
      unreadCount,
      stats,
      goals,
      quokkaPoints,
      assignmentQA,
    };
  },

  /**
   * Get instructor dashboard data (aggregated)
   */
  async getInstructorDashboard(userId: string): Promise<InstructorDashboardData> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const allCourses = getCourses();
    const allThreads = getThreads();
    const users = getUsers();

    // Get courses where user is instructor
    const managedCourses: CourseWithMetrics[] = allCourses
      .filter((course) => course.instructorIds.includes(userId))
      .map((course) => {
        const courseThreads = allThreads.filter((t) => t.courseId === course.id);

        // Calculate metrics
        const metrics: CourseMetrics = {
          threadCount: courseThreads.length,
          unansweredCount: courseThreads.filter((t) => t.status === 'open').length,
          answeredCount: courseThreads.filter((t) => t.status === 'answered').length,
          resolvedCount: courseThreads.filter((t) => t.status === 'resolved').length,
          activeStudents: new Set(
            courseThreads.map((t) => t.authorId)
          ).size,
          recentActivity: courseThreads.filter(
            (t) => new Date(t.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length,
        };

        return {
          ...course,
          metrics,
        };
      });

    // Get unanswered threads across all managed courses
    const managedCourseIds = managedCourses.map((c) => c.id);
    const unansweredQueue = allThreads
      .filter((t) => managedCourseIds.includes(t.courseId) && t.status === 'open')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // Top 10 unanswered

    // Generate recent activity
    const activities: ActivityItem[] = [];

    managedCourseIds.forEach((courseId) => {
      const course = allCourses.find((c) => c.id === courseId);
      if (!course) return;

      const courseThreads = allThreads
        .filter((t) => t.courseId === courseId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      courseThreads.forEach((thread) => {
        const author = users.find((u) => u.id === thread.authorId);
        if (author) {
          activities.push({
            id: `activity-${thread.id}`,
            type: 'thread_created',
            courseId: course.id,
            courseName: course.name,
            threadId: thread.id,
            threadTitle: thread.title,
            authorId: author.id,
            authorName: author.name,
            timestamp: thread.createdAt,
            summary: `New thread in ${course.code}: "${thread.title}"`,
          });
        }
      });
    });

    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Mock insights (would be AI-generated in production)
    const insights: CourseInsight[] = managedCourses.map((course) => ({
      id: `insight-${course.id}`,
      courseId: course.id,
      summary: `${course.code} has ${course.metrics.activeStudents} active students with ${course.metrics.recentActivity} threads this week.`,
      activeThreads: course.metrics.threadCount,
      topQuestions: allThreads
        .filter((t) => t.courseId === course.id)
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map((t) => t.title),
      trendingTopics: [],
      generatedAt: new Date().toISOString(),
    }));

    // Calculate current and previous week stats
    const currentWeek = getCurrentWeekRange();
    const previousWeek = getPreviousWeekRange();

    const allManagedThreads = allThreads.filter((t) => managedCourseIds.includes(t.courseId));

    const currentCourses = managedCourses.length;
    const previousCourses = managedCourses.length; // Courses don't change weekly

    const currentThreads = countInDateRange(allManagedThreads, currentWeek);
    const previousThreads = countInDateRange(allManagedThreads, previousWeek);

    const currentUnanswered = allManagedThreads.filter(
      (t) => t.status === 'open' && new Date(t.createdAt) >= currentWeek.start
    ).length;
    const previousUnanswered = allManagedThreads.filter(
      (t) => t.status === 'open' && new Date(t.createdAt) >= previousWeek.start && new Date(t.createdAt) < currentWeek.start
    ).length;

    const currentStudents = new Set(
      allManagedThreads
        .filter((t) => new Date(t.createdAt) >= currentWeek.start)
        .map((t) => t.authorId)
    ).size;
    const previousStudents = new Set(
      allManagedThreads
        .filter((t) => new Date(t.createdAt) >= previousWeek.start && new Date(t.createdAt) < currentWeek.start)
        .map((t) => t.authorId)
    ).size;

    // Calculate AI coverage (mock)
    const avgAICoverage = managedCourseIds.reduce((sum, id) => sum + calculateAICoverage(id), 0) / managedCourseIds.length;
    const currentAICoverage = Math.round(avgAICoverage);
    const previousAICoverage = Math.round(avgAICoverage - 2); // Mock: slight improvement over time

    // Generate sparklines
    const threadSparkline = generateSparkline(`instructor-threads`, 7, allManagedThreads.length / 7);
    const unansweredSparkline = generateSparkline(`instructor-unanswered`, 7, unansweredQueue.length / 7);

    // Create stats with trends
    const stats = {
      totalCourses: createStatWithTrend(currentCourses, previousCourses, "Courses"),
      totalThreads: createStatWithTrend(currentThreads, previousThreads, "Threads", threadSparkline),
      unansweredThreads: createStatWithTrend(currentUnanswered, previousUnanswered, "Unanswered", unansweredSparkline),
      activeStudents: createStatWithTrend(currentStudents, previousStudents, "Active Students"),
      aiCoverage: createStatWithTrend(currentAICoverage, previousAICoverage, "AI Coverage"),
    };

    // Create instructor goals
    const goals = [
      createGoal(
        "response-time",
        "Response Time",
        "Respond to 80% of threads within 24h",
        75, // Mock current
        80,
        "weekly",
        "response-time"
      ),
      createGoal(
        "ai-coverage",
        "AI Coverage",
        "Maintain 70%+ AI coverage",
        currentAICoverage,
        70,
        "weekly",
        "engagement"
      ),
      createGoal(
        "student-engagement",
        "Student Engagement",
        "60%+ students actively participating",
        55, // Mock current
        60,
        "weekly",
        "engagement"
      ),
    ];

    return {
      managedCourses,
      unansweredQueue,
      recentActivity,
      insights,
      stats,
      goals,
    };
  },

  // ============================================
  // AI Answer API Methods
  // ============================================

  /**
   * Generate AI answer for a thread
   */
  async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
    await delay(800 + Math.random() * 400); // 800-1200ms
    seedData();

    const thread = getThreadById(input.threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${input.threadId}`);
    }

    const course = getCourseById(input.courseId);
    if (!course) {
      throw new Error(`Course not found: ${input.courseId}`);
    }

    // Generate AI response using enhanced helper with course materials
    const { content, confidence, citations } = await generateAIResponseWithMaterials(
      input.courseId, // NEW: Pass courseId for material lookup
      course.code,
      input.title,
      input.content,
      input.tags || []
    );

    const aiAnswer: AIAnswer = {
      id: generateId("ai"),
      threadId: input.threadId,
      courseId: input.courseId,
      content,
      confidenceLevel: confidence.level,
      confidenceScore: confidence.score,
      citations,
      studentEndorsements: 0,
      instructorEndorsements: 0,
      totalEndorsements: 0,
      endorsedBy: [],
      instructorEndorsed: false,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addAIAnswer(aiAnswer);
    updateThread(input.threadId, {
      hasAIAnswer: true,
      aiAnswerId: aiAnswer.id,
      updatedAt: new Date().toISOString(),
    });

    return aiAnswer;
  },

  /**
   * Generate AI answer preview (ask page only)
   * Does NOT save to database
   */
  async generateAIPreview(input: GenerateAIAnswerInput): Promise<AIAnswer> {
    await delay(800 + Math.random() * 400); // 800-1200ms (AI simulation)
    seedData();

    const course = getCourseById(input.courseId);
    if (!course) {
      throw new Error(`Course not found: ${input.courseId}`);
    }

    // Generate AI response using enhanced helper with course materials
    const { content, confidence, citations } = await generateAIResponseWithMaterials(
      input.courseId, // NEW: Pass courseId for material lookup
      course.code,
      input.title,
      input.content,
      input.tags || []
    );

    const preview: AIAnswer = {
      id: `preview-${Date.now()}`,
      threadId: input.threadId,
      courseId: input.courseId,
      content,
      confidenceLevel: confidence.level,
      confidenceScore: confidence.score,
      citations,
      studentEndorsements: 0,
      instructorEndorsements: 0,
      totalEndorsements: 0,
      endorsedBy: [],
      instructorEndorsed: false,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return preview;
  },

  /**
   * Get AI answer for a thread
   */
  async getAIAnswer(threadId: string): Promise<AIAnswer | null> {
    await delay(200 + Math.random() * 200); // 200-400ms
    seedData();

    const thread = getThreadById(threadId);
    if (!thread || !thread.hasAIAnswer || !thread.aiAnswerId) {
      return null;
    }

    return getAIAnswerByThread(threadId);
  },

  /**
   * Endorse an AI answer
   */
  async endorseAIAnswer(input: EndorseAIAnswerInput): Promise<AIAnswer> {
    await delay(100); // Quick action
    seedData();

    const aiAnswer = getAIAnswerById(input.aiAnswerId);
    if (!aiAnswer) {
      throw new Error(`AI answer not found: ${input.aiAnswerId}`);
    }

    // Check if user already endorsed
    if (aiAnswer.endorsedBy.includes(input.userId)) {
      throw new Error("User has already endorsed this answer");
    }

    // Calculate endorsement weight (instructor = 3x)
    const weight = input.isInstructor ? 3 : 1;

    // Update endorsement counts
    const updates: Partial<AIAnswer> = {
      endorsedBy: [...aiAnswer.endorsedBy, input.userId],
      totalEndorsements: aiAnswer.totalEndorsements + weight,
      updatedAt: new Date().toISOString(),
    };

    if (input.isInstructor) {
      updates.instructorEndorsements = aiAnswer.instructorEndorsements + 1;
      updates.instructorEndorsed = true;
    } else {
      updates.studentEndorsements = aiAnswer.studentEndorsements + 1;
    }

    updateAIAnswer(input.aiAnswerId, updates);

    // Return updated answer
    const updatedAnswer = getAIAnswerById(input.aiAnswerId);
    if (!updatedAnswer) {
      throw new Error("Failed to retrieve updated AI answer");
    }

    return updatedAnswer;
  },

  // ============================================
  // Instructor-Specific API Methods
  // ============================================

  /**
   * Get frequently asked questions (FAQ clusters)
   * Groups similar threads by keyword matching
   */
  async getFrequentlyAskedQuestions(courseId: string): Promise<FrequentlyAskedQuestion[]> {
    await delay(400 + Math.random() * 200); // 400-600ms (expensive O(n²) operation)
    seedData();

    const threads = getThreadsByCourse(courseId);
    const aiAnswers = getAIAnswers();

    // Group threads by similarity (keyword matching)
    const clusters: Map<string, Thread[]> = new Map();
    const processed = new Set<string>();

    threads.forEach((thread, idx) => {
      if (processed.has(thread.id)) return;

      const threadKeywords = extractKeywords(`${thread.title} ${thread.content} ${thread.tags?.join(' ') || ''}`);
      const cluster: Thread[] = [thread];
      processed.add(thread.id);

      // Find similar threads
      threads.slice(idx + 1).forEach((otherThread) => {
        if (processed.has(otherThread.id)) return;

        const otherKeywords = extractKeywords(`${otherThread.title} ${otherThread.content} ${otherThread.tags?.join(' ') || ''}`);
        const similarity = calculateMatchRatio(threadKeywords, otherKeywords);

        if (similarity >= 0.4) { // 40% similarity threshold
          cluster.push(otherThread);
          processed.add(otherThread.id);
        }
      });

      // Only create FAQ if 2+ similar threads
      if (cluster.length >= 2) {
        clusters.set(thread.id, cluster);
      }
    });

    // Convert clusters to FrequentlyAskedQuestion objects
    const faqs: FrequentlyAskedQuestion[] = Array.from(clusters.entries()).map(([representativeId, clusterThreads]) => {
      const representative = clusterThreads[0];

      // Extract common keywords
      const allKeywords = clusterThreads.map(t =>
        extractKeywords(`${t.title} ${t.content} ${t.tags?.join(' ') || ''}`)
      );
      const keywordCounts = allKeywords.flat().reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonKeywords = Object.entries(keywordCounts)
        .filter(([, count]) => count >= clusterThreads.length * 0.5) // Present in 50%+ of threads
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([keyword]) => keyword);

      // Calculate average AI confidence
      const confidenceScores = clusterThreads
        .map(t => {
          if (t.aiAnswerId) {
            const aiAnswer = aiAnswers.find((a: AIAnswer) => a.id === t.aiAnswerId);
            return aiAnswer?.confidenceScore || 0;
          }
          return 0;
        })
        .filter(score => score > 0);

      const avgConfidence = confidenceScores.length > 0
        ? Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
        : 0;

      // Check for instructor endorsement
      const hasInstructorEndorsement = clusterThreads.some(t => {
        if (t.aiAnswerId) {
          const aiAnswer = aiAnswers.find((a: AIAnswer) => a.id === t.aiAnswerId);
          return aiAnswer?.instructorEndorsed || false;
        }
        return false;
      });

      return {
        id: generateId('faq'),
        title: representative.title,
        threads: clusterThreads,
        commonKeywords,
        frequency: clusterThreads.length,
        avgConfidence,
        hasInstructorEndorsement,
      };
    });

    // Sort by frequency (most common first)
    return faqs.sort((a, b) => b.frequency - a.frequency);
  },

  /**
   * Get trending topics with frequency analysis
   */
  async getTrendingTopics(courseId: string, timeRange: 'week' | 'month' | 'quarter' = 'week'): Promise<TrendingTopic[]> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const threads = getThreadsByCourse(courseId);
    const now = new Date();

    // Calculate time ranges
    const rangeMs = timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000
                  : timeRange === 'month' ? 30 * 24 * 60 * 60 * 1000
                  : 90 * 24 * 60 * 60 * 1000;

    const currentStart = new Date(now.getTime() - rangeMs);
    const previousStart = new Date(now.getTime() - (rangeMs * 2));

    // Get threads in current and previous periods
    const currentThreads = threads.filter(t => new Date(t.createdAt) >= currentStart);
    const previousThreads = threads.filter(t =>
      new Date(t.createdAt) >= previousStart && new Date(t.createdAt) < currentStart
    );

    // Count tag frequencies
    const currentTagCounts: Record<string, { count: number; threadIds: string[] }> = {};
    currentThreads.forEach(thread => {
      thread.tags?.forEach(tag => {
        if (!currentTagCounts[tag]) {
          currentTagCounts[tag] = { count: 0, threadIds: [] };
        }
        currentTagCounts[tag].count++;
        if (currentTagCounts[tag].threadIds.length < 3) {
          currentTagCounts[tag].threadIds.push(thread.id);
        }
      });
    });

    const previousTagCounts: Record<string, number> = {};
    previousThreads.forEach(thread => {
      thread.tags?.forEach(tag => {
        previousTagCounts[tag] = (previousTagCounts[tag] || 0) + 1;
      });
    });

    // Calculate trends
    const topics: TrendingTopic[] = Object.entries(currentTagCounts).map(([topic, data]) => {
      const currentCount = data.count;
      const previousCount = previousTagCounts[topic] || 0;

      // Calculate percentage growth
      const growth = previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : currentCount > 0 ? 100 : 0;

      // Determine trend direction
      let trend: TrendDirection = 'stable';
      if (growth > 20) trend = 'rising';
      else if (growth < -20) trend = 'falling';

      return {
        topic,
        count: currentCount,
        threadIds: data.threadIds,
        recentGrowth: Math.round(growth),
        trend,
        timeRange: {
          start: currentStart.toISOString(),
          end: now.toISOString(),
        },
      };
    });

    // Sort by count (most popular first)
    return topics.sort((a, b) => b.count - a.count).slice(0, 10);
  },

  /**
   * Get instructor insights with priority ranking
   */
  async getInstructorInsights(userId: string): Promise<InstructorInsight[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const allCourses = getCourses();
    const allThreads = getThreads();
    const allPosts = getPosts();
    const aiAnswers = getAIAnswers();

    // Get courses managed by this instructor
    const managedCourseIds = allCourses
      .filter(c => c.instructorIds.includes(userId))
      .map(c => c.id);

    // Get threads from managed courses
    const managedThreads = allThreads.filter(t => managedCourseIds.includes(t.courseId));

    // Calculate priority for each thread
    const insights: InstructorInsight[] = managedThreads.map(thread => {
      const posts = allPosts.filter(p => p.threadId === thread.id);
      const aiAnswer = thread.aiAnswerId ? aiAnswers.find((a: AIAnswer) => a.id === thread.aiAnswerId) : undefined;

      // Calculate time open (in hours)
      const createdAt = new Date(thread.createdAt);
      const now = new Date();
      const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      // Priority score calculation (0-100)
      // Formula: (views * 0.3) + (hoursOpen * 0.4) + reviewBoost + unansweredBoost
      let priorityScore = 0;
      const reasonFlags: string[] = [];

      // Views weight (0-30 points)
      priorityScore += Math.min(30, thread.views * 0.5);
      if (thread.views > 50) reasonFlags.push('high_views');

      // Time open weight (0-40 points)
      priorityScore += Math.min(40, hoursOpen * 0.5);
      if (hoursOpen > 48) reasonFlags.push('unanswered_48h');
      else if (hoursOpen > 24) reasonFlags.push('unanswered_24h');

      // AI review needed boost (10 points)
      if (aiAnswer && aiAnswer.confidenceLevel === 'low') {
        priorityScore += 10;
        reasonFlags.push('low_ai_confidence');
      }

      // Unanswered boost (20 points)
      if (thread.status === 'open') {
        priorityScore += 20;
        reasonFlags.push('unanswered');
      }

      // Determine urgency level
      let urgency: UrgencyLevel = 'low';
      if (priorityScore >= 80) urgency = 'critical';
      else if (priorityScore >= 60) urgency = 'high';
      else if (priorityScore >= 40) urgency = 'medium';

      return {
        thread,
        priorityScore: Math.min(100, Math.round(priorityScore)),
        urgency,
        engagement: {
          views: thread.views,
          replies: posts.length,
          lastActivity: thread.updatedAt,
        },
        reasonFlags,
        aiAnswer,
      };
    });

    // Sort by priority score (highest first)
    return insights
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 20); // Return top 20
  },

  /**
   * Search questions with natural language query
   */
  async searchQuestions(input: SearchQuestionsInput): Promise<QuestionSearchResult[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const { courseId, query, limit = 20 } = input;

    // Minimum 3 characters
    if (query.trim().length < 3) {
      return [];
    }

    const threads = getThreadsByCourse(courseId);
    const queryKeywords = extractKeywords(query);

    // Search and score each thread
    const results: QuestionSearchResult[] = threads.map(thread => {
      const threadText = `${thread.title} ${thread.content} ${thread.tags?.join(' ') || ''}`;
      const threadKeywords = extractKeywords(threadText);

      // Calculate relevance score
      const matchedKeywords = queryKeywords.filter(k => threadKeywords.includes(k));
      const relevanceScore = matchedKeywords.length > 0
        ? Math.round((matchedKeywords.length / queryKeywords.length) * 100)
        : 0;

      return {
        thread,
        relevanceScore,
        matchedKeywords,
      };
    });

    // Filter by minimum relevance (20%) and sort
    return results
      .filter(r => r.relevanceScore >= 20)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },

  /**
   * Bulk endorse AI answers
   */
  async bulkEndorseAIAnswers(input: BulkEndorseInput): Promise<BulkActionResult> {
    await delay(200 + Math.random() * 100); // 200-300ms (faster than sequential)
    seedData();

    const { aiAnswerIds, userId } = input;
    const errors: Array<{ itemId: string; reason: string; code?: string }> = [];
    let successCount = 0;

    // Validate all AI answers exist and user hasn't endorsed
    for (const aiAnswerId of aiAnswerIds) {
      const aiAnswer = getAIAnswerById(aiAnswerId);

      if (!aiAnswer) {
        errors.push({
          itemId: aiAnswerId,
          reason: 'AI answer not found',
          code: 'NOT_FOUND',
        });
      } else if (aiAnswer.endorsedBy.includes(userId)) {
        errors.push({
          itemId: aiAnswerId,
          reason: 'Already endorsed by this user',
          code: 'ALREADY_ENDORSED',
        });
      }
    }

    // All-or-nothing: if any validation failed, throw error
    if (errors.length > 0) {
      return {
        actionType: 'endorse',
        successCount: 0,
        failedCount: errors.length,
        errors,
        timestamp: new Date().toISOString(),
      };
    }

    // Perform bulk endorsement
    for (const aiAnswerId of aiAnswerIds) {
      try {
        await this.endorseAIAnswer({
          aiAnswerId,
          userId,
          isInstructor: true, // Bulk operations are instructor-only
        });
        successCount++;
      } catch (error) {
        errors.push({
          itemId: aiAnswerId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      actionType: 'endorse',
      successCount,
      failedCount: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Get response templates for a user
   */
  async getResponseTemplates(userId: string): Promise<ResponseTemplate[]> {
    await delay(100 + Math.random() * 50); // 100-150ms (fast)
    seedData();

    const templates = getResponseTemplatesByUser(userId);

    // Sort by usage count (most used first)
    return templates.sort((a, b) => b.usageCount - a.usageCount);
  },

  /**
   * Save new response template
   */
  async saveResponseTemplate(input: CreateResponseTemplateInput, userId: string): Promise<ResponseTemplate> {
    await delay(100 + Math.random() * 50); // 100-150ms
    seedData();

    const newTemplate: ResponseTemplate = {
      id: generateId('template'),
      userId,
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    addResponseTemplate(newTemplate);

    return newTemplate;
  },

  /**
   * Delete response template
   */
  async deleteResponseTemplate(templateId: string): Promise<void> {
    await delay(50); // Quick action
    seedData();

    deleteResponseTemplateFromStore(templateId);
  },

  // ============================================
  // AI Conversation API Methods
  // ============================================

  /**
   * Create new AI conversation
   */
  async createConversation(input: CreateConversationInput): Promise<AIConversation> {
    await delay(100 + Math.random() * 50); // 100-150ms
    seedData();

    const newConversation: AIConversation = {
      id: generateId('conv'),
      userId: input.userId,
      courseId: input.courseId || null,
      title: input.title || 'New Conversation',
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addConversation(newConversation);

    return newConversation;
  },

  /**
   * Get all conversations for a user
   */
  async getAIConversations(userId: string): Promise<AIConversation[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    return getUserConversations(userId);
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string): Promise<AIMessage[]> {
    await delay(100 + Math.random() * 100); // 100-200ms
    seedData();

    return getConversationMessages(conversationId);
  },

  /**
   * Send message in conversation (with LLM response)
   */
  async sendMessage(input: SendMessageInput): Promise<{ userMessage: AIMessage; aiMessage: AIMessage }> {
    await delay(800 + Math.random() * 400); // 800-1200ms (LLM latency)
    seedData();

    // Validate conversation exists
    const conversation = getConversationById(input.conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${input.conversationId}`);
    }

    // Create user message
    const userMessage: AIMessage = {
      id: generateId('msg'),
      conversationId: input.conversationId,
      role: 'user',
      content: input.content,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);

    // Generate AI response
    let aiContent = '';
    try {
      // If conversation has a course, use course context
      if (conversation.courseId) {
        const course = await this.getCourse(conversation.courseId);
        if (course) {
          const { content } = await generateAIResponseWithMaterials(
            conversation.courseId,
            course.code,
            input.content,
            '',
            []
          );
          aiContent = content;
        }
      } else {
        // General conversation without course context
        const { content } = generateAIResponse('GENERAL', input.content, '', []);
        aiContent = content;
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      aiContent = "I apologize, but I'm having trouble generating a response right now. Please try again.";
    }

    // Create AI message
    const aiMessage: AIMessage = {
      id: generateId('msg'),
      conversationId: input.conversationId,
      role: 'assistant',
      content: aiContent,
      timestamp: new Date().toISOString(),
    };

    addMessage(aiMessage);

    return { userMessage, aiMessage };
  },

  /**
   * Delete conversation and all messages
   */
  async deleteAIConversation(conversationId: string): Promise<void> {
    await delay(100); // Quick action
    seedData();

    deleteConversation(conversationId);
  },

  /**
   * Convert conversation to thread
   */
  async convertConversationToThread(
    conversationId: string,
    userId: string,
    courseId: string
  ): Promise<{ thread: Thread; aiAnswer: AIAnswer | null }> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    // Validate conversation exists
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Get all messages
    const messages = getConversationMessages(conversationId);
    if (messages.length === 0) {
      throw new Error('Cannot convert empty conversation to thread');
    }

    // Extract first user message as thread title
    const firstUserMessage = messages.find(m => m.role === 'user');
    const threadTitle = firstUserMessage
      ? firstUserMessage.content.substring(0, 100) + (firstUserMessage.content.length > 100 ? '...' : '')
      : conversation.title;

    // Combine all messages into thread content
    const threadContent = messages
      .map(msg => {
        const role = msg.role === 'user' ? 'Student' : 'AI Assistant';
        return `**${role}:** ${msg.content}`;
      })
      .join('\n\n---\n\n');

    // Create thread
    const newThread: Thread = {
      id: generateId('thread'),
      courseId,
      title: threadTitle,
      content: threadContent,
      authorId: userId,
      status: 'open',
      tags: ['from-conversation'],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addThread(newThread);

    // Check if there's an AI response to preserve as AIAnswer
    const aiMessages = messages.filter(m => m.role === 'assistant');
    let aiAnswer: AIAnswer | null = null;

    if (aiMessages.length > 0) {
      // Use the last AI message as the thread's AI answer
      const lastAIMessage = aiMessages[aiMessages.length - 1];

      const aiAnswerData: AIAnswer = {
        id: generateId('ai'),
        threadId: newThread.id,
        courseId,
        content: lastAIMessage.content,
        confidenceLevel: 'medium',
        confidenceScore: 65,
        citations: [],
        studentEndorsements: 0,
        instructorEndorsements: 0,
        totalEndorsements: 0,
        endorsedBy: [],
        instructorEndorsed: false,
        generatedAt: lastAIMessage.timestamp,
        updatedAt: new Date().toISOString(),
      };

      addAIAnswer(aiAnswerData);
      updateThread(newThread.id, {
        hasAIAnswer: true,
        aiAnswerId: aiAnswerData.id,
      });

      aiAnswer = aiAnswerData;
    }

    // Mark conversation as converted (optional: could add flag to conversation type)
    updateConversation(conversationId, {
      updatedAt: new Date().toISOString(),
    });

    return {
      thread: newThread,
      aiAnswer,
    };
  },
};
