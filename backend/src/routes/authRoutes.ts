// src/routes/authRoutes.ts

import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db, supabase } from "../config/database.js";
import { generateToken } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Check if email already exists in users table
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmail) {
      return res.status(400).json({
        success: false,
        error: "Email already registered. Please login instead.",
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      logger.error("Supabase Auth error:", authError);
      return res.status(400).json({
        success: false,
        error: authError.message,
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        success: false,
        error: "Failed to create auth user",
      });
    }

    // Insert into users table with the Supabase Auth user ID
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name: name || email.split("@")[0],
      })
      .select('id, email, name')
      .single();

    if (insertError) {
      logger.error("Failed to insert user into users table:", insertError);
      return res.status(500).json({
        success: false,
        error: "Failed to create user account. Please try again.",
      });
    }

    logger.info("✅ User created with ID:", authData.user.id);

    // Get the user data from users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', authData.user.id)
      .single();

    res.status(201).json({
      success: true,
      data: { 
        user: userData || { id: authData.user.id, email, name: name || email.split("@")[0] },
        session: authData.session
      },
      message: "User registered successfully",
    });
  } catch (error) {
    logger.error("Register error:", error);
    res.status(500).json({ success: false, error: "Failed to register user" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  console.log("🔥 LOGIN ENDPOINT HIT");
  console.log("BODY:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    console.log("📡 Querying database for user:", email);
    const { data: rows, error: queryError } = await supabase
      .from('users')
      .select('id, email, password, name')
      .ilike('email', email)
      .limit(1);

    console.log("📊 Query result:", { rows: rows?.length, error: queryError });

    if (queryError) throw queryError;

    if (!rows || rows.length === 0) {
      console.log("❌ User not found");
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = rows[0];
    console.log("👤 User found:", user.email);
    console.log("🔐 Comparing passwords...");
    const valid = await bcrypt.compare(password, user.password);
    console.log("✅ Password valid:", valid);

    if (!valid) {
      console.log("❌ Invalid password");
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    console.log("🎫 Generating token...");
    const token = generateToken(user.id, user.email);
    console.log("✅ Token generated, sending response");

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      message: "Login successful",
    });
    console.log("✅ Response sent successfully");
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
});

export const authRoutes = router;
