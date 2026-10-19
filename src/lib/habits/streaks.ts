import { addDays, type ISODate } from "@/lib/dates";

export type Streak = { current: number; best: number; doneToday: boolean };

/**
 * `current` counts consecutive completed days ending today, or ending
 * yesterday if today isn't done yet (the day isn't over). A gap resets it;
 * the UI frames that as "begin again", never as failure.
 */
export function computeStreak(completed: ReadonlySet<ISODate>, today: ISODate): Streak {
  const doneToday = completed.has(today);
  let current = 0;
  for (let d = doneToday ? today : addDays(today, -1); completed.has(d); d = addDays(d, -1)) current++;

  let best = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const d of [...completed].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best, doneToday };
}
