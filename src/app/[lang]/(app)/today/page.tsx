import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import { formatDate, localDate } from "@/lib/dates";
import { fastingHints } from "@/lib/habits/fasting";
import { getPrayerDay, nextPrayer, PRAYERS, type Prayer } from "@/lib/prayer/aladhan";
import { getStreaks, getTracker } from "@/lib/tracker/data";
import { TodayTracker } from "./today-tracker";

export const instant = false;

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user, profile } = await requireOnboardedUser(locale);
  const today = localDate(profile.timezone);

  const [{ habits, logs }, streaks, prayerDay] = await Promise.all([
    getTracker(user.id, today, today),
    getStreaks(user.id, today),
    getPrayerDay({
      date: today,
      latitude: profile.latitude,
      longitude: profile.longitude,
      city: profile.city,
      country: profile.country,
      method: profile.calcMethod,
      school: profile.asrSchool,
    }),
  ]);

  const prayerTimes: Partial<Record<Prayer, string>> = {};
  if (prayerDay) {
    const fmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: prayerDay.timezone });
    for (const p of PRAYERS) prayerTimes[p] = fmt.format(new Date(prayerDay.times[p]));
  }

  const hasLocation = (profile.latitude !== null && profile.longitude !== null) || !!(profile.city && profile.country);
  const prayerNotice = !hasLocation ? (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      {t("today.noLocation")}
      <Link href={`/${locale}/onboarding?edit=1`} className="font-semibold text-primary underline underline-offset-4">
        {t("today.addLocation")}
      </Link>
    </p>
  ) : !prayerDay ? (
    <p className="text-sm text-muted">{t("today.timesUnavailable")}</p>
  ) : null;

  return (
    <>
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted">
          <time dateTime={today}>{formatDate(today, locale, { weekday: "long", day: "numeric", month: "long" })}</time>
          {prayerDay && (
            <>
              <span aria-hidden="true"> · </span>
              <span>
                {t("today.hijri", {
                  day: prayerDay.hijri.day,
                  month: locale === "ar" ? prayerDay.hijri.monthAr : prayerDay.hijri.monthEn,
                  year: prayerDay.hijri.year,
                })}
              </span>
            </>
          )}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{t("today.greeting", { name: profile.displayName })}</h1>
        {prayerDay && <p className="text-xs text-muted">{t("today.methodNote", { method: prayerDay.methodName })}</p>}
      </header>

      <TodayTracker
        date={today}
        habits={habits}
        initialLogs={logs}
        streaks={streaks}
        prayerTimes={prayerTimes}
        nextPrayer={prayerDay ? nextPrayer(prayerDay) : null}
        fastingHints={fastingHints(today, prayerDay?.hijri ?? null)}
        prayerNotice={prayerNotice}
      />
    </>
  );
}
