import type { Locale } from "@/i18n/config";

/**
 * Accepts only same-site, in-locale paths (e.g. "/en/join/K7MR2XQ9") so a
 * `next` parameter can never become an open redirect.
 */
export function safeNext(value: unknown, locale: Locale): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith(`/${locale}/`) || value.startsWith("//") || value.includes("\\")) return null;
  if (!/^\/[a-z]{2}\/[A-Za-z0-9/_-]*$/.test(value)) return null;
  return value;
}
