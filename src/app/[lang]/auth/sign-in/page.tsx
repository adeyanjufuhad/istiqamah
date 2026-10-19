import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { getLocale, getT } from "@/i18n/server";
import { getSessionUser } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

// Reads the session cookie: blocks on the server instead of prerendering.
export const instant = false;

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  if (await getSessionUser()) redirect(`/${locale}/today`);

  return (
    <>
      <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 pb-6 pt-10 sm:pt-16">
        <Link href={`/${locale}`} className="flex w-fit items-center gap-3 rounded-xl">
          <LogoMark className="size-10" />
          <span className="text-lg font-bold">{t("app.name")}</span>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("auth.signInTitle")}</h1>
          <p className="leading-relaxed text-muted">{t("auth.signInBody")}</p>
        </div>
        <SignInForm />
      </main>
      <SiteFooter />
    </>
  );
}
