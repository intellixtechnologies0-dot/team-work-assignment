-- Simple RLS Fix for Task Updates
-- This script uses a simpler approach to fix Row Level Security

-- 1. First, re-enable RLS on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can read their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Only admin can create tasks" ON tasks;
DROP POLICY IF EXISTS "Only admin can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Enable update for users based on email" ON tasks;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON tasks;

-- 3. Create a simple SELECT policy - allow all authenticated users to read tasks
-- (The application will filter by assignee_id in the query)
CREATE POLICY "Allow authenticated users to read tasks" ON tasks
FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Create a simple UPDATE policy - allow all authenticated users to update tasks
-- (The application will ensure only assigned users can update their tasks)
CREATE POLICY "Allow authenticated users to update tasks" ON tasks
FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Create an INSERT policy that only allows admin to create tasks
CREATE POLICY "Only admin can create tasks" ON tasks
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'vrreddypc143@gmail.com'
    )
);

-- 6. Create a DELETE policy that only allows admin to delete tasks
CREATE POLICY "Only admin can delete tasks" ON tasks
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'vrreddypc143@gmail.com'
    )
);

-- 7. Verify the policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY cmd, policyname; 