/**
 * Client-safe parts of the Hisn al-Muslim integration (types and message keys).
 * Fetching lives in hisn.ts (server only).
 */
export type HisnRef = { chapter: number; item: number };

export type HisnDua = HisnRef & {
  chapterTitle: string;
  arabic: string;
  translation: string;
  sourceUrl: string;
};

/** Curated for encouragement between friends; ids verified against the API on 2026-10-19. */
export const ENCOURAGEMENT_DUAS: readonly HisnRef[] = [
  { chapter: 43, item: 139 }, // when something becomes difficult
  { chapter: 34, item: 120 }, // worry and grief
  { chapter: 49, item: 147 }, // visiting the sick
  { chapter: 89, item: 200 }, // for one who loves you for the sake of Allah
  { chapter: 87, item: 198 }, // for someone who does good to you
];

export const duaKey = (r: HisnRef) => `dua.hisn.${r.chapter}.${r.item}`;

export function parseDuaKey(key: string): HisnRef | null {
  const m = /^dua\.hisn\.(\d+)\.(\d+)$/.exec(key);
  if (!m) return null;
  const ref = { chapter: Number(m[1]), item: Number(m[2]) };
  return ENCOURAGEMENT_DUAS.some((d) => d.chapter === ref.chapter && d.item === ref.item) ? ref : null;
}
