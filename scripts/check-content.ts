/**
 * Verifies that every curated reference still resolves at its source, and that
 * each Nawawi hadith still carries the source we label it with.
 *
 *   npm run content:check
 */
import { AYAH_REFS, DUA_POOL, NAWAWI_SAHIH } from "../src/lib/content/daily-refs";
import { ENCOURAGEMENT_DUAS } from "../src/lib/content/hisn-shared";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return JSON.parse((await res.text()).replace(/^﻿/, "")) as T;
}

async function main() {
  console.log(`Quran (${AYAH_REFS.length} ayat)`);
  for (const ref of AYAH_REFS) {
    try {
      const body = await json<{ data: { text: string; edition: { identifier: string } }[] }>(
        `https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.sahih`,
      );
      if (body.data.length !== 2 || body.data.some((e) => !e.text)) fail(`${ref}: missing text`);
    } catch (e) {
      fail(`${ref}: ${(e as Error).message}`);
    }
  }

  console.log(`Hadith (${NAWAWI_SAHIH.length} from an-Nawawi)`);
  for (const { n, source } of NAWAWI_SAHIH) {
    try {
      const path = `eng-nawawi/${n}.json`;
      // Same mirrors as the app: jsDelivr first, raw GitHub if the CDN hiccups.
      const body = await json<{ hadiths: { text: string }[] }>(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${path}`).catch(() =>
        json<{ hadiths: { text: string }[] }>(`https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/${path}`),
      );
      const tag = /\[([^\]]*)\]\s*$/.exec(body.hadiths[0]?.text ?? "")?.[1];
      if (tag !== source) fail(`#${n}: labelled "${source}" but source says "${tag}"`);
    } catch (e) {
      fail(`#${n}: ${(e as Error).message}`);
    }
  }

  const chapters = new Map<number, Set<number>>();
  for (const { chapter, item } of [...DUA_POOL, ...ENCOURAGEMENT_DUAS]) {
    if (!chapters.has(chapter)) chapters.set(chapter, new Set());
    chapters.get(chapter)!.add(item);
  }
  console.log(`Hisn al-Muslim (${chapters.size} chapters)`);
  for (const [chapter, items] of chapters) {
    try {
      const body = await json<Record<string, { ID: number; ARABIC_TEXT: string }[]>>(
        `https://www.hisnmuslim.com/api/en/${chapter}.json`,
      );
      const found = new Set(Object.values(body)[0].filter((i) => i.ARABIC_TEXT).map((i) => i.ID));
      for (const item of items) if (!found.has(item)) fail(`chapter ${chapter} item ${item} missing`);
    } catch (e) {
      fail(`chapter ${chapter}: ${(e as Error).message}`);
    }
  }

  console.log(failures ? `\n${failures} problem(s).` : "\nAll content references resolve.");
  process.exitCode = failures ? 1 : 0;
}

main();
