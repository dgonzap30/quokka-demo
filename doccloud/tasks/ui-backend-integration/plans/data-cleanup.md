# Data Cleanup & Migration Plan

**Date:** 2025-10-17
**Task:** UI Backend Integration - Data Layer Preparation
**Status:** No cleanup required - proceed with verification only

---

## Executive Summary

**Cleanup Required:** None ✅
**Migration Required:** None ✅
**Verification Required:** Yes (minimal)

The data layer is production-ready. No old localStorage keys, no schema conflicts, no orphaned data. This plan focuses on verification steps and optional enhancements only.

---

## Phase 1: Pre-Integration Verification (5 minutes)

### Step 1.1: Verify Environment Configuration

**File:** `.env.local`
**Action:** Ensure file exists and has valid LLM configuration

```bash
# Check if .env.local exists
ls -la .env.local

# If missing, copy from template
cp .env.local.example .env.local
```

**Edit `.env.local`:**
```bash
# Enable LLM integration
NEXT_PUBLIC_USE_LLM=true  # Change from false

# Add your API key (choose one provider)
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
# OR
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE

# Enable debug logging for first test
NEXT_PUBLIC_DEBUG_LLM=true
```

**Verification:**
```bash
# Grep for required variables
grep "NEXT_PUBLIC_USE_LLM" .env.local
grep "NEXT_PUBLIC_.*_API_KEY" .env.local
```

**Expected Output:**
```
NEXT_PUBLIC_USE_LLM=true
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-... (or ANTHROPIC)
```

**Rollback:** If LLM fails, set `NEXT_PUBLIC_USE_LLM=false`

---

### Step 1.2: Verify Course Materials Seeding

**Test:** Open app in browser and check localStorage

**Browser Console Commands:**
```javascript
// Check if materials are seeded
const materials = JSON.parse(localStorage.getItem('quokkaq.courseMaterials'));
console.log('Total materials:', materials.length);
console.log('CS101 materials:', materials.filter(m => m.courseId === 'course-cs101').length);
console.log('MATH221 materials:', materials.filter(m => m.courseId === 'course-math221').length);

// Expected output:
// Total materials: 25
// CS101 materials: 12
// MATH221 materials: 13
```

**Verify Seed Version:**
```javascript
console.log('Seed version:', localStorage.getItem('quokkaq.seedVersion'));
// Expected: "v2.1.0"
```

**If Materials Missing:**
```javascript
// Force re-seed by clearing version
localStorage.removeItem('quokkaq.seedVersion');
window.location.reload();
```

---

### Step 1.3: Verify localStorage Structure

**Browser Console Commands:**
```javascript
// List all Quokka keys
Object.keys(localStorage)
  .filter(key => key.startsWith('quokkaq.'))
  .forEach(key => console.log(key));

// Expected 14 keys:
// quokkaq.users
// quokkaq.authSession
// quokkaq.courses
// quokkaq.enrollments
// quokkaq.threads
// quokkaq.posts
// quokkaq.notifications
// quokkaq.aiAnswers
// quokkaq.aiConversations
// quokkaq.conversationMessages
// quokkaq.responseTemplates
// quokkaq.assignments
// quokkaq.courseMaterials
// quokkaq.seedVersion
// quokkaq.initialized
```

**Check Storage Size:**
```javascript
// Calculate total localStorage size
const size = Object.keys(localStorage)
  .filter(key => key.startsWith('quokkaq.'))
  .reduce((total, key) => {
    return total + (localStorage.getItem(key)?.length || 0);
  }, 0);

console.log('Total storage:', (size / 1024).toFixed(2), 'KB');
// Expected: ~300-350 KB (baseline)
```

---

## Phase 2: Post-Integration Testing (15 minutes)

### Step 2.1: Test Conversation Creation

**File:** `app/quokka/page.tsx` (after integration)

**Test Case 1: Create Conversation with Course Context**
```
1. Navigate to /quokka
2. Select a course (if available)
3. Send message: "What is binary search?"
4. Verify AI responds with course-aware answer
5. Check localStorage for new conversation
```

