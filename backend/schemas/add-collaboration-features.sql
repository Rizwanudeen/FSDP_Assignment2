-- Migration: Add collaboration features (visibility and sharing)
-- Run this script to add the new tables and columns

USE FSDP;
GO

-- Add visibility column to Agents
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Agents') 
    AND name = 'visibility'
)
BEGIN
    ALTER TABLE dbo.Agents ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT 'Added visibility column to Agents table';
END
ELSE
BEGIN
    PRINT 'Visibility column already exists in Agents table';
END
GO

-- Add visibility column to Conversations
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Conversations') 
    AND name = 'visibility'
)
BEGIN
    ALTER TABLE dbo.Conversations ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT 'Added visibility column to Conversations table';
END
ELSE
BEGIN
    PRINT 'Visibility column already exists in Conversations table';
END
GO

-- Add visibility column to CollaborativeTasks
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CollaborativeTasks') 
    AND name = 'visibility'
)
BEGIN
    ALTER TABLE dbo.CollaborativeTasks ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT 'Added visibility column to CollaborativeTasks table';
END
ELSE
BEGIN
    PRINT 'Visibility column already exists in CollaborativeTasks table';
END
GO

-- Add visibility column to Teams
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Teams') 
    AND name = 'visibility'
)
BEGIN
    ALTER TABLE dbo.Teams ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT 'Added visibility column to Teams table';
END
ELSE
BEGIN
    PRINT 'Visibility column already exists in Teams table';
END
GO

-- ShareRequests table
IF OBJECT_ID('dbo.ShareRequests', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ShareRequests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    resourceType NVARCHAR(50) NOT NULL, -- 'agent', 'conversation', 'task', 'team'
    resourceId UNIQUEIDENTIFIER NOT NULL,
    requesterUserId UNIQUEIDENTIFIER NOT NULL,
    ownerUserId UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ShareRequests_Requester FOREIGN KEY (requesterUserId) REFERENCES dbo.Users(id),
    CONSTRAINT FK_ShareRequests_Owner FOREIGN KEY (ownerUserId) REFERENCES dbo.Users(id)
  );
  PRINT 'Created ShareRequests table';
END
ELSE
BEGIN
    PRINT 'ShareRequests table already exists';
END
GO

-- ResourceAccess table (stores approved access)
IF OBJECT_ID('dbo.ResourceAccess', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ResourceAccess (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    resourceType NVARCHAR(50) NOT NULL, -- 'agent', 'conversation', 'task', 'team'
    resourceId UNIQUEIDENTIFIER NOT NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'collaborator', -- 'viewer', 'collaborator'
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ResourceAccess_User FOREIGN KEY (userId) REFERENCES dbo.Users(id),
    CONSTRAINT UQ_ResourceAccess UNIQUE (resourceType, resourceId, userId)
  );
  PRINT 'Created ResourceAccess table';
END
ELSE
BEGIN
    PRINT 'ResourceAccess table already exists';
END
GO

PRINT '';
PRINT 'Migration completed successfully!';
PRINT 'New features:';
PRINT '- Visibility control (public/private) for all resources';
PRINT '- Share request system';
PRINT '- Resource access management';
GO
