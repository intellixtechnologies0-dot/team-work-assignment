# Supabase Setup Guide

This guide will help you set up Supabase as the backend for your Team Work Assignment application.

## 🚀 **Step 1: Create Supabase Project**

1. **Go to [Supabase.com](https://supabase.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Fill in project details:**
   - Organization: Select your org or create one
   - Project name: `team-work-assignment`
   - Database password: Create a strong password
   - Region: Choose closest to your team
5. **Click "Create new project"**

## 📊 **Step 2: Create Database Tables**

### **Table 1: profiles**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### **Table 2: team_members**
```sql
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_by UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Users can insert team members" ON team_members FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update team members" ON team_members FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete team members" ON team_members FOR DELETE USING (auth.uid() = created_by);
```

### **Table 3: tasks**
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  assignee_name TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inProgress', 'completed')),
  created_by UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update tasks" ON tasks FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete tasks" ON tasks FOR DELETE USING (auth.uid() = created_by);
```

## 🔧 **Step 3: Get Your Supabase Credentials**

1. **Go to your Supabase project dashboard**
2. **Click "Settings" in the left sidebar**
3. **Click "API"**
4. **Copy these values:**
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## 🔐 **Step 4: Update Your Application**

1. **Open `script.js`**
2. **Replace the placeholder values:**
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. **With your actual values:**
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

## 🔄 **Step 5: Enable Email Authentication**

1. **Go to Authentication → Settings**
2. **Enable "Enable email confirmations"** (optional)
3. **Configure email templates** (optional)

## 🚀 **Step 6: Deploy Your Application**

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add Supabase authentication and backend"
   git push origin main
   ```

2. **Your app will be available at:**
   `https://intellixtechnologies0-dot.github.io/team-work-assignment`

## 📋 **Database Schema Overview**

### **profiles**
- `id`: User ID (from auth.users)
- `name`: Full name
- `email`: Email address
- `role`: User role
- `created_at`: Timestamp
- `updated_at`: Timestamp

### **team_members**
- `id`: Unique identifier
- `name`: Member name
- `email`: Member email
- `role`: Member role
- `created_by`: User who added the member
- `created_at`: Timestamp
- `updated_at`: Timestamp

### **tasks**
- `id`: Unique identifier
- `title`: Task title
- `description`: Task description
- `assignee_id`: Team member ID
- `assignee_name`: Team member name
- `priority`: low/medium/high
- `due_date`: Due date
- `status`: todo/inProgress/completed
- `created_by`: User who created the task
- `created_at`: Timestamp
- `updated_at`: Timestamp

## 🔒 **Security Features**

✅ **Row Level Security (RLS)** enabled on all tables  
✅ **Authentication required** for all operations  
✅ **Users can only modify** their own data  
✅ **Team members and tasks** are shared across all users  
✅ **Automatic timestamps** for audit trail  

## 🧪 **Testing Your Setup**

1. **Open your deployed application**
2. **Click "Sign Up"** to create an account
3. **Add team members** and tasks
4. **Test all features** (drag & drop, status updates, etc.)
5. **Check Supabase dashboard** to see data being stored

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **"Invalid API key" error:**
   - Check that you copied the correct anon key
   - Make sure there are no extra spaces

2. **"Table doesn't exist" error:**
   - Run the SQL commands in the Supabase SQL editor
   - Check that table names match exactly

3. **"Permission denied" error:**
   - Make sure RLS policies are created correctly
   - Check that users are authenticated

4. **"Network error":**
   - Check your internet connection
   - Verify the Supabase URL is correct

### **Need Help?**
- Check the browser console (F12) for error messages
- Review the Supabase documentation
- Check the Supabase dashboard for any errors

## 🎯 **Next Steps**

Once set up, your team can:
1. **Sign up** with their email and password
2. **Add themselves** as team members
3. **Create and assign tasks**
4. **Track progress** in real-time
5. **Access from anywhere** with internet connection

---

**Your Team Work Assignment app is now ready with full authentication and backend storage!** 🚀 