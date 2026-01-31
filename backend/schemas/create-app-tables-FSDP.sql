-- Create DB and core application tables for the project (SQL Server)
-- This copy targets the FSDP database

IF DB_ID('FSDP') IS NULL
BEGIN
  CREATE DATABASE FSDP;
END
GO

USE FSDP;
GO

-- Users
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    name NVARCHAR(255) NULL,
    password NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
  );
END
GO

-- Agents
IF OBJECT_ID('dbo.Agents', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Agents (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255),
    description NVARCHAR(2000),
    type NVARCHAR(100),
    status NVARCHAR(50) DEFAULT 'ACTIVE',
    avatar NVARCHAR(1000) NULL,
    capabilities NVARCHAR(MAX) NULL, -- JSON array stored as text
    configuration NVARCHAR(MAX) NULL, -- JSON
    metrics NVARCHAR(MAX) NULL,       -- JSON
    lastActive DATETIME2 DEFAULT SYSUTCDATETIME(),
    isDeleted BIT DEFAULT 0 NOT NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
  );
  ALTER TABLE dbo.Agents ADD CONSTRAINT FK_Agents_User FOREIGN KEY (userId) REFERENCES dbo.Users(id);
END
GO

-- Add isDeleted to Agents if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Agents') 
    AND name = 'isDeleted'
)
BEGIN
    ALTER TABLE dbo.Agents ADD isDeleted BIT NOT NULL DEFAULT 0;
END
GO

-- Conversations
IF OBJECT_ID('dbo.Conversations', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Conversations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(500) NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    agentId UNIQUEIDENTIFIER NOT NULL,
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
  );
  ALTER TABLE dbo.Conversations ADD CONSTRAINT FK_Conversations_User FOREIGN KEY (userId) REFERENCES dbo.Users(id);
  ALTER TABLE dbo.Conversations ADD CONSTRAINT FK_Conversations_Agent FOREIGN KEY (agentId) REFERENCES dbo.Agents(id);
END
GO

-- Messages
IF OBJECT_ID('dbo.Messages', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Messages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    conversationId UNIQUEIDENTIFIER NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content NVARCHAR(MAX) NOT NULL,
    feedback SMALLINT DEFAULT 0, -- 1 for like, -1 for dislike, 0 for neutral
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Messages_Conversation FOREIGN KEY (conversationId) REFERENCES dbo.Conversations(id) ON DELETE CASCADE
  );
END
GO

-- Teams (Multi-Agent Collaboration)
IF OBJECT_ID('dbo.Teams', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Teams (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(2000) NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    objective NVARCHAR(1000) NULL,
    status NVARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Teams_User FOREIGN KEY (userId) REFERENCES dbo.Users(id)
  );
END
GO

-- TeamMembers (Agents in Teams)
IF OBJECT_ID('dbo.TeamMembers', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.TeamMembers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    teamId UNIQUEIDENTIFIER NOT NULL,
    agentId UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(100) NULL, -- e.g., 'Intelligence Analyst', 'Mission Planner'
    isPrimaryAgent BIT DEFAULT 0,
    addedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TeamMembers_Team FOREIGN KEY (teamId) REFERENCES dbo.Teams(id) ON DELETE CASCADE,
    CONSTRAINT FK_TeamMembers_Agent FOREIGN KEY (agentId) REFERENCES dbo.Agents(id)
  );
END
GO

-- CollaborativeTasks
IF OBJECT_ID('dbo.CollaborativeTasks', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollaborativeTasks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    teamId UNIQUEIDENTIFIER NOT NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
    priority NVARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    result NVARCHAR(MAX) NULL, -- Final aggregated result
    feedback SMALLINT DEFAULT 0, -- 1 for like, -1 for dislike, 0 for neutral
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    completedAt DATETIME2 NULL,
    CONSTRAINT FK_CollaborativeTasks_Team FOREIGN KEY (teamId) REFERENCES dbo.Teams(id),
    CONSTRAINT FK_CollaborativeTasks_User FOREIGN KEY (userId) REFERENCES dbo.Users(id)
  );
END
GO

-- Add feedback column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CollaborativeTasks') 
    AND name = 'feedback'
)
BEGIN
    ALTER TABLE dbo.CollaborativeTasks ADD feedback SMALLINT NOT NULL DEFAULT 0;
END
GO

-- TaskAssignments (Subtasks assigned to specific agents)
IF OBJECT_ID('dbo.TaskAssignments', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.TaskAssignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    taskId UNIQUEIDENTIFIER NOT NULL,
    agentId UNIQUEIDENTIFIER NOT NULL,
    subtaskDescription NVARCHAR(1000) NOT NULL,
    status NVARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
    result NVARCHAR(MAX) NULL,
    startedAt DATETIME2 NULL,
    completedAt DATETIME2 NULL,
    executionOrder INT DEFAULT 1,
    CONSTRAINT FK_TaskAssignments_Task FOREIGN KEY (taskId) REFERENCES dbo.CollaborativeTasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_TaskAssignments_Agent FOREIGN KEY (agentId) REFERENCES dbo.Agents(id)
  );
END
GO

-- AgentContributions (Track each agent's contribution)
IF OBJECT_ID('dbo.AgentContributions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.AgentContributions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    taskId UNIQUEIDENTIFIER NOT NULL,
    agentId UNIQUEIDENTIFIER NOT NULL,
    contribution NVARCHAR(MAX) NOT NULL,
    confidence FLOAT DEFAULT 0.0, -- 0-1 score
    createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AgentContributions_Task FOREIGN KEY (taskId) REFERENCES dbo.CollaborativeTasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_AgentContributions_Agent FOREIGN KEY (agentId) REFERENCES dbo.Agents(id)
  );
END
GO

-- MessageAttachments (Files attached to conversation messages)
IF OBJECT_ID('dbo.MessageAttachments', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.MessageAttachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    messageId UNIQUEIDENTIFIER NOT NULL,
    fileName NVARCHAR(500) NOT NULL,
    originalFileName NVARCHAR(500) NOT NULL,
    filePath NVARCHAR(1000) NOT NULL,
    fileType NVARCHAR(100) NOT NULL, -- MIME type (image/jpeg, application/pdf, etc.)
    fileSize BIGINT NOT NULL, -- Size in bytes
    uploadedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_MessageAttachments_Message FOREIGN KEY (messageId) REFERENCES dbo.Messages(id) ON DELETE CASCADE
  );
END
GO

-- TaskAttachments (Files attached to collaborative tasks)
IF OBJECT_ID('dbo.TaskAttachments', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.TaskAttachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    taskId UNIQUEIDENTIFIER NOT NULL,
    fileName NVARCHAR(500) NOT NULL,
    originalFileName NVARCHAR(500) NOT NULL,
    filePath NVARCHAR(1000) NOT NULL,
    fileType NVARCHAR(100) NOT NULL, -- MIME type
    fileSize BIGINT NOT NULL, -- Size in bytes
    uploadedBy UNIQUEIDENTIFIER NOT NULL, -- User who uploaded
    uploadedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TaskAttachments_Task FOREIGN KEY (taskId) REFERENCES dbo.CollaborativeTasks(id) ON DELETE CASCADE,
    CONSTRAINT FK_TaskAttachments_User FOREIGN KEY (uploadedBy) REFERENCES dbo.Users(id)
  );
END
GO

-- Add visibility column to Agents
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Agents') 
    AND name = 'visibility'
)
BEGIN
    ALTER TABLE dbo.Agents ADD visibility NVARCHAR(20) NOT NULL DEFAULT 'private';
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
END
GO
