import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ctrl from "../controllers/tasks.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/:id/comments", [param("id").isUUID()], validate, asyncHandler(ctrl.listComments));

router.post(
  "/:id/comments",
  [param("id").isUUID(), body("content").trim().isLength({ min: 1, max: 4000 })],
  validate,
  asyncHandler(ctrl.addComment),
);

router.patch(
  "/:id/status",
  [param("id").isUUID(), body("status").isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])],
  validate,
  asyncHandler(ctrl.patchStatus),
);

router.patch(
  "/:id/assign",
  [param("id").isUUID(), body("assigneeId").optional({ nullable: true }).isUUID()],
  validate,
  asyncHandler(ctrl.patchAssign),
);

router.get("/:id", [param("id").isUUID()], validate, asyncHandler(ctrl.getTask));

router.patch(
  "/:id",
  [
    param("id").isUUID(),
    body("title").optional().trim().isLength({ min: 3, max: 200 }),
    body("description").optional().isString().isLength({ max: 5000 }),
    body("status").optional().isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    body("assigneeId").optional({ nullable: true }).isUUID(),
    body("dueDate").optional({ nullable: true }).isISO8601(),
    body("tags").optional().isArray(),
    body("attachments").optional(),
    body("position").optional().isInt(),
  ],
  validate,
  asyncHandler(ctrl.updateTask),
);

router.delete("/:id", [param("id").isUUID()], validate, asyncHandler(ctrl.deleteTask));

export default router;
