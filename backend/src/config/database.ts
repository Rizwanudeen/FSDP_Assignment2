// src/config/database.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

// Load .env early
dotenv.config();

// ============================================================================
// Supabase Configuration
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.warn("⚠️ Supabase environment variables not fully configured");
}

/**
 * Supabase client with service role key (for backend operations)
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Supabase admin client (for auth operations)
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Helper: connectDatabase
 * Kept for compatibility with existing server startup logic
 */
export async function connectDatabase() {
  try {
    logger.info("🔄 Verifying Supabase connection...");
    
    // Simple test query to verify connection
    const { error } = await supabase.from('agents').select('id').limit(1);
    
    if (error && error.message !== 'Table not found') {
      throw error;
    }

    logger.info("✅ Supabase client initialized and verified");
    return supabase;
  } catch (error) {
    logger.error("❌ Supabase initialization failed:", error);
    throw error;
  }
}

/**
 * Helper: disconnectDatabase
 * Not needed for Supabase (Stateless HTTP), but kept for compatibility
 */
export async function disconnectDatabase() {
  logger.info("🛑 Supabase connection cleared (Stateless)");
}

/**
 * Helper: query
 * Use supabase.from() instead
 */
export async function query(
  tableName: string,
  action: 'select' | 'insert' | 'update' | 'delete' = 'select'
) {
  logger.warn("⚠️ Direct query() is deprecated. Use supabase.from() instead.");
  return supabase.from(tableName);
}

// ============================================================================
// Exports
// ============================================================================

export const db = {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  query,
};