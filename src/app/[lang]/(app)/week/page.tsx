import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = { title: "Week" };

export default async function WeekPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  await requireOnboardedUser(locale);
  return <ComingSoon title={t("nav.week")} body={t("placeholder.week")} />;
}
