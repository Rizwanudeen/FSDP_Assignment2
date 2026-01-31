# Cross-Agent Replies - TypeScript Types

Add these types to your TypeScript project for better type safety:

```typescript
// src/types/crossReplies.ts

/**
 * Represents a cross-agent reply session
 * A session is created when a user wants to save a response 
 * and compare it with other agents' responses to the same question
 */
export interface CrossReplySession {
  id: string;
  userId: string;
  originalMessageId: string;
  originalAgentId: string;
  originalConversationId: string;
  title: string;
  questionContent: string;
  createdAt: string;
  updatedAt: string;
  responses: AgentResponse[];
}

/**
 * Represents an agent's response within a cross-reply session
 */
export interface AgentResponse {
  id: string;
  agentId: string;
  agentName: string;
  conversationId: string;
  responseMessageId: string;
  responseContent: string;
  createdAt: string;
}

/**
 * Request payload for creating a cross-reply session
 */
export interface CreateCrossReplyRequest {
  originalMessageId: string;
  originalAgentId: string;
  originalConversationId: string;
  title: string;
  questionContent: string;
}

/**
 * Response from creating a cross-reply session
 */
export interface CreateCrossReplyResponse {
  id: string;
}

/**
 * Request payload for adding an agent response
 */
export interface AddAgentResponseRequest {
  agentId: string;
  conversationId: string;
  responseMessageId: string;
}

/**
 * API Response wrapper for success
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API Response wrapper for errors
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/**
 * Combined API response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Hook return type for useCrossReplies
 */
export interface UseCrossRepliesReturn {
  sessions: CrossReplySession[];
  activeSession: CrossReplySession | null;
  isLoading: boolean;
  error: string | null;
  createSession: (data: CreateCrossReplyRequest) => Promise<string>;
  addResponse: (sessionId: string, data: AddAgentResponseRequest) => Promise<void>;
  fetchAllSessions: () => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

/**
 * Database model for CrossAgentReplies table
 */
export interface CrossAgentRepliesRecord {
  id: string;
  user_id: string;
  original_message_id: string;
  original_agent_id: string;
  original_conversation_id: string;
  title: string;
  question_content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database model for CrossAgentResponses table
 */
export interface CrossAgentResponsesRecord {
  id: string;
  cross_reply_id: string;
  agent_id: string;
  conversation_id: string;
  response_message_id: string;
  created_at: string;
}

/**
 * Extended agent response with agent details
 */
export interface AgentResponseWithDetails extends AgentResponse {
  agent: AgentDetails;
  message: MessageDetails;
}

/**
 * Agent details for display
 */
export interface AgentDetails {
  id: string;
  name: string;
  avatar?: string;
  type: string;
  description: string;
}

/**
 * Message details for display
 */
export interface MessageDetails {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

/**
 * Comparison statistics
 */
export interface ComparisonStats {
  totalResponses: number;
  agentCount: number;
  averageLength: number;
  mostLiked?: AgentResponse;
}

/**
 * Comparison metadata
 */
export interface ComparisonMetadata {
  sessionId: string;
  originalQuestion: string;
  createdAt: string;
  stats: ComparisonStats;
}

/**
 * User's cross-reply activity
 */
export interface UserCrossReplyActivity {
  totalSessions: number;
  totalResponses: number;
  avgResponsesPerSession: number;
  recentSessions: CrossReplySession[];
}

/**
 * Service method return types
 */
export namespace CrossReplyService {
  export type CreateResult = { id: string };
  export type FetchResult = CrossReplySession[];
  export type FetchOneResult = CrossReplySession | null;
  export type AddResponseResult = AgentResponse;
  export type DeleteResult = boolean;
}

/**
 * Error types
 */
export type CrossReplyError = 
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Service error wrapper
 */
export interface ServiceError {
  type: CrossReplyError;
  message: string;
  statusCode: number;
}

/**
 * UI State for cross-replies
 */
export interface CrossRepliesUIState {
  selectedSession: CrossReplySession | null;
  isViewingComparison: boolean;
  isCreatingSession: boolean;
  isAddingResponse: boolean;
  error: ServiceError | null;
  successMessage: string | null;
}

/**
 * Props for MessageWithCompare component
 */
export interface MessageWithCompareProps {
  messageId: string;
  agentId: string;
  conversationId: string;
  content: string;
  questionText: string;
  role: 'user' | 'assistant';
  onSaveForComparison?: (sessionId: string) => void;
}

/**
 * Props for ComparisonView component
 */
export interface ComparisonViewProps {
  sessionId: string;
  onClose?: () => void;
  onAddResponse?: (agentId: string) => void;
}

/**
 * Props for ComparisonCard component
 */
export interface ComparisonCardProps {
  response: AgentResponse;
  index: number;
  onRate?: (rating: number) => void;
  onCopy?: () => void;
}

/**
 * Props for CrossReplyList component
 */
export interface CrossReplyListProps {
  sessions: CrossReplySession[];
  onSelectSession: (session: CrossReplySession) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: 'newest' | 'oldest' | 'most-responses';
}

/**
 * Filter params for cross-replies
 */
export interface CrossReplyFilterParams {
  agentIds?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchText?: string;
  minResponses?: number;
}

/**
 * Query params combined
 */
export interface CrossReplyQueryParams extends PaginationParams, CrossReplyFilterParams {}

/**
 * Batch operation request
 */
export interface BatchAddResponsesRequest {
  sessionId: string;
  responses: AddAgentResponseRequest[];
}

/**
 * Batch operation result
 */
export interface BatchAddResponsesResult {
  successful: string[];
  failed: Array<{ agentId: string; error: string }>;
}

/**
 * Export comparison data
 */
export interface ExportComparisonData {
  format: 'pdf' | 'json' | 'csv';
  includeTimestamps: boolean;
  includeAgentInfo: boolean;
}

/**
 * Session activity log entry
 */
export interface SessionActivityLog {
  timestamp: string;
  action: 'created' | 'response_added' | 'response_removed' | 'viewed' | 'deleted';
  agentId?: string;
  details?: Record<string, any>;
}
```

