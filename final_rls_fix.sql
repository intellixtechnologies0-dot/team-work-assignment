-- Final RLS Fix for Task Updates
-- This script sets up proper Row Level Security policies for the tasks table

-- 1. First, re-enable RLS on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies that might conflict
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

-- 3. Create a comprehensive SELECT policy that allows users to read their assigned tasks
CREATE POLICY "Users can read their assigned tasks" ON tasks
FOR SELECT USING (
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

-- 4. Create an UPDATE policy that allows team members to update their assigned tasks
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

-- 7. Verify all policies were created successfully
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY cmd, policyname;

-- 8. Test query to verify the policies work correctly
-- This should return tasks assigned to the current user
SELECT 
    t.id,
    t.title,
    t.status,
    t.assignee_id,
    tm.name as assignee_name,
    tm.email as assignee_email,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'vrreddypc143@gmail.com'
        ) THEN 'Admin - Can see all tasks'
        WHEN EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.email = (
                SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
            )
            AND team_members.id = t.assignee_id
        ) THEN 'Team Member - Can see assigned task'
        ELSE 'No Access'
    END as access_level
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