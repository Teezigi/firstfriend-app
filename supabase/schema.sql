-- FirstFriend database schema
-- Supabase: Project → SQL Editor → New query → paste this whole file → Run
-- Safe to re-run any time. Every statement drops-and-recreates or uses
-- "if not exists", so running it again never errors on things that already
-- exist and never touches your actual data.

-- ─────────────────────────────────────────────
-- PROFILES
-- One row per user, created right after they verify their email.
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  area text not null,
  arrival_status text not null check (
    arrival_status in ('just_landed', '1_3_months', '3_6_months', '6_12_months', 'moving_soon')
  ),
  move_date date, -- only set when arrival_status = 'moving_soon'
  interest text not null,
  is_adult boolean not null default false, -- age-gate confirmation, required at signup
  group_id uuid, -- set once matched; null while waiting
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- GROUPS
-- Formed automatically once enough people match on area + interest.
-- ─────────────────────────────────────────────
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  interest text not null,
  status text not null default 'forming' check (
    status in ('forming', 'active', 'completed')
  ),
  created_at timestamptz not null default now()
);

alter table groups enable row level security;
alter table profiles
  drop constraint if exists profiles_group_id_fkey;
alter table profiles
  add constraint profiles_group_id_fkey foreign key (group_id) references groups(id);

drop policy if exists "Members can view their own group" on groups;
create policy "Members can view their own group"
  on groups for select using (
    id in (select group_id from profiles where id = auth.uid())
  );

-- ─────────────────────────────────────────────
-- GROUP MEMBERS
-- Join table with each member's own verification passcode.
-- ─────────────────────────────────────────────
create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  passcode text not null,
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

alter table group_members enable row level security;

drop policy if exists "Members can view their own group's roster" on group_members;
create policy "Members can view their own group's roster"
  on group_members for select using (
    group_id in (select group_id from profiles where id = auth.uid())
  );

-- ─────────────────────────────────────────────
-- AVAILABILITY RESPONSES
-- "When could you meet?" (multi-select per member).
-- ─────────────────────────────────────────────
create table if not exists availability_responses (
  group_id uuid not null references groups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  slot text not null check (
    slot in ('thu_evening', 'fri_evening', 'sat_morning', 'sat_afternoon', 'sun_morning')
  ),
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id, slot)
);

alter table availability_responses enable row level security;

drop policy if exists "Members can view their own group's availability" on availability_responses;
create policy "Members can view their own group's availability"
  on availability_responses for select using (
    group_id in (select group_id from profiles where id = auth.uid())
  );

drop policy if exists "Members can submit their own availability" on availability_responses;
create policy "Members can submit their own availability"
  on availability_responses for insert with check (
    profile_id = auth.uid()
    and group_id in (select group_id from profiles where id = auth.uid())
  );

drop policy if exists "Members can delete their own availability" on availability_responses;
create policy "Members can delete their own availability"
  on availability_responses for delete using (profile_id = auth.uid());

