import { Request, Response } from "express";
import { shareService } from "../services/shareService.js";
import { logger } from "../utils/logger.js";

export class ShareController {
  /**
   * Search for users
   */
  async searchUsers(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const results = await shareService.searchUsers(query, userId);
      res.json(results);
    } catch (error) {
      logger.error("Search users error:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  }

  /**
   * Get user's public resources
   */
  async getUserPublicResources(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user?.id;

      if (!currentUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const results = await shareService.getUserPublicResources(userId);
      res.json(results);
    } catch (error: any) {
      logger.error("Get user public resources error:", error);
      res.status(error.message === "User not found" ? 404 : 500).json({ 
        error: error.message || "Failed to fetch user resources" 
      });
    }
  }

  /**
   * Search for public resources
   */
  async searchPublic(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const results = await shareService.searchPublicResources(query, userId);
      res.json(results);
    } catch (error) {
      logger.error("Search public error:", error);
      res.status(500).json({ error: "Failed to search resources" });
    }
  }

  /**
   * Create a share request
   */
  async createRequest(req: Request, res: Response) {
    try {
      const { resourceType, resourceId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!resourceType || !resourceId) {
        return res.status(400).json({ error: "Resource type and ID are required" });
      }

      const validTypes = ["agent", "conversation", "task", "team"];
      if (!validTypes.includes(resourceType)) {
        return res.status(400).json({ error: "Invalid resource type" });
      }

      const request = await shareService.createShareRequest(
        resourceType,
        resourceId,
        userId
      );

      res.status(201).json(request);
    } catch (error: any) {
      logger.error("Create share request error:", error);
      res.status(400).json({ error: error.message || "Failed to create request" });
    }
  }

  /**
   * Get pending requests for the logged-in owner
   */
  async getPendingRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const requests = await shareService.getPendingRequests(userId);
      res.json(requests);
    } catch (error) {
      logger.error("Get pending requests error:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  }

  /**
   * Approve a share request
   */
  async approveRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await shareService.approveRequest(id, userId);
      res.json(result);
    } catch (error: any) {
      logger.error("Approve request error:", error);
      res.status(400).json({ error: error.message || "Failed to approve request" });
    }
  }

  /**
   * Deny a share request
   */
  async denyRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await shareService.denyRequest(id, userId);
      res.json(result);
    } catch (error: any) {
      logger.error("Deny request error:", error);
      res.status(400).json({ error: error.message || "Failed to deny request" });
    }
  }

  /**
   * Toggle resource visibility
   */
  async toggleVisibility(req: Request, res: Response) {
    try {
      const { type, id } = req.params;
      const { visibility } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!visibility || !["public", "private"].includes(visibility)) {
        return res.status(400).json({ error: "Invalid visibility value" });
      }

      const validTypes = ["agent", "conversation", "task", "team"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid resource type" });
      }

      const result = await shareService.toggleVisibility(type, id, userId, visibility);
      res.json(result);
    } catch (error) {
      logger.error("Toggle visibility error:", error);
      res.status(500).json({ error: "Failed to update visibility" });
    }
  }

  /**
   * Get shared resources for the logged-in user
   */
  async getSharedResources(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const resources = await shareService.getSharedResources(userId);
      res.json(resources);
    } catch (error) {
      logger.error("Get shared resources error:", error);
      res.status(500).json({ error: "Failed to fetch shared resources" });
    }
  }
}

export const shareController = new ShareController();
