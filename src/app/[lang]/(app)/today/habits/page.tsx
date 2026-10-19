import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";
import { ManageHabits } from "./manage-habits";

export const instant = false;

export const metadata: Metadata = { title: "Manage habits" };

export default async function ManageHabitsPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user } = await requireOnboardedUser(locale);
  const habits = await withUser(user.id, (tx) =>
    tx
      .select({
        id: schema.habits.id,
        kind: schema.habits.kind,
        title: schema.habits.title,
        targetValue: schema.habits.targetValue,
        unit: schema.habits.unit,
        isActive: schema.habits.isActive,
        shareWithCircles: schema.habits.shareWithCircles,
      })
      .from(schema.habits)
      .where(eq(schema.habits.userId, user.id))
      .orderBy(asc(schema.habits.position), asc(schema.habits.createdAt)),
  );

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("manage.title")}</h1>
        <p className="leading-relaxed text-muted">{t("manage.intro")}</p>
      </header>
      <ManageHabits habits={habits} />
    </>
  );
}
