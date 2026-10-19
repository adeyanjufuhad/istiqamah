-- Istiqamah: initial schema
--
-- Security model
--   * Every table has Row Level Security enabled AND forced.
--   * The app connects as `istiqamah_app` (NOBYPASSRLS). It is created here
--     without LOGIN; scripts/setup-app-role.ts grants LOGIN + a password that is
--     stored only in .env.local / Vercel env, never in git.
--   * For each request the server verifies the Neon Auth session, then runs the
--     user's queries inside a transaction that sets `app.user_id`
--     (see src/lib/db/index.ts). Policies read it via app.current_user_id().
--   * Users are owned by Neon Managed Better Auth (neon_auth."user"). Deleting a
--     user there cascades to everything below.

create extension if not exists pgcrypto;

create schema if not exists app;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'istiqamah_app') then
    create role istiqamah_app nologin nobypassrls;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function app.current_user_id() returns uuid
language sql stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

create or replace function app.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- Short, unambiguous invite codes (no 0/O/1/I/L).
create or replace function app.gen_invite_code() returns text
language plpgsql volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..8 loop
    code := code || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet)), 1);
  end loop;
  return code;
end
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per user, minimal personal data
-- ---------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key default app.current_user_id()
                references neon_auth."user"(id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 60),
  timezone      text not null default 'UTC' check (char_length(timezone) <= 64),
  city          text check (char_length(city) <= 80),
  country       text check (char_length(country) <= 80),
  -- Rounded to 2 decimals (~1 km): enough for prayer times, no precise location.
  latitude      numeric(5, 2) check (latitude between -90 and 90),
  longitude     numeric(5, 2) check (longitude between -180 and 180),
  -- Aladhan calculation method id (3 = Muslim World League) and Asr school (0 = Shafi'i/standard, 1 = Hanafi).
  calc_method   smallint not null default 3 check (calc_method between 0 and 99),
  asr_school    smallint not null default 0 check (asr_school in (0, 1)),
  locale        text not null default 'en' check (locale in ('en', 'ar')),
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------

create type public.habit_kind as enum (
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
  'quran', 'adhkar_morning', 'adhkar_evening', 'fasting',
  'custom'
);

create type public.habit_unit as enum ('pages', 'minutes', 'count');

create table public.habits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default app.current_user_id()
                      references public.profiles(id) on delete cascade,
  kind                public.habit_kind not null,
  -- Built-in habits are labelled via i18n; only custom habits carry a title.
  title               text check (char_length(btrim(title)) between 1 and 80),
  target_value        integer check (target_value between 1 and 10000),
  unit                public.habit_unit,
  position            smallint not null default 0,
  is_active           boolean not null default true,
  -- Private by default. The user opts each habit in to being visible in their circles.
  share_with_circles  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint custom_has_title check (kind <> 'custom' or title is not null),
  constraint target_has_unit check ((target_value is null) = (unit is null))
);

create unique index habits_one_builtin_per_user
  on public.habits (user_id, kind) where kind <> 'custom';
create index habits_user_idx on public.habits (user_id, position);

create trigger habits_touch before update on public.habits
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- habit_logs: one row per habit per local day
-- ---------------------------------------------------------------------------

create table public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  user_id     uuid not null default app.current_user_id()
              references public.profiles(id) on delete cascade,
  log_date    date not null,
  completed   boolean not null default true,
  value       integer check (value between 0 and 100000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date);

create trigger habit_logs_touch before update on public.habit_logs
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- circles + circle_members
-- ---------------------------------------------------------------------------

create table public.circles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 60),
  description  text check (char_length(description) <= 280),
  invite_code  text not null unique default app.gen_invite_code(),
  max_members  smallint not null default 12 check (max_members between 2 and 50),
  created_by   uuid not null default app.current_user_id()
               references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger circles_touch before update on public.circles
  for each row execute function app.touch_updated_at();

create type public.circle_role as enum ('owner', 'member');

