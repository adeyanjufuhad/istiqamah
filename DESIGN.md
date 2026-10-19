# Istiqamah — DESIGN.md

Design system for agents and humans building Istiqamah. Read this before touching UI.
Format follows [awesome-design-md](https://github.com/VoltAgent/awesome-design-md); craft rules come from the skills in `.claude/skills/` (Vercel Web Interface Guidelines, taste-skill, soft-skill, redesign-skill). **The palette below is the owner's choice and overrides any colour rule in those skills.**

## Overview

Istiqamah should feel like clear morning water: light, calm, quietly confident. The surface is a near-white with a cool cyan breath; ink is deep navy, never black. One ocean blue carries every decisive action. The lighter blues are the atmosphere — aurora washes, selected states, progress — never text.

Motion is the personality. Text resolves out of blur, cards drift on springs, prayer names flow past in a marquee, an aurora moves behind the hero. Motion is always soft (springs and long ease-outs), always interruptible, and fully disabled under `prefers-reduced-motion`.

Tone of voice is gentle. Missed days say "begin again". No rankings, no shame, no exclamation marks.

**Key characteristics**
- Light-only. No dark theme (owner decision, 2026-10-19).
- Navy ink (`ink`) on cool white (`canvas`); one action blue (`primary`).
- Pale blue tints (`tint-*`) for surfaces, selection and progress.
- Pill buttons, softly rounded cards (`rounded-[1.75rem]`), "double-bezel" cards on marketing pages.
- Large tap targets: every interactive element is at least 48px tall.

## Colors

Owner palette, dark → light:

| Token | Hex | Role |
|---|---|---|
| `navy-950` | `#03045e` | **ink** — headings, body text, pressed state |
| `navy-800` | `#023e8a` | primary hover, strong links |
| `ocean-600` | `#0077b6` | **primary** — CTAs, checked state, focus ring (white text 4.7:1) |
| `ocean-500` | `#0096c7` | secondary data, icons on tint |
| `sky-400` | `#00b4d8` | decorative only (aurora, glows, illustration) |
| `sky-300` | `#48cae4` | decorative only |
| `sky-200` | `#90e0ef` | progress tracks, dividers on tint |
| `sky-100` | `#ade8f4` | selected borders, chips |
| `sky-50`  | `#caf0f8` | soft surfaces, done rows, highlights |

Neutrals (navy-tinted so greys never go warm):

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#f5fbfd` | page background |
| `surface` | `#ffffff` | cards, inputs |
| `surface-2` | `#eef7fa` | quiet fills, notes |
| `muted` | `#4a5b7c` | secondary text (≥ 6:1 on canvas) |
| `border` | `#d7e9f0` | hairlines |
| `danger` | `#b42318` | destructive actions only |

**Rules**
- Text is only ever `ink`, `muted`, `primary`, white-on-primary, or `danger`. Never put text in `sky-*`.
- One primary button per view. Secondary actions are white pills with a hairline border, or plain links.
- Shadows are tinted navy, wide and soft: `0 24px 48px -24px rgb(3 4 94 / 0.18)`. Never grey/black shadows.
- Gradients only in atmosphere (aurora, hero wash), never on body text.

## Typography

- **Sans:** Plus Jakarta Sans (400/500/600/700/800) for everything Latin.
- **Arabic:** Noto Naskh Arabic for Arabic UI and religious text.
- Display: `text-5xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95] text-balance`.
- Section titles: `text-3xl md:text-5xl font-bold tracking-tight text-balance`.
- Body: `text-base md:text-lg leading-relaxed text-muted max-w-[60ch] text-pretty`.
- Eyebrows: pill, `text-[11px] uppercase tracking-[0.2em] font-semibold`.
- Numbers that change: `tabular-nums`.
- Typography details: `…` not `...`, curly quotes, loading states end with `…`.

## Layout

- Container: `max-w-6xl mx-auto px-4 sm:px-6` (marketing), `max-w-xl` (app).
- Section rhythm: `py-24 md:py-36`; bottom padding optically ≥ top.
- Hero: asymmetric split (copy left, live UI right), `min-h-[100dvh]`, never `h-screen`.
- Feature grids: asymmetric bento (`md:grid-cols-6` with 4/2, 2/4, 3/3 spans). No three equal cards.
- Mobile (< 768px): everything collapses to one column, rotations and overlaps removed.
- Safe areas: fixed bars pad with `env(safe-area-inset-*)`.

## Elevation & Shapes

- Radii: pills `rounded-full`; cards `rounded-[1.75rem]`; inner cores `rounded-[calc(1.75rem-6px)]`; inputs `rounded-2xl`.
- **Double-bezel** (marketing cards): outer shell `bg-white/60 ring-1 ring-[#03045e]/5 p-1.5 rounded-[2rem]`, inner core `bg-white rounded-[calc(2rem-6px)] shadow-[inset_0_1px_0_white]`.
- App cards stay simpler: white, hairline border, no shadow unless lifted.

## Motion

- Easing: `cubic-bezier(0.32, 0.72, 0, 1)` for UI transitions (200–700ms); springs `stiffness 100–260, damping 20–30` for motion components.
- Animate `transform` and `opacity` only; list properties explicitly (never `transition: all`).
- Entry: fade-up with blur (`y: 24, blur: 8px → 0`), staggered 60–90ms.
- Buttons: `active:scale-[0.98]`; CTA icon nests in its own circle and nudges on hover.
- Loops (aurora, marquee, card swap) pause or render static under `prefers-reduced-motion`.
- React Bits components live in `src/components/reactbits/` (vendored from reactbits.dev, TS + Tailwind variants). Wrap any perpetual animation in its own client component.

## Components

- **Floating nav (marketing):** glass pill, detached from the top (`mt-4`), `backdrop-blur` only here.
- **Buttons:** `primary` (ocean pill, white text), `secondary` (white pill, hairline), `ghost` (text in primary). Min height 48px.
- **Check rows (app):** whole row is the hit target; checked = `sky-50` fill + `primary` check disc.
- **Bottom nav (app):** white, hairline top border, active item in `primary`.
- **Inputs:** label above, help below, error below in `danger`, white fill, `sky-100` focus border + primary focus ring.

## Do / Don't

**Do**
- Keep backgrounds light; let blue tints do the separating instead of borders where possible.
- Show the source of every religious text (surah:ayah, collection + number + grading, Hisn al-Muslim chapter + number).
- Use real, honest numbers (5 daily prayers, 30 juz), never invented stats or testimonials.

**Don't**
- No dark sections, no pure black, no grey shadows.
- No neon glows or gradient text.
- No emojis in UI.
- No leaderboards, rankings, percentages comparing people.
- Never generate Quran, hadith or dua text.
