"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/i18n/config";
import { getSessionUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";
import { habitsForChoices, ONBOARDING_CHOICES, QURAN_UNITS } from "@/lib/habits/defaults";
import { METHOD_IDS } from "@/lib/prayer/methods";
import { safeNext } from "@/lib/safe-next";

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const Input = z.object({
  locale: z.string().refine(isLocale),
  mode: z.enum(["setup", "edit"]),
  displayName: z.string().trim().min(1).max(60),
  timezone: z.string().max(64).refine(isTimeZone),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  city: z.string().trim().max(80).nullable(),
  country: z.string().trim().max(80).nullable(),
  calcMethod: z.number().int().refine((n) => METHOD_IDS.includes(n)),
  asrSchool: z.union([z.literal(0), z.literal(1)]),
  habits: z.array(z.enum(ONBOARDING_CHOICES)).max(ONBOARDING_CHOICES.length),
  quranTarget: z.number().int().min(1).max(600),
  quranUnit: z.enum(QURAN_UNITS),
  next: z.string().max(200).nullable().optional(),
});

export type OnboardingInput = z.input<typeof Input>;

export async function saveOnboarding(raw: OnboardingInput): Promise<{ error: string } | void> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { error: "invalid" };
  const data = parsed.data;
  if (!isLocale(data.locale)) return { error: "invalid" };

  const user = await getSessionUser();
  if (!user) redirect(`/${data.locale}/auth/sign-in`);

  const profile = {
    displayName: data.displayName,
    timezone: data.timezone,
    latitude: data.latitude === null ? null : round2(data.latitude),
    longitude: data.longitude === null ? null : round2(data.longitude),
    city: data.city || null,
    country: data.country || null,
    calcMethod: data.calcMethod,
    asrSchool: data.asrSchool,
    locale: data.locale,
  };

  await withUser(user.id, async (tx) => {
    await tx
      .insert(schema.profiles)
      .values({ id: user.id, ...profile, onboardedAt: new Date() })
      .onConflictDoUpdate({ target: schema.profiles.id, set: profile });

    if (data.mode === "setup") {
      const rows = habitsForChoices(data.habits, { target: data.quranTarget, unit: data.quranUnit });
      if (rows.length) {
        // Re-running setup never duplicates built-in habits (unique per user + kind).
        await tx
          .insert(schema.habits)
          .values(rows.map((h) => ({ ...h, userId: user.id })))
          .onConflictDoNothing();
      }
    }
  });

  const next = safeNext(data.next, data.locale);
  redirect(next ?? `/${data.locale}/${data.mode === "edit" ? "settings" : "today"}`);
}