**Browser Console Verification:**
```javascript
// Check new conversation was created
const conversations = JSON.parse(localStorage.getItem('quokkaq.aiConversations'));
console.log('Conversations:', conversations);

// Check messages were stored
const messages = JSON.parse(localStorage.getItem('quokkaq.conversationMessages'));
console.log('Messages:', messages.filter(m => m.conversationId === conversations[0].id));
```

**Expected:**
- 1 conversation in `aiConversations`
- 2 messages in `conversationMessages` (user + AI)
- Conversation has `courseId` (if course selected)
- Message timestamps are ISO 8601

---

### Step 2.2: Test Conversation Persistence

**Test Case 2: Reload Page and Verify Persistence**
```
1. Note current conversation ID from localStorage
2. Reload page (Cmd+R or F5)
3. Verify conversation still exists
4. Send another message
5. Verify new message added to same conversation
```

**Browser Console Verification:**
```javascript
// Before reload: save conversation ID
const convId = JSON.parse(localStorage.getItem('quokkaq.aiConversations'))[0].id;
console.log('Conversation ID:', convId);

// After reload: verify same ID exists
const convAfter = JSON.parse(localStorage.getItem('quokkaq.aiConversations'))[0];
console.log('Conversation still exists:', convAfter.id === convId);
```

---

### Step 2.3: Test LLM Integration with Materials

**Test Case 3: Verify Course Materials Used in LLM Context**

**Enable Debug Logging:**
```bash
# In .env.local
NEXT_PUBLIC_DEBUG_LLM=true
```

**Test:**
```
1. Navigate to /quokka
2. Select CS101 course
3. Send message: "Explain binary search algorithm"
4. Check browser console for LLM logs
```

**Expected Console Output:**
```
[AI] LLM response generated successfully {
  provider: 'openai',
  model: 'gpt-4o-mini',
  tokens: 450,
  cost: 0.0003,
  materialsUsed: 3  // Should show 2-5 materials
}
```

**Verify Materials in Response:**
- Response should mention specific lecture numbers
- Citations should reference real course materials
- Confidence score should be >60% (material-based, not template)

---

### Step 2.4: Test Conversation Deletion

**Test Case 4: Delete Conversation and Verify Cascade**

**Browser Console:**
```javascript
// Get conversation ID
const convId = JSON.parse(localStorage.getItem('quokkaq.aiConversations'))[0].id;

// Count messages before delete
const messagesBefore = JSON.parse(localStorage.getItem('quokkaq.conversationMessages'))
  .filter(m => m.conversationId === convId);
console.log('Messages before delete:', messagesBefore.length);

// Delete via UI or API
// (Use delete button in UI when implemented)

// Verify messages deleted
const messagesAfter = JSON.parse(localStorage.getItem('quokkaq.conversationMessages'))
  .filter(m => m.conversationId === convId);
console.log('Messages after delete:', messagesAfter.length); // Should be 0
```

---

### Step 2.5: Test Conversation to Thread Conversion

**Test Case 5: Convert Conversation to Public Thread**

**Test:**
```
1. Create conversation with 3-5 messages
2. Click "Post as Thread" button
3. Verify thread created in course
4. Check localStorage for both conversation and thread
```

**Browser Console Verification:**
```javascript
// Check thread was created
const threads = JSON.parse(localStorage.getItem('quokkaq.threads'));
const newThread = threads[threads.length - 1];
console.log('New thread:', newThread);

// Verify conversation still exists
const conversations = JSON.parse(localStorage.getItem('quokkaq.aiConversations'));
console.log('Conversation preserved:', conversations.length > 0);

// Check thread has AI answer
console.log('Thread has AI answer:', newThread.hasAIAnswer);
console.log('AI answer ID:', newThread.aiAnswerId);
```

---

## Phase 3: Fallback Testing (5 minutes)

