/**
 * Pure scheduling logic for reminders (no I/O, unit-tested).
 * Prayer reminders fire at the prayer time; adhkar reminders shortly after
 * Fajr (morning) and Asr (evening), when their time begins.
 */
export const PUSH_EVENTS = ["fajr", "dhuhr", "asr", "maghrib", "isha", "adhkar_morning", "adhkar_evening"] as const;
export type PushEvent = (typeof PUSH_EVENTS)[number];

export const ADHKAR_DELAY_MINUTES = 15;
/** A reminder is still sent if the scheduler runs up to this late. */
export const DISPATCH_WINDOW_MINUTES = 20;

type Times = { fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string };

export function eventTimes(times: Times, prefs: { prayers: boolean; adhkar: boolean }): { event: PushEvent; at: Date }[] {
  const out: { event: PushEvent; at: Date }[] = [];
  if (prefs.prayers) {
    for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) out.push({ event: p, at: new Date(times[p]) });
  }
  if (prefs.adhkar) {
    const after = (iso: string) => new Date(new Date(iso).getTime() + ADHKAR_DELAY_MINUTES * 60_000);
    out.push({ event: "adhkar_morning", at: after(times.fajr) });
    out.push({ event: "adhkar_evening", at: after(times.asr) });
  }
  return out;
}

/** Events whose time has arrived within the dispatch window. */
export function dueEvents(
  times: Times,
  prefs: { prayers: boolean; adhkar: boolean },
  now: Date,
  windowMinutes = DISPATCH_WINDOW_MINUTES,
): PushEvent[] {
  const earliest = now.getTime() - windowMinutes * 60_000;
  return eventTimes(times, prefs)
    .filter(({ at }) => at.getTime() <= now.getTime() && at.getTime() > earliest)
    .map(({ event }) => event);
}
