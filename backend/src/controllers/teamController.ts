// src/controllers/teamController.ts

import { Request, Response } from "express";
import { teamService } from "../services/teamService";
import { collaborationService } from "../services/collaborationService";
import { logger } from "../utils/logger";

class TeamController {
  /**
   * POST /api/teams - Create new team
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { name, description, objective, members } = req.body;

      if (!name || !members || members.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Team name and at least one member are required",
        });
      }

      const team = await teamService.createTeam(userId, {
        name,
        description,
        objective,
        members,
      });

      res.status(201).json({ success: true, data: team });
    } catch (error: any) {
      logger.error("Create team error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/teams - Get all user teams
   */
  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const teams = await teamService.getTeamsByUser(userId);
      res.json({ success: true, data: teams });
    } catch (error: any) {
      logger.error("List teams error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/teams/:id - Get team by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const team = await teamService.getTeamById(req.params.id, userId);
      res.json({ success: true, data: team });
    } catch (error: any) {
      logger.error("Get team error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/teams/:id - Update team
   */
  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const team = await teamService.updateTeam(req.params.id, userId, req.body);
      res.json({ success: true, data: team });
    } catch (error: any) {
      logger.error("Update team error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/teams/:id - Delete team
   */
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      await teamService.deleteTeam(req.params.id, userId);
      res.json({ success: true, message: "Team deleted successfully" });
    } catch (error: any) {
      logger.error("Delete team error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/teams/:id/members - Add member to team
   */
  async addMember(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { agentId, role, isPrimaryAgent } = req.body;

      if (!agentId || !role) {
        return res.status(400).json({
          success: false,
          error: "Agent ID and role are required",
        });
      }

      await teamService.addTeamMember(req.params.id, userId, {
        agentId,
        role,
        isPrimaryAgent,
      });

      const team = await teamService.getTeamById(req.params.id, userId);
      res.json({ success: true, data: team });
    } catch (error: any) {
      logger.error("Add team member error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/teams/:id/members/:memberId - Remove member from team
   */
  async removeMember(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      await teamService.removeTeamMember(
        req.params.id,
        userId,
        req.params.memberId
      );

      res.json({ success: true, message: "Member removed successfully" });
    } catch (error: any) {
      logger.error("Remove team member error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/teams/:id/tasks - Create collaborative task
   */
  async createTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { title, description, priority } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: "Title and description are required",
        });
      }

      const task = await collaborationService.createCollaborativeTask(
        req.params.id,
        userId,
        { title, description, priority }
      );

      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      logger.error("Create task error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/teams/:id/tasks - Get all tasks for team
   */
  async getTasks(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const tasks = await collaborationService.getTasksByTeam(
        req.params.id,
        userId
      );
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      logger.error("Get tasks error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/teams/:teamId/tasks/:taskId - Get task details
   */
  async getTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const task = await collaborationService.getTaskById(
        req.params.taskId,
        userId
      );
      res.json({ success: true, data: task });
    } catch (error: any) {
      logger.error("Get task error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/teams/:teamId/tasks/:taskId/execute - Execute task with streaming
   */
  async executeTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      await collaborationService.executeCollaborativeTask(
        req.params.taskId,
        userId,
        res
      );
    } catch (error: any) {
      logger.error("Execute task error:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  /**
   * POST /api/teams/:teamId/tasks/:taskId/feedback - Record task feedback
   */
  async recordTaskFeedback(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { taskId } = req.params;
      const { feedback } = req.body;

      if (feedback !== 1 && feedback !== -1) {
        return res.status(400).json({
          success: false,
          error: "Feedback must be 1 (thumbs up) or -1 (thumbs down)",
        });
      }

      await collaborationService.recordTaskFeedback(taskId, userId, feedback);
      res.json({ success: true, message: "Feedback recorded" });
    } catch (error: any) {
      logger.error("Record task feedback error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/teams/:teamId/tasks/:taskId/new-version - Create new version of task
   */
  async createTaskVersion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { taskId } = req.params;
      const { title, description, priority } = req.body;

      const newTask = await collaborationService.createTaskVersion(
        taskId,
        userId,
        { title, description, priority }
      );

      res.status(201).json({ success: true, data: newTask });
    } catch (error: any) {
      logger.error("Create task version error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/teams/:teamId/tasks/:taskId/versions - Get task with version history
   */
  async getTaskVersions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { taskId } = req.params;
      const taskWithVersions = await collaborationService.getTaskWithVersions(taskId, userId);

      res.json({ success: true, data: taskWithVersions });
    } catch (error: any) {
      logger.error("Get task versions error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/teams/:teamId/tasks/:taskId - Delete task
   */
  async deleteTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { taskId } = req.params;
      await collaborationService.deleteTask(taskId, userId);

      res.json({ success: true, message: "Task deleted successfully" });
    } catch (error: any) {
      logger.error("Delete task error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const teamController = new TeamController();

