import express from "express";
import { agentController } from "../controllers/agentController.ts";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", agentController.getAll);
router.get("/:id", agentController.getById);
router.post("/", agentController.create);
router.put("/:id", agentController.update);
router.delete("/:id", agentController.delete);
router.post("/:id/test", agentController.test);


router.post("/:id/chat", agentController.chat); 
export const agentRoutes = router;