# Cross-Agent Replies - React Component Examples

## Example 1: Save Response Button (In Message Component)

```typescript
// src/components/MessageWithCompare.tsx
import React, { useState } from 'react';
import { agentService } from '@/services/agentService';

interface MessageWithCompareProps {
  messageId: string;
  agentId: string;
  conversationId: string;
  content: string;
  questionText: string;
  role: 'user' | 'assistant';
}

export const MessageWithCompare: React.FC<MessageWithCompareProps> = ({
  messageId,
  agentId,
  conversationId,
  content,
  questionText,
  role
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSaveForComparison = async () => {
    setIsSaving(true);
    try {
      const result = await agentService.createCrossReply({
        originalMessageId: messageId,
        originalAgentId: agentId,
        originalConversationId: conversationId,
        title: questionText,
        questionContent: questionText
      });

      setSessionId(result.id);
      setShowSaveModal(false);

      // Optionally show success toast
      console.log('Cross-reply session created:', result.id);
    } catch (error) {
      console.error('Error saving for comparison:', error);
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  if (role !== 'assistant') return <div>{content}</div>;

  return (
    <div className="message-container">
      <div className="message-content">{content}</div>
      
      <div className="message-actions">
        <button 
          onClick={() => setShowSaveModal(true)}
          className="btn-secondary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : '📊 Get Other Perspectives'}
        </button>

        {sessionId && (
          <span className="success-badge">
            ✅ Saved for comparison
          </span>
        )}
      </div>

      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Save This Response?</h3>
            <p>
              You'll be able to ask other bots the same question and compare their responses.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveForComparison}
                className="btn-primary"
              >
                Yes, Save for Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Example 2: Cross-Reply Manager Hook

```typescript
// src/hooks/useCrossReplies.ts
import { useState, useCallback } from 'react';
import { agentService } from '@/services/agentService';

