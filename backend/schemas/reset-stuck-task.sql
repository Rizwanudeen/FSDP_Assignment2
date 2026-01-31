-- Reset task that is stuck in IN_PROGRESS status
-- Run this in Supabase SQL Editor to fix the stuck task

UPDATE collaborative_tasks
SET status = 'PENDING'
WHERE id = 'd99c8e8b-6204-4237-b8d0-88916ea447c5'
AND status = 'IN_PROGRESS';

-- Check the result
SELECT id, title, status, user_id, created_at
FROM collaborative_tasks
WHERE id = 'd99c8e8b-6204-4237-b8d0-88916ea447c5';
