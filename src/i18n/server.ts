import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import en from "./dictionaries/en.json";
import { createTranslator, mergeDictionary, type Dictionary } from "./translate";

const partials: Record<Locale, () => Promise<unknown>> = {
  en: async () => ({}),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
};

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!value || !isLocale(value)) notFound();
  return value;
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const l = locale ?? (await getLocale());
  return mergeDictionary(en, await partials[l]());
}

export async function getT() {
  return createTranslator(await getDictionary());
}
