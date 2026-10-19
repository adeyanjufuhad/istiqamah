import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { buttonClass, Card } from "@/components/ui";
import { getLocale, getT } from "@/i18n/server";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { JoinButton } from "./join-button";

export const instant = false;

export const metadata: Metadata = { title: "Join a circle" };

export default async function JoinPage({ params }: PageProps<"/[lang]/join/[code]">) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const code = (await params).code.toUpperCase();
  const here = `/${locale}/join/${encodeURIComponent(code)}`;

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=${encodeURIComponent(here)}`);
  const profile = await getProfile(user.id);
  if (!profile?.onboardedAt) redirect(`/${locale}/onboarding?next=${encodeURIComponent(here)}`);

  const valid = /^[A-Z0-9]{6,12}$/.test(code);
  const preview = valid
    ? (
        await withUser(user.id, (tx) =>
          tx.execute<{ name: string; member_count: number; max_members: number; is_member: boolean }>(
            sql`select * from app.circle_preview(${code})`,
          ),
        )
      ).rows[0]
    : undefined;

  return (
    <main id="main" className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <LogoMark className="size-12" />
      {preview ? (
        <Card className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{t("circles.joinPageTitle")}</h1>
          <p className="leading-relaxed text-muted">{t("circles.joinPageBody", { name: preview.name, count: preview.member_count })}</p>
          {preview.is_member ? (
            <>
              <p className="text-sm font-medium text-primary">{t("circles.joinAlready")}</p>
              <Link href={`/${locale}/circles`} className={buttonClass("primary")}>
                {t("circles.open")}
              </Link>
            </>
          ) : preview.member_count >= preview.max_members ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {t("circles.errorFull")}
            </p>
          ) : (
            <JoinButton code={code} />
          )}
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <p role="alert" className="leading-relaxed">
            {t("circles.invalidInvite")}
          </p>
          <Link href={`/${locale}/circles`} className={buttonClass("secondary")}>
            {t("circles.back")}
          </Link>
        </Card>
      )}
    </main>
  );
}