### Step 3.1: Test Template Fallback

**Disable LLM:**
```bash
# In .env.local
NEXT_PUBLIC_USE_LLM=false
```

**Test:**
```
1. Reload page
2. Send message: "What is binary search?"
3. Verify template-based response (keyword matching)
4. Check response still has citations (from course materials)
```

**Expected Behavior:**
- Response uses template (predictable, pattern-matched)
- Citations still reference real course materials
- Confidence score 55-95% (template-based)
- No LLM API calls in console logs

---

### Step 3.2: Test Invalid API Key Fallback

**Set Invalid Key:**
```bash
# In .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-invalid-key
NEXT_PUBLIC_USE_LLM=true
```

**Test:**
```
1. Reload page
2. Send message
3. Verify fallback to templates (not error)
```

**Expected Console Output:**
```
[AI] LLM generation error: [API error message]
[AI] Falling back to template system
```

---

## Phase 4: Storage Monitoring (Ongoing)

### Step 4.1: Add Storage Size Monitoring

**Optional Enhancement:** Add UI indicator for storage usage

**Implementation:**
```typescript
// In app/quokka/page.tsx or modal
function getStorageSize(): number {
  return Object.keys(localStorage)
    .filter(key => key.startsWith('quokkaq.'))
    .reduce((total, key) => {
      return total + (localStorage.getItem(key)?.length || 0);
    }, 0);
}

// Usage
const storageKB = (getStorageSize() / 1024).toFixed(2);
console.log(`Storage: ${storageKB} KB`);
```

**Add to Debug Panel (optional):**
```tsx
{process.env.NEXT_PUBLIC_DEBUG_LLM === 'true' && (
  <div className="text-xs text-muted-foreground">
    Storage: {(getStorageSize() / 1024).toFixed(2)} KB
  </div>
)}
```

---

### Step 4.2: Monitor Conversation Growth

**Check Periodically:**
```javascript
// Browser console
const conversations = JSON.parse(localStorage.getItem('quokkaq.aiConversations'));
const messages = JSON.parse(localStorage.getItem('quokkaq.conversationMessages'));

console.log('Conversations:', conversations.length);
console.log('Messages:', messages.length);
console.log('Avg messages per conversation:', (messages.length / conversations.length).toFixed(1));
```

**Warning Thresholds:**
- Conversations > 50: Consider archiving old ones
- Messages > 500: Consider pruning short conversations
- Storage > 2MB: Implement pruning strategy

---

## Phase 5: Optional Enhancements (Future)

### Enhancement 1: Conversation Archiving

**Goal:** Hide old conversations without deleting

**Schema Change:**
```typescript
// Add to AIConversation interface
interface AIConversation {
  // ... existing fields
  archived?: boolean;
  archivedAt?: string;
}
```

**API Method:**
```typescript
// lib/api/client.ts
async archiveConversation(conversationId: string): Promise<void> {
  const conversation = getConversationById(conversationId);
  if (conversation) {
    updateConversation(conversationId, {
      archived: true,
      archivedAt: new Date().toISOString(),
    });
  }
}
```

**UI Filter:**
```typescript
// In useAIConversations hook
const activeConversations = conversations.filter(c => !c.archived);
```

**Benefit:** Reduces visual clutter, keeps history safe

---

### Enhancement 2: Conversation Export

**Goal:** Export conversation as markdown file

