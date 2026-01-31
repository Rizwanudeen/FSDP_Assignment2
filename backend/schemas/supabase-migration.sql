-- Supabase/PostgreSQL Migration Script
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    avatar VARCHAR(1000),
    capabilities JSONB, -- Use JSONB for better performance
    configuration JSONB,
    metrics JSONB,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'private',
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500),
    visibility VARCHAR(20) DEFAULT 'private',
    user_id UUID NOT NULL REFERENCES users(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    feedback SMALLINT DEFAULT 0, -- 1 for like, -1 for dislike, 0 for neutral
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id),
    objective VARCHAR(1000),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    visibility VARCHAR(20) DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),
    role VARCHAR(100),
    is_primary_agent BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborative Tasks table
CREATE TABLE IF NOT EXISTS collaborative_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    result TEXT,
    feedback SMALLINT DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'private',
    parent_task_id UUID REFERENCES collaborative_tasks(id),
    version_number INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Task Assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES collaborative_tasks(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),
    subtask_description VARCHAR(1000) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    result TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_order INT DEFAULT 1
);

-- Agent Contributions table
CREATE TABLE IF NOT EXISTS agent_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES collaborative_tasks(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),
    contribution TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES collaborative_tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Requests table
CREATE TABLE IF NOT EXISTS share_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    requester_user_id UUID NOT NULL REFERENCES users(id),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Access table
CREATE TABLE IF NOT EXISTS resource_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'collaborator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource_type, resource_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_tasks_team_id ON collaborative_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_tasks_user_id ON collaborative_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_access_lookup ON resource_access(resource_type, resource_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic - you can customize)

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can view their own agents and shared agents
CREATE POLICY "Users can view own and shared agents" ON agents
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR
        visibility = 'public' OR
        EXISTS (
            SELECT 1 FROM resource_access 
            WHERE resource_type = 'agent' 
            AND resource_id = agents.id 
            AND user_id::text = auth.uid()::text
        )
    );

-- Users can create their own agents
CREATE POLICY "Users can insert own agents" ON agents
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Users can update their own agents
CREATE POLICY "Users can update own agents" ON agents
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Similar policies for other tables...
-- (Add more policies as needed)
