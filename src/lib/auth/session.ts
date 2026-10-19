import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Locale } from "@/i18n/config";
import { schema, withUser } from "@/lib/db";
import { auth } from "./server";

export type SessionUser = { id: string; email: string; name: string | null };

/** The verified session user, or null. Reads cookies, so call at request time. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Mark the render as request-time before the SDK touches cookies, so
  // prerendering stops here instead of logging a rejected cookies() read.
  await connection();
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name ?? null };
}

export async function requireUser(locale: Locale): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/sign-in`);
  return user;
}

export async function getProfile(userId: string) {
  return withUser(userId, async (tx) => {
    const [profile] = await tx.select().from(schema.profiles).where(eq(schema.profiles.id, userId));
    return profile ?? null;
  });
}

/** Signed-in user who has finished onboarding; otherwise redirects. */
export async function requireOnboardedUser(locale: Locale) {
  const user = await requireUser(locale);
  const profile = await getProfile(user.id);
  if (!profile?.onboardedAt) redirect(`/${locale}/onboarding`);
  return { user, profile };
}
