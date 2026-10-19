import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { getPage } from "@/content/pages";
import { getLocale, getT } from "@/i18n/server";

export async function ProsePage({ page }: { page: "privacy" | "about" }) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const content = getPage(locale, page);

  return (
    <>
      <main id="main" className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 pb-6 pt-8">
        <Link href={`/${locale}`} className="flex w-fit items-center gap-3 rounded-xl">
          <LogoMark className="size-9" />
          <span className="font-bold">{t("app.name")}</span>
        </Link>
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
          <p className="text-lg leading-relaxed text-muted">{content.intro}</p>
          {content.updated && <p className="text-sm text-muted">{content.updated}</p>}
        </header>
        {content.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="leading-relaxed">
                {p}
              </p>
            ))}
            {s.items && (
              <ul className="flex list-disc flex-col gap-2 ps-5 leading-relaxed marker:text-primary">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
