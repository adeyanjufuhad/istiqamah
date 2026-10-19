import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Card } from "@/components/ui";
import { getLocale, getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translate";
import { requireOnboardedUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user, profile } = await requireOnboardedUser(locale);
  const habits = await withUser(user.id, (tx) =>
    tx
      .select()
      .from(schema.habits)
      .where(eq(schema.habits.userId, user.id))
      .orderBy(asc(schema.habits.position)),
  );

  const date = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: profile.timezone,
  }).format(new Date());

  return (
    <>
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted">{date}</p>
        <h1 className="text-3xl font-bold tracking-tight">{t("today.greeting", { name: profile.displayName })}</h1>
      </header>

      <Card className="flex flex-col gap-4">
        <p className="leading-relaxed text-muted">{t("today.comingSoon")}</p>
        {habits.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">{t("today.tracking")}</h2>
            <ul className="flex flex-wrap gap-2">
              {habits.map((h) => (
                <li key={h.id} className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary-soft-ink">
                  {h.kind === "custom" ? h.title : t(`habits.${h.kind}` as MessageKey)}
                  {h.targetValue && h.unit ? ` · ${h.targetValue} ${t(`habits.units.${h.unit}`)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </>
  );
}
