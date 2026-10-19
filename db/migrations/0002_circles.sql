-- Phase 3: circles — khatm goals, nudge limits, invite previews, ownership handover.

-- ---------------------------------------------------------------------------
-- A circle outlives its creator: ownership passes on instead of cascading.
-- ---------------------------------------------------------------------------

alter table public.circles alter column created_by drop not null;
alter table public.circles drop constraint circles_created_by_fkey;
alter table public.circles
  add constraint circles_created_by_fkey foreign key (created_by)
  references public.profiles(id) on delete set null;

-- When a member leaves (or deletes their account): delete an empty circle,
-- otherwise make sure someone is still the owner (longest-standing member).
create or replace function app.after_member_removed() returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (select 1 from public.circle_members where circle_id = old.circle_id) then
    delete from public.circles where id = old.circle_id;
  elsif not exists (select 1 from public.circle_members where circle_id = old.circle_id and role = 'owner') then
    update public.circle_members set role = 'owner'
    where (circle_id, user_id) = (
      select circle_id, user_id from public.circle_members
      where circle_id = old.circle_id order by joined_at, user_id limit 1
    );
  end if;
  return null;
end
$$;

create trigger circle_members_after_delete after delete on public.circle_members
  for each row execute function app.after_member_removed();

-- Lets someone holding an invite code see what they're joining, nothing more.
create or replace function app.circle_preview(code text)
returns table (name text, member_count int, max_members int, is_member boolean)
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select c.name,
         (select count(*)::int from public.circle_members m where m.circle_id = c.id),
         c.max_members::int,
         exists (select 1 from public.circle_members m where m.circle_id = c.id and m.user_id = app.current_user_id())
  from public.circles c
  where c.invite_code = upper(btrim(code))
$$;

-- ---------------------------------------------------------------------------
-- Nudges: gentle by design, so rate-limited to avoid pressure or spam.
-- ---------------------------------------------------------------------------

create or replace function app.limit_nudges() returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if (select count(*) from public.nudges
      where sender_id = new.sender_id and recipient_id = new.recipient_id
        and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'nudge limit reached for this friend today' using errcode = 'P0003';
  end if;
  if (select count(*) from public.nudges
      where sender_id = new.sender_id and created_at > now() - interval '24 hours') >= 30 then
    raise exception 'nudge limit reached for today' using errcode = 'P0003';
  end if;
  return new;
end
$$;

create trigger nudges_limit before insert on public.nudges
  for each row execute function app.limit_nudges();

-- ---------------------------------------------------------------------------
-- Circle khatm: members claim juz (1–30) and mark them read.
-- ---------------------------------------------------------------------------

create table public.khatms (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles(id) on delete cascade,
  title         text check (char_length(btrim(title)) between 1 and 80),
  created_by    uuid default app.current_user_id() references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- One khatm in progress per circle at a time.
create unique index khatms_one_active on public.khatms (circle_id) where completed_at is null;
create index khatms_circle_idx on public.khatms (circle_id, created_at desc);

create table public.khatm_juz (
  khatm_id      uuid not null references public.khatms(id) on delete cascade,
  juz           smallint not null check (juz between 1 and 30),
  user_id       uuid not null default app.current_user_id()
                references public.profiles(id) on delete cascade,
  claimed_at    timestamptz not null default now(),
  completed_at  timestamptz,
  primary key (khatm_id, juz)
);

create or replace function app.khatm_circle(target_khatm uuid) returns uuid
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select circle_id from public.khatms where id = target_khatm
$$;

create or replace function app.khatm_is_active(target_khatm uuid) returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from public.khatms where id = target_khatm and completed_at is null)
$$;

-- Close the khatm when all 30 juz are read; reopen if one is un-marked.
create or replace function app.sync_khatm_completion() returns trigger
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  k uuid := coalesce(new.khatm_id, old.khatm_id);
  read_count int;
begin
  select count(*) into read_count from public.khatm_juz where khatm_id = k and completed_at is not null;
  update public.khatms
     set completed_at = case when read_count = 30 then coalesce(completed_at, now()) else null end
   where id = k;
  return null;
end
$$;

create trigger khatm_juz_sync after insert or update or delete on public.khatm_juz
  for each row execute function app.sync_khatm_completion();

alter table public.khatms    enable row level security;
alter table public.khatms    force row level security;
alter table public.khatm_juz enable row level security;
alter table public.khatm_juz force row level security;

create policy khatms_select on public.khatms for select to istiqamah_app
  using (app.is_circle_member(circle_id));
create policy khatms_insert on public.khatms for insert to istiqamah_app
  with check (app.is_circle_member(circle_id) and created_by = app.current_user_id() and completed_at is null);
create policy khatms_update on public.khatms for update to istiqamah_app
  using (app.is_circle_owner(circle_id) or created_by = app.current_user_id())
  with check (app.is_circle_member(circle_id));
create policy khatms_delete on public.khatms for delete to istiqamah_app
  using (app.is_circle_owner(circle_id) or created_by = app.current_user_id());

create policy khatm_juz_select on public.khatm_juz for select to istiqamah_app
  using (app.is_circle_member(app.khatm_circle(khatm_id)));
create policy khatm_juz_claim on public.khatm_juz for insert to istiqamah_app
  with check (
    user_id = app.current_user_id()
    and app.is_circle_member(app.khatm_circle(khatm_id))
    and app.khatm_is_active(khatm_id)
  );
create policy khatm_juz_update_own on public.khatm_juz for update to istiqamah_app
  using (user_id = app.current_user_id()) with check (user_id = app.current_user_id());
create policy khatm_juz_release on public.khatm_juz for delete to istiqamah_app
  using (user_id = app.current_user_id() or app.is_circle_owner(app.khatm_circle(khatm_id)));

grant select, insert, update, delete on public.khatms, public.khatm_juz to istiqamah_app;
grant execute on function app.circle_preview(text), app.khatm_circle(uuid), app.khatm_is_active(uuid) to istiqamah_app;