-- ─────────────────────────────────────────────
-- MEETUPS
-- One confirmed meetup per group per cycle.
-- ─────────────────────────────────────────────
create table if not exists meetups (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  scheduled_at timestamptz not null,
  venue_name text,
  venue_area text,
  reveals_at timestamptz, -- exact venue name hidden until this time
  status text not null default 'proposed' check (
    status in ('proposed', 'confirmed', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

alter table meetups enable row level security;

drop policy if exists "Members can view their own group's meetups" on meetups;
create policy "Members can view their own group's meetups"
  on meetups for select using (
    group_id in (select group_id from profiles where id = auth.uid())
  );

-- ─────────────────────────────────────────────
-- RSVPS
-- ─────────────────────────────────────────────
create table if not exists rsvps (
  meetup_id uuid not null references meetups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('coming', 'late', 'cant_make_it')),
  updated_at timestamptz not null default now(),
  primary key (meetup_id, profile_id)
);

alter table rsvps enable row level security;

drop policy if exists "Members can view their own group's RSVPs" on rsvps;
create policy "Members can view their own group's RSVPs"
  on rsvps for select using (
    meetup_id in (
      select id from meetups where group_id in (
        select group_id from profiles where id = auth.uid()
      )
    )
  );

drop policy if exists "Members can set their own RSVP" on rsvps;
create policy "Members can set their own RSVP"
  on rsvps for insert with check (profile_id = auth.uid());

drop policy if exists "Members can update their own RSVP" on rsvps;
create policy "Members can update their own RSVP"
  on rsvps for update using (profile_id = auth.uid());

-- ─────────────────────────────────────────────
-- GROUP SIGNALS
-- Lightweight coordination, not a chat feed. "I'm in", votes, "meet again".
-- ─────────────────────────────────────────────
create table if not exists group_signals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  signal_type text not null check (
    signal_type in ('im_in', 'vote_coffee', 'vote_walk', 'vote_climbing', 'want_again')
  ),
  created_at timestamptz not null default now()
);

alter table group_signals enable row level security;

drop policy if exists "Members can view their own group's signals" on group_signals;
create policy "Members can view their own group's signals"
  on group_signals for select using (
    group_id in (select group_id from profiles where id = auth.uid())
  );

drop policy if exists "Members can send their own signals" on group_signals;
create policy "Members can send their own signals"
  on group_signals for insert with check (
    profile_id = auth.uid()
    and group_id in (select group_id from profiles where id = auth.uid())
  );

-- ─────────────────────────────────────────────
-- POST-MEETUP FEEDBACK
-- Private, never shown to other group members.
-- ─────────────────────────────────────────────
create table if not exists post_meetup_feedback (
  meetup_id uuid not null references meetups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  rating text not null check (
    rating in ('would_repeat', 'try_another', 'no_repeat')
  ),
  created_at timestamptz not null default now(),
  primary key (meetup_id, profile_id)
);

alter table post_meetup_feedback enable row level security;

drop policy if exists "Members can view only their own feedback" on post_meetup_feedback;
create policy "Members can view only their own feedback"
  on post_meetup_feedback for select using (profile_id = auth.uid());

drop policy if exists "Members can submit their own feedback" on post_meetup_feedback;
create policy "Members can submit their own feedback"
  on post_meetup_feedback for insert with check (profile_id = auth.uid());

-- ─────────────────────────────────────────────
-- CONNECTION REQUESTS
-- Day-30 "who would you like to stay connected with?" Contact only
-- shared when both sides pick each other.
-- ─────────────────────────────────────────────
create table if not exists connection_requests (
  group_id uuid not null references groups(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, requester_id, target_id)
);

alter table connection_requests enable row level security;

drop policy if exists "Users can view their own requests" on connection_requests;
create policy "Users can view their own requests"
  on connection_requests for select using (
    requester_id = auth.uid() or target_id = auth.uid()
  );

drop policy if exists "Users can create their own requests" on connection_requests;
create policy "Users can create their own requests"
  on connection_requests for insert with check (requester_id = auth.uid());

-- ─────────────────────────────────────────────
-- SAFETY REPORTS
-- Report / block / get-help actions from the Safety menu.
-- ─────────────────────────────────────────────
create table if not exists safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid references profiles(id),
  group_id uuid references groups(id),
  report_type text not null check (
    report_type in ('report_member', 'leave_group', 'block_member', 'get_help')
  ),
  details text,
  created_at timestamptz not null default now()
);

alter table safety_reports enable row level security;

drop policy if exists "Users can view their own reports" on safety_reports;
create policy "Users can view their own reports"
  on safety_reports for select using (reporter_id = auth.uid());

drop policy if exists "Users can create their own reports" on safety_reports;
create policy "Users can create their own reports"
  on safety_reports for insert with check (reporter_id = auth.uid());

-- ─────────────────────────────────────────────
-- MATCHING FUNCTION
-- Groups up to 4 unmatched profiles that share an area + interest.
-- Called manually for now (see supabase/README.md). A scheduled job
-- comes later once there's real signup volume to justify it.
-- ─────────────────────────────────────────────
create or replace function try_form_groups()
returns integer
language plpgsql
security definer
as $$
declare
  rec record;
  new_group_id uuid;
  matched_count integer := 0;
begin
  for rec in
    select area, interest, array_agg(id order by created_at) as profile_ids
    from profiles
    where group_id is null
    group by area, interest
    having count(*) >= 4
  loop
    new_group_id := gen_random_uuid();
    insert into groups (id, area, interest, status)
    values (new_group_id, rec.area, rec.interest, 'active');

    for i in 1..4 loop
      update profiles set group_id = new_group_id where id = rec.profile_ids[i];
      insert into group_members (group_id, profile_id, passcode)
      values (
        new_group_id,
        rec.profile_ids[i],
        upper(substr(md5(random()::text), 1, 4))
      );
    end loop;

    matched_count := matched_count + 1;
  end loop;

  return matched_count;
end;
$$;

-- ─────────────────────────────────────────────
-- EXPLICIT GRANTS
-- Required from October 30, 2026. Supabase stops auto-granting Data API
-- access to new tables in `public`. Adding these explicitly now means every
-- table here (and any future migration that follows this pattern) keeps
-- working regardless of when it's actually run. RLS policies above still
-- do the real access control; these grants just let the API reach the
-- table at all. See: https://github.com/orgs/supabase/discussions/45329
-- ─────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'groups', 'group_members', 'availability_responses',
    'meetups', 'rsvps', 'group_signals', 'post_meetup_feedback',
    'connection_requests', 'safety_reports'
  ]
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