---

## Usage Examples

```typescript
// src/pages/ChatPage.tsx
import { 
  CrossReplySession, 
  CreateCrossReplyRequest,
  AddAgentResponseRequest,
  MessageWithCompareProps 
} from '@/types/crossReplies';

// Create a cross-reply session
const createSession = async (data: CreateCrossReplyRequest) => {
  // Type safe!
  const result = await agentService.createCrossReply(data);
  // result is { id: string }
};

// Add a response to a session
const addResponse = async (
  sessionId: string, 
  data: AddAgentResponseRequest
) => {
  // Type safe!
  await agentService.addAgentResponse(sessionId, data);
};

// MessageWithCompare component with types
const MessageComponent: React.FC<MessageWithCompareProps> = ({
  messageId,
  agentId,
  conversationId,
  content,
  questionText,
  role,
  onSaveForComparison
}) => {
  // All props are typed!
  return <div>{content}</div>;
};

// Hook with return type
const useCrossReplies = (): UseCrossRepliesReturn => {
  // Implementation with full type support
  return {
    sessions: [],
    activeSession: null,
    isLoading: false,
    error: null,
    createSession: async () => '',
    addResponse: async () => {},
    fetchAllSessions: async () => {},
    fetchSession: async () => {},
    deleteSession: async () => {}
  };
};
```

---

## Update Your index.ts

```typescript
// src/types/index.ts
export * from './crossReplies';

// Export commonly used types
export type {
  CrossReplySession,
  AgentResponse,
  CreateCrossReplyRequest,
  AddAgentResponseRequest,
  UseCrossRepliesReturn,
  MessageWithCompareProps,
  ComparisonViewProps
} from './crossReplies';
```

These types provide full type safety throughout your cross-agent reply implementation! 🎉
