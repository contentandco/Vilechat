-- Vailchat Supabase Database Schema
-- Copy and paste this into the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Rooms Table
create table if not exists rooms (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    created_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '24 hours'),
    password text,
    name text,
    name_encrypted text,
    is_paused boolean default false,
    creator_id text,
    creator_device_id text
);

-- Migration for existing rooms table
alter table rooms add column if not exists name text;
alter table rooms add column if not exists name_encrypted text;
alter table rooms add column if not exists is_paused boolean default false;
alter table rooms add column if not exists creator_id text;
alter table rooms add column if not exists creator_device_id text;

-- Messages Table
create table if not exists messages (
    id uuid primary key default gen_random_uuid(),
    room_id uuid references rooms(id) on delete cascade not null,
    sender_id text not null, -- Client-generated unique id for this session
    sender_name text not null, -- E.g. "Neon Fox", "Retro Bear"
    content_encrypted text not null, -- Encrypted message text or encrypted image URL
    is_image boolean default false,
    is_voice boolean default false,
    is_sticker boolean default false,
    created_at timestamptz default now()
);

-- Device Sessions Table (Tracks room sessions per unique device key)
create table if not exists device_sessions (
    id uuid primary key default gen_random_uuid(),
    device_id text not null,
    room_code text not null,
    room_name text,
    created_at timestamptz default now(),
    last_active_at timestamptz default now(),
    unique (device_id, room_code)
);

-- Indexing for speed
create index if not exists idx_rooms_code on rooms(code);
create index if not exists idx_messages_room_id on messages(room_id);
create index if not exists idx_rooms_expires_at on rooms(expires_at);
create index if not exists idx_device_sessions_device_id on device_sessions(device_id);
create index if not exists idx_device_sessions_room_code on device_sessions(room_code);

-- Self-cleaning function: Deletes expired rooms and their messages.
-- This runs automatically whenever a new room is created so you don't need a paid cron job.
create or replace function cleanup_expired_rooms()
returns trigger as $$
begin
    delete from rooms where expires_at < now();
    delete from device_sessions where room_code not in (select code from rooms);
    return new;
end;
$$ language plpgsql;

-- Trigger to run cleanup before inserting a new room
drop trigger if exists trigger_cleanup_rooms on rooms;
create trigger trigger_cleanup_rooms
    before insert on rooms
    for each statement
    execute function cleanup_expired_rooms();

-- Row Level Security (RLS) configuration
-- Since this is an anonymous app, we allow public read/write to these tables.
alter table rooms enable row level security;
alter table messages enable row level security;
alter table device_sessions enable row level security;

-- Policies for Rooms
create policy "Allow anonymous creation of rooms" on rooms
    for insert with check (true);

create policy "Allow anonymous reading of active rooms" on rooms
    for select using (expires_at > now());

create policy "Allow anonymous update of rooms" on rooms
    for update using (true) with check (true);

create policy "Allow anonymous deletion of rooms" on rooms
    for delete using (true);

-- Policies for Messages
create policy "Allow anonymous creation of messages" on messages
    for insert with check (
        exists (
            select 1 from rooms 
            where rooms.id = messages.room_id and rooms.expires_at > now()
        )
    );

create policy "Allow anonymous reading of messages of active rooms" on messages
    for select using (
        exists (
            select 1 from rooms 
            where rooms.id = messages.room_id and rooms.expires_at > now()
        )
    );

-- Policies for Device Sessions
create policy "Allow anonymous device session management" on device_sessions
    for all using (true) with check (true);
