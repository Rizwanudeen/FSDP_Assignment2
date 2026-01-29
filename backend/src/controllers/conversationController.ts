import { Request, Response } from 'express';
import { db, supabase } from '../config/database';
import { logger } from '../utils/logger';

class ConversationController {
    async getLatestConversation(req: Request, res: Response) {
        try {
            const agentId = req.params.agentId;
            const userId = (req as any).user.id;
            if (!userId) {
                return res.status(401).send('Unauthorized');
            }
            
            console.log(`🔍 getLatestConversation - agentId: ${agentId}, userId: ${userId}`);
            
            // Check if user owns the agent or has shared access
            const { data: agent, error: agentError } = await supabase
                .from('agents')
                .select('user_id')
                .eq('id', agentId)
                .single();

            console.log(`📊 Agent query result:`, { agent, error: agentError?.message });

            if (agentError || !agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            const isOwner = agent.user_id === userId;
            
            let hasSharedAccess = false;
            if (!isOwner) {
                const { data: accessCheck } = await supabase
                    .from('resource_access')
                    .select('id')
                    .eq('resource_type', 'agent')
                    .eq('resource_id', agentId)
                    .eq('user_id', userId)
                    .single();
                
                hasSharedAccess = !!accessCheck;
                console.log(`🔑 Shared access check:`, { hasSharedAccess, accessCheck });
            }

            if (!isOwner && !hasSharedAccess) {
                console.log('❌ Access denied');
                return res.status(403).json({ error: 'Access denied' });
            }

            console.log(`✅ User has access - isOwner: ${isOwner}, hasSharedAccess: ${hasSharedAccess}`);

            // If user has access (owner or shared), show ALL conversations for this agent
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            console.log(`📝 Conversation query result:`, { 
                found: !!conversation, 
                conversationId: conversation?.id,
                error: convError?.message,
                errorCode: convError?.code 
            });

            if (convError) {
                console.error('❌ Error fetching conversation:', convError);
                throw convError;
            }

            if (conversation) {
                const { data: messages, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversation.id)
                    .order('created_at', { ascending: true });

                if (msgError) throw msgError;
                
                console.log(`✉️ Found ${messages?.length || 0} messages`);
                res.json({ success: true, data: { ...conversation, messages } });
            } else {
                console.log('📭 No conversation found');
                res.status(404).json({ success: false, message: 'No conversation found for this agent.' });
            }
        } catch (error) {
            logger.error('Error fetching latest conversation:', error);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    }

    async recordFeedback(req: Request, res: Response) {
        const { messageId, feedback } = req.body; // feedback is 'like' or 'dislike'
        const userId = (req as any).user.id;

        if (!messageId || !feedback) {
            return res.status(400).json({ success: false, error: "Message ID and feedback are required." });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(messageId)) {
            return res.status(400).json({ success: false, error: "Invalid message ID format. Must be a valid UUID." });
        }

        try {
            // 1. Get the message and its current feedback value
            const { data: messages, error: msgError } = await supabase
                .from('messages')
                .select('feedback, conversation_id')
                .eq('id', messageId);

            if (msgError) throw msgError;

      if (!messages || messages.length === 0) {
        return res.status(404).json({ success: false, error: `Message with ID '${messageId}' not found.` });
      }            const currentFeedback = messages[0].feedback || 0;

            // 2. Determine the new feedback value
            const feedbackValue = feedback === 'like' ? 1 : -1;
            const newFeedback = currentFeedback === feedbackValue ? 0 : feedbackValue;

            // 3. Update the message's feedback in the database
            const { error: updateError } = await supabase
                .from('messages')
                .update({ feedback: newFeedback })
                .eq('id', messageId);

            if (updateError) throw updateError;

            // 4. Get the agent ID from the conversation
            const conversationId = messages[0].conversation_id;
            const { data: convResult, error: convError } = await supabase
                .from('conversations')
                .select('agent_id')
                .eq('id', conversationId)
                .single();

            if (convError) throw convError;

            if (convResult) {
                const agentId = convResult.agent_id;

                // 5. Calculate success rate from all feedback for this agent
                const { data: allMessages, error: statsError } = await supabase
                    .from('messages')
                    .select('feedback, conversations!inner(agent_id)')
                    .eq('conversations.agent_id', agentId)
                    .not('feedback', 'is', null)
                    .neq('feedback', 0);

                if (statsError) throw statsError;

                const totalFeedback = allMessages?.length || 0;
                const likes = allMessages?.filter(m => m.feedback === 1).length || 0;
                const successRate = totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 0;

                // 6. Update agent metrics
                const { data: currentMetrics, error: metricsError } = await supabase
                    .from('agents')
                    .select('metrics')
                    .eq('id', agentId)
                    .single();

                if (metricsError) throw metricsError;

                let metrics = {};
                if (currentMetrics && currentMetrics.metrics) {
                    try {
                        metrics = typeof currentMetrics.metrics === 'string' 
                            ? JSON.parse(currentMetrics.metrics) 
                            : currentMetrics.metrics;
                    } catch (e) {
                        metrics = {};
                    }
                }

                metrics = {
                    ...metrics,
                    successRate,
                    totalFeedback,
                    positiveFeedback: likes
                };

                const { error: updateMetricsError } = await supabase
                    .from('agents')
                    .update({ metrics })
                    .eq('id', agentId);

                if (updateMetricsError) throw updateMetricsError;
            }
            
            res.json({ success: true, data: { feedback: newFeedback } });

        } catch (error) {
            logger.error("Failed to record feedback", error);
            res.status(500).json({ success: false, error: "Failed to record feedback." });
        }
    }
}

export const conversationController = new ConversationController();
