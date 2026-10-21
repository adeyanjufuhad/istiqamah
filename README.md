# Istiqamah

A mobile-first PWA that helps Muslims stay consistent in their deen through gentle daily habit tracking and small accountability circles.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Neon Postgres · Neon Managed Better Auth · Drizzle ORM · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
npm run db:migrate           # apply db/migrations/*.sql with the owner role
npm run db:setup-role        # passwords for the restricted roles → writes DATABASE_APP_URL + DATABASE_DISPATCH_URL
npm run db:test-rls          # end-to-end Row Level Security checks against the database
npm run content:check        # every curated Quran/hadith/dua reference still resolves at its source
npm test                     # unit tests
npm run dev
```

In the Neon Console (Auth → Configuration) enable **Magic Link**. Google sign-in works in development with Neon's shared credentials; add your own Google OAuth client before launch (see below).

## Structure

```
db/migrations/        SQL migrations: schema, helper functions, RLS policies, grants (source of truth)
scripts/              migrate, setup-app-role, test-rls, check-content
src/proxy.ts          locale redirect + route protection
src/app/[lang]/       all pages (root layout lives here; `lang` is a root param)
  (app)/              signed-in area: today, week, circles, settings
  auth/sign-in        magic link + Google
  onboarding          name → timezone → location & method → habits
  privacy, about
src/app/api/          auth proxy, data export, sign-out
src/i18n/             locales, JSON dictionaries, server + client helpers
src/lib/db/           Drizzle schema mirror + `withUser()` RLS transaction helper
src/lib/auth/         Neon Auth server/client + session helpers
public/sw.js          service worker (offline shell; tracker queue arrives in Phase 2)
```

## Security model

- **RLS on every table**, enabled *and* forced.
- The app connects only as `istiqamah_app` (`NOBYPASSRLS`). Owner credentials (`DATABASE_URL`) are used by scripts only and must not be set in Vercel.
- Each request verifies the Neon Auth session, then runs queries in a transaction that sets `app.user_id` (`set_config(..., is_local => true)`); policies read it via `app.current_user_id()`.
- Circle members can read each other's display names (via `circle_member_profiles`) and only the habits a user explicitly shares. Joining requires an invite code through `app.join_circle()`.
- Deleting a Neon Auth user cascades to all of their data.

## Daily content & reminders

- **Ayah of the day**: alquran.cloud (Uthmani text + Saheeh International), from a vetted list of references in `src/lib/content/daily-refs.ts`; links to Quran.com.
- **Hadith of the day**: Forty Hadith of an-Nawawi via fawazahmed0/hadith-api, limited to narrations in Sahih al-Bukhari / Sahih Muslim so every item shows collection, number, source and grade (Sahih); links to Sunnah.com.
- **Dua of the day** and nudge duas: Hisn al-Muslim (hisnmuslim.com API), with chapter + number + link.
- **Push reminders** (opt-in, Settings): prayer times and morning/evening adhkar. `GET /api/push/dispatch` with `Authorization: Bearer $CRON_SECRET` sends anything due (idempotent). Schedule it every 5 minutes with `.github/workflows/push-dispatch.yml` (set repo secrets `APP_URL`, `CRON_SECRET`) or, on Vercel Pro, a Vercel Cron: `{ "crons": [{ "path": "/api/push/dispatch", "schedule": "*/5 * * * *" }] }`.
- The dispatcher connects as `istiqamah_dispatch`, which can read only schedule columns of opted-in users.

## Content rules

Quran, hadith and dua text must come from established APIs or vetted static data, always with a visible reference. Never write or generate it. The app does not issue rulings and points users to qualified scholars.

## Before launch

- Add your own Google OAuth client in Neon Auth (redirect URI `{NEON_AUTH_BASE_URL}/callback/google`).
- Configure a dedicated email provider in Neon Auth (the shared sender is for development).
- Add the production domain to Neon Auth trusted domains.
- Set `DATABASE_APP_URL`, `DATABASE_DISPATCH_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET` in Vercel. Never set `DATABASE_URL` (owner) there.
- Set a real `VAPID_SUBJECT` contact.
