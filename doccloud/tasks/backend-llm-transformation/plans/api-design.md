# API Design Plan - Backend LLM Transformation

**Author:** Mock API Designer Sub-Agent
**Date:** 2025-10-16
**Status:** Ready for Review
**Estimated Implementation:** 8-12 hours

---

## Table of Contents

1. [TypeScript Interfaces](#1-typescript-interfaces)
2. [API Methods - New](#2-api-methods-new)
3. [API Methods - Modified](#3-api-methods-modified)
4. [React Query Hooks](#4-react-query-hooks)
5. [Mock Data Structure](#5-mock-data-structure)
6. [Implementation Checklist](#6-implementation-checklist)
7. [Backend Integration Notes](#7-backend-integration-notes)

---

## 1. TypeScript Interfaces

### 1.1 Conversation Types

**Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` (append to end)

```typescript
// ============================================
// AI Conversation Types (Private Q&A)
// ============================================

/**
 * AI conversation session (private, user-owned)
 *
 * Represents a private chat session between user and AI assistant.
 * Conversations are isolated per user and can be converted to public threads.
 */
export interface AIConversation {
  /** Unique conversation identifier */
  id: string;

  /** Owner user ID (conversations are private) */
  userId: string;

  /** Optional course context (null = multi-course general view) */
  courseId: string | null;

  /** Optional course code for display */
  courseCode?: string;

  /** Auto-generated title from first user message (max 60 chars) */
  title: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last activity timestamp */
  updatedAt: string;

  /** Number of messages in conversation */
  messageCount: number;

  /** Whether conversation has been converted to public thread */
  convertedToThread: boolean;

  /** Thread ID if converted (null otherwise) */
  threadId?: string;
}

/**
 * Conversational message (user or assistant)
 *
 * Represents a single turn in an AI conversation.
 * User messages trigger AI responses with course material context.
 */
export interface AIMessage {
  /** Unique message identifier */
  id: string;

  /** Parent conversation ID */
  conversationId: string;

  /** Message sender */
  role: 'user' | 'assistant';

  /** Message text content (markdown supported) */
  content: string;

  /** Assistant messages may cite course materials */
  materialReferences?: MaterialReference[];

  /** Assistant messages have confidence scoring */
  confidenceScore?: number;

  /** ISO 8601 message timestamp */
  timestamp: string;
}

/**
 * Input for creating new conversation
 */
export interface CreateConversationInput {
  /** User ID (owner) */
  userId: string;

  /** Optional course context (null = general/multi-course) */
  courseId: string | null;

  /** Initial user message (required) */
  firstMessage: string;
}

/**
 * Input for sending message to conversation
 */
export interface SendMessageInput {
  /** Conversation ID */
  conversationId: string;

  /** User message content */
  content: string;

  /** User ID (for auth check) */
  userId: string;
}

/**
 * Input for converting conversation to thread
 */
export interface ConvertConversationInput {
  /** Conversation ID to convert */
  conversationId: string;

  /** Target course ID for public thread */
  courseId: string;

  /** User ID (for auth check) */
  userId: string;

  /** Optional custom title (defaults to conversation title) */
  customTitle?: string;

  /** Optional tags for thread */
  tags?: string[];
}

/**
 * Result of conversation → thread conversion
 */
export interface ConvertConversationResult {
  /** Newly created thread */
  thread: Thread;

  /** AI answer from conversation (if available) */
  aiAnswer: AIAnswer | null;

  /** Original conversation (marked as converted) */
  conversation: AIConversation;
}

// ============================================
// LLM Provider Types
// ============================================

/**
 * LLM provider name (extensible)
 */
export type LLMProvider = 'openai' | 'anthropic';

/**
 * LLM model identifier
 */
export type LLMModel =
  | 'gpt-4o-mini'           // OpenAI: Fast, cheap, recommended
  | 'gpt-4o'                // OpenAI: Expensive, high quality
  | 'claude-3-haiku'        // Anthropic: Fast, cheap
  | 'claude-3-5-sonnet';    // Anthropic: High quality

/**
 * LLM generation parameters
 */
export interface LLMParams {
  /** Model to use */
  model: LLMModel;

  /** Temperature (0-2, lower = more deterministic) */
  temperature: number;

  /** Top-p nucleus sampling (0-1) */
  topP: number;

  /** Max tokens to generate (limits response length) */
  maxTokens: number;

  /** Stop sequences (optional) */
  stopSequences?: string[];
}

/**
 * LLM context for generation
 */
export interface LLMContext {
  /** Course materials ranked by relevance */
  materials: CourseMaterial[];

  /** Current course context (if single-course) */
  currentCourse?: Course;

  /** All enrolled courses (if multi-course) */
  enrolledCourses?: Course[];

  /** Conversation history (for multi-turn) */
  conversationHistory?: AIMessage[];
}

/**
 * LLM generation input
 */
export interface LLMGenerateInput {
  /** User question/prompt */
  prompt: string;

  /** Course materials and context */
  context: LLMContext;

  /** Generation parameters */
  params: LLMParams;

  /** Provider preference (fallback if primary fails) */
  provider?: LLMProvider;
}

/**
 * LLM generation output
 */
export interface LLMGenerateOutput {
  /** Generated response text */
  content: string;

  /** Confidence score (0-100, derived from model) */
  confidenceScore: number;

  /** Materials cited in response */
  citedMaterials: MaterialReference[];

  /** Token usage stats */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Provider used (may differ from requested if fallback) */
  provider: LLMProvider;

  /** Model used */
  model: LLMModel;

  /** ISO 8601 generation timestamp */
  generatedAt: string;
}

// ============================================
// LMS Integration Types
// ============================================

/**
 * LMS provider (adapter pattern)
 */
export type LMSProvider = 'canvas' | 'blackboard' | 'moodle' | 'simulated';

/**
 * LMS sync status
 */
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * LMS sync result
 */
export interface LMSSyncResult {
  /** Sync job ID */
  id: string;

  /** Course ID being synced */
  courseId: string;

  /** LMS provider */
  provider: LMSProvider;

  /** Current status */
  status: SyncStatus;

  /** Number of materials added */
  materialsAdded: number;

  /** Number of materials updated */
  materialsUpdated: number;

  /** Number of materials deleted */
  materialsDeleted: number;

  /** Error message (if failed) */
  error?: string;

  /** ISO 8601 start timestamp */
  startedAt: string;

  /** ISO 8601 completion timestamp (null if in progress) */
  completedAt: string | null;
}

/**
 * Input for triggering LMS sync
 */
export interface SyncLMSInput {
  /** Course ID to sync */
  courseId: string;

  /** LMS provider to use */
  provider: LMSProvider;

  /** Force full re-sync (vs incremental) */
  fullSync?: boolean;
}

// ============================================
// Course Context Types
// ============================================

/**
 * Built course context for LLM
 */
export interface BuiltCourseContext {
  /** Context type */
  type: 'single' | 'multi';

  /** Course(s) included in context */
  courses: Course[];

  /** All materials in context (ranked by relevance) */
  materials: CourseMaterial[];

  /** Total token count estimate */
  estimatedTokens: number;

  /** Whether context was truncated to fit limits */
  truncated: boolean;

  /** ISO 8601 build timestamp */
  builtAt: string;
}

/**
 * Auto-detected course from query
 */
export interface DetectedCourse {
  /** Detected course */
  course: Course;

  /** Confidence score (0-100) */
  confidence: number;

  /** Keywords that matched */
  matchedKeywords: string[];
}
```

**Changes to Existing Types:**

None! All new types are additive. Existing types remain unchanged.

---

## 2. API Methods - New

All new methods go in: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

### 2.1 Conversation Management

#### `createConversation`

**Signature:**
```typescript
async createConversation(input: CreateConversationInput): Promise<AIConversation>
```

**Implementation:**
```typescript
/**
 * Create new AI conversation
 * Sends first message and gets AI response
 */
async createConversation(input: CreateConversationInput): Promise<AIConversation> {
  await delay(400 + Math.random() * 200); // 400-600ms
  seedData();

  // Create conversation
  const conversation: AIConversation = {
    id: generateId('conv'),
    userId: input.userId,
    courseId: input.courseId,
    courseCode: input.courseId ? getCourseById(input.courseId)?.code : undefined,
    title: input.firstMessage.slice(0, 60).trim() + (input.firstMessage.length > 60 ? '...' : ''),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 2, // User message + AI response
    convertedToThread: false,
  };

  // Add user message
  const userMessage: AIMessage = {
    id: generateId('msg'),
    conversationId: conversation.id,
    role: 'user',
    content: input.firstMessage,
    timestamp: new Date().toISOString(),
  };

  // Generate AI response (use LLM or template fallback)
  const aiResponse = await this.generateConversationResponse({
    conversationId: conversation.id,
    courseId: input.courseId,
    userMessage: input.firstMessage,
    history: [],
  });

  const aiMessage: AIMessage = {
    id: generateId('msg'),
    conversationId: conversation.id,
    role: 'assistant',
    content: aiResponse.content,
    materialReferences: aiResponse.materialReferences,
    confidenceScore: aiResponse.confidenceScore,
    timestamp: new Date().toISOString(),
  };

  // Save to localStorage
  addConversation(conversation);
  addMessage(userMessage);
  addMessage(aiMessage);

  return conversation;
}
```

**Network Delay:** 400-600ms
**Errors:**
- Throws if `userId` invalid
- Throws if `courseId` invalid
- Throws if `firstMessage` empty

**Mock Data:** Saves to `localStorage.getItem('quokkaq.conversations')` and `quokkaq.messages`

---

#### `getUserConversations`

**Signature:**
```typescript
async getUserConversations(userId: string): Promise<AIConversation[]>
```

**Implementation:**
```typescript
/**
 * Get all conversations for a user
 * Sorted by updatedAt DESC (most recent first)
 */
async getUserConversations(userId: string): Promise<AIConversation[]> {
  await delay(); // 200-500ms
  seedData();

  const conversations = getConversations(userId);
  return conversations.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
```

**Network Delay:** 200-500ms
**Errors:** None (returns empty array if user not found)
**Mock Data:** Reads from `localStorage.getItem('quokkaq.conversations')`

---

#### `getConversationMessages`

**Signature:**
```typescript
async getConversationMessages(conversationId: string): Promise<AIMessage[]>
```

**Implementation:**
```typescript
/**
 * Get all messages for a conversation
 * Sorted chronologically (oldest first)
 */
async getConversationMessages(conversationId: string): Promise<AIMessage[]> {
  await delay(); // 200-500ms
  seedData();

  const messages = getMessagesByConversation(conversationId);
  return messages.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
```

**Network Delay:** 200-500ms
**Errors:** Throws if `conversationId` not found
**Mock Data:** Reads from `localStorage.getItem('quokkaq.messages')`

---

#### `sendMessage`

**Signature:**
```typescript
async sendMessage(input: SendMessageInput): Promise<AIMessage>
```

**Implementation:**
```typescript
/**
 * Send message to conversation and get AI response
 * Returns AI response message
 */
async sendMessage(input: SendMessageInput): Promise<AIMessage> {
  await delay(800 + Math.random() * 400); // 800-1200ms (AI generation)
  seedData();

  const conversation = getConversationById(input.conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${input.conversationId}`);
  }

  // Auth check
  if (conversation.userId !== input.userId) {
    throw new Error('Unauthorized: conversation belongs to different user');
  }

  // Add user message
  const userMessage: AIMessage = {
    id: generateId('msg'),
    conversationId: input.conversationId,
    role: 'user',
    content: input.content,
    timestamp: new Date().toISOString(),
  };
  addMessage(userMessage);

  // Get conversation history
  const history = await this.getConversationMessages(input.conversationId);

  // Generate AI response with context
  const aiResponse = await this.generateConversationResponse({
    conversationId: input.conversationId,
    courseId: conversation.courseId,
    userMessage: input.content,
    history: history.slice(0, -1), // Exclude user message we just added
  });

  const aiMessage: AIMessage = {
    id: generateId('msg'),
    conversationId: input.conversationId,
    role: 'assistant',
    content: aiResponse.content,
    materialReferences: aiResponse.materialReferences,
    confidenceScore: aiResponse.confidenceScore,
    timestamp: new Date().toISOString(),
  };
  addMessage(aiMessage);

  // Update conversation
  updateConversation(input.conversationId, {
    updatedAt: new Date().toISOString(),
    messageCount: conversation.messageCount + 2,
  });

  return aiMessage;
}
```

**Network Delay:** 800-1200ms (includes AI generation)
**Errors:**
- Throws if `conversationId` not found
- Throws if `userId` doesn't match conversation owner
- Throws if `content` empty

**Mock Data:** Appends to `localStorage.getItem('quokkaq.messages')`

---

#### `deleteConversation`

**Signature:**
```typescript
async deleteConversation(conversationId: string, userId: string): Promise<void>
```

**Implementation:**
```typescript
/**
 * Delete conversation and all its messages
 * Auth check: only owner can delete
 */
async deleteConversation(conversationId: string, userId: string): Promise<void> {
  await delay(100); // Quick action
  seedData();

  const conversation = getConversationById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  // Auth check
  if (conversation.userId !== userId) {
    throw new Error('Unauthorized: conversation belongs to different user');
  }

  // Delete messages first
  deleteMessagesByConversation(conversationId);

  // Delete conversation
  deleteConversation(conversationId);
}
```

**Network Delay:** 100ms
**Errors:**
- Throws if `conversationId` not found
- Throws if `userId` doesn't match owner

**Mock Data:** Removes from `quokkaq.conversations` and `quokkaq.messages`

---

#### `convertConversationToThread`

**Signature:**
```typescript
async convertConversationToThread(input: ConvertConversationInput): Promise<ConvertConversationResult>
```

**Implementation:**
```typescript
/**
 * Convert private conversation to public thread
 * Preserves conversation context and AI response
 */
async convertConversationToThread(input: ConvertConversationInput): Promise<ConvertConversationResult> {
  await delay(600 + Math.random() * 200); // 600-800ms
  seedData();

  const conversation = getConversationById(input.conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${input.conversationId}`);
  }

  // Auth check
  if (conversation.userId !== input.userId) {
    throw new Error('Unauthorized: conversation belongs to different user');
  }

  // Already converted?
  if (conversation.convertedToThread) {
    throw new Error('Conversation already converted to thread');
  }

  // Get messages
  const messages = await this.getConversationMessages(input.conversationId);

  // Extract first user message for thread content
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) {
    throw new Error('Conversation has no user messages');
  }

  // Extract first AI message for AI answer
  const firstAIMessage = messages.find(m => m.role === 'assistant');

  // Create thread
  const threadInput: CreateThreadInput = {
    courseId: input.courseId,
    title: input.customTitle || conversation.title,
    content: firstUserMessage.content,
    tags: input.tags || [],
  };

  const { thread, aiAnswer } = await this.createThread(threadInput, input.userId);

  // Mark conversation as converted
  updateConversation(input.conversationId, {
    convertedToThread: true,
    threadId: thread.id,
    updatedAt: new Date().toISOString(),
  });

  const updatedConversation = getConversationById(input.conversationId)!;

  return {
    thread,
    aiAnswer,
    conversation: updatedConversation,
  };
}
```

**Network Delay:** 600-800ms
**Errors:**
- Throws if `conversationId` not found
- Throws if `userId` doesn't match owner
- Throws if conversation already converted
- Throws if no user messages in conversation

**Mock Data:** Updates `quokkaq.conversations`, creates entries in `quokkaq.threads` and `quokkaq.aiAnswers`

---

### 2.2 LLM Integration (Internal Helper)

#### `generateConversationResponse`

**Signature:**
```typescript
async generateConversationResponse(input: {
  conversationId: string;
  courseId: string | null;
  userMessage: string;
  history: AIMessage[];
}): Promise<{
  content: string;
  materialReferences: MaterialReference[];
  confidenceScore: number;
}>
```

**Implementation:**
```typescript
/**
 * Generate AI response for conversation message
 * Uses LLM with course context or template fallback
 * PRIVATE METHOD - not exposed in API
 */
async generateConversationResponse(input: {
  conversationId: string;
  courseId: string | null;
  userMessage: string;
  history: AIMessage[];
}): Promise<{
  content: string;
  materialReferences: MaterialReference[];
  confidenceScore: number;
}> {
  // If courseId provided: single-course context
  if (input.courseId) {
    return await this.generateSingleCourseResponse(input.courseId, input.userMessage, input.history);
  }

  // If courseId null: multi-course context (all enrolled courses)
  // Extract userId from conversation
  const conversation = getConversationById(input.conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const enrolledCourses = await this.getUserCourses(conversation.userId);
  return await this.generateMultiCourseResponse(enrolledCourses, input.userMessage, input.history);
}

/**
 * Generate response using single-course context
 * PRIVATE METHOD
 */
async generateSingleCourseResponse(
  courseId: string,
  userMessage: string,
  history: AIMessage[]
): Promise<{
  content: string;
  materialReferences: MaterialReference[];
  confidenceScore: number;
}> {
  // Get course materials
  const materials = await this.getCourseMaterials(courseId);

  // Score materials by relevance
  const keywords = extractKeywords(userMessage);
  const scoredMaterials = materials.map(m => ({
    material: m,
    relevance: Math.min(95, 60 + keywords.filter(k => m.keywords.includes(k)).length * 10),
  }));

  const topMaterials = scoredMaterials
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  // TODO: Replace with LLM call
  // For now: fallback to template system
  const course = await this.getCourse(courseId);
  if (!course) throw new Error('Course not found');

  const response = generateAIResponse(course.code, userMessage, '', []);

  // Convert Citation[] to MaterialReference[]
  const materialReferences: MaterialReference[] = topMaterials.slice(0, 3).map(({ material, relevance }) => ({
    materialId: material.id,
    type: material.type,
    title: material.title,
    excerpt: generateExcerpt(material.content, keywords),
    relevanceScore: relevance,
    link: undefined,
  }));

  return {
    content: response.content,
    materialReferences,
    confidenceScore: response.confidence.score,
  };
}

/**
 * Generate response using multi-course context
 * PRIVATE METHOD
 */
async generateMultiCourseResponse(
  courses: Course[],
  userMessage: string,
  history: AIMessage[]
): Promise<{
  content: string;
  materialReferences: MaterialReference[];
  confidenceScore: number;
}> {
  // Get materials from all courses
  const allMaterials: CourseMaterial[] = [];
  for (const course of courses) {
    const materials = await this.getCourseMaterials(course.id);
    allMaterials.push(...materials);
  }

  // Score materials by relevance (same as single-course)
  const keywords = extractKeywords(userMessage);
  const scoredMaterials = allMaterials.map(m => ({
    material: m,
    relevance: Math.min(95, 60 + keywords.filter(k => m.keywords.includes(k)).length * 10),
  }));

  const topMaterials = scoredMaterials
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5); // Top 5 across all courses

  // TODO: Replace with LLM call
  // For now: use GENERAL_TEMPLATE
  const response = {
    content: GENERAL_TEMPLATE.content,
    confidence: { score: 60 },
  };

  const materialReferences: MaterialReference[] = topMaterials.slice(0, 3).map(({ material, relevance }) => ({
    materialId: material.id,
    type: material.type,
    title: material.title,
    excerpt: generateExcerpt(material.content, keywords),
    relevanceScore: relevance,
    link: undefined,
  }));

  return {
    content: response.content,
    materialReferences,
    confidenceScore: response.confidence.score,
  };
}
```

**Network Delay:** N/A (internal helper)
**Errors:** Throws if course/materials not found

---

### 2.3 LMS Sync (Simulated)

#### `syncCourseMaterials`

**Signature:**
```typescript
async syncCourseMaterials(input: SyncLMSInput): Promise<LMSSyncResult>
```

**Implementation:**
```typescript
/**
 * Sync course materials from LMS
 * SIMULATED for demo - adds predefined materials to localStorage
 */
async syncCourseMaterials(input: SyncLMSInput): Promise<LMSSyncResult> {
  await delay(2000 + Math.random() * 1000); // 2-3 seconds (simulates network + processing)
  seedData();

  const course = getCourseById(input.courseId);
  if (!course) {
    throw new Error(`Course not found: ${input.courseId}`);
  }

  // Simulate sync result
  const syncResult: LMSSyncResult = {
    id: generateId('sync'),
    courseId: input.courseId,
    provider: input.provider,
    status: 'completed',
    materialsAdded: Math.floor(Math.random() * 10) + 5, // 5-15 materials
    materialsUpdated: Math.floor(Math.random() * 5),
    materialsDeleted: 0,
    startedAt: new Date(Date.now() - 3000).toISOString(),
    completedAt: new Date().toISOString(),
  };

  // In real implementation:
  // - Call LMS API (Canvas, Blackboard, etc.)
  // - Parse course content (syllabi, lectures, assignments)
  // - Extract text content for AI context
  // - Save to database

  return syncResult;
}
```

**Network Delay:** 2-3 seconds
**Errors:** Throws if `courseId` invalid
**Mock Data:** No persistent changes (simulated only)

---

## 3. API Methods - Modified

### 3.1 `generateAIAnswer`

**Current Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts` (lines 1512-1560)

**Change Required:** Replace `generateAIResponseWithMaterials()` call with LLM provider call.

**Modified Implementation:**
```typescript
/**
 * Generate AI answer for a thread
 * MODIFIED: Uses LLM instead of templates
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

  // NEW: Use LLM provider instead of template matching
  let content: string;
  let confidence: { level: ConfidenceLevel; score: number };
  let citations: Citation[];

  try {
    // Attempt LLM generation
    const llmResult = await this.generateSingleCourseResponse(
      input.courseId,
      input.title + '\n\n' + input.content,
      []
    );

    content = llmResult.content;
    confidence = {
      level: getConfidenceLevel(llmResult.confidenceScore),
      score: llmResult.confidenceScore,
    };

    // Convert MaterialReference[] to Citation[]
    citations = llmResult.materialReferences.map(ref => ({
      id: generateId('cite'),
      sourceType: mapMaterialTypeToCitationType(ref.type),
      source: ref.title,
      excerpt: ref.excerpt,
      relevance: ref.relevanceScore,
      link: ref.link,
    }));
  } catch (error) {
    console.error('LLM generation failed, falling back to templates:', error);

    // Fallback to old template system
    const fallback = await generateAIResponseWithMaterials(
      input.courseId,
      course.code,
      input.title,
      input.content,
      input.tags || []
    );

    content = fallback.content;
    confidence = fallback.confidence;
    citations = fallback.citations;
  }

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
}
```

**Signature:** Unchanged
**Network Delay:** Unchanged (800-1200ms)
**Errors:** Unchanged
**Breaking Changes:** None (signature identical)

---

### 3.2 `generateAIPreview`

**Current Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts` (lines 1566-1602)

**Change Required:** Same as `generateAIAnswer` - replace template logic with LLM.

**Modified Implementation:**
```typescript
/**
 * Generate AI answer preview (ask page only)
 * Does NOT save to database
 * MODIFIED: Uses LLM instead of templates
 */
async generateAIPreview(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  await delay(800 + Math.random() * 400); // 800-1200ms (AI simulation)
  seedData();

  const course = getCourseById(input.courseId);
  if (!course) {
    throw new Error(`Course not found: ${input.courseId}`);
  }

  // NEW: Use LLM provider instead of template matching
  let content: string;
  let confidence: { level: ConfidenceLevel; score: number };
  let citations: Citation[];

  try {
    const llmResult = await this.generateSingleCourseResponse(
      input.courseId,
      input.title + '\n\n' + input.content,
      []
    );

    content = llmResult.content;
    confidence = {
      level: getConfidenceLevel(llmResult.confidenceScore),
      score: llmResult.confidenceScore,
    };

    citations = llmResult.materialReferences.map(ref => ({
      id: generateId('cite'),
      sourceType: mapMaterialTypeToCitationType(ref.type),
      source: ref.title,
      excerpt: ref.excerpt,
      relevance: ref.relevanceScore,
      link: ref.link,
    }));
  } catch (error) {
    console.error('LLM generation failed, falling back to templates:', error);

    const fallback = await generateAIResponseWithMaterials(
      input.courseId,
      course.code,
      input.title,
      input.content,
      input.tags || []
    );

    content = fallback.content;
    confidence = fallback.confidence;
    citations = fallback.citations;
  }

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
}
```

**Signature:** Unchanged
**Network Delay:** Unchanged (800-1200ms)
**Errors:** Unchanged
**Breaking Changes:** None (signature identical)

---

## 4. React Query Hooks

**Location:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts` (append to end)

### 4.1 Query Keys

Add to `queryKeys` object (line 23):

```typescript
const queryKeys = {
  // ... existing keys ...

  // NEW: Conversation query keys
  conversations: (userId: string) => ['conversations', userId] as const,
  conversation: (conversationId: string) => ['conversation', conversationId] as const,
  conversationMessages: (conversationId: string) => ['conversationMessages', conversationId] as const,
};
```

---

### 4.2 Conversation Hooks

#### `useConversations`

```typescript
/**
 * Get all conversations for user
 * Sorted by updatedAt DESC (most recent first)
 */
export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.conversations(userId) : ['conversations'],
    queryFn: () => (userId ? api.getUserConversations(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,  // 1 minute (near-real-time)
    gcTime: 5 * 60 * 1000,      // 5 minutes
  });
}
```

**Invalidated By:** `useCreateConversation`, `useDeleteConversation`, `useConvertConversation`

---

#### `useConversationMessages`

```typescript
/**
 * Get all messages for a conversation
 * Sorted chronologically (oldest first)
 */
export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationId ? queryKeys.conversationMessages(conversationId) : ['conversationMessages'],
    queryFn: () => (conversationId ? api.getConversationMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    staleTime: 30 * 1000,       // 30 seconds
    gcTime: 2 * 60 * 1000,      // 2 minutes
    refetchInterval: 30 * 1000, // Poll every 30 seconds (simulates real-time)
  });
}
```

**Invalidated By:** `useSendMessage`

---

#### `useCreateConversation`

```typescript
/**
 * Create new AI conversation
 * Sends first message and gets AI response
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConversationInput) => api.createConversation(input),
    onSuccess: (newConversation) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(newConversation.userId)
      });

      // Pre-populate conversation in cache
      queryClient.setQueryData(
        queryKeys.conversation(newConversation.id),
        newConversation
      );
    },
  });
}
```

---

#### `useSendMessage`

```typescript
/**
 * Send message to conversation
 * Uses optimistic updates for instant UX
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => api.sendMessage(input),

    // Optimistic update: add user message immediately
    onMutate: async (input) => {
      const queryKey = queryKeys.conversationMessages(input.conversationId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Get current cached messages
      const previousMessages = queryClient.getQueryData(queryKey);

      // Optimistically add user message
      const optimisticUserMessage: AIMessage = {
        id: `temp-${Date.now()}`,
        conversationId: input.conversationId,
        role: 'user',
        content: input.content,
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old: AIMessage[] | undefined) => {
        return old ? [...old, optimisticUserMessage] : [optimisticUserMessage];
      });

      // Return context for rollback
      return { previousMessages, conversationId: input.conversationId };
    },

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousMessages && context?.conversationId) {
        queryClient.setQueryData(
          queryKeys.conversationMessages(context.conversationId),
          context.previousMessages
        );
      }
    },

    // On success: refetch to get AI response
    onSuccess: (aiMessage, variables) => {
      // Invalidate messages (will refetch and include AI response)
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(variables.conversationId)
      });

      // Invalidate conversations list (updatedAt changed)
      const conversation = queryClient.getQueryData<AIConversation>(
        queryKeys.conversation(variables.conversationId)
      );
      if (conversation) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations(conversation.userId)
        });
      }
    },
  });
}
```

---

#### `useDeleteConversation`

```typescript
/**
 * Delete conversation and all its messages
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      api.deleteConversation(conversationId, userId),

    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.conversation(variables.conversationId)
      });
      queryClient.removeQueries({
        queryKey: queryKeys.conversationMessages(variables.conversationId)
      });

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(variables.userId)
      });
    },
  });
}
```

---

#### `useConvertConversation`

```typescript
/**
 * Convert conversation to public thread
 */
export function useConvertConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConvertConversationInput) => api.convertConversationToThread(input),

    onSuccess: (result) => {
      const { thread, conversation } = result;

      // Invalidate course threads (new thread added)
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseThreads(thread.courseId)
      });

      // Invalidate conversations list (conversation marked as converted)
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations(conversation.userId)
      });

      // Update conversation in cache
      queryClient.setQueryData(
        queryKeys.conversation(conversation.id),
        conversation
      );

      // Invalidate dashboards (new thread activity)
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['instructorDashboard'] });
    },
  });
}
```

---

## 5. Mock Data Structure

### 5.1 Conversations Data

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/conversations.json`

```json
{
  "conversations": [
    {
      "id": "conv-1",
      "userId": "user-student-1",
      "courseId": "course-cs101",
      "courseCode": "CS101",
      "title": "How do I implement binary search in Python?",
      "createdAt": "2025-10-14T10:30:00Z",
      "updatedAt": "2025-10-14T10:35:00Z",
      "messageCount": 4,
      "convertedToThread": false
    },
    {
      "id": "conv-2",
      "userId": "user-student-1",
      "courseId": null,
      "title": "General question about data structures",
      "createdAt": "2025-10-15T14:20:00Z",
      "updatedAt": "2025-10-15T14:22:00Z",
      "messageCount": 2,
      "convertedToThread": false
    },
    {
      "id": "conv-3",
      "userId": "user-student-2",
      "courseId": "course-math221",
      "courseCode": "MATH221",
      "title": "Can you explain integration by parts?",
      "createdAt": "2025-10-13T09:15:00Z",
      "updatedAt": "2025-10-13T09:18:00Z",
      "messageCount": 2,
      "convertedToThread": true,
      "threadId": "thread-123"
    }
  ]
}
```

**Seed Count:** 3-5 conversations per student user

---

### 5.2 Messages Data

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/messages.json`

```json
{
  "messages": [
    {
      "id": "msg-1",
      "conversationId": "conv-1",
      "role": "user",
      "content": "How do I implement binary search in Python?",
      "timestamp": "2025-10-14T10:30:00Z"
    },
    {
      "id": "msg-2",
      "conversationId": "conv-1",
      "role": "assistant",
      "content": "Binary search is an efficient algorithm for finding a target value in a **sorted array**...",
      "materialReferences": [
        {
          "materialId": "mat-cs101-lec5",
          "type": "lecture",
          "title": "Lecture 5: Binary Search Trees",
          "excerpt": "Binary search works by repeatedly dividing...",
          "relevanceScore": 85
        },
        {
          "materialId": "mat-cs101-slide3",
          "type": "slide",
          "title": "Slides: Search Algorithms",
          "excerpt": "Complexity analysis: O(log n) for binary search...",
          "relevanceScore": 80
        }
      ],
      "confidenceScore": 88,
      "timestamp": "2025-10-14T10:30:30Z"
    },
    {
      "id": "msg-3",
      "conversationId": "conv-1",
      "role": "user",
      "content": "Can you show me the code?",
      "timestamp": "2025-10-14T10:35:00Z"
    },
    {
      "id": "msg-4",
      "conversationId": "conv-1",
      "role": "assistant",
      "content": "Here's a Python implementation:\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    ...",
      "confidenceScore": 92,
      "timestamp": "2025-10-14T10:35:15Z"
    }
  ]
}
```

**Seed Count:** 2-8 messages per conversation (alternating user/assistant)

---

### 5.3 localStorage Keys

Add to `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`:

```typescript
const KEYS = {
  // ... existing keys ...

  // NEW: Conversation keys
  conversations: "quokkaq.conversations",
  messages: "quokkaq.messages",
};
```

---

### 5.4 LocalStore Helper Functions

Add to `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts` (append to end):

```typescript
// ============================================
// Conversation Data Access
// ============================================

/**
 * Get all conversations from localStorage
 */
export function getConversations(): AIConversation[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.conversations);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return parsed.conversations as AIConversation[];
  } catch {
    return [];
  }
}

/**
 * Get conversations by user ID
 */
export function getConversationsByUser(userId: string): AIConversation[] {
  const conversations = getConversations();
  return conversations.filter((c) => c.userId === userId);
}

/**
 * Get conversation by ID
 */
export function getConversationById(id: string): AIConversation | null {
  const conversations = getConversations();
  return conversations.find((c) => c.id === id) ?? null;
}

/**
 * Add new conversation
 */
export function addConversation(conversation: AIConversation): void {
  if (typeof window === "undefined") return;

  const conversations = getConversations();
  conversations.push(conversation);
  localStorage.setItem(KEYS.conversations, JSON.stringify({ conversations }));
}

/**
 * Update conversation
 */
export function updateConversation(conversationId: string, updates: Partial<AIConversation>): void {
  if (typeof window === "undefined") return;

  const conversations = getConversations();
  const index = conversations.findIndex((c) => c.id === conversationId);

  if (index !== -1) {
    conversations[index] = { ...conversations[index], ...updates };
    localStorage.setItem(KEYS.conversations, JSON.stringify({ conversations }));
  }
}

/**
 * Delete conversation
 */
export function deleteConversationById(conversationId: string): void {
  if (typeof window === "undefined") return;

  const conversations = getConversations();
  const filtered = conversations.filter((c) => c.id !== conversationId);
  localStorage.setItem(KEYS.conversations, JSON.stringify({ conversations: filtered }));
}

// ============================================
// Message Data Access
// ============================================

/**
 * Get all messages from localStorage
 */
export function getMessages(): AIMessage[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.messages);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return parsed.messages as AIMessage[];
  } catch {
    return [];
  }
}

/**
 * Get messages by conversation ID
 */
export function getMessagesByConversation(conversationId: string): AIMessage[] {
  const messages = getMessages();
  return messages.filter((m) => m.conversationId === conversationId);
}

/**
 * Add new message
 */
export function addMessage(message: AIMessage): void {
  if (typeof window === "undefined") return;

  const messages = getMessages();
  messages.push(message);
  localStorage.setItem(KEYS.messages, JSON.stringify({ messages }));
}

/**
 * Delete messages by conversation ID
 */
export function deleteMessagesByConversation(conversationId: string): void {
  if (typeof window === "undefined") return;

  const messages = getMessages();
  const filtered = messages.filter((m) => m.conversationId !== conversationId);
  localStorage.setItem(KEYS.messages, JSON.stringify({ messages: filtered }));
}
```

---

## 6. Implementation Checklist

### Phase 1: TypeScript Types (30 min)

- [ ] Add conversation types to `lib/models/types.ts` (lines ~1722+)
  - `AIConversation`, `AIMessage`, `CreateConversationInput`, etc.
- [ ] Add LLM provider types (lines ~1850+)
  - `LLMProvider`, `LLMModel`, `LLMParams`, `LLMContext`, etc.
- [ ] Add LMS integration types (lines ~1950+)
  - `LMSProvider`, `SyncStatus`, `LMSSyncResult`, etc.
- [ ] Run typecheck: `npx tsc --noEmit` (must pass)

---

### Phase 2: Mock Data Files (30 min)

- [ ] Create `mocks/conversations.json` with seed conversations (3-5)
- [ ] Create `mocks/messages.json` with seed messages (10-20)
- [ ] Update `lib/store/localStore.ts`:
  - Add `conversations` and `messages` to KEYS object
  - Import conversation/message JSON files
  - Add to `seedData()` function
  - Add conversation/message helper functions
- [ ] Increment `SEED_VERSION` to force re-seed
- [ ] Test seed: Open app in browser, check localStorage

---

### Phase 3: LocalStore Helpers (45 min)

- [ ] Implement conversation CRUD functions:
  - `getConversations()`, `getConversationsByUser()`, `getConversationById()`
  - `addConversation()`, `updateConversation()`, `deleteConversationById()`
- [ ] Implement message CRUD functions:
  - `getMessages()`, `getMessagesByConversation()`
  - `addMessage()`, `deleteMessagesByConversation()`
- [ ] Test all helpers in browser console

---

### Phase 4: API Methods - Internal Helpers (1-2 hours)

- [ ] Implement `generateConversationResponse()` in `lib/api/client.ts`
- [ ] Implement `generateSingleCourseResponse()` (uses existing material fetching)
- [ ] Implement `generateMultiCourseResponse()` (aggregates all courses)
- [ ] Add LLM fallback logic (try LLM, fallback to templates on error)
- [ ] Test with mock data

---

### Phase 5: API Methods - Conversation CRUD (2-3 hours)

- [ ] Implement `createConversation()` in `lib/api/client.ts`
  - Creates conversation + user message + AI response
  - Saves to localStorage
- [ ] Implement `getUserConversations()`
- [ ] Implement `getConversationMessages()`
- [ ] Implement `sendMessage()`
  - Auth check
  - Adds user message
  - Generates AI response
  - Updates conversation
- [ ] Implement `deleteConversation()`
  - Auth check
  - Cascades to messages
- [ ] Implement `convertConversationToThread()`
  - Auth check
  - Creates thread via `createThread()`
  - Marks conversation as converted
- [ ] Test all methods in browser console

---

### Phase 6: API Methods - Modified (1 hour)

- [ ] Modify `generateAIAnswer()`:
  - Replace template call with `generateSingleCourseResponse()`
  - Add try/catch fallback to templates
- [ ] Modify `generateAIPreview()`:
  - Same changes as `generateAIAnswer()`
- [ ] Test both methods still work with existing UI

---

### Phase 7: React Query Hooks (1-2 hours)

- [ ] Add conversation query keys to `lib/api/hooks.ts`
- [ ] Implement `useConversations(userId)`
- [ ] Implement `useConversationMessages(conversationId)`
- [ ] Implement `useCreateConversation()` mutation
- [ ] Implement `useSendMessage()` mutation with optimistic updates
- [ ] Implement `useDeleteConversation()` mutation
- [ ] Implement `useConvertConversation()` mutation
- [ ] Test all hooks in React DevTools

---

### Phase 8: LMS Sync (Optional, 30 min)

- [ ] Implement `syncCourseMaterials()` in `lib/api/client.ts`
  - Simulated sync (returns mock result)
  - No real API calls
- [ ] Add `useSyncCourseMaterials()` hook in `lib/api/hooks.ts`
- [ ] Test sync flow

---

### Phase 9: Integration Testing (1-2 hours)

- [ ] Test conversation creation flow end-to-end
- [ ] Test multi-turn conversation with context retention
- [ ] Test conversation → thread conversion
- [ ] Test single-course vs multi-course context
- [ ] Test LLM fallback to templates on error
- [ ] Verify zero breaking changes to existing features
- [ ] Test all invalidation patterns work correctly

---

### Phase 10: Documentation & Cleanup (30 min)

- [ ] Update context.md with implementation notes
- [ ] Document any deviations from plan
- [ ] Add JSDoc comments to all new functions
- [ ] Run linter: `npm run lint` (must pass)
- [ ] Run typecheck: `npx tsc --noEmit` (must pass)
- [ ] Commit with message: `feat: add LLM conversation API and storage`

---

## 7. Backend Integration Notes

### What Will Change

When connecting to real backend:

#### 1. API Method Implementations

**BEFORE (Mock):**
```typescript
async createConversation(input: CreateConversationInput): Promise<AIConversation> {
  await delay(400 + Math.random() * 200); // Mock delay
  const conversation = { id: generateId('conv'), ...input };
  addConversation(conversation); // localStorage
  return conversation;
}
```

**AFTER (Real Backend):**
```typescript
async createConversation(input: CreateConversationInput): Promise<AIConversation> {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}
```

---

#### 2. LLM Provider Integration

**Current:** Template matching with material keyword scoring
**Future:** Real OpenAI/Anthropic API calls

**New Files Needed:**
- `lib/llm/provider.ts` - Generic LLM interface
- `lib/llm/openai.ts` - OpenAI SDK wrapper
- `lib/llm/anthropic.ts` - Anthropic SDK wrapper
- `lib/llm/prompts.ts` - Prompt engineering utilities

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=openai  # Primary provider
LLM_FALLBACK_PROVIDER=anthropic
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7
```

---

#### 3. Database Schema

**Tables Needed:**

**`ai_conversations` table:**
```sql
CREATE TABLE ai_conversations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NULL,         -- NULL = multi-course
  course_code VARCHAR(50) NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  message_count INT NOT NULL DEFAULT 0,
  converted_to_thread BOOLEAN NOT NULL DEFAULT FALSE,
  thread_id VARCHAR(255) NULL,         -- Foreign key to threads table

  INDEX idx_user_id (user_id),
  INDEX idx_course_id (course_id),
  INDEX idx_updated_at (updated_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE SET NULL
);
```

**`ai_messages` table:**
```sql
CREATE TABLE ai_messages (
  id VARCHAR(255) PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  material_references JSON NULL,      -- Array of MaterialReference objects
  confidence_score INT NULL,          -- 0-100 for assistant messages
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_conversation_id (conversation_id),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);
```

**`lms_content` table (for LMS sync):**
```sql
CREATE TABLE lms_content (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) NOT NULL,
  lms_provider ENUM('canvas', 'blackboard', 'moodle') NOT NULL,
  lms_content_id VARCHAR(255) NOT NULL, -- ID from LMS system
  content_type VARCHAR(50) NOT NULL,    -- 'syllabus', 'module', 'assignment', etc.
  raw_content TEXT NOT NULL,
  synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_course_id (course_id),
  INDEX idx_lms_content_id (lms_content_id),
  UNIQUE KEY uk_lms_content (course_id, lms_provider, lms_content_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

**Migration Script Template:**
```typescript
// migrations/001_add_conversations.ts
export async function up(db: Database): Promise<void> {
  await db.schema.createTable('ai_conversations', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('course_id').nullable();
    table.string('course_code', 50).nullable();
    table.string('title', 255).notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.integer('message_count').defaultTo(0);
    table.boolean('converted_to_thread').defaultTo(false);
    table.string('thread_id').nullable();

    table.index(['user_id'], 'idx_user_id');
    table.index(['course_id'], 'idx_course_id');
    table.index(['updated_at'], 'idx_updated_at');
  });

  await db.schema.createTable('ai_messages', (table) => {
    // ... same structure
  });
}
```

---

#### 4. Authentication & Authorization

**Current:** Mock session in localStorage
**Future:** JWT tokens with backend validation

**Changes Needed:**
- Add `Authorization: Bearer ${token}` header to all API calls
- Backend validates JWT on every request
- Conversation ownership enforced server-side
- Rate limiting per user (e.g., 100 messages/day)

---

#### 5. Real-Time Updates

**Current:** Polling every 30 seconds (`refetchInterval`)
**Future:** WebSocket or Server-Sent Events (SSE)

**Options:**

**Option A: WebSocket (bidirectional)**
```typescript
// lib/api/websocket.ts
const ws = new WebSocket('wss://api.example.com/conversations');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  queryClient.setQueryData(
    queryKeys.conversationMessages(message.conversationId),
    (old) => [...(old || []), message]
  );
};
```

**Option B: SSE (server → client only, simpler)**
```typescript
// lib/api/sse.ts
const eventSource = new EventSource('/api/conversations/stream');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversationMessages(message.conversationId)
  });
};
```

**Recommendation:** Use SSE for initial implementation (simpler, HTTP-based).

---

#### 6. Error Handling

**Current:** Throws generic `Error` objects
**Future:** Structured error responses

**Backend Error Format:**
```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation with ID 'conv-123' not found",
    "status": 404
  }
}
```

**Frontend Error Handling:**
```typescript
try {
  const conversation = await api.getConversationMessages('conv-123');
} catch (error) {
  if (error.code === 'CONVERSATION_NOT_FOUND') {
    // Handle not found
  } else if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else {
    // Generic error
  }
}
```

---

#### 7. Cost Tracking

**NEW: Add token usage tracking**

**Database Table:**
```sql
CREATE TABLE llm_usage (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255) NULL,
  provider ENUM('openai', 'anthropic') NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Cost Tracking Logic:**
```typescript
// Track after each LLM call
await db.insert('llm_usage', {
  id: generateId('usage'),
  userId: conversation.userId,
  conversationId: conversation.id,
  provider: 'openai',
  model: 'gpt-4o-mini',
  promptTokens: 1500,
  completionTokens: 500,
  totalTokens: 2000,
  estimatedCostUsd: 2000 * 0.000001, // $0.002 (example rate)
  timestamp: new Date().toISOString(),
});
```

---

### Migration Checklist

When moving to production backend:

#### Pre-Migration
- [ ] Set up database (PostgreSQL/MySQL recommended)
- [ ] Run migration scripts to create tables
- [ ] Seed database with existing mock data
- [ ] Configure environment variables
- [ ] Set up LLM API keys
- [ ] Configure LMS adapter (Canvas/Blackboard/etc.)

#### Code Changes
- [ ] Replace `api.*` methods with `fetch()` calls
- [ ] Add `Authorization` headers to all requests
- [ ] Replace `generateConversationResponse()` with LLM provider calls
- [ ] Update error handling to parse backend error format
- [ ] Remove localStorage persistence (use backend as source of truth)
- [ ] Update React Query `staleTime` values (can be longer with backend)

#### Testing
- [ ] Integration tests for all API endpoints
- [ ] Load testing for concurrent conversations
- [ ] LLM provider fallback testing
- [ ] Cost tracking validation
- [ ] Real-time update testing (WebSocket/SSE)

#### Monitoring
- [ ] Set up logging (e.g., Winston, Sentry)
- [ ] Track LLM API latency and error rates
- [ ] Monitor token usage and costs
- [ ] Set up alerts for high costs or errors

---

## Appendices

### A. Example LLM Prompt Template

**Location:** `lib/llm/prompts.ts` (new file)

```typescript
export function buildAIAnswerPrompt(
  question: string,
  materials: CourseMaterial[],
  courseContext: Course
): string {
  return `You are an AI teaching assistant for ${courseContext.name} (${courseContext.code}).

A student asked:
"""
${question}
"""

Relevant course materials:
${materials.map((m, idx) => `
[${idx + 1}] ${m.title} (${m.type})
${m.content.slice(0, 500)}...
`).join('\n')}

Instructions:
1. Answer the question clearly and concisely
2. Cite specific course materials by number [1], [2], etc.
3. Use examples when helpful
4. If the question is unclear, ask for clarification
5. If the materials don't cover the topic, acknowledge this

Answer:`;
}
```

---

### B. Query Key Reference

All conversation-related query keys:

| Key | Format | Invalidated By |
|-----|--------|----------------|
| `conversations` | `['conversations', userId]` | `createConversation`, `deleteConversation`, `convertConversation` |
| `conversation` | `['conversation', conversationId]` | `convertConversation` (marks as converted) |
| `conversationMessages` | `['conversationMessages', conversationId]` | `sendMessage` |

---

### C. Network Delay Reference

| Method | Min (ms) | Max (ms) | Rationale |
|--------|----------|----------|-----------|
| `createConversation` | 400 | 600 | Creates conversation + generates AI response |
| `getUserConversations` | 200 | 500 | List query |
| `getConversationMessages` | 200 | 500 | List query |
| `sendMessage` | 800 | 1200 | AI generation (expensive) |
| `deleteConversation` | 100 | 100 | Quick deletion |
| `convertConversationToThread` | 600 | 800 | Creates thread + updates conversation |
| `syncCourseMaterials` | 2000 | 3000 | Simulates LMS API call |

---

**End of API Design Plan**

**Status:** Ready for implementation. Parent agent should review this plan, then implement in the order specified in Section 6 (Implementation Checklist).
