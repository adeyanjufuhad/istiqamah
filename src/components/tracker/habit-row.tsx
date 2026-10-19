"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import type { MessageKey, Translate } from "@/i18n/translate";
import type { Streak } from "@/lib/habits/streaks";
import type { LogEntry, TrackerHabit } from "@/lib/tracker/data";

export function habitLabel(h: Pick<TrackerHabit, "kind" | "title">, t: Translate) {
  return h.kind === "custom" ? (h.title ?? "") : t(`habits.${h.kind}` as MessageKey);
}

function StreakNote({ streak }: { streak?: Streak }) {
  const { t } = useI18n();
  if (!streak) return null;
  if (streak.current >= 2) return <span className="text-sm text-muted">{t("today.streak", { count: streak.current })}</span>;
  if (streak.current === 1 && streak.doneToday) return <span className="text-sm text-muted">{t("today.streakOne")}</span>;
  if (streak.current === 0 && streak.best > 0)
    return <span className="text-sm text-primary-soft-ink">{t("today.beginAgain")}</span>;
  return null;
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${
        checked ? "border-primary bg-primary text-primary-ink" : "border-border bg-surface"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      )}
    </span>
  );
}

/** Whole row is the tap target (min 56px). */
export function CheckRow({
  habit,
  entry,
  streak,
  meta,
  badge,
  onChange,
}: {
  habit: TrackerHabit;
  entry?: LogEntry;
  streak?: Streak;
  meta?: ReactNode;
  badge?: ReactNode;
  onChange: (entry: LogEntry) => void;
}) {
  const { t } = useI18n();
  const checked = !!entry?.completed;
  const label = habitLabel(habit, t);
  return (
    <li>
      <label
        className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)] ${
          checked ? "border-primary/40 bg-primary-soft" : "border-border bg-surface"
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange({ completed: e.target.checked, value: entry?.value ?? null })}
        />
        <Check checked={checked} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 font-semibold">
            {label}
            {badge}
          </span>
          <StreakNote streak={streak} />
        </span>
        {meta && <span className="shrink-0 text-base tabular-nums text-muted">{meta}</span>}
      </label>
    </li>
  );
}

export function AmountRow({
  habit,
  entry,
  streak,
  onChange,
}: {
  habit: TrackerHabit;
  entry?: LogEntry;
  streak?: Streak;
  onChange: (entry: LogEntry) => void;
}) {
  const { t } = useI18n();
  const target = habit.targetValue ?? 1;
  const value = entry?.value ?? 0;
  const label = habitLabel(habit, t);
  const unit = habit.unit ? t(`habits.units.${habit.unit}`) : "";
  const set = (v: number) => {
    const next = Math.max(0, Math.min(100000, v));
    onChange({ value: next, completed: next >= target });
  };
  const done = value >= target;

  return (
    <li
      className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 ${
        done ? "border-primary/40 bg-primary-soft" : "border-border bg-surface"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{label}</span>
        <span className="text-sm text-muted" aria-live="polite">
          {t("today.ofTarget", { value, target, unit })}
        </span>
        <StreakNote streak={streak} />
      </span>
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= 0}
          aria-label={t("today.decrease", { habit: label })}
          className="grid size-12 place-items-center rounded-full border border-border bg-surface text-xl font-semibold disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums" aria-hidden="true">
          {value}
        </span>
        <button
          type="button"
          onClick={() => set(value + 1)}
          aria-label={t("today.increase", { habit: label })}
          className="grid size-12 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-ink"
        >
          +
        </button>
      </div>
    </li>
  );
}