create table public.circle_members (
  circle_id  uuid not null references public.circles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.circle_role not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index circle_members_user_idx on public.circle_members (user_id);

-- Membership checks run as the function owner so policies on circle_members
-- can use them without recursing into their own RLS.
create or replace function app.is_circle_member(target_circle uuid, target_user uuid default app.current_user_id())
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = target_circle and user_id = target_user
  )
$$;

create or replace function app.is_circle_owner(target_circle uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = target_circle
      and user_id = app.current_user_id()
      and role = 'owner'
  )
$$;

create or replace function app.shares_circle_with(other_user uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.circle_members mine
    join public.circle_members theirs on theirs.circle_id = mine.circle_id
    where mine.user_id = app.current_user_id()
      and theirs.user_id = other_user
  )
$$;

-- The creator of a circle becomes its owner automatically.
create or replace function app.add_circle_owner() returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.circle_members (circle_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end
$$;

create trigger circles_add_owner after insert on public.circles
  for each row execute function app.add_circle_owner();

-- Joining is only possible with a valid invite code, through this function.
create or replace function app.join_circle(code text) returns uuid
language plpgsql volatile security definer
set search_path = pg_catalog, public
as $$
declare
  me uuid := app.current_user_id();
  target public.circles%rowtype;
  member_count int;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into target from public.circles where invite_code = upper(btrim(code));
  if not found then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.circle_members where circle_id = target.id and user_id = me) then
    return target.id;
  end if;

  select count(*) into member_count from public.circle_members where circle_id = target.id;
  if member_count >= target.max_members then
    raise exception 'circle is full' using errcode = 'P0001';
  end if;

  insert into public.circle_members (circle_id, user_id, role) values (target.id, me, 'member');
  return target.id;
end
$$;

-- Co-members see each other's display name only, never location/timezone.
create view public.circle_member_profiles
with (security_barrier = true)
as
  select cm.circle_id, cm.user_id, cm.role, cm.joined_at, p.display_name
  from public.circle_members cm
  join public.profiles p on p.id = cm.user_id
  where app.is_circle_member(cm.circle_id);

-- ---------------------------------------------------------------------------
-- nudges: preset encouragement between circle members
-- ---------------------------------------------------------------------------

create type public.nudge_kind as enum ('nudge', 'dua');

create table public.nudges (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles(id) on delete cascade,
  sender_id     uuid not null default app.current_user_id()
                references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  kind          public.nudge_kind not null,
  -- Key into vetted, app-bundled text (i18n nudges / static dua data). No free text.
  message_key   text not null check (message_key ~ '^[a-z0-9_.-]{1,64}$'),
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  constraint no_self_nudge check (sender_id <> recipient_id)
);

create index nudges_recipient_idx on public.nudges (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.profiles       force row level security;
alter table public.habits         enable row level security;
alter table public.habits         force row level security;
alter table public.habit_logs     enable row level security;
alter table public.habit_logs     force row level security;
alter table public.circles        enable row level security;
alter table public.circles        force row level security;
alter table public.circle_members enable row level security;
alter table public.circle_members force row level security;
alter table public.nudges         enable row level security;
alter table public.nudges         force row level security;

-- profiles: only your own row (co-members use circle_member_profiles).
create policy profiles_select_own on public.profiles for select to istiqamah_app
  using (id = app.current_user_id());
create policy profiles_insert_own on public.profiles for insert to istiqamah_app
  with check (id = app.current_user_id());
create policy profiles_update_own on public.profiles for update to istiqamah_app
  using (id = app.current_user_id()) with check (id = app.current_user_id());
create policy profiles_delete_own on public.profiles for delete to istiqamah_app
  using (id = app.current_user_id());

-- habits: yours, plus habits a co-member chose to share.
create policy habits_select on public.habits for select to istiqamah_app
  using (
    user_id = app.current_user_id()
    or (share_with_circles and app.shares_circle_with(user_id))
  );
create policy habits_insert_own on public.habits for insert to istiqamah_app
  with check (user_id = app.current_user_id());
create policy habits_update_own on public.habits for update to istiqamah_app
  using (user_id = app.current_user_id()) with check (user_id = app.current_user_id());
create policy habits_delete_own on public.habits for delete to istiqamah_app
  using (user_id = app.current_user_id());

-- habit_logs: yours, plus logs of habits a co-member shares.
create policy habit_logs_select on public.habit_logs for select to istiqamah_app
  using (
    user_id = app.current_user_id()
    or exists (
      select 1 from public.habits h
      where h.id = habit_logs.habit_id
        and h.share_with_circles
        and app.shares_circle_with(h.user_id)
    )
  );
create policy habit_logs_insert_own on public.habit_logs for insert to istiqamah_app
  with check (
    user_id = app.current_user_id()
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = app.current_user_id())
  );
