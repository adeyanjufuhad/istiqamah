"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AmountRow, CheckRow } from "@/components/tracker/habit-row";
import { SyncStatus } from "@/components/tracker/sync-status";
import { useLogs } from "@/components/tracker/use-logs";
import { useI18n } from "@/i18n/client";
import type { FastingHint } from "@/lib/habits/fasting";
import type { Streak } from "@/lib/habits/streaks";
import type { Prayer } from "@/lib/prayer/aladhan";
import type { LogEntry, LogMap, TrackerHabit } from "@/lib/tracker/data";

const PRAYER_KINDS = new Set(["fajr", "dhuhr", "asr", "maghrib", "isha"]);

/** Server streaks are a snapshot; reflect today's tap immediately. */
function liveStreak(server: Streak | undefined, doneNow: boolean): Streak {
  const s = server ?? { current: 0, best: 0, doneToday: false };
  const before = s.doneToday ? s.current - 1 : s.current;
  const current = doneNow ? before + 1 : before;
  return { current, best: Math.max(s.best, current), doneToday: doneNow };
}

export function TodayTracker({
  date,
  habits,
  initialLogs,
  streaks,
  prayerTimes,
  nextPrayer,
  fastingHints,
  prayerNotice,
}: {
  date: string;
  habits: TrackerHabit[];
  initialLogs: LogMap;
  streaks: Record<string, Streak>;
  prayerTimes: Partial<Record<Prayer, string>>;
  nextPrayer: Prayer | null;
  fastingHints: FastingHint[];
  prayerNotice: ReactNode;
}) {
  const { t, locale } = useI18n();
  const { logs, setEntry, sync } = useLogs(initialLogs);

  const entry = (h: TrackerHabit) => logs[h.id]?.[date];
  const change = (h: TrackerHabit) => (e: LogEntry) => setEntry(h.id, date, e);
  const streak = (h: TrackerHabit) => liveStreak(streaks[h.id], !!entry(h)?.completed);

  const prayers = habits.filter((h) => PRAYER_KINDS.has(h.kind));
  const quran = habits.filter((h) => h.kind === "quran");
  const adhkar = habits.filter((h) => h.kind === "adhkar_morning" || h.kind === "adhkar_evening");
  const fasting = habits.filter((h) => h.kind === "fasting");
  const custom = habits.filter((h) => h.kind === "custom");

  const done = habits.filter((h) => entry(h)?.completed).length;
  const total = habits.length;
  const mood = done === 0 ? t("today.noneYet") : done === total ? t("today.allDone") : t("today.someDone");

  const row = (h: TrackerHabit, extra?: { meta?: ReactNode; badge?: ReactNode }) =>
    h.targetValue && h.unit ? (
      <AmountRow key={h.id} habit={h} entry={entry(h)} streak={streak(h)} onChange={change(h)} />
    ) : (
      <CheckRow key={h.id} habit={h} entry={entry(h)} streak={streak(h)} onChange={change(h)} {...extra} />
    );

  return (
    <div className="flex flex-col gap-6">
      {total > 0 && (
        <section aria-labelledby="progress-heading" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="progress-heading" className="text-lg font-semibold">
              {t("today.progress", { done, total })}
            </h2>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-labelledby="progress-heading"
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <p className="text-muted">{mood}</p>
        </section>
      )}

      <SyncStatus sync={sync} />

      {prayers.length > 0 && (
        <Section title={t("today.prayers")}>
          {prayerNotice}
          <ul className="flex flex-col gap-2">
            {prayers.map((h) =>
              row(h, {
                meta: prayerTimes[h.kind as Prayer],
                badge:
                  nextPrayer === h.kind ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      {t("today.nextPrayer")}
                    </span>
                  ) : undefined,
              }),
            )}
          </ul>
        </Section>
      )}

      {quran.length > 0 && (
        <Section title={t("today.quran")}>
          <ul className="flex flex-col gap-2">{quran.map((h) => row(h))}</ul>
        </Section>
      )}

      {adhkar.length > 0 && (
        <Section title={t("today.adhkar")}>
          <ul className="flex flex-col gap-2">{adhkar.map((h) => row(h))}</ul>
        </Section>
      )}

      {fasting.length > 0 && (
        <Section title={t("today.fasting")}>
          {fastingHints.length > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {t("today.fastHintLabel")}
              {fastingHints.map((hint) => (
                <span key={hint} className="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary-soft-ink">
                  {t(`today.fastHint.${hint}`)}
                </span>
              ))}
            </p>
          )}
          <ul className="flex flex-col gap-2">{fasting.map((h) => row(h))}</ul>
        </Section>
      )}

      {custom.length > 0 && (
        <Section title={t("today.yourHabits")}>
          <ul className="flex flex-col gap-2">{custom.map((h) => row(h))}</ul>
        </Section>
      )}

      <Link
        href={`/${locale}/today/habits`}
        className="flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-border text-base font-semibold text-primary hover:bg-primary-soft"
      >
        {t("today.manageHabits")}
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-sm font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
