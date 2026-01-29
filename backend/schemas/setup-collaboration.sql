-- Quick Setup Script for Collaboration Features
-- This script adds all necessary tables and columns for the collaboration feature

USE FSDP;
GO

PRINT '================================================';
PRINT 'COLLABORATION FEATURE SETUP';
PRINT '================================================';
PRINT '';

-- Step 1: Add visibility columns
PRINT 'Step 1: Adding visibility columns...';
PRINT '----------------------------------------';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Agents') AND name = 'visibility')
BEGIN
    ALTER TABLE dbo.Agents ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT '✓ Added visibility to Agents';
END
ELSE PRINT '✓ Agents already has visibility column';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Conversations') AND name = 'visibility')
BEGIN
    ALTER TABLE dbo.Conversations ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT '✓ Added visibility to Conversations';
END
ELSE PRINT '✓ Conversations already has visibility column';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CollaborativeTasks') AND name = 'visibility')
BEGIN
    ALTER TABLE dbo.CollaborativeTasks ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT '✓ Added visibility to CollaborativeTasks';
END
ELSE PRINT '✓ CollaborativeTasks already has visibility column';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Teams') AND name = 'visibility')
BEGIN
    ALTER TABLE dbo.Teams ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
    PRINT '✓ Added visibility to Teams';
END
ELSE PRINT '✓ Teams already has visibility column';

PRINT '';

-- Step 2: Create ShareRequests table
PRINT 'Step 2: Creating ShareRequests table...';
PRINT '----------------------------------------';

IF OBJECT_ID('dbo.ShareRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ShareRequests (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        resourceType NVARCHAR(50) NOT NULL,
        resourceId UNIQUEIDENTIFIER NOT NULL,
        requesterUserId UNIQUEIDENTIFIER NOT NULL,
        ownerUserId UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ShareRequests_Requester FOREIGN KEY (requesterUserId) REFERENCES dbo.Users(id),
        CONSTRAINT FK_ShareRequests_Owner FOREIGN KEY (ownerUserId) REFERENCES dbo.Users(id)
    );
    PRINT '✓ ShareRequests table created';
END
ELSE PRINT '✓ ShareRequests table already exists';

PRINT '';

-- Step 3: Create ResourceAccess table
PRINT 'Step 3: Creating ResourceAccess table...';
PRINT '----------------------------------------';

IF OBJECT_ID('dbo.ResourceAccess', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResourceAccess (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        resourceType NVARCHAR(50) NOT NULL,
        resourceId UNIQUEIDENTIFIER NOT NULL,
        userId UNIQUEIDENTIFIER NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'collaborator',
        createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ResourceAccess_User FOREIGN KEY (userId) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_ResourceAccess UNIQUE (resourceType, resourceId, userId)
    );
    PRINT '✓ ResourceAccess table created';
END
ELSE PRINT '✓ ResourceAccess table already exists';

PRINT '';
PRINT '================================================';
PRINT 'SETUP COMPLETE!';
PRINT '================================================';
PRINT '';
PRINT 'New features enabled:';
PRINT '  • Public/Private visibility for all resources';
PRINT '  • Search and discover public resources';
PRINT '  • Request access to public resources';
PRINT '  • Approve/deny access requests';
PRINT '  • Shared resources management';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Restart your backend server';
PRINT '  2. Restart your frontend dev server';
PRINT '  3. Navigate to /search to discover resources';
PRINT '  4. Navigate to /requests to manage access';
PRINT '';
PRINT 'Happy collaborating! 🚀';
PRINT '';
GO
