# Database Migration Guide

## 🚨 **IMPORTANT: Database Migration Required**

Your application is trying to use the new multiple assignees feature, but your Supabase database still has the old structure. You need to run these SQL commands in your Supabase SQL Editor.

## 📋 **Step 1: Backup Your Data (Optional but Recommended)**

Before making changes, you can export your current data:

```sql
-- Export current tasks (if you want to keep them)
SELECT * FROM tasks;
```

## 🔄 **Step 2: Create the New Table Structure**

Run these commands in your Supabase SQL Editor:

```sql
-- Create new table for task assignments
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

## 🔧 **Step 3: Migrate Existing Data (If You Have Tasks)**

If you have existing tasks, run this to migrate them:

```sql
-- Migrate existing tasks to new structure
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

## 🗑️ **Step 4: Remove Old Columns**

After migrating data, remove the old columns:

```sql
-- Remove old columns from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;
```

## ✅ **Step 5: Verify the Migration**

Check that everything is working:

```sql
-- Check tasks table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks';

-- Check task_assignments table
SELECT * FROM task_assignments LIMIT 5;
```

## 🧪 **Step 6: Test the Application**

1. **Go to:** https://intellixtechnologies0-dot.github.io/team-work-assignment/
2. **Sign in as admin** (vrreddypc143@gmail.com)
3. **Add team members** if needed
4. **Create a new task** with multiple assignees
5. **Test the functionality**

## 🚨 **If You Get Errors:**

### **Error: "relation 'task_assignments' does not exist"**
- Make sure you ran the CREATE TABLE command for `task_assignments`

### **Error: "column 'assignee_id' does not exist"**
- Make sure you removed the old columns from the `tasks` table

### **Error: "foreign key constraint"**
- Make sure your `team_members` table exists and has data

## 📞 **Need Help?**

If you're still getting errors:

1. **Check the browser console** (F12 → Console tab)
2. **Look for specific error messages**
3. **Verify all SQL commands ran successfully**
4. **Make sure you're in the correct Supabase project**

---

**After completing these steps, your application should work with multiple assignees!** 🚀 