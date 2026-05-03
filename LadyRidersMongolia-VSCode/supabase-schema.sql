create extension if not exists pgcrypto;

create table if not exists features (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists abouts (
  id uuid primary key default gen_random_uuid(),
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists says (
  id uuid primary key default gen_random_uuid(),
  text text not null default '',
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  phone text not null default '',
  bike text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint users_role_check check (role in ('user', 'admin')),
  constraint users_status_check check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  status text not null default 'pending',
  application_data jsonb not null default '{}'::jsonb,
  profile_photo_path text not null default '',
  motorcycle_photo_path text not null default '',
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint membership_applications_status_check check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists stats (
  id smallint primary key default 1,
  members integer not null default 0,
  events integer not null default 0,
  trips integer not null default 0,
  community integer not null default 1,
  constraint stats_single_row check (id = 1)
);

create table if not exists contact (
  id smallint primary key default 1,
  phone text not null default '-',
  facebook text not null default '-',
  instagram text not null default '-',
  constraint contact_single_row check (id = 1)
);

insert into stats (id, members, events, trips, community)
values (1, 0, 0, 0, 1)
on conflict (id) do nothing;

insert into contact (id, phone, facebook, instagram)
values (1, '-', 'Lady Riders Mongolia', 'https://www.instagram.com/lady_riders_mongolia_wmc/')
on conflict (id) do nothing;
