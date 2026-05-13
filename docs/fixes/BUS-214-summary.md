# BUS-214 Fix Summary: Eve Auth Recognition and Saved Chats

## Problem Statement

Board reported three critical bugs in Eve:
1. **Saved chats not working** — users cannot save or restore chat sessions
2. **Eve doesn't recognize logged-in users** — the chat acts as if the user is unauthenticated even when they're signed in
3. **Eve responded in Chinese unexpectedly** — indicates a language detection issue

## Root Causes

### 1. Missing Auth Context Forwarding
The chat API was not forwarding user authentication information to Eve's OpenClaw proxy, so Eve couldn't recognize logged-in users or personalize responses.

### 2. Session Resume Endpoint Only Accepted Database IDs
The session resume endpoint only looked up sessions by database ID, but resume URLs use the sessionKey (UUID). This caused 404 errors when trying to restore saved chats.

### 3. Critical Bug in Message Loading
Even after fixing the session lookup, we were passing the wrong session ID to `getMessages()`. We passed the input parameter (sessionKey string) instead of the actual database ID from the found session, causing message loading to fail.

### 4. No Language Enforcement
Eve was not explicitly told to respond in English, leading to unexpected language responses.

## Fixes Applied

### Fix 1: Forward Auth Context to Eve (Commit 62b581d)
**File**: `app/api/chat/route.ts`

**Changes**:
- Added `UserContext` interface with auth state (isAuthed, userId, userName, userEmail)
- Modified `callOpenClaw()` to accept and forward `userContext` parameter
- Extracted auth context from authSession and passed it to OpenClaw

```typescript
eveReply = await callOpenClaw(languagePrefix + resumePrefix + lastUserMessage, sessionKey, {
  isAuthed: !!authSession?.user?.id,
  userId: authSession?.user?.id ?? undefined,
  userName: authSession?.user?.name ?? undefined,
  userEmail: authSession?.user?.email ?? undefined,
});
```

### Fix 2: Accept SessionKey for Resume (Commit 62b581d)
**File**: `app/api/chat/sessions/[sessionId]/route.ts`

**Changes**:
- Modified session lookup to try `findById()` first, then `findBySessionKey()` if not found
- This allows resume URLs to work with either database IDs or sessionKeys

```typescript
let chatSession = await chatStore.findById(sessionId);
if (!chatSession) {
  chatSession = await chatStore.findBySessionKey(sessionId);
}
```

### Fix 3: Load and Display Resume Messages (Commit 62b581d)
**File**: `app/chat/page.tsx`

**Changes**:
- Added `resumeMessages` state to store loaded messages
- Fetch messages from session endpoint when resuming
- Render resume messages before new messages in the chat UI

```typescript
fetch(`/api/chat/sessions/${encodeURIComponent(resumeKey)}`)
  .then(r => r.json())
  .then(data => {
    if (data.messages && Array.isArray(data.messages)) {
      setResumeMessages(data.messages);
    }
  })
```

### Fix 4: English Language Enforcement (Commit 62b581d)
**File**: `app/api/chat/route.ts`

**Changes**:
- Added language prefix `[System: Always respond in English.]\n` to all messages

```typescript
const languagePrefix = '[System: Always respond in English.]\n';
eveReply = await callOpenClaw(languagePrefix + resumePrefix + lastUserMessage, ...);
```

### Fix 5: Critical Bug Fix - Use Correct Session ID (Commit e7b5da4)
**File**: `app/api/chat/sessions/[sessionId]/route.ts`

**Changes**:
- Fixed message loading to use `chatSession.id` (database ID) instead of `sessionId` (input parameter)

```typescript
// Before (BROKEN):
const messages = await chatStore.getMessages(sessionId);

// After (FIXED):
const messages = await chatStore.getMessages(chatSession.id);
```

**Why this was critical**: When a user resumes via sessionKey (UUID), we find the session correctly, but then we were passing the sessionKey string to `getMessages()`, which expects a database ID. This always failed to load messages, making saved chats appear empty.

## Testing

### Test Script
Created `test-session-resume.js` to verify:
1. Chat page is accessible
2. Session endpoint returns 404 for non-existent sessions
3. Session endpoint accepts both database IDs and sessionKeys
4. Session endpoint returns correct structure: `{ session, messages }`

### Test Results
```
✅ Chat page accessible
✅ Correctly returns 404 for non-existent session
✅ Session endpoint structure verified
```

## Verification Checklist

To verify the fixes work end-to-end:

1. **Auth Context Forwarding**:
   - Log in as a user
   - Start a chat
   - Eve should recognize the user and personalize responses
   - Check Network tab: POST to /api/chat should include userContext in request body

2. **Saved Chat Resume**:
   - Start a chat session and have a conversation
   - Save the session (note the sessionKey)
   - Close the tab
   - Open `/chat?resume=<sessionKey>`
   - Previous messages should appear in the chat UI

3. **English Language**:
   - Start a new chat
   - Eve should respond in English regardless of user's language

4. **Session Persistence**:
   - Messages are saved to the database
   - Session is associated with userId (if logged in)
   - Session can be retrieved later

## Dependencies

These fixes depend on:
- OpenClaw proxy at `http://127.0.0.1:8097` (Nova's reverse SSH tunnel)
- Database with `chatSession` and `chatMessage` tables
- Auth session from auth() function

## Known Limitations

- OpenClaw proxy must be running (reverse SSH tunnel from Nova)
- If the tunnel drops, chat returns 503
- Auth context is forwarded but depends on OpenClaw proxy to actually use it

## Related Issues

- BUS-213: Original bug report with user transcript
- BUS-210: Chat sessions + userId association
- BUS-205: Sign-in links + JWT session strategy
