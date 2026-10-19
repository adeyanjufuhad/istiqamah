import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, enabledLocales, isLocale, locales, type Locale } from "@/i18n/config";
import { auth } from "@/lib/auth/server";

/** First path segment (after the locale) that requires a signed-in user. */
const PROTECTED = new Set(["today", "week", "circles", "settings", "onboarding"]);

const guards = Object.fromEntries(
  locales.map((l) => [l, auth.middleware({ loginUrl: `/${l}/auth/sign-in` })]),
) as Record<Locale, (req: NextRequest) => Promise<NextResponse>>;

function preferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie) && enabledLocales.includes(cookie)) return cookie;
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (tag && isLocale(tag) && enabledLocales.includes(tag)) return tag;
  }
  return defaultLocale;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, first = "", second = ""] = pathname.split("/");

  if (!isLocale(first)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Optimistic check + session refresh. Pages still verify the session server-side.
  // Also run it wherever a sign-in callback lands (e.g. an invite link): the SDK
  // completes Google / magic-link sign-in by exchanging this verifier in middleware.
  if (PROTECTED.has(second) || req.nextUrl.searchParams.has("neon_auth_session_verifier")) return guards[first](req);

  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals, metadata images and any file with an extension (sw.js, icons, manifest).
  matcher: ["/((?!api|_next|apple-icon|.*\\..*).*)"],
};
