-- ========================================
-- COMPLETE SUPABASE SCHEMA - FIXED ORDERING
-- ========================================

-- 1. Setup
create extension if not exists "uuid-ossp";

-- 2. Agents (linked to auth.users)
create table if not exists public.agents (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null, 
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
    visibility text default 'private',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Conversations
create table if not exists public.conversations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    title text,
    visibility text default 'private',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. Messages
create table if not exists public.messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    role text not null, 
    content text not null,
    tokens integer default 0,
    feedback smallint default 0,
    created_at timestamptz default now()
);

-- 5. Users table (for username search)
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    name text,
    password text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 6. Teams table
create table if not exists public.teams (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    user_id uuid references auth.users(id) on delete cascade not null,
    objective text,
    status text default 'ACTIVE',
    visibility text default 'private',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. Team Members
create table if not exists public.team_members (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    role text,
    is_primary_agent boolean default false,
    added_at timestamptz default now()
);

-- 8. Collaborative Tasks
create table if not exists public.collaborative_tasks (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text,
    status text default 'PENDING',
    priority text default 'MEDIUM',
    result text,
    feedback smallint default 0,
    visibility text default 'private',
    parent_task_id uuid references public.collaborative_tasks(id),
    version_number int default 1,
    created_at timestamptz default now(),
    completed_at timestamptz
);

-- 9. Share Requests
create table if not exists public.share_requests (
    id uuid primary key default uuid_generate_v4(),
    resource_type text not null,
    resource_id uuid not null,
    requester_user_id uuid references auth.users(id) on delete cascade not null,
    owner_user_id uuid references auth.users(id) on delete cascade not null,
    status text default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 10. Resource Access (CREATE THIS BEFORE POLICIES REFERENCE IT!)
create table if not exists public.resource_access (
    id uuid primary key default uuid_generate_v4(),
    resource_type text not null,
    resource_id uuid not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text default 'collaborator',
    created_at timestamptz default now(),
    unique(resource_type, resource_id, user_id)
);

-- 11. Task Assignments
create table if not exists public.task_assignments (
    id uuid primary key default uuid_generate_v4(),
    task_id uuid references public.collaborative_tasks(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    subtask_description text not null,
    status text default 'PENDING',
    result text,
    started_at timestamptz,
    completed_at timestamptz,
    execution_order int default 1
);

-- 12. Agent Contributions
create table if not exists public.agent_contributions (
    id uuid primary key default uuid_generate_v4(),
    task_id uuid references public.collaborative_tasks(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    contribution text not null,
    confidence float default 0.0,
    created_at timestamptz default now()
);

-- 13. Saved Responses
create table if not exists public.saved_responses (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    original_agent_id uuid references public.agents(id) on delete cascade not null,
    original_conversation_id uuid references public.conversations(id) on delete cascade not null,
    original_message_id uuid references public.messages(id) on delete cascade not null,
    original_response text not null,
    target_agent_id uuid references public.agents(id) on delete cascade not null,
    question_text text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 14. Cross-Agent Replies
create table if not exists public.cross_agent_replies (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    original_message_id uuid references public.messages(id) on delete cascade not null,
    original_agent_id uuid references public.agents(id) on delete cascade not null,
    original_conversation_id uuid references public.conversations(id) on delete cascade not null,
    title text not null,
    question_content text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 15. Cross-Agent Responses
create table if not exists public.cross_agent_responses (
    id uuid primary key default uuid_generate_v4(),
    cross_reply_id uuid references public.cross_agent_replies(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    response_message_id uuid references public.messages(id) on delete cascade not null,
    created_at timestamptz default now()
);

-- ========================================
-- INDEXES
-- ========================================

create index if not exists idx_agents_user_id on public.agents(user_id);
create index if not exists idx_agents_is_deleted on public.agents(is_deleted);
create index if not exists idx_agents_created_at on public.agents(created_at desc);

create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_agent_id on public.conversations(agent_id);
create index if not exists idx_conversations_created_at on public.conversations(created_at desc);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_role on public.messages(role);
create index if not exists idx_messages_created_at on public.messages(created_at desc);

create index if not exists idx_users_name on public.users(name);
create index if not exists idx_users_email on public.users(email);

create index if not exists idx_teams_user_id on public.teams(user_id);
create index if not exists idx_team_members_team on public.team_members(team_id);

create index if not exists idx_collab_tasks_team on public.collaborative_tasks(team_id);
create index if not exists idx_collab_tasks_user on public.collaborative_tasks(user_id);
create index if not exists idx_collab_tasks_parent on public.collaborative_tasks(parent_task_id);

create index if not exists idx_share_requests_requester on public.share_requests(requester_user_id);
create index if not exists idx_share_requests_owner on public.share_requests(owner_user_id);

create index if not exists idx_resource_access_user on public.resource_access(user_id);
create index if not exists idx_resource_access_lookup on public.resource_access(resource_type, resource_id, user_id);

create index if not exists idx_task_assignments_task on public.task_assignments(task_id);
create index if not exists idx_agent_contributions_task on public.agent_contributions(task_id);

create index if not exists idx_saved_responses_user_id on public.saved_responses(user_id);
create index if not exists idx_saved_responses_target_agent on public.saved_responses(target_agent_id);
create index if not exists idx_saved_responses_original_agent on public.saved_responses(original_agent_id);
create index if not exists idx_saved_responses_created_at on public.saved_responses(created_at desc);

create index if not exists idx_cross_agent_replies_user_id on public.cross_agent_replies(user_id);
create index if not exists idx_cross_agent_replies_original_agent on public.cross_agent_replies(original_agent_id);
create index if not exists idx_cross_agent_replies_created_at on public.cross_agent_replies(created_at desc);

create index if not exists idx_cross_agent_responses_cross_reply on public.cross_agent_responses(cross_reply_id);
create index if not exists idx_cross_agent_responses_agent on public.cross_agent_responses(agent_id);
create index if not exists idx_cross_agent_responses_created_at on public.cross_agent_responses(created_at);

-- ========================================
-- ENABLE RLS
-- ========================================

alter table public.agents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.collaborative_tasks enable row level security;
alter table public.share_requests enable row level security;
alter table public.resource_access enable row level security;
alter table public.task_assignments enable row level security;
alter table public.agent_contributions enable row level security;
alter table public.saved_responses enable row level security;
alter table public.cross_agent_replies enable row level security;
alter table public.cross_agent_responses enable row level security;

-- ========================================
-- RLS POLICIES (NOW RESOURCE_ACCESS EXISTS!)
-- ========================================

-- Users policies
drop policy if exists "Users can view all profiles for search" on public.users;
create policy "Users can view all profiles for search"
  on public.users for select using (true);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id or auth.role() = 'service_role');

-- Agents policies
drop policy if exists "Users can select their own agents" on public.agents;
drop policy if exists "Users can select own and shared agents" on public.agents;
create policy "Users can select own and shared agents"
  on public.agents for select
  using (
    auth.uid() = user_id or 
    auth.role() = 'service_role' or
    visibility = 'public' or
    exists (select 1 from public.resource_access where resource_type = 'agent' and resource_id = agents.id and user_id = auth.uid())
  );

drop policy if exists "Users can insert their own agents" on public.agents;
create policy "Users can insert their own agents"
  on public.agents for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can update their own agents" on public.agents;
create policy "Users can update their own agents"
  on public.agents for update
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can delete their own agents" on public.agents;
create policy "Users can delete their own agents"
  on public.agents for delete
  using (auth.uid() = user_id or auth.role() = 'service_role');

-- Conversations policies
drop policy if exists "Users can select their own conversations" on public.conversations;
drop policy if exists "Users can select own and shared conversations" on public.conversations;
create policy "Users can select own and shared conversations"
  on public.conversations for select
  using (
    auth.uid() = user_id or
    auth.role() = 'service_role' or
    exists (
      select 1 from public.agents a
      left join public.resource_access ra on ra.resource_type = 'agent' and ra.resource_id = a.id
      where a.id = conversations.agent_id and (a.user_id = auth.uid() or ra.user_id = auth.uid())
    )
  );

drop policy if exists "Users can insert their own conversations" on public.conversations;
create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can update their own conversations" on public.conversations;
create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can delete their own conversations" on public.conversations;
create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id or auth.role() = 'service_role');

-- Messages policies
drop policy if exists "Users can select messages from their conversations" on public.messages;
create policy "Users can select messages from their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid() or auth.role() = 'service_role')
    )
  );

drop policy if exists "Users can insert messages in their conversations" on public.messages;
create policy "Users can insert messages in their conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid() or auth.role() = 'service_role')
    )
  );

drop policy if exists "Users can update messages in their conversations" on public.messages;
create policy "Users can update messages in their conversations"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid() or auth.role() = 'service_role')
    )
  );

