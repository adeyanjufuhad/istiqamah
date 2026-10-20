-- Phase 4: optional web push reminders for prayer times and adhkar.
--
-- Users manage their own subscriptions as istiqamah_app (RLS: own rows only).
-- The scheduled dispatcher connects as istiqamah_dispatch: no BYPASSRLS, can
-- read only the profile columns needed to compute prayer times, read
-- subscriptions, and record deliveries. Neither role can see the other's data
-- beyond that. LOGIN + password are set by scripts/setup-app-role.ts.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'istiqamah_dispatch') then
    create role istiqamah_dispatch nologin nobypassrls;
  end if;
end
$$;

create table public.push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default app.current_user_id()
                   references public.profiles(id) on delete cascade,
  endpoint         text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh           text not null check (char_length(p256dh) <= 200),
  auth             text not null check (char_length(auth) <= 100),
  prayers          boolean not null default true,
  adhkar           boolean not null default true,
  created_at       timestamptz not null default now(),
  last_success_at  timestamptz
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- One delivery per subscription per event per local day (makes dispatch idempotent).
create table public.push_deliveries (
  subscription_id  uuid not null references public.push_subscriptions(id) on delete cascade,
  event            text not null check (event ~ '^[a-z_]{1,32}$'),
  event_date       date not null,
  sent_at          timestamptz not null default now(),
  primary key (subscription_id, event, event_date)
);

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
alter table public.push_deliveries    enable row level security;
alter table public.push_deliveries    force row level security;

-- Users: their own subscriptions only.
create policy push_subscriptions_own on public.push_subscriptions for all to istiqamah_app
  using (user_id = app.current_user_id())
  with check (user_id = app.current_user_id());

-- Dispatcher: read subscriptions, prune dead ones, record successes and deliveries.
create policy push_subscriptions_dispatch_read on public.push_subscriptions for select to istiqamah_dispatch
  using (true);
create policy push_subscriptions_dispatch_update on public.push_subscriptions for update to istiqamah_dispatch
  using (true) with check (true);
create policy push_subscriptions_dispatch_delete on public.push_subscriptions for delete to istiqamah_dispatch
  using (true);
create policy push_deliveries_dispatch on public.push_deliveries for all to istiqamah_dispatch
  using (true) with check (true);

-- Profiles: dispatcher may only read rows of users who opted in to push.
create policy profiles_dispatch_read on public.profiles for select to istiqamah_dispatch
  using (exists (select 1 from public.push_subscriptions s where s.user_id = profiles.id));

grant select, insert, update, delete on public.push_subscriptions to istiqamah_app;

grant usage on schema public to istiqamah_dispatch;
grant select (id, user_id, endpoint, p256dh, auth, prayers, adhkar), delete on public.push_subscriptions to istiqamah_dispatch;
grant update (last_success_at) on public.push_subscriptions to istiqamah_dispatch;
grant select, insert, delete on public.push_deliveries to istiqamah_dispatch;
-- Column-level: no display name, no onboarding data, nothing else.
grant select (id, timezone, latitude, longitude, city, country, calc_method, asr_school, locale)
  on public.profiles to istiqamah_dispatch;
