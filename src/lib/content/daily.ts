import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ISODate } from "@/lib/dates";
import { AYAH_REFS, DUA_POOL, NAWAWI_SAHIH } from "./daily-refs";
import { fetchChapter } from "./hisn";

/*
 * Ayah, hadith and dua of the day.
 *
 * Hard rule: no religious text is written here. These lists hold *references*
 * only; the text is fetched from the established source and shown with its
 * reference. Lists were vetted on 2026-10-19 by fetching each reference.
 * Everyone sees the same item on the same calendar date.
 */

const dayNumber = (date: ISODate) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
const pick = <T,>(list: readonly T[], date: ISODate, salt: number) => list[(dayNumber(date) * 7 + salt) % list.length];

/* ------------------------------------------------------------------- ayah */

export type Ayah = {
  surah: number;
  ayah: number;
  surahName: string;
  surahNameArabic: string;
  arabic: string;
  translation: string;
  translator: string;
  url: string;
};

type QuranEdition = {
  text: string;
  numberInSurah: number;
  surah: { number: number; englishName: string; name: string };
  edition: { identifier: string; englishName: string };
};

async function fetchAyah(ref: string): Promise<Ayah> {
  "use cache";
  cacheLife("max");
  cacheTag("quran");
  const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.sahih`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`alquran.cloud ${res.status}`);
  const body = (await res.json()) as { code: number; data: QuranEdition[] };
  const ar = body.data.find((e) => e.edition.identifier === "quran-uthmani");
  const en = body.data.find((e) => e.edition.identifier === "en.sahih");
  if (body.code !== 200 || !ar || !en) throw new Error("alquran.cloud: unexpected shape");
  return {
    surah: ar.surah.number,
    ayah: ar.numberInSurah,
    surahName: ar.surah.englishName,
    surahNameArabic: ar.surah.name,
    arabic: ar.text,
    translation: en.text,
    translator: en.edition.englishName,
    url: `https://quran.com/${ar.surah.number}/${ar.numberInSurah}`,
  };
}

/* ----------------------------------------------------------------- hadith */

export type Hadith = {
  collection: string;
  number: number;
  source: string;
  grade: "Sahih";
  arabic: string;
  english: string;
  url: string;
};

const HADITH_MIRRORS = [
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions",
  "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions",
];

async function fetchHadithText(edition: string, n: number): Promise<string> {
  let lastError: unknown;
  for (const base of HADITH_MIRRORS) {
    try {
      const res = await fetch(`${base}/${edition}/${n}.json`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`hadith-api ${res.status}`);
      const body = (await res.json()) as { hadiths: { hadithnumber: number; text: string }[] };
      const h = body.hadiths.find((x) => x.hadithnumber === n);
      if (!h?.text) throw new Error("hadith-api: missing text");
      return h.text.trim();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function fetchHadith(n: number, source: string): Promise<Hadith> {
  "use cache";
  cacheLife("max");
  cacheTag("hadith");
  const [english, arabic] = await Promise.all([fetchHadithText("eng-nawawi", n), fetchHadithText("ara-nawawi", n)]);
  return {
    collection: "Forty Hadith of an-Nawawi",
    number: n,
    source,
    grade: "Sahih",
    arabic,
    // The trailing "[Muslim]" etc. is shown as structured metadata instead.
    english: english.replace(/\s*\[[^\]]*\]\s*$/, ""),
    url: `https://sunnah.com/nawawi40:${n}`,
  };
}

/* -------------------------------------------------------------------- dua */

export type DailyDua = {
  chapter: number;
  item: number;
  chapterTitle: string;
  arabic: string;
  translation: string;
  sourceUrl: string;
};

/* ------------------------------------------------------------------ public */

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[daily] ${label} unavailable`, err instanceof Error ? err.message : err);
    return null;
  }
}

export function getAyahOfDay(date: ISODate) {
  return safe("ayah", () => fetchAyah(pick(AYAH_REFS, date, 0)));
}

export function getHadithOfDay(date: ISODate) {
  const h = pick(NAWAWI_SAHIH, date, 3);
  return safe("hadith", () => fetchHadith(h.n, h.source));
}

export function getDuaOfDay(date: ISODate): Promise<DailyDua | null> {
  const ref = pick(DUA_POOL, date, 5);
  return safe("dua", async () => {
    const chapter = await fetchChapter(ref.chapter);
    const item = chapter.items.find((i) => i.id === ref.item);
    if (!item) throw new Error(`hisn item ${ref.item} missing`);
    return {
      ...ref,
      chapterTitle: chapter.title,
      arabic: item.arabic,
      translation: item.translation,
      sourceUrl: `https://www.hisnmuslim.com/i/en/${ref.chapter}`,
    };
  });
}