drop policy if exists "Users can delete messages from their conversations" on public.messages;
create policy "Users can delete messages from their conversations"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid() or auth.role() = 'service_role')
    )
  );

-- Teams policies
drop policy if exists "Users can view own and shared teams" on public.teams;
create policy "Users can view own and shared teams"
  on public.teams for select
  using (
    auth.uid() = user_id or 
    visibility = 'public' or
    auth.role() = 'service_role' or
    exists (select 1 from public.resource_access where resource_type = 'team' and resource_id = teams.id and user_id = auth.uid())
  );

drop policy if exists "Users can manage own teams" on public.teams;
create policy "Users can manage own teams"
  on public.teams for all
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- Collaborative Tasks policies
drop policy if exists "Users can view own and shared tasks" on public.collaborative_tasks;
create policy "Users can view own and shared tasks"
  on public.collaborative_tasks for select
  using (
    auth.uid() = user_id or
    auth.role() = 'service_role' or
    exists (select 1 from public.resource_access where resource_type = 'task' and resource_id = collaborative_tasks.id and user_id = auth.uid()) or
    exists (select 1 from public.teams t left join public.resource_access ra on ra.resource_type = 'team' and ra.resource_id = t.id where t.id = collaborative_tasks.team_id and (t.user_id = auth.uid() or ra.user_id = auth.uid()))
  );

