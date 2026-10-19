import { weekday, type ISODate } from "@/lib/dates";
import type { Hijri } from "@/lib/prayer/aladhan";

export type FastingHint = "ramadan" | "monday" | "thursday" | "white_days";

/**
 * Gentle calendar reminders only, not rulings. Days on which fasting is
 * widely held to be impermissible (the two Eids and the days of tashreeq)
 * never get a hint.
 */
export function fastingHints(date: ISODate, hijri: Hijri | null): FastingHint[] {
  if (hijri) {
    const { month, day } = hijri;
    const eidOrTashreeq = (month === 10 && day === 1) || (month === 12 && day >= 10 && day <= 13);
    if (eidOrTashreeq) return [];
    if (month === 9) return ["ramadan"];
  }
  const hints: FastingHint[] = [];
  const wd = weekday(date);
  if (wd === 1) hints.push("monday");
  if (wd === 4) hints.push("thursday");
  if (hijri && hijri.day >= 13 && hijri.day <= 15) hints.push("white_days");
  return hints;
}
