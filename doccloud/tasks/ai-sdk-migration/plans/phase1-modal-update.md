# Phase 1.2: QuokkaAssistantModal Update Plan

## Goal
Replace custom React Query mutations with `usePersistedChat` hook to enable real streaming, Stop, and Regenerate functionality.

## Key Changes

### 1. Replace Hooks
**Remove:**
- `useConversationMessages(activeConversationId)` - messages now come from usePersistedChat
- `useSendMessage()` - replaced by chat.sendMessage

**Add:**
- `usePersistedChat({ conversationId, courseId, userId })` - provides messages + streaming

### 2. Update Message Rendering
**Current:** `message.content` (simple string)
**New:** Extract text from `message.parts[]` array

```typescript
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(p => p.type === "text")
    .map(p => ("text" in p ? p.text : ""))
    .join("\n");
}
```

### 3. Form Submission
**Current:** Manual `sendMessage.mutate({ content, conversationId, userId, role })`
**New:** `chat.sendMessage({ content: input })`

### 4. Status Checks
**Current:** `sendMessage.isPending`
**New:** `chat.status === "in-progress"` or `chat.status === "streaming"`

### 5. Stop Button
**Add:** Button visible during streaming
```tsx
{chat.status === "streaming" && (
  <Button onClick={chat.stop}>Stop Generation</Button>
)}
```

### 6. Regenerate Button
**Current:** Re-sends last user message via `sendMessage.mutate`
**New:** `chat.regenerate()` (built-in AI SDK function)

## Implementation Steps

1. Add usePersistedChat import and hook call
2. Create helper function for text extraction
3. Update message rendering loop
4. Update form submission handler
5. Add Stop button in input area
6. Update Regenerate button
7. Update all status checks
8. Test streaming, stop, regenerate

## Testing Checklist

- [ ] Messages load from localStorage on modal open
- [ ] Streaming appears token-by-token
- [ ] Stop button cancels mid-stream
- [ ] Regenerate re-runs last turn
- [ ] Messages persist after reload
- [ ] Course selector still works
- [ ] Post as Thread still works
- [ ] Clear conversation still works
