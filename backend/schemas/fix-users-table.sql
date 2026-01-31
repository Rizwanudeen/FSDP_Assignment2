-- Fix users table to generate its own UUIDs instead of referencing auth.users

-- Drop the foreign key constraint
alter table public.users drop constraint if exists users_id_fkey;

-- Alter id column to have default uuid generation
alter table public.users alter column id set default uuid_generate_v4();

-- Make id not reference auth.users anymore
-- The table can now work independently
