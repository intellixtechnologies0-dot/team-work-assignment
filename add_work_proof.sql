-- Add Work Proof Column to Tasks Table
-- This script adds a column to store links or screenshots of work done

-- 1. Add work_proof column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_proof TEXT;

-- 2. Add work_proof_updated_at column to track when work proof was last updated
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_proof_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Update the work_proof_updated_at column when work_proof is updated
CREATE OR REPLACE FUNCTION update_work_proof_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.work_proof IS DISTINCT FROM OLD.work_proof THEN
        NEW.work_proof_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_work_proof_timestamp_trigger ON tasks;
CREATE TRIGGER update_work_proof_timestamp_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_work_proof_timestamp();

-- 5. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('work_proof', 'work_proof_updated_at')
ORDER BY column_name; 