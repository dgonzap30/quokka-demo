# Phase 3.1: Module Extraction Implementation Guide

**Status:** 2/9 modules complete (22%)
**Completed:** auth, notifications
**Remaining:** courses, threads, posts, ai-answers, conversations, materials, instructor

---

## Completed Examples

### ✅ auth.ts (175 lines)
**Methods:** login, signup, logout, getCurrentUser, restoreSession
**Pattern Established:**
```typescript
import type { User, AuthResult, AuthSession } from "@/lib/models/types";
import { seedData, getAuthSession, setAuthSession } from "@/lib/store/localStore";
import { delay, generateId } from "./utils";

export const authAPI = {
  async login(input: LoginInput): Promise<AuthResult> {
    await delay(300 + Math.random() * 200);
    seedData();
    // ... implementation
  },
  // ... other methods
};
```

### ✅ notifications.ts (90 lines)
**Methods:** getNotifications, markNotificationRead, markAllNotificationsRead
**Key Learning:** Renamed imports to avoid naming conflicts with local functions

---

## Remaining Modules

### 1. courses.ts (~250 lines)
**Priority:** HIGH
**Effort:** 2-3 hours
**Methods to Extract:**

```typescript
export const coursesAPI = {
  async getAllCourses(): Promise<Course[]>
  async getUserCourses(userId: string): Promise<Course[]>
  async getCourse(courseId: string): Promise<Course | null>
  async getCourseMetrics(courseId: string): Promise<CourseMetrics>
  async getCourseInsights(courseId: string): Promise<CourseInsight>
}
```

**Source Lines:** 633-791 in client.ts
**Dependencies:**
- `lib/utils/dashboard-calculations` (createStatWithTrend, createGoal, etc.)
- `lib/utils/quokka-points` (calculateQuokkaPoints)
- `lib/store/localStore` (getCourses, getCourseById, etc.)

**Steps:**
1. Create `lib/api/client/courses.ts`
2. Copy methods from client.ts:633-791
3. Import dependencies (delay, generateId, seed Data, course accessors)
4. Export as `coursesAPI`
5. Update `client/index.ts` to import and spread `...coursesAPI`
6. Remove methods from legacy binding list

---

### 2. threads.ts (~500 lines)
**Priority:** HIGH
**Effort:** 4-6 hours
**Methods to Extract:**

```typescript
export const threadsAPI = {
  async getCourseThreads(courseId: string): Promise<ThreadWithAIAnswer[]>
  async getThread(threadId: string): Promise<ThreadDetails | null>
  async createThread(input: CreateThreadInput, authorId: string): Promise<CreateThreadResult>
  async endorseThread(threadId: string, userId: string): Promise<void>
  async upvoteThread(threadId: string, userId: string): Promise<void>
  async removeUpvote(threadId: string, userId: string): Promise<void>
  async checkThreadDuplicates(input: CreateThreadInput): Promise<SimilarThread[]>
  async mergeThreads(sourceId: string, targetId: string, userId: string): Promise<Thread>
}
```

**Source Lines:** 676-704, 923-996, 2243-2596 in client.ts
**Dependencies:**
- `lib/utils/similarity` (findSimilarDocuments)
- `lib/store/metrics` (trackThreadCreated)
- `lib/store/localStore` (getThreads, getThreadsByCourse, addThread, etc.)

**Complexity:** High - includes duplicate detection with TF-IDF similarity

---

### 3. posts.ts (~150 lines)
**Priority:** MEDIUM
**Effort:** 1-2 hours
**Methods to Extract:**

```typescript
export const postsAPI = {
  async createPost(input: CreatePostInput, authorId: string): Promise<Post>
  // Note: endorsePost and flagPost don't exist in current codebase
}
```

**Source Lines:** 997-1025 in client.ts
**Dependencies:**
- `lib/store/localStore` (getPosts, addPost)
- `lib/store/metrics` (trackResponseGenerated)

---

### 4. ai-answers.ts (~400 lines)
**Priority:** HIGH
**Effort:** 3-5 hours
**Methods to Extract:**

```typescript
export const aiAnswersAPI = {
  async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer>
  async generateAIPreview(input: GenerateAIAnswerInput): Promise<AIAnswer>
  async getAIAnswer(threadId: string): Promise<AIAnswer | null>
  async endorseAIAnswer(input: EndorseAIAnswerInput): Promise<AIAnswer>
  async bulkEndorseAIAnswers(input: BulkEndorseInput): Promise<BulkActionResult>
}
```

**Source Lines:** 1415-1936 in client.ts
**Dependencies:**
- Template fallback function (generateSimpleFallbackMessage)
- `lib/store/localStore` (getAIAnswers, addAIAnswer, updateAIAnswer)
- `lib/store/metrics` (trackPreviewGenerated)

**Note:** Uses template-based fallback system - production uses `/api/answer` endpoint

---

### 5. conversations.ts (~350 lines)
**Priority:** HIGH
**Effort:** 3-4 hours
**Methods to Extract:**

```typescript
export const conversationsAPI = {
  async createConversation(input: CreateConversationInput): Promise<AIConversation>
  async getAIConversations(userId: string): Promise<AIConversation[]>
  async getConversationMessages(conversationId: string): Promise<AIMessage[]>
  async sendMessage(input: SendMessageInput): Promise<MessageResult>
  async deleteAIConversation(conversationId: string): Promise<void>
  async convertConversationToThread(input: ConversationToThreadInput): Promise<ConversationToThreadResult>
}
```

