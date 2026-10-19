import type { HabitKind } from "@/lib/db/schema";

export const PRAYER_KINDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const satisfies readonly HabitKind[];

/** Choices offered during onboarding. `prayers` expands to the five prayer habits. */
export const ONBOARDING_CHOICES = ["prayers", "quran", "adhkar_morning", "adhkar_evening", "fasting"] as const;
export type OnboardingChoice = (typeof ONBOARDING_CHOICES)[number];

export const QURAN_UNITS = ["pages", "minutes"] as const;
export type QuranUnit = (typeof QURAN_UNITS)[number];

export type NewHabit = {
  kind: HabitKind;
  position: number;
  targetValue?: number;
  unit?: "pages" | "minutes" | "count";
};

export function habitsForChoices(
  choices: readonly OnboardingChoice[],
  quran: { target: number; unit: QuranUnit },
): NewHabit[] {
  const out: NewHabit[] = [];
  const add = (h: Omit<NewHabit, "position">) => out.push({ ...h, position: out.length });
  if (choices.includes("prayers")) PRAYER_KINDS.forEach((kind) => add({ kind }));
  if (choices.includes("quran")) add({ kind: "quran", targetValue: quran.target, unit: quran.unit });
  if (choices.includes("adhkar_morning")) add({ kind: "adhkar_morning" });
  if (choices.includes("adhkar_evening")) add({ kind: "adhkar_evening" });
  if (choices.includes("fasting")) add({ kind: "fasting" });
  return out;
}
