# Multiple Assignees Setup Guide

This guide will help you modify your Supabase database to support assigning the same task to multiple team members.

## 🔄 **Step 1: Update Database Schema**

### **Create New Table: task_assignments**
```sql
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

### **Modify Existing Table: tasks**
```sql
-- Remove the single assignee columns from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;
```

## 🔧 **Step 2: Update Application Logic**

The application will now:
1. **Create tasks** without assignees initially
2. **Assign tasks** to multiple team members through the task_assignments table
3. **Track individual progress** for each assignee
4. **Show tasks** based on assignments rather than single assignee

## 📊 **New Database Schema Overview**

### **tasks** (Updated)
- `id`: Unique identifier
- `title`: Task title
- `description`: Task description
- `priority`: low/medium/high
- `due_date`: Due date
- `created_by`: User who created the task
- `created_at`: Timestamp
- `updated_at`: Timestamp

### **task_assignments** (New)
- `id`: Unique identifier
- `task_id`: Reference to task
- `assignee_id`: Reference to team member
- `assignee_name`: Team member name
- `status`: todo/inProgress/completed (individual status)
- `assigned_at`: Timestamp
- `updated_at`: Timestamp

## 🚀 **Benefits of This Approach**

✅ **Multiple assignees** per task  
✅ **Individual progress tracking** for each assignee  
✅ **Flexible assignment** - can assign to one or many  
✅ **Better collaboration** - team members can work together  
✅ **Detailed reporting** - see who completed what  

## 🧪 **Testing the New Setup**

1. **Run the SQL commands** in Supabase SQL Editor
2. **Deploy the updated application**
3. **Test creating tasks** with multiple assignees
4. **Verify each assignee** can see and update their assigned tasks
5. **Check individual progress** tracking works correctly

---

**Your Team Work Assignment app now supports multiple assignees per task!** 🚀 