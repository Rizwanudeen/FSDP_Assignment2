// src/config/database.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";
import { logger } from "../utils/logger";

// Load .env early
dotenv.config();

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;

if (USE_SUPABASE && supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  logger.info('Using Supabase database');
}

// MSSQL fallback
import mssql from "mssql";

// Helper: safely parse integer ENV
const parseNumber = (val: string | undefined, defaultValue: number): number => {
  const num = val ? Number(val) : NaN;
  return Number.isFinite(num) ? num : defaultValue;
};

// MSSQL configuration
const config: mssql.config = {
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || process.env.DB_PASS || undefined,
  server: process.env.DB_SERVER || process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || process.env.DB_NAME || "master",
  port: parseNumber(process.env.DB_PORT, 1433),

  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false", // true by default
    enableArithAbort: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: mssql.ConnectionPool | null = null;

/**
 * Connect to Database (Supabase or MSSQL)
 */
export async function connectDatabase() {
  try {
    if (USE_SUPABASE) {
      // Test Supabase connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows (OK)
        logger.error('❌ Failed to connect to Supabase:', error);
        throw error;
      }
      logger.info('✅ Successfully connected to Supabase');
      return supabase;
    }

    // MSSQL fallback
    if (pool) {
      logger.warn("⚠️ Database pool already exists. Skipping reconnect.");
      return pool;
    }

    pool = new mssql.ConnectionPool(config);
    const poolPromise = pool.connect();

    // Attach event handlers for reliability
    pool.on("error", (err) => {
      logger.error("❌ MSSQL Pool Error:", err);
      pool = null;
    });

    return pool;
  } catch (error) {
    logger.error("❌ MSSQL Database connection failed:", error);
    throw error;
  }
}

/**
 * Disconnect from MSSQL
 */
export async function disconnectDatabase() {
  if (!pool) return;

  try {
    logger.info("Closing database connection pool...");
    await pool.close();
    pool = null;
    logger.info("🛑 Database connection pool closed");
  } catch (err) {
    logger.error("❌ Error closing DB connection:", err);
  }
}

/**
 * Run a SQL query with optional parameters (works with both Supabase and MSSQL)
 */
export async function query(
  sqlText: string,
  inputs: Record<string, any> = {}
) {
  if (USE_SUPABASE) {
    // Convert MSSQL query to Supabase format
    // This is a basic wrapper - you'll need to update service files for proper Supabase usage
    logger.warn('⚠️ Direct SQL queries not fully supported with Supabase. Use Supabase client methods instead.');
    throw new Error('Please migrate service to use Supabase client methods');
  }

  if (!pool) throw new Error("❌ Database not connected");

  const request = pool.request();

  for (const [key, value] of Object.entries(inputs)) {
    request.input(key, value);
  }

  const result = await request.query(sqlText);
  return result.recordset;
}

// For other modules that need direct pool access
export { pool, supabase };

export const db = {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  query: USE_SUPABASE 
    ? async (sql: string, params: any) => {
        // Supabase uses client methods, not raw SQL
        throw new Error('Use Supabase client methods instead of raw SQL');
      }
    : query,
  client: USE_SUPABASE ? supabase : pool,
  mssql: USE_SUPABASE ? null : mssql,
};
