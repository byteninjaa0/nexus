import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ctrl from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { checkRole } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth, checkRole("ADMIN"));

router.get("/stats", asyncHandler(ctrl.platformStats));
router.get("/activity", asyncHandler(ctrl.platformActivity));

export default router;
