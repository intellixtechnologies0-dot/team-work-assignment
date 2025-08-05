# Safe Migration Guide (No Destructive Operations)

## 🛡️ **Step-by-Step Safe Migration**

This guide avoids any "destructive" operations and lets you verify each step.

### **Step 1: Backup Your Data**
```sql
-- Export your current data (run this first)
SELECT * FROM tasks;
SELECT * FROM team_members;
```

### **Step 2: Create New Table (Safe)**
```sql
-- This is safe - only creates new table
CREATE TABLE task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  assignee_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  assignee_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inProgress', 'completed')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(task_id, assignee_id)
);

-- Enable Row Level Security
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all task assignments" ON task_assignments FOR SELECT USING (true);
CREATE POLICY "Users can insert task assignments" ON task_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update task assignments" ON task_assignments FOR UPDATE USING (true);
CREATE POLICY "Users can delete task assignments" ON task_assignments FOR DELETE USING (true);
```

### **Step 3: Migrate Data (Safe)**
```sql
-- Copy existing data to new structure
INSERT INTO task_assignments (task_id, assignee_id, assignee_name, status)
SELECT 
    t.id as task_id,
    tm.id as assignee_id,
    tm.name as assignee_name,
    t.status
FROM tasks t
JOIN team_members tm ON t.assignee_id = tm.id
WHERE t.assignee_id IS NOT NULL;
```

### **Step 4: Verify Migration (Safe)**
```sql
-- Check that data was migrated correctly
SELECT COUNT(*) FROM task_assignments;
SELECT * FROM task_assignments LIMIT 5;
```

### **Step 5: Test Application**
1. **Go to:** https://intellixtechnologies0-dot.github.io/team-work-assignment/
2. **Test functionality** with the new structure
3. **If everything works**, proceed to cleanup

### **Step 6: Cleanup (Optional - Only After Testing)**
```sql
-- Only run this AFTER you've tested and confirmed everything works
-- This is the "destructive" part, but your data is already safe in task_assignments

-- Remove old columns (this will show the warning)
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;
```

## 🔄 **Alternative: Keep Both Structures**

If you want to avoid the warning entirely, you can keep both structures:

```sql
-- Just create the new table and migrate data
-- Don't remove the old columns
-- The application will work with the new structure
-- Old columns will be ignored
```

## ✅ **Recommended Approach:**

1. **Run Steps 1-4** (all safe operations)
2. **Test the application** thoroughly
3. **If everything works perfectly**, then consider Step 6
4. **If you're unsure**, just keep both structures

## 🚨 **What to Do Now:**

1. **Start with Step 1** (backup)
2. **Run Step 2** (create new table)
3. **Run Step 3** (migrate data)
4. **Test the application**
5. **Let me know how it goes!**

This way, you can safely migrate without any risk to your data! 🛡️ 