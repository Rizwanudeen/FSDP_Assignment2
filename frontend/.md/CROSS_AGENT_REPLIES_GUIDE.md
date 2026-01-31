# Cross-Agent Reply System Documentation

## Overview
This system allows users to save bot responses they like and have other bots answer the same question. It's perfect for getting different perspectives or more conversational responses while keeping track of all the different answers.

## How It Works

### User Flow:
1. User gets a response from Agent A to a question
2. User likes the response and wants to see how other agents would answer
3. User initiates a "Cross-Reply" session - this saves the original question and agent's response
4. User can then have Agents B, C, D, etc. answer the same question
5. User can view all responses side-by-side to compare

## Database Schema

### CrossAgentReplies Table
Stores the cross-reply sessions initiated by users
```sql
- id: UNIQUEIDENTIFIER (Primary Key)
- userId: UNIQUEIDENTIFIER (FK)
- originalMessageId: UNIQUEIDENTIFIER (FK to Messages)
- originalAgentId: UNIQUEIDENTIFIER (FK to Agents)
- originalConversationId: UNIQUEIDENTIFIER (FK to Conversations)
- title: NVARCHAR(MAX)
- questionContent: NVARCHAR(MAX)
- createdAt: DATETIME2
- updatedAt: DATETIME2
```

### CrossAgentResponses Table
Stores individual agent responses within a cross-reply session
```sql
- id: UNIQUEIDENTIFIER (Primary Key)
- crossReplyId: UNIQUEIDENTIFIER (FK to CrossAgentReplies) [CASCADE DELETE]
- agentId: UNIQUEIDENTIFIER (FK to Agents)
- conversationId: UNIQUEIDENTIFIER (FK to Conversations)
- responseMessageId: UNIQUEIDENTIFIER (FK to Messages)
- createdAt: DATETIME2
```

## API Endpoints

### 1. Create Cross-Reply Session
**POST** `/api/agents/cross-replies`

Creates a new cross-reply session when the user saves a response they like.

**Request Body:**
```json
{
  "originalMessageId": "uuid-of-the-liked-message",
  "originalAgentId": "uuid-of-agent-a",
  "originalConversationId": "uuid-of-conversation",
  "title": "Why is the sky blue?",
  "questionContent": "The user's original question text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cross-reply-session-id"
  },
  "message": "Cross-reply session created successfully"
}
```

### 2. Get All Cross-Replies
**GET** `/api/agents/cross-replies`

Fetches all cross-reply sessions for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cross-reply-id",
      "user_id": "user-id",
      "original_message_id": "message-id",
      "original_agent_id": "agent-id",
      "original_conversation_id": "conv-id",
      "title": "Why is the sky blue?",
      "question_content": "Tell me about the sky",
      "created_at": "2026-01-16T10:00:00Z",
      "updated_at": "2026-01-16T10:00:00Z",
      "responses": [
        {
          "id": "response-id",
          "agentId": "agent-b-id",
          "agentName": "Physics Bot",
          "conversationId": "conv-id",
          "responseMessageId": "msg-id",
          "responseContent": "The sky appears blue because...",
          "createdAt": "2026-01-16T10:05:00Z"
        }
      ]
    }
  ]
}
```

### 3. Get Specific Cross-Reply
**GET** `/api/agents/cross-replies/:crossReplyId`

Fetches a specific cross-reply session with all its agent responses.

**Response:** Same format as item in the array above

### 4. Add Agent Response
**POST** `/api/agents/cross-replies/:crossReplyId/responses`

Adds a new agent's response to an existing cross-reply session.

**Request Body:**
```json
{
  "agentId": "uuid-of-agent-b",
  "conversationId": "uuid-of-new-conversation",
  "responseMessageId": "uuid-of-agent-b-response-message"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "response-record-id",
    "cross_reply_id": "cross-reply-id",
    "agent_id": "agent-b-id",
    "conversation_id": "conv-id",
    "response_message_id": "msg-id",
    "created_at": "2026-01-16T10:05:00Z"
  },
  "message": "Agent response added successfully"
}
```

### 5. Delete Cross-Reply
**DELETE** `/api/agents/cross-replies/:crossReplyId`

Deletes a cross-reply session and all associated agent responses.

**Response:**
```json
{
  "success": true,
  "message": "Cross-reply session deleted successfully"
}
```

## Frontend Usage

### Example Flow:

```typescript
import agentService from '@/services/agentService';

