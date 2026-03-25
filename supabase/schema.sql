-- =============================================
-- FitSocial Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- Profiles Table (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  avatar_url text,
  following uuid[] default '{}',
  streak_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================
-- Workout Logs Table
-- =============================================
create table public.workout_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('aerobic', 'strength')) not null,
  category text not null,
  intensity text check (intensity in ('easy', 'moderate', 'hard')) not null,
  details jsonb not null default '{}',
  is_template boolean default false,
  likes integer default 0,
  shares integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for workout_logs
alter table public.workout_logs enable row level security;

create policy "Workout logs are viewable by everyone"
  on public.workout_logs for select
  using (true);

create policy "Users can insert their own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- =============================================
-- Saved Programs (Templates) Table
-- =============================================
create table public.saved_programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, workout_log_id)
);

-- RLS for saved_programs
alter table public.saved_programs enable row level security;

create policy "Saved programs are viewable by everyone"
  on public.saved_programs for select
  using (true);

create policy "Users can insert their own saved programs"
  on public.saved_programs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved programs"
  on public.saved_programs for delete
  using (auth.uid() = user_id);

-- =============================================
-- Comments Table
-- =============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for comments
alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- =============================================
-- Likes Table
-- =============================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workout_log_id, user_id)
);

-- RLS for likes
alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

create policy "Users can insert their own likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- =============================================
-- Functions
-- =============================================

-- Function to increment likes
create or replace function public.increment_likes(workout_log_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.workout_logs
  set likes = likes + 1
  where id = workout_log_id;
end;
$$;

-- Function to decrement likes
create or replace function public.decrement_likes(workout_log_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.workout_logs
  set likes = greatest(likes - 1, 0)
  where id = workout_log_id;
end;
$$;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Indexes for performance
-- =============================================
create index if not exists idx_workout_logs_user_id on public.workout_logs(user_id);
create index if not exists idx_workout_logs_created_at on public.workout_logs(created_at desc);
create index if not exists idx_comments_workout_log_id on public.comments(workout_log_id);
create index if not exists idx_likes_workout_log_id on public.likes(workout_log_id);
create index if not exists idx_saved_programs_user_id on public.saved_programs(user_id);
