// src/middleware/auth.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/database";
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
 * MIDDLEWARE: Authenticate JWT using Supabase
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
      logger.warn("❌ No token provided in Authorization header");
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    // Verify token with Supabase admin
    logger.info("🔐 Verifying token...");
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      logger.error("❌ JWT verification error:", error.message);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    if (!data?.user) {
      logger.error("❌ No user data in token response");
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    logger.info("✅ Token verified for user:", data.user.id);
    req.user = { 
      id: data.user.id, 
      email: data.user.email || "" 
    };
    return next();
  } catch (error: any) {
    logger.error("❌ JWT verification exception:", error.message || error);
    return res.status(401).json({
      success: false,
      error: "Token verification failed",
    });
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, email: string): string {
  // 1. Cast the secret to string to satisfy TypeScript
  const secret = (process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET) as string;
  
  if (!secret) {
    throw new Error("JWT Secret not set in environment");
  }

  // 2. Define options with explicit types to match the library's SignOptions
  const signOptions: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || "7d",
  };

  // 3. Use the sub (subject) claim for the userId as per standard
  return jwt.sign({ sub: userId, email }, secret, signOptions);
}