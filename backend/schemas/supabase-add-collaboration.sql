-- ========================================
-- ADD COLLABORATION FEATURES TO EXISTING SUPABASE SCHEMA
-- Run this in Supabase SQL Editor AFTER your existing schema
-- ========================================

-- 1. Create users table (maps to auth.users with additional fields for username search)
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    name text,
    password text, -- Can be null if using Supabase auth
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_users_name on public.users(name);
create index if not exists idx_users_email on public.users(email);

alter table public.users enable row level security;

create policy "Users can view all profiles for search"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id or auth.role() = 'service_role');

-- 2. Add visibility to existing tables
alter table public.agents add column if not exists visibility text default 'private';
alter table public.conversations add column if not exists visibility text default 'private';

-- 3. Teams table
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

create index if not exists idx_teams_user_id on public.teams(user_id);
alter table public.teams enable row level security;

create policy "Users can view own and shared teams"
  on public.teams for select
  using (
    auth.uid() = user_id or 
    visibility = 'public' or
    auth.role() = 'service_role' or
    exists (select 1 from public.resource_access where resource_type = 'team' and resource_id = teams.id and user_id = auth.uid())
  );

create policy "Users can manage own teams"
  on public.teams for all
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- 4. Team Members
create table if not exists public.team_members (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    role text,
    is_primary_agent boolean default false,
    added_at timestamptz default now()
);

create index if not exists idx_team_members_team on public.team_members(team_id);
alter table public.team_members enable row level security;

-- 5. Collaborative Tasks (with versioning)
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

create index if not exists idx_collab_tasks_team on public.collaborative_tasks(team_id);
create index if not exists idx_collab_tasks_user on public.collaborative_tasks(user_id);
create index if not exists idx_collab_tasks_parent on public.collaborative_tasks(parent_task_id);
alter table public.collaborative_tasks enable row level security;

create policy "Users can view own and shared tasks"
  on public.collaborative_tasks for select
  using (
    auth.uid() = user_id or
    auth.role() = 'service_role' or
    exists (select 1 from public.resource_access where resource_type = 'task' and resource_id = collaborative_tasks.id and user_id = auth.uid()) or
    exists (select 1 from public.teams t left join public.resource_access ra on ra.resource_type = 'team' and ra.resource_id = t.id where t.id = collaborative_tasks.team_id and (t.user_id = auth.uid() or ra.user_id = auth.uid()))
  );

create policy "Users can manage own tasks"
  on public.collaborative_tasks for all
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- 6. Share Requests
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

create index if not exists idx_share_requests_requester on public.share_requests(requester_user_id);
create index if not exists idx_share_requests_owner on public.share_requests(owner_user_id);
alter table public.share_requests enable row level security;

create policy "Users can view own requests"
  on public.share_requests for select
  using (auth.uid() = requester_user_id or auth.uid() = owner_user_id or auth.role() = 'service_role');

create policy "Users can create requests"
  on public.share_requests for insert
  with check (auth.uid() = requester_user_id or auth.role() = 'service_role');

create policy "Owners can update requests"
  on public.share_requests for update
  using (auth.uid() = owner_user_id or auth.role() = 'service_role');

-- 7. Resource Access (stores approved sharing)
create table if not exists public.resource_access (
    id uuid primary key default uuid_generate_v4(),
    resource_type text not null,
    resource_id uuid not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text default 'collaborator',
    created_at timestamptz default now(),
    unique(resource_type, resource_id, user_id)
);

create index if not exists idx_resource_access_user on public.resource_access(user_id);
create index if not exists idx_resource_access_lookup on public.resource_access(resource_type, resource_id, user_id);
alter table public.resource_access enable row level security;

create policy "Users can view their access"
  on public.resource_access for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Service role manages access"
  on public.resource_access for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 8. Task Assignments
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

create index if not exists idx_task_assignments_task on public.task_assignments(task_id);
alter table public.task_assignments enable row level security;

-- 9. Agent Contributions
create table if not exists public.agent_contributions (
    id uuid primary key default uuid_generate_v4(),
    task_id uuid references public.collaborative_tasks(id) on delete cascade not null,
    agent_id uuid references public.agents(id) on delete cascade not null,
    contribution text not null,
    confidence float default 0.0,
    created_at timestamptz default now()
);

create index if not exists idx_agent_contributions_task on public.agent_contributions(task_id);
alter table public.agent_contributions enable row level security;

-- 10. Update existing agents RLS to include shared access
drop policy if exists "Users can select their own agents" on public.agents;
create policy "Users can select own and shared agents"
  on public.agents for select
  using (
    auth.uid() = user_id or 
    auth.role() = 'service_role' or
    visibility = 'public' or
    exists (select 1 from public.resource_access where resource_type = 'agent' and resource_id = agents.id and user_id = auth.uid())
  );

-- 11. Update conversations RLS for shared agent access
drop policy if exists "Users can select their own conversations" on public.conversations;
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

-- Verify tables created
select table_name from information_schema.tables 
where table_schema = 'public' and table_name in ('users', 'teams', 'resource_access', 'share_requests', 'collaborative_tasks')
order by table_name;
