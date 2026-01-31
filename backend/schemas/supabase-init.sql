-- Supabase PostgreSQL Schema Initialization

-- 1. Setup
create extension if not exists "uuid-ossp";

-- 2. Agents (Note: linked to auth.users)
create table public.agents (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null, 
    name text not null,
    description text,
    type text,
    status text default 'ACTIVE',
    avatar text,
    capabilities jsonb default '[]'::jsonb,
    configuration jsonb default '{"system_prompt": "You are a helpful assistant.", "model": "gpt-4o-mini"}'::jsonb,
    metrics jsonb default '{"totalInteractions": 0, "successRate": 0, "avgResponseTime": 0}'::jsonb,
    last_active timestamptz default now(),
    is_deleted boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Conversations
create table public.conversations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    agent_id uuid references public.agents(id) on delete cascade,
    title text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. Messages
create table public.messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid references public.conversations(id) on delete cascade,
    role text not null, 
    content text not null,
    tokens integer default 0,
    feedback smallint default 0,
    created_at timestamptz default now()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_deleted ON public.agents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for agents table
-- Allow authenticated users to view their own agents
CREATE POLICY "Users can view their own agents" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to create agents (service role can bypass)
CREATE POLICY "Users can create their own agents" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own agents
CREATE POLICY "Users can update their own agents" ON public.agents
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own agents
CREATE POLICY "Users can delete their own agents" ON public.agents
  FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS Policies for conversations table
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- 9. RLS Policies for messages table
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );