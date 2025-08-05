-- Fix Database Permissions for Task Updates
-- This script fixes Row Level Security (RLS) policies so team members can update their assigned tasks

-- 1. First, let's check the current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 2. Drop existing policies that might be blocking updates
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Team members can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tasks;

-- 3. Create a new policy that allows team members to update tasks assigned to them
CREATE POLICY "Team members can update assigned tasks" ON tasks
FOR UPDATE USING (
    -- Allow if user is admin (vrreddypc143@gmail.com)
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'vrreddypc143@gmail.com'
    )
    OR
    -- Allow if task is assigned to the current user
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.email = (
            SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
        )
        AND team_members.id = tasks.assignee_id
    )
);

-- 4. Create a policy for reading tasks
CREATE POLICY "Users can read their assigned tasks" ON tasks
FOR SELECT USING (
    -- Allow if user is admin
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'vrreddypc143@gmail.com'
    )
    OR
    -- Allow if task is assigned to the current user
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.email = (
            SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
        )
        AND team_members.id = tasks.assignee_id
    )
);

-- 5. Create a policy for inserting tasks (admin only)
CREATE POLICY "Only admin can create tasks" ON tasks
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'vrreddypc143@gmail.com'
    )
);

-- 6. Create a policy for deleting tasks (admin only)
CREATE POLICY "Only admin can delete tasks" ON tasks
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'vrreddypc143@gmail.com'
    )
);

-- 7. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 8. Test query to verify permissions work
-- This should return tasks assigned to the current user
SELECT 
    t.id,
    t.title,
    t.status,
    t.assignee_id,
    tm.name as assignee_name,
    tm.email as assignee_email
FROM tasks t
LEFT JOIN team_members tm ON t.assignee_id = tm.id
WHERE EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.email = (
        SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
    )
    AND team_members.id = t.assignee_id
)
OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'vrreddypc143@gmail.com'
); 