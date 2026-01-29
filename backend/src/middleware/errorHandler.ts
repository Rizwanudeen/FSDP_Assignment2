// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * GLOBAL ERROR HANDLER
 * Catches any thrown error and returns a consistent JSON response.
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log everything
  logger.error("Unhandled error", {
    message: error?.message,
    stack: error?.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Prisma-style codes (if you ever use Prisma later)
  if (error && error.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: "A record with this value already exists",
    });
  }

  if (error && error.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: "Record not found",
    });
  }

  // Validation-style errors
  if (error && error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: error.message || "Validation error",
    });
  }

  // Fallback
  const statusCode =
    typeof error?.statusCode === "number" ? error.statusCode : 500;
  const message =
    typeof error?.message === "string"
      ? error.message
      : "Internal server error";

  const responseBody: any = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV === "development" && error?.stack) {
    responseBody.stack = error.stack;
  }

  return res.status(statusCode).json(responseBody);
}
