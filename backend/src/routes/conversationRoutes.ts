// src/routes/conversationRoutes.ts

import express from "express";
import { authenticateToken } from "../middleware/auth";
import { db, supabase } from "../config/database";
import { conversationController } from "../controllers/conversationController";
import crypto from "crypto";

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/conversations
 * Get all conversations for user with the latest message + agent info
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;

    // Return empty list early
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    /**
     * Fetch all conversations + agent info + last message ID
     * Include conversations for agents the user owns OR has shared access to
     */
    
    // First, get all agent IDs the user has access to (owned + shared)
    const { data: ownedAgents } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', userId);
    
    const { data: sharedAgents } = await supabase
      .from('resource_access')
      .select('resource_id')
      .eq('resource_type', 'agent')
      .eq('user_id', userId);
    
    const ownedAgentIds = ownedAgents?.map(a => a.id) || [];
    const sharedAgentIds = sharedAgents?.map(a => a.resource_id) || [];
    const allAccessibleAgentIds = [...ownedAgentIds, ...sharedAgentIds];

    // If no accessible agents, return empty list
    if (allAccessibleAgentIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch conversations for all accessible agents
    const { data: rows, error } = await supabase
      .from('conversations')
      .select(`
        *,
        agents!conversations_agent_id_fkey (
          id,
          name,
          avatar,
          user_id
        ),
        users!conversations_user_id_fkey (
          name
        )
      `)
      .in('agent_id', allAccessibleAgentIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Fetch last messages for each conversation
    let lastMessagesMap: Record<string, any> = {};

    if (rows && rows.length > 0) {
      for (const conv of rows) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastMsg) {
          lastMessagesMap[conv.id] = lastMsg;
        }
      }
    }

    // Build final response structure
    const conversations = rows.map((r) => ({
      id: r.id,
      title: r.title,
      userId: r.user_id,
      ownerName: r.users?.name,
      isOwner: r.user_id === userId ? 1 : 0,
      agent: r.agents
        ? {
            id: r.agents.id,
            name: r.agents.name,
            avatar: r.agents.avatar,
          }
        : null,
      messages: lastMessagesMap[r.id] ? [lastMessagesMap[r.id]] : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json({ success: true, data: conversations });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch conversations" });
  }
});

/**
 * GET /api/conversations/:id
 * Get one conversation with all messages
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Get conversation
    const { data: convRows, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id);

    if (convError) throw convError;

    if (!convRows.length) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found" });
    }

    const conv = convRows[0];

    // Check if user owns the agent or has shared access
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', conv.agent_id)
      .single();

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
        .eq('resource_id', conv.agent_id)
        .eq('user_id', userId)
        .single();
      
      hasSharedAccess = !!accessCheck;
    }

    if (!isOwner && !hasSharedAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get agent info
    const { data: agentRows } = await supabase
      .from('agents')
      .select('id, name, avatar')
      .eq('id', conv.agent_id)
      .single();

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', conv.user_id)
      .single();

    // Messages sorted chronologically
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      data: {
        ...conv,
        users: userData || null,
        agent: agentRows || null,
        messages,
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch conversation" });
  }
});

/**
 * GET /api/conversations/latest/:agentId
 * Get the latest conversation for a specific agent (supports shared access)
 */
router.get("/latest/:agentId", conversationController.getLatestConversation.bind(conversationController));

/**
 * DELETE /api/conversations/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Check ownership
    const { data: convRows, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId);

    if (checkError) throw checkError;

    if (!convRows.length) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found" });
    }

    // Delete messages → conversation
    const { error: delMsgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);

    if (delMsgError) throw delMsgError;

    const { error: delConvError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (delConvError) throw delConvError;

    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to delete conversation" });
  }
});

/**
 * POST /api/conversations/feedback
 * Record feedback for a message
 */
router.post("/feedback", authenticateToken, (req, res) => {
  conversationController.recordFeedback(req, res);
});

/**
 * POST /api/conversations/message
 * Create a message and return its ID (for file uploads before chat)
 */
router.post("/message", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { agentId, conversationId, message, role } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({ error: "agentId and message are required" });
    }

    // Get agent and verify access
    const { data: agentResult, error: agentError } = await supabase
      .from('agents')
      .select('name, user_id')
      .eq('id', agentId)
      .single();
    
    if (agentError || !agentResult) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Check if user owns the agent OR has shared access
    const isOwner = agentResult.user_id === userId;
    
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
    }

    if (!isOwner && !hasSharedAccess) {
      return res.status(403).json({ error: "Access denied: You don't have permission to chat with this agent" });
    }

    // For shared agents, REUSE the existing conversation (don't create new ones per user)
    let convId = conversationId;

    if (!convId) {
      // Check if ANY conversation exists for this agent
      const { data: existingConv, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existingConv && !existingError) {
        // Reuse existing conversation
        convId = existingConv.id;
        console.log(`♻️ Reusing existing conversation ${convId} for agent ${agentId}`);
      } else {
        // Create new conversation
        convId = crypto.randomUUID();
        const agentName = agentResult?.name || "New Conversation";

        const { error: insertError } = await supabase
          .from('conversations')
          .insert({
            id: convId,
            user_id: agentResult.user_id, // Use agent owner's ID
            agent_id: agentId,
            title: agentName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
        console.log(`✨ Created new conversation ${convId} for agent ${agentId}`);
      }
    }

    // Create message
    const messageId = crypto.randomUUID();
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        conversation_id: convId,
        role: role || "user",
        content: message,
        created_at: new Date().toISOString(),
      });

    if (msgError) throw msgError;

    res.json({
      success: true,
      messageId,
      conversationId: convId,
    });
  } catch (error: any) {
    console.error("Create message error:", error);
    res.status(500).json({ error: error.message || "Failed to create message" });
  }
});

export const conversationRoutes = router;
