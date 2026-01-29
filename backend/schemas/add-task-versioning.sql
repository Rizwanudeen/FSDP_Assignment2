-- Add versioning columns to CollaborativeTasks table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CollaborativeTasks') AND name = 'versionNumber')
BEGIN
    ALTER TABLE CollaborativeTasks
    ADD versionNumber INT NOT NULL DEFAULT 1;
END
GO

-- Drop existing index if it exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_CollaborativeTasks_ParentTask')
BEGIN
    DROP INDEX IDX_CollaborativeTasks_ParentTask ON CollaborativeTasks;
END
GO

-- Drop parentTaskId if it exists with wrong data type
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CollaborativeTasks') AND name = 'parentTaskId')
BEGIN
    ALTER TABLE CollaborativeTasks
    DROP COLUMN parentTaskId;
END
GO

-- Add parentTaskId with correct UNIQUEIDENTIFIER type
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CollaborativeTasks') AND name = 'parentTaskId')
BEGIN
    ALTER TABLE CollaborativeTasks
    ADD parentTaskId UNIQUEIDENTIFIER NULL;
END
GO

-- Add foreign key constraint for parentTaskId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CollaborativeTasks_ParentTask')
BEGIN
    ALTER TABLE CollaborativeTasks
    ADD CONSTRAINT FK_CollaborativeTasks_ParentTask
    FOREIGN KEY (parentTaskId) REFERENCES CollaborativeTasks(id);
END
GO

-- Create index for faster version queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_CollaborativeTasks_ParentTask')
BEGIN
    CREATE INDEX IDX_CollaborativeTasks_ParentTask
    ON CollaborativeTasks(parentTaskId);
END
GO

PRINT 'Task versioning columns added successfully';
