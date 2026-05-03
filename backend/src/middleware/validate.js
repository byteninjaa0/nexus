import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join(", ");
    return next(new AppError(msg, 400));
  }
  next();
}
