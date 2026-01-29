-- Add feedback column to CollaborativeTasks table
-- Run this if the column doesn't exist yet

USE FSDP;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CollaborativeTasks') 
    AND name = 'feedback'
)
BEGIN
    ALTER TABLE dbo.CollaborativeTasks ADD feedback SMALLINT NOT NULL DEFAULT 0;
    PRINT 'Feedback column added successfully';
END
ELSE
BEGIN
    PRINT 'Feedback column already exists';
END
GO
