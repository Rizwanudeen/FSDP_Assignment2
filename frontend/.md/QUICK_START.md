# Quick Start: Cross-Agent Replies

## TL;DR - 3 Steps to Enable Bot-to-Bot Conversations

### Step 1: Database Setup (5 minutes)
```bash
# Execute this SQL file in your MSSQL database:
backend/schemas/add-cross-reply-table.sql
```

### Step 2: Backend Already Ready ✅
The following are **already implemented**:
- ✅ Service layer: `backend/src/services/agentCrossReplyService.ts`
- ✅ Controllers: `backend/src/controllers/agentCrossReplyController.ts`
- ✅ Routes: Updated in `backend/src/routes/agentRoutes.ts`
- ✅ Frontend service: Updated `frontend/src/services/agentService.ts`

### Step 3: Create UI (Your Part!)
Build a component that calls these functions:

```typescript
import agentService from '@/services/agentService';

// User clicks "Save response for cross-replies"
async function saveBotResponseForComparison(messageId, agentId, convId, question) {
  const session = await agentService.createCrossReply({
    originalMessageId: messageId,
    originalAgentId: agentId,
    originalConversationId: convId,
    title: question,
    questionContent: question
  });
  
  // Show session UI where user can add more bot responses
  return session.id;
}

// User chats with another bot
async function addBotResponseToComparison(sessionId, newAgentId, newQuestion) {
  // After new bot responds, get the message ID and add it
  await agentService.addAgentResponse(sessionId, {
    agentId: newAgentId,
    conversationId: newConversationId,
    responseMessageId: newMessageId
  });
}

// Display all bot responses
async function viewAllResponses(sessionId) {
  const session = await agentService.getCrossReplyById(sessionId);
  return session.responses; // Array of all bot responses
}
```

---

## API Routes Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/api/agents/cross-replies` | Create new comparison session |
| **GET** | `/api/agents/cross-replies` | Get all sessions |
| **GET** | `/api/agents/cross-replies/:id` | Get specific session |
| **POST** | `/api/agents/cross-replies/:id/responses` | Add bot response |
| **DELETE** | `/api/agents/cross-replies/:id` | Delete session |

---

## Real-World Example

```typescript
// User workflow:
// 1. "I like what Bot A said, but I want other perspectives"

const session = await agentService.createCrossReply({
  originalMessageId: "msg-123",
  originalAgentId: "bot-a",
  originalConversationId: "conv-456",
  title: "How do I learn React?",
  questionContent: "I'm new to React, where should I start?"
});

// 2. User asks Bot B the same question via chat
// (Bot B responds with new message ID: "msg-789")

await agentService.addAgentResponse(session.id, {
  agentId: "bot-b",
  conversationId: "conv-789",
  responseMessageId: "msg-789"
});

// 3. User asks Bot C the same question
// (Bot C responds with message ID: "msg-101")

await agentService.addAgentResponse(session.id, {
  agentId: "bot-c",
  conversationId: "conv-101",
  responseMessageId: "msg-101"
});

// 4. View all responses side-by-side
const allResponses = await agentService.getCrossReplyById(session.id);

// Result:
{
  title: "How do I learn React?",
  responses: [
    {
      agentName: "Tutorial Bot",
      responseContent: "Start with the official React docs...",
      agentId: "bot-a"
    },
    {
      agentName: "Project Bot",
      responseContent: "Build a todo app first...",
      agentId: "bot-b"
    },
    {
      agentName: "Career Bot", 
      responseContent: "Learn JavaScript fundamentals first...",
      agentId: "bot-c"
    }
  ]
}
```

---

## Database Schema (Simple Version)

**CrossAgentReplies** table stores the "comparison session":
- Links the original question to original bot's response
- Belongs to a user

**CrossAgentResponses** table stores each bot's answer:
- One row per bot that answers the question
- Links bot → response message → session

---

## File Locations

```
Backend:
├── src/
│   ├── controllers/
│   │   └── agentCrossReplyController.ts ← NEW
│   ├── services/
│   │   └── agentCrossReplyService.ts ← NEW
│   └── routes/
│       └── agentRoutes.ts ← MODIFIED
└── schemas/
    └── add-cross-reply-table.sql ← NEW

Frontend:
└── src/services/
    └── agentService.ts ← MODIFIED (added 5 new functions)

Docs:
├── IMPLEMENTATION_SUMMARY.md ← Complete guide
├── CROSS_AGENT_REPLIES_GUIDE.md ← Detailed API docs
└── QUICK_START.md ← This file
```

---

## Common Patterns

### Pattern 1: Add "Get Another Perspective" Button
```typescript
<button onClick={() => {
  const session = await agentService.createCrossReply({
    originalMessageId,
    originalAgentId,
    originalConversationId,
    title: message.text,
    questionContent: message.text
  });
  // Open modal to let user choose another bot
}}>
  Get Another Perspective
</button>
```

### Pattern 2: Show Comparison View
```typescript
const session = await agentService.getCrossReplyById(sessionId);
return (
  <div>
    <h2>{session.title}</h2>
    {session.responses.map(response => (
      <Card key={response.id}>
        <h3>{response.agentName}</h3>
        <p>{response.responseContent}</p>
      </Card>
    ))}
  </div>
);
```

### Pattern 3: Auto-Add After Chat
```typescript
agentService.chatStream(
  agentId,
  question,
  {},
  (token) => updateUI(token),
  async () => {
    // After stream completes, automatically add to comparison
    await agentService.addAgentResponse(sessionId, {
      agentId,
      conversationId: lastConversationId,
      responseMessageId: lastMessageId
    });
  }
);
```

---

## What You Get

✨ **Bot-to-Bot Conversations**: One question, multiple perspectives  
🔄 **Easy Comparison**: Side-by-side bot responses  
💾 **Persistent**: All data saved to database  
🔐 **Secure**: User-specific, authenticated  
⚡ **Fast**: Optimized queries with indexes  
🛠️ **Simple**: Just 5 API endpoints

**You're ready to go! Start building the UI.** 🚀
