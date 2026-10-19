import Link from "next/link";
import { getLocale, getT } from "@/i18n/server";

export async function SiteFooter() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  return (
    <footer className="mx-auto w-full max-w-xl px-5 pb-10 pt-6 text-sm text-muted">
      <p className="mb-3 leading-relaxed">{t("scholar.note")}</p>
      <nav aria-label="Footer" className="flex gap-5">
        <Link href={`/${locale}/privacy`} className="underline underline-offset-4 hover:text-ink">
          {t("footer.privacy")}
        </Link>
        <Link href={`/${locale}/about`} className="underline underline-offset-4 hover:text-ink">
          {t("footer.about")}
        </Link>
      </nav>
    </footer>
  );
}
