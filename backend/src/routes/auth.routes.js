import { Router } from "express";
import { body, query } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as auth from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { isStrongPassword } from "../utils/validators.js";

const router = Router();

const emailChain = body("email").isEmail().normalizeEmail().withMessage("Valid email required");

const passwordCustom = body("password").custom((v) => {
  if (!isStrongPassword(v)) {
    throw new Error("Password must be 8+ chars with uppercase, number, and special character");
  }
  return true;
});

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name 2-80 chars"),
    emailChain,
    passwordCustom,
  ],
  validate,
  asyncHandler(auth.signup),
);

router.post(
  "/login",
  [emailChain, body("password").notEmpty()],
  validate,
  asyncHandler(auth.login),
);

router.post("/refresh", [body("refreshToken").notEmpty()], validate, asyncHandler(auth.refresh));

router.post("/logout", asyncHandler(auth.logout));

router.get("/me", requireAuth, asyncHandler(auth.me));

router.get(
  "/check-email",
  [query("email").isEmail().normalizeEmail()],
  validate,
  asyncHandler(auth.checkEmail),
);

export default router;
