-- Görev Yönetimi – Kurumsal MVP Şema (Supabase Postgres)
-- Auth kullanıcıları: auth.users
-- Profiller: public.profiles

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create type public.app_role as enum ('DIRECTOR','HYBRID_LEAD','PM','ANALYST');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'ANALYST',
  team_id uuid references public.teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  team_id uuid references public.teams(id),
  assignee_id uuid references public.profiles(id),
  owner_id uuid references public.profiles(id),
  status text not null default 'Başlanmadı',
  priority text not null default 'Orta',
  start_date date,
  due_date date,
  progress int not null default 0,
  sla_days int not null default 5,
  blocked_reason text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_updated_at_idx on public.tasks(updated_at desc);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_team_idx on public.tasks(team_id);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- (Öneri) Production için Row Level Security (RLS) policy ekleyin.
