// src/services/metricService.ts

import { db, supabase } from "../config/database";
import { logger } from "../utils/logger";

export const metricService = {
  /** Save a message in DB */
  async saveMessage(conversationId: string, agentId: string, role: string, content: string, tokenCount = 0) {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        agent_id: agentId,
        role,
        content,
        tokens: tokenCount
      });
    
    if (error) throw error;
  },

  /** * Ensures a conversation exists 
   */
  async ensureConversation(agentId: string, userId: string): Promise<string> {
    const { data: rows, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (rows && rows.length > 0) return rows[0].id;

    // Create new conversation
    const { data: result, error: insertError } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        user_id: userId
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return result.id;
  },

  /** * Update metrics safely 
   */
  async updateMetrics(agentId: string, data: {
    success: boolean;
    responseTimeMs: number;
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
  }) {
    const {
      success,
      responseTimeMs,
      inputTokens,
      outputTokens,
      costUSD
    } = data;

    // Get current metrics
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('metrics')
      .eq('id', agentId)
      .single();

    if (fetchError) throw fetchError;

    const currentMetrics = agent?.metrics || {};
    const totalInteractions = (currentMetrics.totalInteractions || 0) + 1;
    const avgResponseTime = (
      ((currentMetrics.avgResponseTime || 0) * (totalInteractions - 1) + responseTimeMs) /
      totalInteractions
    );
    const successRate = (
      ((currentMetrics.successRate || 0) / 100 * (totalInteractions - 1) + (success ? 1 : 0)) /
      totalInteractions
    ) * 100;
    const totalTokens = (currentMetrics.totalTokens || 0) + inputTokens + outputTokens;
    const llmCostUSD = (currentMetrics.llmCostUSD || 0) + costUSD;

    // Update agent metrics
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        metrics: {
          totalInteractions,
          avgResponseTime,
          successRate,
          totalTokens,
          llmCostUSD,
        },
      })
      .eq('id', agentId);

    if (updateError) throw updateError;
  }
};
