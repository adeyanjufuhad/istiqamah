# Istiqamah

A mobile-first PWA that helps Muslims stay consistent in their deen through gentle daily habit tracking and small accountability circles.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Neon Postgres · Neon Managed Better Auth · Drizzle ORM · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
npm run db:migrate           # apply db/migrations/*.sql with the owner role
npm run db:setup-role        # give the restricted runtime role a password → writes DATABASE_APP_URL
npm run db:test-rls          # end-to-end Row Level Security checks against the database
npm run dev
```

In the Neon Console (Auth → Configuration) enable **Magic Link**. Google sign-in works in development with Neon's shared credentials; add your own Google OAuth client before launch (see below).

## Structure

```
db/migrations/        SQL migrations: schema, helper functions, RLS policies, grants (source of truth)
scripts/              migrate, setup-app-role, test-rls
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

## Content rules

Quran, hadith and dua text must come from established APIs or vetted static data, always with a visible reference. Never write or generate it. The app does not issue rulings and points users to qualified scholars.

## Before launch

- Add your own Google OAuth client in Neon Auth (redirect URI `{NEON_AUTH_BASE_URL}/callback/google`).
- Configure a dedicated email provider in Neon Auth (the shared sender is for development).
- Add the production domain to Neon Auth trusted domains.
- Set `DATABASE_APP_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_APP_URL` in Vercel.
