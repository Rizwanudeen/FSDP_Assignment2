-- Fix foreign key constraints to point to correct users table
-- Run this in Supabase SQL Editor

-- Drop the incorrect foreign key constraint
ALTER TABLE share_requests 
DROP CONSTRAINT IF EXISTS share_requests_requester_user_id_fkey;

ALTER TABLE share_requests 
DROP CONSTRAINT IF EXISTS share_requests_owner_user_id_fkey;

-- Recreate foreign keys pointing to public.users (not auth.users)
ALTER TABLE share_requests
ADD CONSTRAINT share_requests_requester_user_id_fkey 
FOREIGN KEY (requester_user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE share_requests
ADD CONSTRAINT share_requests_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Verify the constraints
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname LIKE 'share_requests_%_fkey';