interface UseCrossRepliesReturn {
  sessions: any[];
  activeSession: any | null;
  isLoading: boolean;
  error: string | null;
  createSession: (data: any) => Promise<string>;
  addResponse: (sessionId: string, data: any) => Promise<void>;
  fetchAllSessions: () => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const useCrossReplies = (): UseCrossRepliesReturn => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await agentService.createCrossReply(data);
      setActiveSession({
        ...data,
        id: result.id,
        responses: [],
        createdAt: new Date().toISOString()
      });
      return result.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addResponse = useCallback(async (sessionId: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.addAgentResponse(sessionId, data);
      // Refresh the session to show new response
      await fetchSession(sessionId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await agentService.getCrossReplies();
      setSessions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await agentService.getCrossReplyById(sessionId);
      setActiveSession(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.deleteCrossReply(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessions, activeSession]);

  return {
    sessions,
    activeSession,
    isLoading,
    error,
    createSession,
    addResponse,
    fetchAllSessions,
    fetchSession,
    deleteSession
  };
};
```

---

## Example 3: Comparison View Component

```typescript
// src/components/ComparisonView.tsx
import React, { useEffect, useState } from 'react';
import { useCrossReplies } from '@/hooks/useCrossReplies';

interface ComparisonViewProps {
  sessionId: string;
  onClose?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  sessionId,
  onClose
}) => {
  const { activeSession, fetchSession, isLoading, error } = useCrossReplies();

  useEffect(() => {
    fetchSession(sessionId);
  }, [sessionId, fetchSession]);

  if (isLoading) {
    return <div className="loading">Loading responses...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!activeSession) {
    return <div className="error">Session not found</div>;
  }

  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <h2>{activeSession.title}</h2>
        {onClose && (
          <button onClick={onClose} className="btn-icon">
            ✕
          </button>
        )}
      </div>

      <div className="original-response">
        <h3>Original Response</h3>
        <div className="response-card highlighted">
          <div className="response-agent">
            Starting point for comparison
          </div>
        </div>
      </div>

      {activeSession.responses && activeSession.responses.length > 0 ? (
        <div className="responses-grid">
          <h3>Other Perspectives ({activeSession.responses.length})</h3>
          
          <div className="responses-container">
            {activeSession.responses.map((response, index) => (
              <div key={response.id} className="response-card">
                <div className="response-header">
                  <span className="response-agent">
                    🤖 {response.agentName}
                  </span>
                  <span className="response-number">#{index + 1}</span>
                </div>
                
                <div className="response-content">
                  {response.responseContent}
                </div>
                
                <div className="response-footer">
                  <small>
                    {new Date(response.createdAt).toLocaleString()}
                  </small>
                  <div className="response-actions">
                    <button className="btn-small">📋 Copy</button>
                    <button className="btn-small">⭐ Like</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No responses yet. Ask another bot the same question!</p>
        </div>
      )}

      <div className="comparison-actions">
        <button className="btn-primary">
          📝 Ask Another Bot
        </button>
        <button className="btn-secondary">
          💾 Save Comparison
        </button>
      </div>
    </div>
  );
};
```

---

## Example 4: Cross-Reply Manager Page

```typescript
// src/pages/CrossRepliesDashboard.tsx
import React, { useEffect } from 'react';
import { useCrossReplies } from '@/hooks/useCrossReplies';
import { ComparisonView } from '@/components/ComparisonView';

export const CrossRepliesDashboard: React.FC = () => {
  const {
    sessions,
    activeSession,
    isLoading,
    error,
    fetchAllSessions,
    deleteSession,
    fetchSession
  } = useCrossReplies();

  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  return (
    <div className="dashboard">
      <h1>Comparison Sessions</h1>
      <p className="subtitle">
        View all your bot comparison sessions and analyze different perspectives
      </p>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {isLoading && sessions.length === 0 ? (
        <div className="loading">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <h3>No Comparison Sessions Yet</h3>
          <p>
            Save bot responses during conversations to start comparing perspectives!
          </p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session) => (
            <div key={session.id} className="session-card">
              <h3>{session.title}</h3>
              
              <div className="session-meta">
                <span>
                  📊 {session.responses?.length || 0} Responses
                </span>
                <span>
                  📅 {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="session-preview">
                <p>{session.question_content.substring(0, 100)}...</p>
              </div>

              <div className="session-agents">
                {session.responses?.slice(0, 3).map((resp: any) => (
                  <span key={resp.id} className="agent-badge">
                    {resp.agentName}
                  </span>
                ))}
                {session.responses?.length > 3 && (
                  <span className="agent-badge">
                    +{session.responses.length - 3} more
                  </span>
                )}
              </div>

              <div className="session-actions">
                <button 
                  onClick={() => fetchSession(session.id)}
                  className="btn-primary"
                >
                  View Comparison
                </button>
                <button 
                  onClick={() => deleteSession(session.id)}
                  className="btn-secondary"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSession && (
        <div className="modal-overlay">
          <div className="modal-large">
            <ComparisonView 
              sessionId={activeSession.id}
              onClose={() => {
                // Clear active session
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Example 5: Integration in Chat Interface

```typescript
// src/components/ChatInterface.tsx - Modified to support cross-replies
import React, { useState, useRef } from 'react';
import { agentService } from '@/services/agentService';
import { useCrossReplies } from '@/hooks/useCrossReplies';
import { MessageWithCompare } from '@/components/MessageWithCompare';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  conversationId?: string;
}

export const ChatInterfaceWithCrossReplies: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const agentId = 'current-agent-id';
  const conversationId = 'current-conversation-id';
  const { createSession } = useCrossReplies();

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    let assistantContent = '';
    const assistantMessageId = `msg-${Date.now() + 1}`;

    try {
      await agentService.chatStream(
        agentId,
        input,
        { conversationId },
        (token) => {
          assistantContent += token;
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = assistantContent;
            } else {
              updated.push({
                id: assistantMessageId,
                role: 'assistant',
                content: assistantContent,
                agentId,
                conversationId
              });
            }
            return updated;
          });
        },
        () => {
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
    }

    setInput('');
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.map((message) => (
          <MessageWithCompare
            key={message.id}
            messageId={message.id}
            agentId={message.agentId || agentId}
            conversationId={message.conversationId || conversationId}
            content={message.content}
            questionText={messages[0]?.content || ''}
            role={message.role}
          />
        ))}
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isStreaming}
        />
        <button
          onClick={handleSendMessage}
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
};
```

---

## Styling Suggestions

```css
/* styles/cross-replies.css */

.response-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.response-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.response-card.highlighted {
  border-color: #4CAF50;
  background-color: #f1f8f4;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.response-agent {
  color: #1976d2;
}

.response-content {
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
}

.response-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #666;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.responses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.session-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.agent-badge {
  display: inline-block;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.75rem;
  margin-right: 8px;
  margin-top: 8px;
}
```

These examples give you a solid foundation to build the UI! 🚀