**Source Lines:** 1988-2241 in client.ts
**Dependencies:**
- `lib/store/localStore` (getAIConversations, addConversation, addMessage, etc.)
- `lib/store/metrics` (trackConversationCreated, trackMessageSent)

**Complexity:** High - includes conversation-to-thread conversion logic

---

### 6. materials.ts (~200 lines)
**Priority:** MEDIUM
**Effort:** 2-3 hours
**Methods to Extract:**

```typescript
export const materialsAPI = {
  async getCourseMaterials(courseId: string): Promise<CourseMaterial[]>
  async searchCourseMaterials(input: SearchCourseMaterialsInput): Promise<CourseMaterialSearchResult[]>
}
```

**Source Lines:** 792-878 in client.ts
**Dependencies:**
- `lib/store/localStore` (getCourseMaterials, getCourseMaterialsByCourse)
- Simple keyword-based search logic

---

### 7. instructor.ts (~800 lines) ⚠️ LARGE
**Priority:** HIGH
**Effort:** 6-10 hours
**Methods to Extract:**

```typescript
export const instructorAPI = {
  async getStudentDashboard(userId: string): Promise<StudentDashboardData>
  async getInstructorDashboard(userId: string): Promise<InstructorDashboardData>
  async getFrequentlyAskedQuestions(courseId: string): Promise<FrequentlyAskedQuestion[]>
  async getTrendingTopics(courseId: string, timeRange?: TimeRange): Promise<TrendingTopic[]>
  async getInstructorInsights(userId: string): Promise<InstructorInsight[]>
  async searchQuestions(input: SearchQuestionsInput): Promise<QuestionSearchResult[]>
  async getResponseTemplates(userId: string): Promise<ResponseTemplate[]>
  async saveResponseTemplate(input: CreateResponseTemplateInput, userId: string): Promise<ResponseTemplate>
  async deleteResponseTemplate(templateId: string): Promise<void>
}
```

**Source Lines:** 1027-1987 in client.ts
**Dependencies:**
- `lib/utils/dashboard-calculations` (all calculation utilities)
- `lib/utils/quokka-points` (calculateQuokkaPoints)
- `lib/utils/assignment-qa` (calculateAllAssignmentQA)
- `lib/store/localStore` (multiple accessors)

**Complexity:** VERY HIGH - complex dashboard calculation logic

**Recommendation:** Consider splitting further into:
- `instructor/dashboards.ts` (student + instructor dashboards)
- `instructor/insights.ts` (FAQs, trends, insights)
- `instructor/templates.ts` (response templates)

---

## Implementation Steps (Per Module)

### Step 1: Create Module File
```bash
touch lib/api/client/{module-name}.ts
```

### Step 2: Setup Module Structure
```typescript
// ============================================
// {Module Name} API Module
// ============================================

import type { /* types */ } from "@/lib/models/types";
import { /* localStore functions */ } from "@/lib/store/localStore";
import { delay, generateId } from "./utils";

export const {moduleName}API = {
  // ... methods
};
```

### Step 3: Extract Methods
- Copy methods from client.ts (use source line numbers above)
- Update imports as needed
- Rename conflicting function names with "FromStore" suffix (see notifications.ts example)

### Step 4: Update Main Index
```typescript
// lib/api/client/index.ts
import { {moduleName}API } from "./{module-name}";

export const api = {
  ...{moduleName}API,
  // ... remove from legacy bindings
};
```

### Step 5: Verify
```bash
npx tsc --noEmit
```

### Step 6: Remove Legacy Bindings
Delete the `.bind(legacyAPI)` lines from index.ts once module is imported

---

## Testing Strategy

After extracting each module:
1. Run typecheck: `npx tsc --noEmit`
2. Start dev server: `npm run dev`
3. Test related UI flows manually
4. Verify no runtime errors in console

---

## Completion Checklist

- [ ] courses.ts extracted
- [ ] threads.ts extracted
- [ ] posts.ts extracted
- [ ] ai-answers.ts extracted
- [ ] conversations.ts extracted
- [ ] materials.ts extracted
- [ ] instructor.ts extracted
- [ ] All imports updated in client/index.ts
- [ ] Legacy API bindings removed from index.ts
- [ ] All methods working in dev environment
- [ ] TypeScript compiles with no errors
- [ ] Delete original client.ts file
- [ ] Update all `import { api } from "@/lib/api/client"` references if needed (should work automatically via index.ts)

---

## Estimated Total Effort

| Module | Effort | Priority |
|--------|--------|----------|
| courses | 2-3h | HIGH |
| threads | 4-6h | HIGH |
| posts | 1-2h | MEDIUM |
| ai-answers | 3-5h | HIGH |
| conversations | 3-4h | HIGH |
| materials | 2-3h | MEDIUM |
| instructor | 6-10h | HIGH |

**Total:** 21-33 hours (3-4 days full-time)

---

## Notes

- **Pattern Established:** auth.ts and notifications.ts show the complete pattern
- **Backward Compatible:** Import paths unchanged (`@/lib/api/client`)
- **No Breaking Changes:** All existing functionality preserved during migration
- **Incremental Approach:** Each module can be extracted and tested independently
- **Helper Functions:** delay() and generateId() moved to utils.ts (already done)

---

**Next Steps:**
1. Extract courses.ts (simplest remaining module)
2. Extract materials.ts (also simple)
3. Extract posts.ts (single method)
4. Extract threads.ts, ai-answers.ts, conversations.ts (complex, in any order)
5. Extract instructor.ts last (most complex - consider sub-splitting)
6. Final cleanup and delete client.ts
