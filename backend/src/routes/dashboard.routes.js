import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ctrl from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", asyncHandler(ctrl.stats));
router.get("/activity", asyncHandler(ctrl.activityFeed));
router.get("/overdue", asyncHandler(ctrl.overdueList));

export default router;
