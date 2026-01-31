// src/controllers/agentController.ts

import { Request, Response } from "express";
import { agentService } from "../services/agentService";
import { logger } from "../utils/logger";

class AgentController {
  /**
   * GET /api/agents
   */
  getAll = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const agents = await agentService.getAllAgents(userId);

      res.json({ success: true, data: agents });
    } catch (error) {
      logger.error("Get agents error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch agents" });
    }
  };

  /**
   * GET /api/agents/:id
   */
  getById = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const agent = await agentService.getAgentById(req.params.id, userId);

      if (!agent)
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });

      res.json({ success: true, data: agent });
    } catch (error) {
      logger.error("Get agent error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch agent" });
    }
  };

  /**
   * POST /api/agents
   */
  create = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const { name, description, type } = req.body;

      if (!name || !description || !type) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: name, description, type",
        });
      }

      const newAgent = await agentService.createAgent(userId, req.body);

      res
        .status(201)
        .json({
          success: true,
          data: newAgent,
          message: "Agent created successfully",
        });
    } catch (error) {
      logger.error("Create agent error:", error);
      logger.error("Create agent error details:", {
        message: (error as any).message,
        code: (error as any).code,
        details: (error as any).details,
      });
      res
        .status(500)
        .json({ 
          success: false, 
          error: "Failed to create agent",
          details: (error as any).message || "Unknown error"
        });
    }
  };

  /**
   * PUT /api/agents/:id
   */
  update = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const updated = await agentService.updateAgent(
        req.params.id,
        userId,
        req.body
      );

      if (!updated)
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });

      res.json({
        success: true,
        data: updated,
        message: "Agent updated successfully",
      });
    } catch (error) {
      logger.error("Update agent error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update agent" });
    }
  };

  /**
   * DELETE /api/agents/:id
   */
  delete = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const removed = await agentService.deleteAgent(req.params.id, userId);

      if (!removed)
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });

      res.json({ success: true, message: "Agent deleted successfully" });
    } catch (error) {
      logger.error("Delete agent error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete agent" });
    }
  };

  /**
   * POST /api/agents/:id/test
   */
  test = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const { message } = req.body;
      if (!message)
        return res.status(400).json({ success: false, error: "Message is required" });

      const result = await agentService.testAgent(
        req.params.id,
        userId,
        message
      );

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Test agent error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to test agent" });
    }
  };

  /**
   * POST /api/agents/:id/chat (SSE Streaming)
   */
  chat = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const { message, conversationId, skipUserMessage } = req.body;
      if (!message)
        return res.status(400).json({ success: false, error: "Message is required" });

      // Streaming headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      if (typeof (res as any).flushHeaders === "function") {
        (res as any).flushHeaders();
      }

      await agentService.chatWithAgent(
        req.params.id,
        userId,
        message,
        conversationId,
        res,
        skipUserMessage
      );
    } catch (error) {
      logger.error("Chat error:", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ success: false, error: "Failed to chat with agent" });
      }
    }
  };
}

export const agentController = new AgentController();
