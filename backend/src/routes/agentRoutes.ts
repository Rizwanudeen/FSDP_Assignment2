import express from "express";
import { agentController } from "../controllers/agentController.ts";
import { agentCrossReplyController } from "../controllers/agentCrossReplyController.ts";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Standard agent routes
router.get("/", agentController.getAll);
router.get("/:id", agentController.getById);
router.post("/", agentController.create);
router.put("/:id", agentController.update);
router.delete("/:id", agentController.delete);
router.post("/:id/test", agentController.test);
router.post("/:id/chat", agentController.chat);

// Cross-reply routes - must come before /:id to avoid route conflicts
router.post("/cross-replies", agentCrossReplyController.createCrossReply);
router.get("/cross-replies", agentCrossReplyController.getAllCrossReplies);
router.get("/cross-replies/:crossReplyId", agentCrossReplyController.getCrossReplyById);
router.post("/cross-replies/:crossReplyId/responses", agentCrossReplyController.addAgentResponse);
router.delete("/cross-replies/:crossReplyId", agentCrossReplyController.deleteCrossReply);

export const agentRoutes = router;