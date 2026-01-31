import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function initializeDatabase() {
  try {
    logger.info('🔄 Verifying database...');
    
    // Check if agents table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('agents')
      .select('id')
      .limit(1);

    if (checkError?.code === 'PGRST116' || checkError?.message?.includes('not found')) {
      logger.warn('⚠️ Tables not found in Supabase database');
      logger.warn('📝 Please ensure your Supabase database is properly set up');
      return;
    }

    logger.info('✅ Database tables verified');
  } catch (error: any) {
    logger.error('❌ Database verification error:', error.message);
    throw error;
  }
}