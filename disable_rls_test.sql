-- Temporarily disable RLS to test if that's causing the update issue
-- WARNING: This will allow all authenticated users to read/write all tasks
-- Only use this for testing, then re-enable RLS with proper policies

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- 2. Temporarily disable RLS on tasks table
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- 4. Test if you can now update tasks
-- (This will be tested through the web interface)

-- 5. After testing, re-enable RLS with proper policies:
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- 
-- Then run the fix_permissions.sql script to set up proper policies 