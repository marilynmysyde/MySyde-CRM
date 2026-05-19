-- MySyde CRM — Full Schema
-- Run this in the Supabase SQL editor at supabase.com/dashboard
-- After running: enable Row Level Security policies at the bottom of this file

-- ─────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────

create table partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('chamber','city_gov','downtown_assoc','community_org','local_business','nonprofit','other')),
  website     text,
  address     text,
  notes       text,
  active      boolean not null default true,
  created_at  timestamp with time zone default now()
);

create table contacts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  role            text,
  partner_id      uuid references partners(id) on delete set null,
  mailerlite_id   text,
  notes           text,
  created_at      timestamp with time zone default now()
);

create table kiosks (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  location      text,
  status        text not null default 'pending' check (status in ('active','inactive','pending')),
  partner_id    uuid references partners(id) on delete set null,
  installed_at  date,
  notes         text,
  created_at    timestamp with time zone default now()
);

create table packages (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  monthly_rate    numeric(10,2) not null,
  slot_type       text,
  loops_per_hour  integer,
  design_included boolean not null default false,
  active          boolean not null default true
);

create table deals (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  contact_id        uuid references contacts(id) on delete set null,
  partner_id        uuid references partners(id) on delete set null,
  kiosk_id          uuid references kiosks(id) on delete set null,
  stage             text not null default 'prospect' check (stage in ('prospect','pitched','proposal','creative','live','closed_won','closed_lost')),

  -- Placement & pricing (MySyde rate card)
  placement_type    text check (placement_type in (
                      'top_banner','bottom_banner','premier_welcome','start_screen',
                      'search_button','primary_wrap','side_wrap','featured_event',
                      'map_picture','map_name_under','map_name_category','map_bundle'
                    )),
  screen            text check (screen in ('screen_1','screen_2','both')),
  pricing_tier      text default 'option_2' check (pricing_tier in ('option_1','option_2','option_3')),
  launch_pricing    boolean default false,
  monthly_rate      numeric(10,2),
  months            integer default 3,
  total_value       numeric(10,2) generated always as (monthly_rate * months) stored,

  -- Creative workflow
  design_status     text default 'none' check (design_status in ('none','briefed','in_progress','revised','approved','uploaded')),
  canva_file_url    text,
  canva_file_name   text,

  -- Run dates & renewal
  run_start         date,
  run_end           date,
  renewal_alert     date generated always as (run_end - interval '14 days') stored,

  -- Admin
  invoice_status    text default 'none' check (invoice_status in ('none','deposit_pending','paid','overdue')),
  gmail_thread_id   text,
  notes             text,
  created_at        timestamp with time zone default now(),
  closed_at         timestamp with time zone
);

create table tasks (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  status          text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority        text not null default 'medium' check (priority in ('low','medium','high')),
  due_date        date,
  assigned_to     text,
  partner_id      uuid references partners(id) on delete set null,
  deal_id         uuid references deals(id) on delete set null,
  contact_id      uuid references contacts(id) on delete set null,
  kiosk_id        uuid references kiosks(id) on delete set null,
  is_recurring    boolean not null default false,
  recurrence_rule text check (recurrence_rule in ('weekly','monthly','quarterly')),
  tags            text[] default '{}',
  created_at      timestamp with time zone default now()
);

create table posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  caption         text,
  platforms       text[] default '{}',
  status          text not null default 'idea' check (status in ('idea','draft','review','scheduled','live','archived')),
  scheduled_at    timestamp with time zone,
  published_at    timestamp with time zone,
  partner_id      uuid references partners(id) on delete set null,
  kiosk_id        uuid references kiosks(id) on delete set null,
  deal_id         uuid references deals(id) on delete set null,
  canva_file_url  text,
  canva_file_name text,
  hashtags        text[] default '{}',
  notes           text,
  created_at      timestamp with time zone default now()
);

create table notes (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  partner_id  uuid references partners(id) on delete cascade,
  contact_id  uuid references contacts(id) on delete set null,
  deal_id     uuid references deals(id) on delete set null,
  task_id     uuid references tasks(id) on delete set null,
  post_id     uuid references posts(id) on delete set null,
  created_by  text,
  created_at  timestamp with time zone default now()
);

create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('note','email','call','stage_change','canva_update','task_complete','post_published')),
  body        text,
  partner_id  uuid references partners(id) on delete set null,
  deal_id     uuid references deals(id) on delete set null,
  contact_id  uuid references contacts(id) on delete set null,
  post_id     uuid references posts(id) on delete set null,
  created_by  text,
  created_at  timestamp with time zone default now()
);


-- ─────────────────────────────────────────────────────────
-- SEED: Default packages
-- ─────────────────────────────────────────────────────────

insert into packages (name, monthly_rate, slot_type, loops_per_hour, design_included) values
  ('Starter',  299.00, 'banner',      4,  false),
  ('Standard', 499.00, 'full_panel',  8,  true),
  ('Premium',  799.00, 'full_screen', 12, true);


-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────

create index on deals (stage);
create index on deals (partner_id);
create index on deals (run_end);
create index on tasks (partner_id);
create index on tasks (status);
create index on tasks (due_date);
create index on posts (status);
create index on posts (scheduled_at);
create index on activity_log (partner_id, created_at desc);


-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- v1 policy: all authenticated users read/write all rows
-- No anonymous access
-- ─────────────────────────────────────────────────────────

alter table partners     enable row level security;
alter table contacts     enable row level security;
alter table kiosks       enable row level security;
alter table packages     enable row level security;
alter table deals        enable row level security;
alter table tasks        enable row level security;
alter table posts        enable row level security;
alter table notes        enable row level security;
alter table activity_log enable row level security;

-- Partners
create policy "auth_all" on partners     for all to authenticated using (true) with check (true);
create policy "auth_all" on contacts     for all to authenticated using (true) with check (true);
create policy "auth_all" on kiosks       for all to authenticated using (true) with check (true);
create policy "auth_all" on packages     for all to authenticated using (true) with check (true);
create policy "auth_all" on deals        for all to authenticated using (true) with check (true);
create policy "auth_all" on tasks        for all to authenticated using (true) with check (true);
create policy "auth_all" on posts        for all to authenticated using (true) with check (true);
create policy "auth_all" on notes        for all to authenticated using (true) with check (true);
create policy "auth_all" on activity_log for all to authenticated using (true) with check (true);
