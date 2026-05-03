import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || (err.name === "JsonWebTokenError" ? 401 : 500);
  const message =
    err instanceof AppError
      ? err.message
      : err.name === "JsonWebTokenError"
        ? "Invalid token"
        : process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message || "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}
