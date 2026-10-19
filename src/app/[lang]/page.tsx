import Link from "next/link";
import { Suspense } from "react";
import { DeletedNotice } from "@/components/deleted-notice";
import { LogoMark } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { buttonClass } from "@/components/ui";
import { getLocale, getT } from "@/i18n/server";

export default async function Landing() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const points = [
    { title: t("landing.point1Title"), body: t("landing.point1Body") },
    { title: t("landing.point2Title"), body: t("landing.point2Body") },
    { title: t("landing.point3Title"), body: t("landing.point3Body") },
  ];

  return (
    <>
      <main id="main" className="mx-auto flex w-full max-w-xl flex-col gap-10 px-5 pb-6 pt-10 sm:pt-16">
        <div className="flex items-center gap-3">
          <LogoMark className="size-11" />
          <span className="text-xl font-bold tracking-tight">{t("app.name")}</span>
        </div>

        <Suspense>
          <DeletedNotice />
        </Suspense>

        <section className="flex flex-col gap-5">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
            {t("landing.headline")}
          </h1>
          <p className="text-lg leading-relaxed text-muted">{t("landing.body")}</p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href={`/${locale}/auth/sign-in`} className={buttonClass("primary", "sm:px-8")}>
              {t("landing.cta")}
            </Link>
            <Link href={`/${locale}/auth/sign-in`} className={buttonClass("ghost")}>
              {t("landing.haveAccount")}
            </Link>
          </div>
        </section>

        <ul className="grid gap-3">
          {points.map((p) => (
            <li key={p.title} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <h2 className="font-semibold">{p.title}</h2>
              <p className="mt-1 text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
