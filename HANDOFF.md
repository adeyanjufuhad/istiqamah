# Istiqamah: handoff for the next AI assistant (ChatGPT)

You're picking up a working, deployed codebase. Read this whole file, then `README.md`, `DESIGN.md` and `AGENTS.md` before changing anything. Last updated: 2026-10-20.

---

## 1. What this is

**Istiqamah** is a mobile-first PWA that helps Muslims stay consistent in their deen: a gentle daily tracker (5 prayers, Quran, morning/evening adhkar, fasting, custom habits) plus small private accountability **circles** of friends.

- **Live:** https://istiqamah-six.vercel.app (production, auto-deploys on every push to `main`)
- **Repo:** https://github.com/adeyanjufuhad/istiqamah (public)
- **Owner:** Fuhad Adeyanju (GitHub `adeyanjufuhad`)

### Owner's hard rules (non-negotiable)

1. **Never generate Quran, hadith or dua text with AI. Not even a short quote in UI copy.** Religious text comes only from established APIs or vetted data, always with a visible reference. (The previous assistant once drafted a hadith quote from memory in the About page and had to remove it. Don't repeat that.)
2. The app **does not issue fatwas or rulings**. Keep the "consult a qualified scholar" note.
3. **Minimal personal data**, clear privacy page, users can **export and delete** their data.
4. **Accessibility:** contrast, screen-reader labels, RTL-safe layout (logical CSS properties: `ms-`, `ps-`, `start-`, `end-`).
5. **Gentle language only.** Missed days say "begin again", never guilt or shame. **No leaderboards or ranking** (to avoid riya).
6. **Git:** conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`). **Never add "Co-authored-by: Claude"/AI attribution** to commits or PRs. Push every commit to `origin main`. Check with `git log` that no commit contains attribution.
7. Work in phases and **show the owner the result before moving on**.

### Owner's design decisions

- **Light-only** app (dark mode was removed on request). Palette (dark → light): `#03045e #023e8a #0077b6 #0096c7 #00b4d8 #48cae4 #90e0ef #ade8f4 #caf0f8`. Primary `#0077b6`, ink `#03045e`. Font: Plus Jakarta Sans; Arabic: Noto Naskh Arabic. All tokens are in `src/app/globals.css`, and the rules are in `DESIGN.md`.
- **Motion-heavy landing page** built with **React Bits** components (reactbits.dev). The owner explicitly wants React Bits used. They're vendored in `src/components/reactbits/` (excluded from ESLint). Add more via `https://reactbits.dev/r/<Name>-TS-TW.json` (shadcn registry JSON: copy `files[].content`, add `"use client"`, install `dependencies`).
- Landing has **Islamic ornaments**: crescent moon, twinkling 8-point stars, mosque skyline, swinging lanterns, khatam star pattern, and a faint drifting **Arabic-letter texture** with the word استقامة. The owner chose letters + app name over dhikr phrases. **Don't put sacred text (Quran, dhikr, names of Allah) in decorative backgrounds.**
- The owner removed the hero eyebrow pill and the on-page "Pause motion" button. Motion still pauses for `prefers-reduced-motion`.
- Design skills used (vendored in `.claude/skills/`): Vercel Web Interface Guidelines, tasteskill (design-taste-frontend, high-end-visual-design, redesign-existing-projects). The owner's palette overrides their colour rules.

---

## 2. Status by phase

| Phase | Scope | Status |
|---|---|---|
| 1 Foundation | Next.js setup, Neon schema + RLS, auth (magic link + Google), onboarding, design, i18n scaffold, PWA, privacy/export/delete | ✅ Built, deployed |
| 2 Daily tracker | Today screen, prayer times (Aladhan) + Hijri date, Quran/adhkar/fasting/custom habits, streaks, weekly view, offline check-ins | ✅ Built, deployed |
| 3 Circles | Create/join via link or code, shared-habit visibility per habit, nudges + Hisn al-Muslim duas, circle khatm (30 juz) | ✅ Built, deployed |
| 4 Content + reminders | Ayah/hadith/dua of the day with sources; opt-in web push for prayer times + adhkar | ✅ Built, deployed |

**Verified:** typecheck, ESLint, production builds, 20 unit tests (`npm test`), **49 end-to-end RLS checks** against the real DB (`npm run db:test-rls`), content reference check (`npm run content:check`), signed-out flows in a browser, production smoke tests, the push dispatch endpoint, and the GitHub Actions reminder workflow.

**NOT yet verified in a browser while signed in** (the owner chose to test later): the tracker (check-ins, Quran stepper, offline outbox), week view, manage habits, circles (create/join/invite/nudge/khatm), daily content cards, reminders opt-in, export, delete account. Onboarding *was* completed once successfully by the owner (Google sign-in).

---

## 3. Known issues and open items (priority order)

1. **Session dropped after about 5 minutes (unresolved).** In the only signed-in test, Google sign-in and onboarding worked, then ~10 minutes later `/en/today` redirected to sign-in with no sign-out request, and both sessions were still valid in `neon_auth.session`. The suspected area is the Neon Auth SDK's 5-minute `session_data` cookie refresh (`@neondatabase/auth` 0.6.0-beta, `node_modules/@neondatabase/auth/dist/server-*.mjs`: `trySessionCache`, `processAuthMiddleware`). To debug: set `NEON_AUTH_LOG_LEVEL=debug`, sign in, wait more than 5 minutes, reload `/en/today`, and read the server logs. Note that `proxy.ts` only runs the auth middleware on protected paths (and on any URL with `neon_auth_session_verifier`). Also check cookies: `__Secure-neon-auth.session_token` and `__Secure-neon-auth.local.session_data`; the app sets `sameSite: "lax"`.
2. **End-to-end signed-in QA** of everything listed above.
3. **Account deletion:** `auth.deleteUser()` (Neon Managed Better Auth) is untested; the app deletes the profile first (cascades all app data), then calls `deleteUser`. Confirm Neon allows it, or enable it in the Neon Auth config.
4. **Before real users:** add your own Google OAuth client in Neon Auth (it currently uses Neon's shared dev credentials, which show Neon's branding), set a dedicated email provider (it currently uses Neon's shared sender), and set a real `VAPID_SUBJECT` (currently `mailto:reminders@istiqamah.invalid`) in Vercel env.
5. **Production and dev share one Neon branch (`main`).** Create a `dev` branch for local work and give it its own `.env.local`.
6. **Arabic:** routes `/ar/...` render RTL, but `src/i18n/dictionaries/ar.json` is empty (it falls back to English) and Arabic is hidden from the language picker (`enabledLocales` in `src/i18n/config.ts`). Translations need a native speaker's review.
7. **Push on iOS** works only when the PWA is installed to the Home Screen. GitHub disables scheduled workflows after 60 days of repo inactivity; on Vercel Pro, switch to Vercel Cron (README has the snippet).
8. Custom domain: none yet. If added, also add it to Neon Auth trusted domains and update `NEXT_PUBLIC_APP_URL` + GitHub secret `APP_URL`.
9. Pinterest research was done while the owner was logged in. Takeaways used: a sun-arc "next prayer" gauge, per-prayer sky gradients, floating phone/cards hero, oversized type.

---

## 4. Stack and important framework caveats

- **Next.js 16.4 (App Router)** with **Cache Components** (`cacheComponents: true`, `partialPrefetching: true`). This is not the Next.js from older training data. Read `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`). Key differences already handled:
  - `middleware.ts` is now **`src/proxy.ts`**.
  - Root layout lives in `src/app/[lang]/layout.tsx`; locale comes from **`next/root-params`** (`lang()`), with `generateStaticParams` for `en` and `ar`.
  - Pages that read the session export **`instant = false`**. Session helpers call `await connection()` before reading cookies.
  - **No `Math.random()` / `Date.now()` during render in client components that prerender** (the build fails). React Bits' `RotatingText` was patched for this.
  - Cached fetches use `"use cache"` + `cacheLife()` + `cacheTag()`.
- TypeScript, **Tailwind CSS v4** (CSS-first config in `globals.css`), **Drizzle ORM** (schema mirror in `src/lib/db/schema.ts`; **SQL migrations are the source of truth**), `zod` v4, `motion`, `gsap`, `web-push`.
- **Neon** Postgres + **Neon Managed Better Auth** (`@neondatabase/auth`). Magic link enabled (15-minute expiry), Google enabled (shared dev creds).
- **Vercel** hosting, functions in **`lhr1`** (London, next to the Neon DB in `aws-eu-west-2`).

---

## 5. Infrastructure (identifiers, not secrets)

| Thing | Value |
|---|---|
| Neon project | `istiqamah`, id `billowing-cell-40671162`, region aws-eu-west-2, PG 17 |
| Neon branch | `main`, id `br-flat-bread-zarjll44` |
| Neon Auth base URL | `https://ep-flat-tree-za9qg5mm.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth` |
| Neon Auth trusted domain | `https://istiqamah-six.vercel.app` |
| Vercel project | `istiqamah`, id `prj_OlGxHaF07LOLIsOsC1AcT8Qih1TF`, team `team_YGpTd8jH7dGV5R9zu7MhMIJC` (personal/Hobby) |
| Production URL | https://istiqamah-six.vercel.app |
| GitHub Actions secrets | `APP_URL`, `CRON_SECRET` (set) |

**Where the secrets live (values are NOT in git):**
- Local: `.env.local` (gitignored) holds `DATABASE_URL` (owner role, scripts only), `DATABASE_APP_URL`, `DATABASE_DISPATCH_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`.
- Vercel (production + preview): everything above **except `DATABASE_URL`**. The owner credential must never be deployed.
- Template: `.env.example`.
- Rotate DB role passwords with `npm run db:setup-role` (writes `.env.local`; then update Vercel).

---

## 6. Architecture

```
db/migrations/        0001_init (schema + RLS), 0002_circles (khatm, nudge limits, ownership), 0003_push
scripts/              migrate, setup-app-role, test-rls (49 checks), check-content
src/proxy.ts          locale redirect + auth middleware on protected paths
src/app/[lang]/       landing, auth/sign-in, onboarding, join/[code], privacy, about
  (app)/              today (+ habits), week, circles (+ [id]), settings
src/app/api/          auth proxy, logs (check-ins), account/export, account/sign-out, push/subscribe, push/dispatch
src/components/       ui, landing/*, tracker/*, daily/*, reactbits/* (vendored), dua-block, logo
src/i18n/             config, dictionaries (en.json; ar.json empty), server/client helpers
src/lib/db            Drizzle schema + withUser() (sets app.user_id per transaction)
src/lib/auth          Neon Auth server/client, session helpers (requireOnboardedUser)
src/lib/content       daily.ts, daily-refs.ts (references only), hisn.ts, hisn-shared.ts
src/lib/push          schedule.ts (pure, tested), dispatch.ts
src/lib/offline       IndexedDB outbox for offline check-ins
public/sw.js          service worker: cache, offline fallback, push notifications
```

### Security model (important)
- **RLS enabled and forced on every table.**
- The app connects as **`istiqamah_app`** (no BYPASSRLS). Every query runs inside `withUser(userId, tx => …)`, which sets `app.user_id` with `set_config(…, true)`; policies use `app.current_user_id()`.
- The push dispatcher connects as **`istiqamah_dispatch`**: it can read only schedule columns (`timezone`, location, method) of users who opted in, read subscriptions, and write delivery logs. It cannot read names, habits, logs or nudges (covered by RLS tests).
- The owner role (`neondb_owner`, BYPASSRLS) is for migrations and scripts only.
- Circles: members see each other's **display name only** (via the `circle_member_profiles` view) and only habits a user marked "Share with my circles". Joining requires `app.join_circle(code)`. Ownership passes to the longest-standing member; empty circles are deleted.
- Nudges are **preset keys only** (no free text): `nudge.*` (app copy) or `dua.hisn.<chapter>.<item>` from a curated whitelist. Rate limited to 3 per friend per day and 30 per day.
- `safeNext()` guards all `?next=` redirects (open-redirect protection).

### Content sources (references only in code)
- **Ayah of the day:** alquran.cloud `quran-uthmani` + `en.sahih` (Saheeh International), 48 vetted references in `daily-refs.ts`, linked to quran.com.
- **Hadith of the day:** fawazahmed0/hadith-api, **Forty Hadith of an-Nawawi limited to the 26 narrated in Sahih al-Bukhari and/or Sahih Muslim**, so the grade shown ("Sahih") follows from the source. Shows collection, number, source and grade, plus Arabic. Links to sunnah.com/nawawi40:N. jsDelivr first, raw GitHub fallback.
- **Dua of the day / nudge duas:** Hisn al-Muslim API (hisnmuslim.com), chapters 27, 34, 43, 46, 129, 131 (+ 49, 87, 89 for nudges), linked to `hisnmuslim.com/i/en/<chapter>`.
- `npm run content:check` re-verifies every reference and every hadith's source label.

### Reminders
- Opt-in in Settings → service worker push subscription → `/api/push/subscribe`.
- `.github/workflows/push-dispatch.yml` runs every 5 minutes, calling `GET /api/push/dispatch` with `Authorization: Bearer $CRON_SECRET`. It fires prayer reminders at prayer time and adhkar 15 minutes after Fajr and Asr. Delivery is idempotent per subscription/event/day, with a 20-minute window, and expired endpoints are pruned.

---

## 7. Commands

```bash
npm install
npm run dev                 # local dev (service worker only registers in production builds)
npx next build && npm start # production build locally
npm test                    # unit tests (node:test via tsx)
npm run db:migrate          # apply new SQL migrations (owner DATABASE_URL)
npm run db:setup-role       # (re)set passwords for istiqamah_app / istiqamah_dispatch
npm run db:test-rls         # 49 RLS checks against the real DB (creates and deletes test users)
npm run content:check       # verify all religious-content references resolve
npx tsc --noEmit && npx eslint
```

Deploying = `git push origin main` (the Vercel Git integration builds production). The Vercel CLI works via `npx vercel@64.7.0 …`; the project is linked in `.vercel/`.

---

## 8. Suggested next steps

1. Reproduce and fix the 5-minute session drop (section 3.1) with the owner signed in.
2. Full signed-in QA pass across all phases; fix what breaks.
3. Production readiness: own Google OAuth client, email provider, VAPID subject, a Neon `dev` branch, optional custom domain.
4. Arabic translation (`ar.json`) + enable in the language picker + RTL QA.
5. Ideas the owner may want: Qibla direction, Ramadan mode (suhoor/iftar times from Aladhan), per-circle sharing (currently per habit across all circles), install prompt for the PWA.

Keep the tone gentle, keep sources visible, and show the owner each result before moving on.
