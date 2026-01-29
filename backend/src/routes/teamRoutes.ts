// src/routes/teamRoutes.ts

import express from "express";
import { authenticateToken } from "../middleware/auth";
import { teamController } from "../controllers/teamController";

const router = express.Router();

// All team routes require authentication
router.use(authenticateToken);

// Team CRUD
router.post("/", teamController.create.bind(teamController));
router.get("/", teamController.list.bind(teamController));
router.get("/:id", teamController.getById.bind(teamController));
router.put("/:id", teamController.update.bind(teamController));
router.delete("/:id", teamController.delete.bind(teamController));

// Team members
router.post("/:id/members", teamController.addMember.bind(teamController));
router.delete("/:id/members/:memberId", teamController.removeMember.bind(teamController));

// Collaborative tasks
router.post("/:id/tasks", teamController.createTask.bind(teamController));
router.get("/:id/tasks", teamController.getTasks.bind(teamController));
router.get("/:teamId/tasks/:taskId", teamController.getTask.bind(teamController));
router.get("/:teamId/tasks/:taskId/versions", teamController.getTaskVersions.bind(teamController));
router.post("/:teamId/tasks/:taskId/execute", teamController.executeTask.bind(teamController));
router.post("/:teamId/tasks/:taskId/feedback", teamController.recordTaskFeedback.bind(teamController));
router.post("/:teamId/tasks/:taskId/new-version", teamController.createTaskVersion.bind(teamController));
router.delete("/:teamId/tasks/:taskId", teamController.deleteTask.bind(teamController));

export { router as teamRoutes };
