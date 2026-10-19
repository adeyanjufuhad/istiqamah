import type en from "./dictionaries/en.json";

export type Dictionary = typeof en;

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
// Arrays (e.g. rotating headline words) are read from the dictionary directly, not via t().
type Paths<T> = T extends string
  ? never
  : T extends readonly unknown[]
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T & string];

export type MessageKey = Paths<Dictionary>;
export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

/** Deep-merges a partial translation over English so missing keys fall back. */
export function mergeDictionary(base: Dictionary, partial: unknown): Dictionary {
  if (!partial || typeof partial !== "object") return base;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(partial as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && v && typeof v === "object" ? mergeDictionary(b as Dictionary, v) : v;
  }
  return out as Dictionary;
}

export function createTranslator(dict: Dictionary): Translate {
  return (key, values) => {
    let node: unknown = dict;
    for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
    let text = typeof node === "string" ? node : key;
    if (values) for (const [k, v] of Object.entries(values)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };
}
