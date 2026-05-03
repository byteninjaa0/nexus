import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ctrl from "../controllers/projects.controller.js";
import * as tasks from "../controllers/tasks.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { checkProjectRole, requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(ctrl.listMyProjects));

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("color").optional().isString().isLength({ max: 32 }),
    body("icon").optional().isString().isLength({ max: 64 }),
    body("deadline").optional().isISO8601(),
    body("memberIds").optional().isArray(),
  ],
  validate,
  asyncHandler(ctrl.createProject),
);

router.get("/:id", [param("id").isUUID()], validate, requireProjectMember, asyncHandler(ctrl.getProject));

router.patch(
  "/:id",
  [param("id").isUUID()],
  validate,
  checkProjectRole("OWNER", "ADMIN"),
  [
    body("name").optional().trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("status").optional().isIn(["ACTIVE", "ARCHIVED", "COMPLETED"]),
    body("color").optional().isString(),
    body("icon").optional().isString(),
    body("deadline").optional().isISO8601(),
  ],
  validate,
  asyncHandler(ctrl.updateProject),
);

router.delete(
  "/:id",
  [param("id").isUUID()],
  validate,
  checkProjectRole("OWNER", "ADMIN"),
  asyncHandler(ctrl.deleteProject),
);

router.post(
  "/:id/members",
  [param("id").isUUID(), body("userId").isUUID(), body("role").optional().isIn(["ADMIN", "MEMBER"])],
  validate,
  checkProjectRole("OWNER", "ADMIN"),
  asyncHandler(ctrl.addMember),
);

router.delete(
  "/:id/members/:uid",
  [param("id").isUUID(), param("uid").isUUID()],
  validate,
  checkProjectRole("OWNER"),
  asyncHandler(ctrl.removeMember),
);

router.patch(
  "/:id/members/:uid",
  [param("id").isUUID(), param("uid").isUUID(), body("role").isIn(["ADMIN", "MEMBER"])],
  validate,
  checkProjectRole("OWNER"),
  asyncHandler(ctrl.updateMemberRole),
);

router.get("/:id/tasks", [param("id").isUUID()], validate, requireProjectMember, asyncHandler(tasks.listProjectTasks));

router.post(
  "/:id/tasks",
  [param("id").isUUID()],
  validate,
  checkProjectRole("OWNER", "ADMIN"),
  [
    body("title").trim().isLength({ min: 3, max: 200 }),
    body("description").optional().isString().isLength({ max: 5000 }),
    body("status").optional().isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    body("assigneeId").optional().isUUID(),
    body("dueDate")
      .optional({ nullable: true })
      .isISO8601()
      .custom((v, { req }) => {
        if (!v) return true;
        const d = new Date(v);
        if (d <= new Date()) throw new Error("Due date must be in the future");
        return true;
      }),
    body("tags").optional().isArray(),
    body("attachments").optional(),
  ],
  validate,
  asyncHandler(tasks.createTask),
);

export default router;
