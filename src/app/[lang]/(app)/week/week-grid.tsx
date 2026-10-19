"use client";

import { habitLabel } from "@/components/tracker/habit-row";
import { SyncStatus } from "@/components/tracker/sync-status";
import { useLogs } from "@/components/tracker/use-logs";
import { Card } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { formatDate } from "@/lib/dates";
import type { Streak } from "@/lib/habits/streaks";
import type { LogMap, TrackerHabit } from "@/lib/tracker/data";

export function WeekGrid({
  days,
  today,
  editableFrom,
  habits,
  initialLogs,
  streaks,
}: {
  days: string[];
  today: string;
  editableFrom: string;
  habits: TrackerHabit[];
  initialLogs: LogMap;
  streaks: Record<string, Streak>;
}) {
  const { t, locale } = useI18n();
  const { logs, setEntry, sync } = useLogs(initialLogs);

  if (!habits.length) return <Card>{t("week.empty")}</Card>;

  const pastDays = days.filter((d) => d < today);
  const missedSomething = pastDays.some((d) => habits.some((h) => !logs[h.id]?.[d]?.completed));
  const withRuns = habits.filter((h) => (streaks[h.id]?.best ?? 0) > 1);

  return (
    <div className="flex flex-col gap-5">
      {missedSomething && (
        <p className="rounded-2xl bg-primary-soft px-4 py-3 leading-relaxed text-primary-soft-ink">{t("week.beginAgain")}</p>
      )}
      <SyncStatus sync={sync} />

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t("week.title")}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky start-0 bg-surface px-3 py-3 text-start font-semibold">
                <span className="sr-only">{t("manage.active")}</span>
              </th>
              {days.map((d) => {
                const done = habits.filter((h) => logs[h.id]?.[d]?.completed).length;
                return (
                  <th key={d} scope="col" className={`px-1 py-3 text-center font-semibold ${d === today ? "text-primary" : ""}`}>
                    <span className="block text-xs text-muted">{formatDate(d, locale, { weekday: "narrow" })}</span>
                    <span className="block">{formatDate(d, locale, { day: "numeric" })}</span>
                    <span className="block text-[11px] font-normal text-muted">
                      {t("week.daysDone", { done, total: habits.length })}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => {
              const label = habitLabel(h, t);
              return (
                <tr key={h.id} className="border-t border-border">
                  <th scope="row" className="sticky start-0 max-w-28 truncate bg-surface px-3 py-2 text-start font-medium">
                    {label}
                  </th>
                  {days.map((d) => {
                    const entry = logs[h.id]?.[d];
                    const done = !!entry?.completed;
                    const editable = d >= editableFrom && d <= today;
                    const state = done ? t("week.done") : t("week.notDone");
                    const name = t("week.cell", {
                      habit: label,
                      date: formatDate(d, locale, { weekday: "long", day: "numeric", month: "long" }),
                      state,
                    });
                    return (
                      <td key={d} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          disabled={!editable}
                          aria-pressed={done}
                          aria-label={name}
                          title={name}
                          onClick={() =>
                            setEntry(h.id, d, {
                              completed: !done,
                              // Keep amounts consistent with the toggle for counted habits.
                              value: h.targetValue ? (done ? 0 : Math.max(entry?.value ?? 0, h.targetValue)) : (entry?.value ?? null),
                            })
                          }
                          className="mx-auto grid size-11 place-items-center rounded-full disabled:cursor-default"
                        >
                          <span
                            aria-hidden="true"
                            className={`block size-6 rounded-full border-2 ${
                              done ? "border-primary bg-primary" : "border-border bg-transparent"
                            } ${d === today && !done ? "border-primary/60" : ""}`}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-4 rounded-full bg-primary" />
          {t("week.legendDone")}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-4 rounded-full border-2 border-border" />
          {t("week.legendOpen")}
        </span>
        <span>{t("week.editHint")}</span>
      </div>

      {withRuns.length > 0 && (
        <Card>
          <ul className="flex flex-col gap-1.5 text-sm">
            {withRuns.map((h) => (
              <li key={h.id} className="flex justify-between gap-3">
                <span className="font-medium">{habitLabel(h, t)}</span>
                <span className="text-muted">{t("week.bestStreak", { count: streaks[h.id]!.best })}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
