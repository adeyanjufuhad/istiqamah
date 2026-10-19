import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ISODate } from "@/lib/dates";

export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type Prayer = (typeof PRAYERS)[number];

export type Hijri = {
  day: number;
  month: number;
  monthEn: string;
  monthAr: string;
  year: number;
  holidays: string[];
};

export type PrayerDay = {
  /** ISO 8601 timestamps with offset, e.g. 2026-10-19T05:23:00+01:00 */
  times: Record<Prayer | "sunrise", string>;
  hijri: Hijri;
  timezone: string;
  methodName: string;
};

export type PrayerQuery = {
  date: ISODate;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  method: number;
  school: number;
};

type AladhanResponse = {
  code: number;
  data: {
    timings: Record<string, string>;
    date: {
      hijri: {
        day: string;
        month: { number: number; en: string; ar: string };
        year: string;
        holidays: string[];
      };
    };
    meta: { timezone: string; method: { name: string } };
  };
};

/**
 * Prayer times and Hijri date from the Aladhan API (https://aladhan.com/prayer-times-api).
 * Cached per (date, location, method) for a day. Returns null when no location
 * is set or the API is unavailable, so the tracker keeps working without times.
 */
export async function getPrayerDay(q: PrayerQuery): Promise<PrayerDay | null> {
  const hasCoords = q.latitude !== null && q.longitude !== null;
  if (!hasCoords && !(q.city && q.country)) return null;
  try {
    return await fetchPrayerDay(q.date, q.latitude, q.longitude, q.city, q.country, q.method, q.school);
  } catch (err) {
    console.warn("[aladhan] prayer times unavailable", err instanceof Error ? err.message : err);
    return null;
  }
}

async function fetchPrayerDay(
  date: ISODate,
  latitude: number | null,
  longitude: number | null,
  city: string | null,
  country: string | null,
  method: number,
  school: number,
): Promise<PrayerDay> {
  "use cache";
  cacheLife("days");
  cacheTag("aladhan");

  const [y, m, d] = date.split("-");
  const params = new URLSearchParams({ method: String(method), school: String(school), iso8601: "true" });
  let path: string;
  if (latitude !== null && longitude !== null) {
    path = `timings/${d}-${m}-${y}`;
    params.set("latitude", String(latitude));
    params.set("longitude", String(longitude));
  } else {
    path = `timingsByCity/${d}-${m}-${y}`;
    params.set("city", city!);
    params.set("country", country!);
  }

  const res = await fetch(`https://api.aladhan.com/v1/${path}?${params}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Aladhan ${res.status}`);
  const body = (await res.json()) as AladhanResponse;
  if (body.code !== 200) throw new Error(`Aladhan code ${body.code}`);

  const t = body.data.timings;
  const h = body.data.date.hijri;
  return {
    times: { fajr: t.Fajr, sunrise: t.Sunrise, dhuhr: t.Dhuhr, asr: t.Asr, maghrib: t.Maghrib, isha: t.Isha },
    hijri: {
      day: Number(h.day),
      month: h.month.number,
      monthEn: h.month.en,
      monthAr: h.month.ar,
      year: Number(h.year),
      holidays: h.holidays ?? [],
    },
    timezone: body.data.meta.timezone,
    methodName: body.data.meta.method.name,
  };
}

export function nextPrayer(day: PrayerDay, now: Date = new Date()): Prayer | null {
  return PRAYERS.find((p) => new Date(day.times[p]) > now) ?? null;
}
