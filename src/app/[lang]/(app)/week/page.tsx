import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import { addDays, dateRange, EDIT_WINDOW_DAYS, formatDate, localDate } from "@/lib/dates";
import { getStreaks, getTracker } from "@/lib/tracker/data";
import { WeekGrid } from "./week-grid";

export const instant = false;

export const metadata: Metadata = { title: "Week" };

export default async function WeekPage({ searchParams }: PageProps<"/[lang]/week">) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user, profile } = await requireOnboardedUser(locale);
  const offset = Math.min(0, Math.max(-52, Math.trunc(Number((await searchParams).w ?? 0)) || 0));

  const today = localDate(profile.timezone);
  const end = addDays(today, offset * 7);
  const start = addDays(end, -6);
  const days = dateRange(start, end);

  const [{ habits, logs }, streaks] = await Promise.all([getTracker(user.id, start, end), getStreaks(user.id, today)]);

  const range = `${formatDate(start, locale, { day: "numeric", month: "short" })} – ${formatDate(end, locale, {
    day: "numeric",
    month: "short",
  })}`;

  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("week.title")}</h1>
        <nav className="flex items-center justify-between gap-2" aria-label={t("week.title")}>
          <Link
            href={`/${locale}/week?w=${offset - 1}`}
            className="grid min-h-12 min-w-12 place-items-center rounded-2xl border border-border bg-surface px-3 text-sm font-semibold"
          >
            <span aria-hidden="true" className="rtl:-scale-x-100">
              ←
            </span>
            <span className="sr-only">{t("week.previous")}</span>
          </Link>
          <p className="font-semibold" aria-live="polite">
            {range}
          </p>
          {offset < 0 ? (
            <Link
              href={`/${locale}/week?w=${offset + 1}`}
              className="grid min-h-12 min-w-12 place-items-center rounded-2xl border border-border bg-surface px-3 text-sm font-semibold"
            >
              <span aria-hidden="true" className="rtl:-scale-x-100">
                →
              </span>
              <span className="sr-only">{t("week.next")}</span>
            </Link>
          ) : (
            <span className="min-w-12" />
          )}
        </nav>
      </header>

      <WeekGrid
        days={days}
        today={today}
        editableFrom={addDays(today, -EDIT_WINDOW_DAYS)}
        habits={habits}
        initialLogs={logs}
        streaks={streaks}
      />
    </>
  );
}
