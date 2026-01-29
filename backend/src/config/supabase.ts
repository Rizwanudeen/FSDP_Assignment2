// src/config/supabase.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Use service key for backend

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Database query wrapper compatible with existing MSSQL code
 */
export const db = {
  async query(sql: string, params?: Record<string, any>): Promise<any[]> {
    try {
      // Convert named parameters (@param) to PostgreSQL format ($1, $2, etc.)
      let pgSql = sql;
      const paramValues: any[] = [];
      
      if (params) {
        let paramIndex = 1;
        for (const [key, value] of Object.entries(params)) {
          // Replace @paramName with $1, $2, etc.
          pgSql = pgSql.replace(new RegExp(`@${key}\\b`, 'g'), `$${paramIndex}`);
          paramValues.push(value);
          paramIndex++;
        }
      }

      // Convert SQL Server syntax to PostgreSQL
      pgSql = convertMSSQLToPostgreSQL(pgSql);

      logger.info('Executing Supabase query:', { sql: pgSql, params: paramValues });

      // Execute using Supabase's RPC or direct SQL
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: pgSql,
        params: paramValues,
      });

      if (error) {
        logger.error('Supabase query error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Database query failed:', error);
      throw error;
    }
  },

  async execute(sql: string, params?: Record<string, any>): Promise<any> {
    const results = await this.query(sql, params);
    return { rowsAffected: results.length };
  },
};

/**
 * Convert MSSQL syntax to PostgreSQL
 */
function convertMSSQLToPostgreSQL(sql: string): string {
  // Replace NEWID() with uuid_generate_v4()
  sql = sql.replace(/NEWID\(\)/gi, 'uuid_generate_v4()');
  
  // Replace SYSUTCDATETIME() with NOW()
  sql = sql.replace(/SYSUTCDATETIME\(\)/gi, 'NOW()');
  
  // Replace TOP N with LIMIT N
  sql = sql.replace(/SELECT\s+TOP\s+(\d+)/gi, 'SELECT');
  const topMatch = sql.match(/TOP\s+(\d+)/i);
  if (topMatch) {
    sql = sql.replace(/TOP\s+\d+/i, '') + ` LIMIT ${topMatch[1]}`;
  }
  
  // Replace NVARCHAR with VARCHAR
  sql = sql.replace(/NVARCHAR/gi, 'VARCHAR');
  
  // Replace BIT with BOOLEAN
  sql = sql.replace(/BIT/gi, 'BOOLEAN');
  
  // Replace DATETIME2 with TIMESTAMPTZ
  sql = sql.replace(/DATETIME2/gi, 'TIMESTAMPTZ');
  
  // Convert snake_case column names (if needed)
  // This is optional depending on your preference
  
  return sql;
}

export async function connectDatabase() {
  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      logger.error('❌ Failed to connect to Supabase:', error);
      throw error;
    }
    
    logger.info('✅ Successfully connected to Supabase');
    return supabase;
  } catch (error) {
    logger.error('❌ Supabase connection error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  // Supabase client doesn't need explicit closing
  logger.info('Supabase client ready for cleanup');
}