// Step 1: User likes a response and wants to save it for cross-replies
const crossReplySession = await agentService.createCrossReply({
  originalMessageId: messageId,
  originalAgentId: agentAId,
  originalConversationId: conversationId,
  title: "Why is the sky blue?",
  questionContent: "Tell me about the sky"
});

console.log('Cross-reply session created:', crossReplySession.id);

// Step 2: Get the cross-reply session with all responses
const session = await agentService.getCrossReplyById(crossReplySession.id);
console.log('Current responses:', session.responses);

// Step 3: Have another agent answer the same question
// First, chat with Agent B using the same question
const chatResult = await agentService.chatStream(
  agentBId,
  "Tell me about the sky",
  { conversationId: null },
  (token) => console.log(token),
  () => {
    // Step 4: After Agent B responds, add their response to the cross-reply
    agentService.addAgentResponse(crossReplySession.id, {
      agentId: agentBId,
      conversationId: newConversationId,
      responseMessageId: agentBResponseMessageId
    });
  }
);

// Step 5: Get all cross-replies to display in UI
const allCrossReplies = await agentService.getCrossReplies();
console.log('All cross-replies:', allCrossReplies);

// Step 6: Delete when done
await agentService.deleteCrossReply(crossReplySession.id);
```

## UI Component Ideas

### Cross-Reply Modal
Add a button on liked messages that opens a modal:
- Shows the original question and first agent's response
- List of other agents with a button "Get another perspective"
- Each agent's response displayed in a card format
- Ability to export or compare responses

### Cross-Reply Dashboard
- List of all cross-reply sessions
- Quick stats: "Agent A answered this question 3 different ways"
- Search and filter cross-replies
- Delete or manage sessions

### Inline Comparison
- Show responses side-by-side
- Highlight differences
- Allow user to rank/vote on best response

## Setup Instructions

### 1. Update Database
Run the migration script to create the tables:
```bash
# Using MSSQL Server Management Studio or similar:
# Execute: backend/schemas/add-cross-reply-table.sql
```

### 2. Backend is Ready
The following files are already implemented:
- `backend/src/services/agentCrossReplyService.ts` - Service layer
- `backend/src/controllers/agentCrossReplyController.ts` - Controller logic
- Routes already added to `backend/src/routes/agentRoutes.ts`

### 3. Frontend Service Updated
`frontend/src/services/agentService.ts` now includes:
- `createCrossReply()`
- `getCrossReplies()`
- `getCrossReplyById()`
- `addAgentResponse()`
- `deleteCrossReply()`

### 4. Build a UI Component
Create components that use the updated `agentService`:
- A button on messages to "Save for cross-replies"
- A new page/modal to view cross-reply sessions
- A component to display and compare responses

## Error Handling

All endpoints return appropriate HTTP status codes:
- `201` - Created (POST requests)
- `200` - Success (GET, DELETE)
- `400` - Bad Request (missing fields)
- `401` - Unauthorized (not logged in)
- `404` - Not Found (session doesn't exist)
- `500` - Server Error

## Performance Considerations

- Indexes are created on frequently queried columns
- CrossAgentResponses has CASCADE DELETE for cleanup
- Queries fetch minimal data with proper joins
- Consider pagination if a session has many responses

## Future Enhancements

1. **Batch Processing**: Add ability to have multiple agents answer simultaneously
2. **Scoring**: Let users rate which response was most helpful
3. **Templates**: Save frequently asked cross-reply questions
4. **Analytics**: Track which agents perform best for specific question types
5. **Export**: Generate reports comparing different agent responses
6. **Conversation Threading**: Link cross-replies back to original conversations

## Notes

- Each cross-reply session is tied to a specific user for privacy
- All data is persisted in the database
- The original message, agent, and conversation are preserved for reference
- No data is deleted unless explicitly requested
