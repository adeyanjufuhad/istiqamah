import type { Metadata } from "next";
import Link from "next/link";
import { ThemePicker } from "@/components/theme";
import { Button, buttonClass, Card, ScholarNote } from "@/components/ui";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import { DeleteAccount } from "./delete-account";

export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user } = await requireOnboardedUser(locale);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("settings.appearance")}</h2>
        <ThemePicker />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("settings.profile")}</h2>
        <Link href={`/${locale}/onboarding?edit=1`} className={buttonClass("secondary")}>
          {t("settings.editProfile")}
        </Link>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">{t("settings.yourData")}</h2>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">{t("settings.exportTitle")}</h3>
          <p className="text-sm text-muted">{t("settings.exportBody")}</p>
          <a href="/api/account/export" download className={buttonClass("secondary", "self-start")}>
            {t("settings.exportButton")}
          </a>
        </div>
        <hr className="border-border" />
        <DeleteAccount />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("settings.account")}</h2>
        <p className="text-sm text-muted">{t("settings.signedInAs", { email: user.email })}</p>
        <form method="post" action="/api/account/sign-out">
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="secondary" className="w-full">
            {t("auth.signOut")}
          </Button>
        </form>
      </Card>

      <nav className="flex gap-5 text-sm" aria-label={t("settings.about")}>
        <Link href={`/${locale}/about`} className="underline underline-offset-4">
          {t("settings.about")}
        </Link>
        <Link href={`/${locale}/privacy`} className="underline underline-offset-4">
          {t("settings.privacy")}
        </Link>
      </nav>
      <ScholarNote text={t("scholar.note")} />
    </>
  );
}