create policy habit_logs_update_own on public.habit_logs for update to istiqamah_app
  using (user_id = app.current_user_id())
  with check (
    user_id = app.current_user_id()
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = app.current_user_id())
  );
create policy habit_logs_delete_own on public.habit_logs for delete to istiqamah_app
  using (user_id = app.current_user_id());

-- circles: members can see; anyone signed in can create; owners edit/delete.
create policy circles_select_member on public.circles for select to istiqamah_app
  using (app.is_circle_member(id) or created_by = app.current_user_id());
create policy circles_insert on public.circles for insert to istiqamah_app
  with check (created_by = app.current_user_id());
create policy circles_update_owner on public.circles for update to istiqamah_app
  using (app.is_circle_owner(id)) with check (app.is_circle_owner(id));
create policy circles_delete_owner on public.circles for delete to istiqamah_app
  using (app.is_circle_owner(id));

-- circle_members: visible to fellow members. Joining goes through app.join_circle().
-- Leave your own membership, or (owners) remove others.
create policy circle_members_select on public.circle_members for select to istiqamah_app
  using (app.is_circle_member(circle_id));
create policy circle_members_delete on public.circle_members for delete to istiqamah_app
  using (user_id = app.current_user_id() or app.is_circle_owner(circle_id));
create policy circle_members_update_owner on public.circle_members for update to istiqamah_app
  using (app.is_circle_owner(circle_id)) with check (app.is_circle_owner(circle_id));

-- nudges: only sender and recipient see them; both must share the circle.
create policy nudges_select on public.nudges for select to istiqamah_app
  using (sender_id = app.current_user_id() or recipient_id = app.current_user_id());
create policy nudges_insert on public.nudges for insert to istiqamah_app
  with check (
    sender_id = app.current_user_id()
    and app.is_circle_member(circle_id)
    and app.is_circle_member(circle_id, recipient_id)
  );
create policy nudges_update_recipient on public.nudges for update to istiqamah_app
  using (recipient_id = app.current_user_id()) with check (recipient_id = app.current_user_id());
create policy nudges_delete on public.nudges for delete to istiqamah_app
  using (sender_id = app.current_user_id() or recipient_id = app.current_user_id());

-- ---------------------------------------------------------------------------
-- Grants for the runtime role (RLS still applies on top of these)
-- ---------------------------------------------------------------------------

revoke all on schema app from public;
revoke execute on all functions in schema app from public;

grant usage on schema public, app to istiqamah_app;
grant select, insert, update, delete on
  public.profiles, public.habits, public.habit_logs, public.circles, public.nudges
  to istiqamah_app;
grant select, delete on public.circle_members to istiqamah_app;
grant update (role) on public.circle_members to istiqamah_app;
grant select on public.circle_member_profiles to istiqamah_app;
grant execute on function
  app.current_user_id(),
  app.gen_invite_code(),
  app.is_circle_member(uuid, uuid),
  app.is_circle_owner(uuid),
  app.shares_circle_with(uuid),
  app.join_circle(text)
  to istiqamah_app;
