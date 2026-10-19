import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Duas from Hisn al-Muslim (Fortress of the Muslim, Sa'id ibn Wahf al-Qahtani),
 * fetched from the hisnmuslim.com API and shown exactly as published.
 * Never write or paraphrase dua text here; only reference it by chapter + item id.
 */
import { ENCOURAGEMENT_DUAS, type HisnDua, type HisnRef } from "./hisn-shared";

export { duaKey, ENCOURAGEMENT_DUAS, parseDuaKey, type HisnDua, type HisnRef } from "./hisn-shared";

type ChapterJson = Record<string, { ID: number; ARABIC_TEXT: string; TRANSLATED_TEXT: string }[]>;

async function fetchChapter(chapter: number) {
  "use cache";
  cacheLife("weeks");
  cacheTag("hisn");
  const res = await fetch(`https://www.hisnmuslim.com/api/en/${chapter}.json`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`hisnmuslim ${res.status}`);
  // The API serves JSON with a UTF-8 BOM.
  const json = JSON.parse((await res.text()).replace(/^﻿/, "")) as ChapterJson;
  const [title, items] = Object.entries(json)[0] ?? [];
  if (!title || !items) throw new Error("hisnmuslim: unexpected shape");
  return {
    title: title.trim(),
    items: items.map((i) => ({ id: i.ID, arabic: i.ARABIC_TEXT.trim(), translation: i.TRANSLATED_TEXT.trim() })),
  };
}

export async function getHisnDua(ref: HisnRef): Promise<HisnDua | null> {
  try {
    const chapter = await fetchChapter(ref.chapter);
    const item = chapter.items.find((i) => i.id === ref.item);
    if (!item) return null;
    return {
      ...ref,
      chapterTitle: chapter.title,
      arabic: item.arabic,
      translation: item.translation,
      sourceUrl: "https://www.hisnmuslim.com/i/en/" + ref.chapter,
    };
  } catch (err) {
    console.warn("[hisn] unavailable", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getEncouragementDuas(): Promise<HisnDua[]> {
  const all = await Promise.all(ENCOURAGEMENT_DUAS.map(getHisnDua));
  return all.filter((d): d is HisnDua => d !== null);
}
