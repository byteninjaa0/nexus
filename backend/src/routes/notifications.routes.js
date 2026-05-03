import { Router } from "express";
import { param } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ctrl from "../controllers/notifications.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(ctrl.listNotifications));
router.post("/read-all", asyncHandler(ctrl.markAllRead));
router.patch("/:id/read", [param("id").isUUID()], validate, asyncHandler(ctrl.markRead));
router.delete("/:id", [param("id").isUUID()], validate, asyncHandler(ctrl.dismiss));

export default router;
