import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { getLocale, getT } from "@/i18n/server";
import { getProfile, requireUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/safe-next";
import { OnboardingForm } from "./onboarding-form";

export const instant = false;

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage({ searchParams }: PageProps<"/[lang]/onboarding">) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const user = await requireUser(locale);
  const profile = await getProfile(user.id);
  const sp = await searchParams;
  const editing = sp.edit === "1";
  const next = safeNext(sp.next, locale);

  if (profile?.onboardedAt && !editing) redirect(next ?? `/${locale}/today`);

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-12 pt-8">
      <div className="flex items-center gap-3">
        <LogoMark className="size-9" />
        <h1 className="text-lg font-bold">{editing ? t("settings.editProfile") : t("onboarding.title")}</h1>
      </div>
      <OnboardingForm
        mode={editing && profile ? "edit" : "setup"}
        nextPath={next}
        initial={{
          displayName: profile?.displayName ?? user.name ?? "",
          timezone: profile?.timezone ?? null,
          latitude: profile?.latitude ?? null,
          longitude: profile?.longitude ?? null,
          city: profile?.city ?? "",
          country: profile?.country ?? "",
          calcMethod: profile?.calcMethod ?? null,
          asrSchool: (profile?.asrSchool ?? 0) as 0 | 1,
        }}
      />
    </main>
  );
}
