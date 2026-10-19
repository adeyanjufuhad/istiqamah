import type { HisnDua } from "@/lib/content/hisn-shared";

/** Renders a dua exactly as published, always with its source reference. */
export function DuaBlock({ dua, compact = false }: { dua: HisnDua; compact?: boolean }) {
  return (
    <figure className="flex flex-col gap-2">
      <blockquote className="flex flex-col gap-2">
        <p lang="ar" dir="rtl" className={`font-arabic leading-loose text-ink ${compact ? "text-lg" : "text-xl"}`}>
          {dua.arabic}
        </p>
        <p className="text-sm leading-relaxed text-muted">{dua.translation}</p>
      </blockquote>
      <figcaption className="text-xs font-medium text-muted">
        <a href={dua.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-ink">
          Hisn al-Muslim · {dua.chapterTitle} · #{dua.item}
        </a>
      </figcaption>
    </figure>
  );
}
