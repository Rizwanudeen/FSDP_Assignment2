-- Create task_attachments table for collaborative tasks
-- This table stores file attachments (images, documents) for tasks

CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES collaborative_tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),:3000/api/teams/478f473f-37a3-43bc-8aab-2ab80dad9c98/tasks/aa4269ca-8b2d-49aa-9184-ac3c7457abdc/versions:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
:3000/api/teams/478f473f-37a3-43bc-8aab-2ab80dad9c98/tasks/aa4269ca-8b2d-49aa-9184-ac3c7457abdc/versions:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_attachments_file_type ON task_attachments(file_type);

-- Add comment to table
COMMENT ON TABLE task_attachments IS 'Stores file attachments for collaborative tasks';

-- Add comments to columns
COMMENT ON COLUMN task_attachments.file_name IS 'Stored filename (usually with UUID)';
COMMENT ON COLUMN task_attachments.original_file_name IS 'Original filename uploaded by user';
COMMENT ON COLUMN task_attachments.file_path IS 'Full path or URL to the file in storage';
COMMENT ON COLUMN task_attachments.file_type IS 'Type category: image, document, video, etc.';
COMMENT ON COLUMN task_attachments.mime_type IS 'MIME type: image/png, application/pdf, etc.';

-- Grant permissions (adjust based on your RLS policy needs)
-- Note: RLS is disabled since you're using custom JWT authentication
-- If you want to enable RLS later, you'll need to adjust policies for your auth system
ALTER TABLE task_attachments DISABLE ROW LEVEL SECURITY;
