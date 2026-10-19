/** Calendar dates as `YYYY-MM-DD` strings, always interpreted in the user's timezone. */
export type ISODate = string;

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function localDate(timeZone: string, at: Date = new Date()): ISODate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(date: ISODate): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Format a calendar date for display without timezone drift. */
export function formatDate(date: ISODate, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

/** How far back check-ins can be added or corrected. */
export const EDIT_WINDOW_DAYS = 7;