**Implementation:**
```typescript
// lib/api/client.ts
function exportConversation(conversationId: string): string {
  const conversation = getConversationById(conversationId);
  const messages = getConversationMessages(conversationId);

  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Date:** ${new Date(conversation.createdAt).toLocaleDateString()}\n`;
  markdown += `**Course:** ${conversation.courseId || 'General'}\n\n`;
  markdown += `---\n\n`;

  messages.forEach(msg => {
    const role = msg.role === 'user' ? 'You' : 'Quokka';
    markdown += `### ${role}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
  });

  return markdown;
}

// Download helper
function downloadConversation(conversationId: string) {
  const markdown = exportConversation(conversationId);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quokka-conversation-${conversationId}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**UI Integration:**
```tsx
<Button onClick={() => downloadConversation(conv.id)}>
  <Download className="h-4 w-4 mr-2" />
  Export as Markdown
</Button>
```

**Benefit:** Users can save important conversations outside localStorage

---

### Enhancement 3: Conversation Pruning

**Goal:** Auto-delete old, short conversations

**Implementation:**
```typescript
// lib/api/client.ts
function pruneOldConversations(maxAge: number = 90): number {
  const conversations = getAIConversations();
  const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);

  let prunedCount = 0;
  conversations
    .filter(c => {
      const isOld = new Date(c.updatedAt) < cutoffDate;
      const isShort = c.messageCount < 3;
      return isOld && isShort;
    })
    .forEach(c => {
      deleteConversation(c.id);
      prunedCount++;
    });

  return prunedCount;
}

// Auto-run on app load (optional)
if (typeof window !== 'undefined') {
  const storageSize = getStorageSize();
  if (storageSize > 2 * 1024 * 1024) { // If > 2MB
    console.log('[Storage] Running auto-prune...');
    const pruned = pruneOldConversations(90);
    console.log(`[Storage] Pruned ${pruned} old conversations`);
  }
}
```

**Benefit:** Prevents localStorage quota issues

---

## Phase 6: Rollback Procedures

### Rollback Level 1: Disable LLM (No Data Loss)

**When:** LLM integration causes issues, but data is fine

**Steps:**
```bash
# In .env.local
NEXT_PUBLIC_USE_LLM=false
```

**Result:**
- Immediate fallback to template system
- All conversations preserved
- No code changes needed

---

### Rollback Level 2: Clear Conversations (Preserve Threads)

**When:** Conversation data corrupted or causing issues

**Steps:**
```javascript
// Browser console
localStorage.removeItem('quokkaq.aiConversations');
localStorage.removeItem('quokkaq.conversationMessages');

// Reload page
window.location.reload();
```

**Result:**
- Private conversations deleted
- Public threads unchanged
- Users can create new conversations

---

### Rollback Level 3: Full Data Reset

**When:** Critical localStorage corruption

**Steps:**
```javascript
// Browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('quokkaq.'))
  .forEach(key => localStorage.removeItem(key));

// Reload page (will re-seed from JSON files)
window.location.reload();
```

**Result:**
- All data cleared
- Re-seeds from `mocks/*.json` files
- Users lose custom conversations/threads

---

## Success Criteria

### Data Layer Health Checklist

- [ ] `.env.local` exists with valid LLM configuration
- [ ] Course materials seeded (25 materials total)
- [ ] Seed version is `v2.1.0`
- [ ] All 14 localStorage keys present
- [ ] Storage size < 500KB (baseline + 1-2 conversations)
- [ ] Conversation creates and persists across reloads
- [ ] Messages store correctly with conversation ID
- [ ] Cascade delete removes conversation + messages
- [ ] Conversation to thread conversion works
- [ ] Template fallback works when LLM disabled
- [ ] Invalid API key falls back gracefully
- [ ] Debug logging shows LLM using course materials

---

## Timeline

**Phase 1: Pre-Integration Verification** - 5 minutes
**Phase 2: Post-Integration Testing** - 15 minutes
**Phase 3: Fallback Testing** - 5 minutes
**Phase 4: Storage Monitoring** - 2 minutes setup
**Phase 5: Optional Enhancements** - Future (Phase 2)
**Phase 6: Rollback Testing** - 5 minutes

**Total Core Time:** 30 minutes
**With Enhancements:** +2 hours (optional, future)

---

## Conclusion

**Data Cleanup Required:** None ✅
**Migration Required:** None ✅
**Next Step:** Proceed directly to UI integration with conversation hooks

The data layer is production-ready. Focus on verification steps in this plan, then move to component integration (next agent task: Component Architect).
