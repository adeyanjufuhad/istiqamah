import { getT } from "@/i18n/server";
import { getAyahOfDay, getDuaOfDay, getHadithOfDay } from "@/lib/content/daily";
import type { ISODate } from "@/lib/dates";

/*
 * Daily religious content. Every item is fetched from its source and always
 * shows its reference; nothing here is written or paraphrased by the app.
 */

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-[var(--radius-card)] bg-white/60 p-1.5 ring-1 ring-navy-950/5">
      <div className="flex flex-col gap-4 rounded-[calc(var(--radius-card)-6px)] bg-surface p-5 shadow-[inset_0_1px_0_white] sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ocean-600">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Unavailable({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-sky-100 underline-offset-4 hover:text-ink hover:decoration-primary">
      {children}
    </a>
  );
}

export async function AyahCard({ date }: { date: ISODate }) {
  const [t, ayah] = await Promise.all([getT(), getAyahOfDay(date)]);
  return (
    <Shell title={t("daily.ayahTitle")}>
      {ayah ? (
        <figure className="flex flex-col gap-4">
          <blockquote className="flex flex-col gap-3">
            <p lang="ar" dir="rtl" className="font-arabic text-2xl leading-[2.1] text-navy-950 sm:text-[1.7rem]">
              {ayah.arabic}
            </p>
            <p className="text-base leading-relaxed text-ink">{ayah.translation}</p>
          </blockquote>
          <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-medium text-muted">
            <span>
              {t("daily.ayahRef", { surah: ayah.surahName, surahNumber: ayah.surah, ayah: ayah.ayah })}
              <span aria-hidden="true"> · </span>
              {t("daily.translation", { name: ayah.translator })}
            </span>
            <SourceLink href={ayah.url}>{t("daily.readOn", { site: "Quran.com" })}</SourceLink>
          </figcaption>
        </figure>
      ) : (
        <Unavailable text={t("daily.unavailable")} />
      )}
    </Shell>
  );
}

export async function HadithCard({ date }: { date: ISODate }) {
  const [t, hadith] = await Promise.all([getT(), getHadithOfDay(date)]);
  return (
    <Shell title={t("daily.hadithTitle")}>
      {hadith ? (
        <figure className="flex flex-col gap-3">
          <blockquote>
            <p className="text-base leading-relaxed text-ink">{hadith.english}</p>
          </blockquote>
          <details className="group rounded-2xl bg-surface-2 px-4 py-2">
            <summary className="min-h-10 cursor-pointer list-none py-2 text-sm font-semibold text-primary marker:hidden">
              {t("daily.showArabic")}
            </summary>
            <p lang="ar" dir="rtl" className="pb-2 font-arabic text-lg leading-loose text-ink">
              {hadith.arabic}
            </p>
          </details>
          <figcaption className="flex flex-col gap-1 text-xs font-medium text-muted">
            <span className="font-semibold text-ink">{t("daily.hadithMeta", { collection: hadith.collection, number: hadith.number })}</span>
            <span>
              {t("daily.hadithSource", { source: hadith.source })}
              <span aria-hidden="true"> · </span>
              {t("daily.grade", { grade: hadith.grade })}
            </span>
            <SourceLink href={hadith.url}>{t("daily.readOn", { site: "Sunnah.com" })}</SourceLink>
          </figcaption>
        </figure>
      ) : (
        <Unavailable text={t("daily.unavailable")} />
      )}
    </Shell>
  );
}

export async function DuaCard({ date }: { date: ISODate }) {
  const [t, dua] = await Promise.all([getT(), getDuaOfDay(date)]);
  return (
    <Shell title={t("daily.duaTitle")}>
      {dua ? (
        <figure className="flex flex-col gap-3">
          <blockquote className="flex flex-col gap-3">
            <p lang="ar" dir="rtl" className="font-arabic text-xl leading-loose text-navy-950">
              {dua.arabic}
            </p>
            <p className="text-sm leading-relaxed text-muted">{dua.translation}</p>
          </blockquote>
          <figcaption className="text-xs font-medium text-muted">
            <SourceLink href={dua.sourceUrl}>{t("daily.duaRef", { chapter: dua.chapterTitle, item: dua.item })}</SourceLink>
          </figcaption>
        </figure>
      ) : (
        <Unavailable text={t("daily.unavailable")} />
      )}
    </Shell>
  );
}

export function DailySkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="rounded-[var(--radius-card)] bg-surface p-6 ring-1 ring-border">
      <div className="flex flex-col gap-3">
        <span className="h-3 w-28 animate-pulse rounded-full bg-sky-50" />
        <span className="h-6 w-full animate-pulse rounded-full bg-surface-2" />
        <span className="h-6 w-4/5 animate-pulse rounded-full bg-surface-2" />
        <span className="h-4 w-2/3 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
