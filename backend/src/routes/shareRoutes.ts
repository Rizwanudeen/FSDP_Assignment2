import { Router } from "express";
import { shareController } from "../controllers/shareController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Search users by name or email
router.get("/search/users", (req, res) => shareController.searchUsers(req, res));

// Get user's public resources
router.get("/users/:userId/public-resources", (req, res) => shareController.getUserPublicResources(req, res));

// Search public resources
router.get("/search/public", (req, res) => shareController.searchPublic(req, res));

// Create a share request
router.post("/share-requests", (req, res) => shareController.createRequest(req, res));

// Get pending requests (for owners)
router.get("/share-requests/pending", (req, res) => shareController.getPendingRequests(req, res));

// Approve a request
router.post("/share-requests/:id/approve", (req, res) => shareController.approveRequest(req, res));

// Deny a request
router.post("/share-requests/:id/deny", (req, res) => shareController.denyRequest(req, res));

// Toggle resource visibility
router.patch("/resources/:type/:id/visibility", (req, res) => shareController.toggleVisibility(req, res));

// Get shared resources for the logged-in user
router.get("/shared-resources", (req, res) => shareController.getSharedResources(req, res));

export { router as shareRoutes };
