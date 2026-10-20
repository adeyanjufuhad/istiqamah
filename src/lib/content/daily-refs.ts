/*
 * Reference lists for the daily content. References only, never text:
 * text is always fetched from the source (see daily.ts). Vetted 2026-10-19;
 * `npm run content:check` re-verifies that every reference resolves.
 */

/** surah:ayah references (alquran.cloud). */
export const AYAH_REFS = [
  "2:45", "2:152", "2:153", "2:155", "2:186", "2:201", "2:286", "3:8", "3:139", "3:173", "3:191", "3:200",
  "6:162", "7:23", "7:56", "7:205", "9:129", "11:112", "11:115", "12:87", "13:28", "14:7", "16:97", "16:128",
  "18:46", "20:14", "20:114", "23:118", "25:63", "25:74", "28:24", "29:45", "29:69", "33:41", "39:10", "39:53",
  "40:60", "41:30", "46:13", "47:7", "50:16", "51:56", "59:18", "64:16", "65:3", "93:3", "94:5", "94:6",
] as const;

/**
 * Forty Hadith of an-Nawawi, restricted to narrations an-Nawawi attributes to
 * Sahih al-Bukhari and/or Sahih Muslim, so the grade "Sahih" follows from the
 * source itself. Hasan or otherwise-graded entries are deliberately excluded.
 */
export const NAWAWI_SAHIH: readonly { n: number; source: "Bukhari & Muslim" | "Muslim" | "Al-Bukhari" }[] = [
  { n: 1, source: "Bukhari & Muslim" }, { n: 2, source: "Muslim" }, { n: 3, source: "Bukhari & Muslim" },
  { n: 4, source: "Bukhari & Muslim" }, { n: 6, source: "Bukhari & Muslim" }, { n: 7, source: "Muslim" },
  { n: 8, source: "Bukhari & Muslim" }, { n: 9, source: "Bukhari & Muslim" }, { n: 10, source: "Muslim" },
  { n: 13, source: "Muslim" }, { n: 14, source: "Muslim" }, { n: 15, source: "Muslim" },
  { n: 16, source: "Al-Bukhari" }, { n: 17, source: "Muslim" }, { n: 20, source: "Al-Bukhari" },
  { n: 21, source: "Muslim" }, { n: 22, source: "Muslim" }, { n: 23, source: "Muslim" },
  { n: 24, source: "Muslim" }, { n: 25, source: "Muslim" }, { n: 26, source: "Muslim" },
  { n: 34, source: "Muslim" }, { n: 35, source: "Muslim" }, { n: 37, source: "Muslim" },
  { n: 38, source: "Al-Bukhari" }, { n: 40, source: "Al-Bukhari" },
];

/** Hisn al-Muslim chapter → item ids suitable for any day. */
export const DUA_POOL: readonly { chapter: number; item: number }[] = [
  ...Array.from({ length: 24 }, (_, i) => ({ chapter: 27, item: 75 + i })), // morning & evening remembrance
  { chapter: 34, item: 120 },
  { chapter: 34, item: 121 },
  { chapter: 43, item: 139 },
  { chapter: 46, item: 144 },
  ...Array.from({ length: 6 }, (_, i) => ({ chapter: 129, item: 248 + i })), // repentance
  { chapter: 131, item: 266 },
];
