"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { habitLabel } from "@/components/tracker/habit-row";
import { Button, buttonClass, Card, Field, Input, Select } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import type { HabitKind } from "@/lib/db/schema";
import type { TrackerHabit } from "@/lib/tracker/data";
import { addCustomHabit, deleteCustomHabit, setHabitActive, setHabitShared, trackBuiltIn, updateTarget } from "./actions";

const BUILT_INS: Exclude<HabitKind, "custom">[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
  "quran",
  "adhkar_morning",
  "adhkar_evening",
  "fasting",
];

export function ManageHabits({ habits }: { habits: TrackerHabit[] }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();
  const active = habits.filter((h) => h.isActive);
  const inactive = habits.filter((h) => !h.isActive);
  const untracked = BUILT_INS.filter((k) => !habits.some((h) => h.kind === k));

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("manage.active")}</h2>
        <ul className="flex flex-col divide-y divide-border">
          {active.map((h) => (
            <li key={h.id} className="flex flex-col gap-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{habitLabel(h, t)}</span>
                <Button
                  variant="ghost"
                  className="min-h-11 px-3 text-sm"
                  disabled={pending}
                  onClick={() => start(() => setHabitActive(h.id, false))}
                >
                  {t("manage.stop")}
                </Button>
              </div>
              <ShareToggle habit={h} />
              {h.targetValue && h.unit && <TargetForm habit={h} />}
            </li>
          ))}
        </ul>
      </Card>

      {(inactive.length > 0 || untracked.length > 0) && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("manage.inactive")}</h2>
          <ul className="flex flex-col divide-y divide-border">
            {inactive.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium text-muted">{habitLabel(h, t)}</span>
                <span className="flex gap-1">
                  {h.kind === "custom" && (
                    <Button
                      variant="ghost"
                      className="min-h-11 px-3 text-sm text-danger"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(t("manage.removeConfirm", { name: habitLabel(h, t) }))) start(() => deleteCustomHabit(h.id));
                      }}
                    >
                      {t("manage.remove")}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="min-h-11 px-3 text-sm"
                    disabled={pending}
                    onClick={() => start(() => setHabitActive(h.id, true))}
                  >
                    {t("manage.resume")}
                  </Button>
                </span>
              </li>
            ))}
            {untracked.map((k) => (
              <li key={k} className="flex items-center justify-between gap-2 py-3">
                <span className="font-medium text-muted">{t(`habits.${k}`)}</span>
                <Button
                  variant="secondary"
                  className="min-h-11 px-3 text-sm"
                  disabled={pending}
                  onClick={() => start(() => trackBuiltIn(k))}
                >
                  {t("manage.addBuiltIn")}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AddHabitForm />

      <Link href={`/${locale}/today`} className={buttonClass("ghost")}>
        {t("manage.back")}
      </Link>
    </div>
  );
}

function ShareToggle({ habit }: { habit: TrackerHabit }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [on, setOn] = useState(habit.shareWithCircles);
  const id = `share-${habit.id}`;
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface-2 px-4 py-2">
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{t("manage.share")}</span>
        <span className="text-xs text-muted">{t("manage.shareHelp")}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setOn(next);
          start(() => setHabitShared(habit.id, next));
        }}
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-border transition-[background-color] duration-300 ease-soft after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-soft peer-checked:bg-primary peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]"
      />
    </label>
  );
}

function TargetForm({ habit }: { habit: TrackerHabit }) {
  const { t } = useI18n();
  const [, action, pending] = useActionState(updateTarget, null);
  const units = habit.kind === "quran" ? (["pages", "minutes"] as const) : ([habit.unit!] as const);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="habitId" value={habit.id} />
      <Field id={`amount-${habit.id}`} label={habit.kind === "quran" ? t("manage.quranGoal") : t("manage.goalLabel")}>
        <Input
          id={`amount-${habit.id}`}
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={10000}
          defaultValue={habit.targetValue ?? 1}
          className="w-28"
        />
      </Field>
      <Select name="unit" defaultValue={habit.unit ?? undefined} aria-label={t("manage.goalLabel")} className="w-auto">
        {units.map((u) => (
          <option key={u} value={u}>
            {t(`habits.units.${u}`)}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t("common.saving") : t("manage.saveGoal")}
      </Button>
    </form>
  );
}

function AddHabitForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(addCustomHabit, null);
  const [goal, setGoal] = useState<"none" | "count" | "minutes">("none");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <Card>
      <form ref={formRef} action={action} className="flex flex-col gap-4" onReset={() => setGoal("none")}>
        <h2 className="text-lg font-semibold">{t("manage.addTitle")}</h2>
        <Field id="habit-name" label={t("manage.nameLabel")} error={state?.error ? t("common.error") : undefined}>
          <Input id="habit-name" name="name" required maxLength={80} placeholder={t("manage.namePlaceholder")} />
        </Field>
        <Field id="habit-goal" label={t("manage.goalLabel")}>
          <Select id="habit-goal" name="goal" value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)}>
            <option value="none">{t("manage.goalNone")}</option>
            <option value="count">{t("manage.goalCount")}</option>
            <option value="minutes">{t("manage.goalMinutes")}</option>
          </Select>
        </Field>
        {goal !== "none" && (
          <Field id="habit-amount" label={t("manage.amountLabel")}>
            <Input id="habit-amount" name="amount" type="number" inputMode="numeric" min={1} max={10000} defaultValue={1} className="w-28" />
          </Field>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("manage.add")}
        </Button>
      </form>
    </Card>
  );
}
