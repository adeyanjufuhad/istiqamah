import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = { title: "Circles" };

export default async function CirclesPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  await requireOnboardedUser(locale);
  return <ComingSoon title={t("nav.circles")} body={t("placeholder.circles")} />;
}
