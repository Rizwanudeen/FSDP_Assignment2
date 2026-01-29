// src/middleware/auth.ts

import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/database";
import { logger } from "../utils/logger.js";

// --- Extend Express Request to include user ---
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * MIDDLEWARE: Authenticate using Supabase
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      logger.error("❌ Supabase Auth error:", error?.message);
      logger.error("❌ Token provided:", token.substring(0, 20) + "...");
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    logger.info("✅ User authenticated:", { id: data.user.id, email: data.user.email });

    req.user = { 
      id: data.user.id, 
      email: data.user.email || "" 
    };

    next();
  } catch (error: any) {
    logger.error("❌ Auth middleware unexpected error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during authentication",
    });
  }
}

/**
 * Generate JWT token for login/signup
 */
export function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not set in environment");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign({ userId, email }, secret, {
    expiresIn,
  });
}