drop policy if exists "Users can manage own tasks" on public.collaborative_tasks;
create policy "Users can manage own tasks"
  on public.collaborative_tasks for all
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- Share Requests policies
drop policy if exists "Users can view own requests" on public.share_requests;
create policy "Users can view own requests"
  on public.share_requests for select
  using (auth.uid() = requester_user_id or auth.uid() = owner_user_id or auth.role() = 'service_role');

drop policy if exists "Users can create requests" on public.share_requests;
create policy "Users can create requests"
  on public.share_requests for insert
  with check (auth.uid() = requester_user_id or auth.role() = 'service_role');

drop policy if exists "Owners can update requests" on public.share_requests;
create policy "Owners can update requests"
  on public.share_requests for update
  using (auth.uid() = owner_user_id or auth.role() = 'service_role');

-- Resource Access policies
drop policy if exists "Users can view their access" on public.resource_access;
create policy "Users can view their access"
  on public.resource_access for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Service role manages access" on public.resource_access;
create policy "Service role manages access"
  on public.resource_access for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Saved Responses policies
drop policy if exists "Users can select their own saved responses" on public.saved_responses;
create policy "Users can select their own saved responses"
  on public.saved_responses for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can insert their own saved responses" on public.saved_responses;
create policy "Users can insert their own saved responses"
  on public.saved_responses for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can update their own saved responses" on public.saved_responses;
create policy "Users can update their own saved responses"
  on public.saved_responses for update
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can delete their own saved responses" on public.saved_responses;
create policy "Users can delete their own saved responses"
  on public.saved_responses for delete
  using (auth.uid() = user_id or auth.role() = 'service_role');

-- Cross-Agent Replies policies
drop policy if exists "Users can select their own cross-agent replies" on public.cross_agent_replies;
create policy "Users can select their own cross-agent replies"
  on public.cross_agent_replies for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can insert their own cross-agent replies" on public.cross_agent_replies;
create policy "Users can insert their own cross-agent replies"
  on public.cross_agent_replies for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can update their own cross-agent replies" on public.cross_agent_replies;
create policy "Users can update their own cross-agent replies"
  on public.cross_agent_replies for update
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can delete their own cross-agent replies" on public.cross_agent_replies;
create policy "Users can delete their own cross-agent replies"
  on public.cross_agent_replies for delete
  using (auth.uid() = user_id or auth.role() = 'service_role');

-- Cross-Agent Responses policies
drop policy if exists "Users can select responses from their cross-agent replies" on public.cross_agent_responses;
create policy "Users can select responses from their cross-agent replies"
  on public.cross_agent_responses for select
  using (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.cross_agent_replies car
      where car.id = cross_reply_id and car.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert responses to their cross-agent replies" on public.cross_agent_responses;
create policy "Users can insert responses to their cross-agent replies"
  on public.cross_agent_responses for insert
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.cross_agent_replies car
      where car.id = cross_reply_id and car.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete responses from their cross-agent replies" on public.cross_agent_responses;
create policy "Users can delete responses from their cross-agent replies"
  on public.cross_agent_responses for delete
  using (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.cross_agent_replies car
      where car.id = cross_reply_id and car.user_id = auth.uid()
    )
  );

-- ========================================
-- VERIFICATION
-- ========================================
select 'Schema creation complete!' as status;
select table_name from information_schema.tables 
where table_schema = 'public' 
order by table_name;
