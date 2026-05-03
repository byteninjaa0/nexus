import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ctrl from "../controllers/users.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { checkRole } from "../middleware/rbac.js";
import { isStrongPassword } from "../utils/validators.js";

const router = Router();

router.use(requireAuth);

router.get("/", checkRole("ADMIN"), asyncHandler(ctrl.listUsers));

router.get("/:id/activity", [param("id").isUUID()], validate, asyncHandler(ctrl.userActivity));

router.get("/:id", [param("id").isUUID()], validate, asyncHandler(ctrl.getUser));

router.patch(
  "/:id",
  [
    param("id").isUUID(),
    body("name").optional().trim().isLength({ min: 2, max: 80 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("avatar").optional().isString().isLength({ max: 500 }),
    body("password")
      .optional()
      .custom((v) => {
        if (v && !isStrongPassword(v)) {
          throw new Error("Password must meet strength rules");
        }
        return true;
      }),
    body("role").optional().isIn(["ADMIN", "MEMBER"]),
    body("deactivated").optional().isBoolean(),
  ],
  validate,
  asyncHandler(ctrl.updateUser),
);

router.delete("/:id", checkRole("ADMIN"), [param("id").isUUID()], validate, asyncHandler(ctrl.deleteUser));

export default router;
