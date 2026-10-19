"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/i18n/config";
import { getSessionUser } from "@/lib/auth/session";
import { isNudgePreset } from "@/lib/circles/nudges";
import { parseDuaKey } from "@/lib/content/hisn";
import { schema, withUser } from "@/lib/db";

type Result = { ok?: number; error?: string } | null;

async function requireUserId() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user.id;
}

const localeOf = (v: FormDataEntryValue | null) => {
  const l = String(v ?? "");
  return isLocale(l) ? l : "en";
};

function refresh(circleId?: string) {
  revalidatePath("/[lang]/circles", "page");
  if (circleId) revalidatePath("/[lang]/circles/[id]", "page");
}

/** Postgres error codes raised by our functions/triggers (see db/migrations). */
function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

/* --------------------------------------------------------------- circles */

const NewCircle = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(280).optional(),
});

export async function createCircle(_prev: Result, formData: FormData): Promise<Result> {
  const parsed = NewCircle.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: "invalid" };
  const userId = await requireUserId();
  const [circle] = await withUser(userId, (tx) =>
    tx
      .insert(schema.circles)
      .values({ name: parsed.data.name, description: parsed.data.description ?? null, createdBy: userId })
      .returning({ id: schema.circles.id }),
  );
  redirect(`/${localeOf(formData.get("locale"))}/circles/${circle.id}`);
}

export async function joinCircle(_prev: Result, formData: FormData): Promise<Result> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(code)) return { error: "invalid-code" };
  const userId = await requireUserId();
  let circleId: string;
  try {
    const rows = await withUser(userId, (tx) =>
      tx.execute<{ id: string }>(sql`select app.join_circle(${code}) as id`),
    );
    circleId = rows.rows[0].id;
  } catch (err) {
    const code = pgCode(err);
    if (code === "P0002") return { error: "invalid-code" };
    if (code === "P0001") return { error: "full" };
    throw err;
  }
  redirect(`/${localeOf(formData.get("locale"))}/circles/${circleId}`);
}

export async function leaveCircle(formData: FormData) {
  const circleId = z.uuid().parse(formData.get("circleId"));
  const userId = await requireUserId();
  await withUser(userId, (tx) =>
    tx
      .delete(schema.circleMembers)
      .where(and(eq(schema.circleMembers.circleId, circleId), eq(schema.circleMembers.userId, userId))),
  );
  refresh();
  redirect(`/${localeOf(formData.get("locale"))}/circles`);
}

export async function removeMember(formData: FormData) {
  const circleId = z.uuid().parse(formData.get("circleId"));
  const memberId = z.uuid().parse(formData.get("memberId"));
  const userId = await requireUserId();
  // RLS: only owners can delete other members' rows.
  await withUser(userId, (tx) =>
    tx
      .delete(schema.circleMembers)
      .where(and(eq(schema.circleMembers.circleId, circleId), eq(schema.circleMembers.userId, memberId))),
  );
  refresh(circleId);
}

export async function newInviteCode(formData: FormData) {
  const circleId = z.uuid().parse(formData.get("circleId"));
  const userId = await requireUserId();
  await withUser(userId, (tx) =>
    tx.update(schema.circles).set({ inviteCode: sql`app.gen_invite_code()` }).where(eq(schema.circles.id, circleId)),
  );
  refresh(circleId);
}

export async function deleteCircle(formData: FormData) {
  const circleId = z.uuid().parse(formData.get("circleId"));
  const userId = await requireUserId();
  await withUser(userId, (tx) => tx.delete(schema.circles).where(eq(schema.circles.id, circleId)));
  refresh();
  redirect(`/${localeOf(formData.get("locale"))}/circles`);
}

/* ---------------------------------------------------------------- nudges */

const Nudge = z.object({ circleId: z.uuid(), recipientId: z.uuid(), messageKey: z.string().max(64) });

export async function sendNudge(input: z.input<typeof Nudge>): Promise<{ ok: boolean; error?: "limit" | "invalid" }> {
  const parsed = Nudge.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { circleId, recipientId, messageKey } = parsed.data;
  // Only vetted keys: our own preset copy, or a curated Hisn al-Muslim dua reference.
  const kind = isNudgePreset(messageKey) ? "nudge" : parseDuaKey(messageKey) ? "dua" : null;
  if (!kind) return { ok: false, error: "invalid" };
  const userId = await requireUserId();
  try {
    await withUser(userId, (tx) =>
      tx.insert(schema.nudges).values({ circleId, recipientId, senderId: userId, kind, messageKey }),
    );
  } catch (err) {
    if (pgCode(err) === "P0003") return { ok: false, error: "limit" };
    return { ok: false, error: "invalid" };
  }
  return { ok: true };
}

export async function markInboxRead() {
  const userId = await requireUserId();
  await withUser(userId, (tx) =>
    tx
      .update(schema.nudges)
      .set({ readAt: new Date() })
      .where(and(eq(schema.nudges.recipientId, userId), isNull(schema.nudges.readAt))),
  );
  refresh();
}

/* ----------------------------------------------------------------- khatm */

export async function startKhatm(formData: FormData) {
  const circleId = z.uuid().parse(formData.get("circleId"));
  const title = z.string().trim().max(80).parse(formData.get("title") ?? "");
  const userId = await requireUserId();
  try {
    await withUser(userId, (tx) =>
      tx.insert(schema.khatms).values({ circleId, title: title || null, createdBy: userId }),
    );
  } catch (err) {
    // 23505: someone else just started one (one active khatm per circle).
    if (pgCode(err) !== "23505") throw err;
  }
  refresh(circleId);
}

const JuzInput = z.object({ circleId: z.uuid(), khatmId: z.uuid(), juz: z.number().int().min(1).max(30) });

export async function claimJuz(input: z.input<typeof JuzInput>) {
  const { circleId, khatmId, juz } = JuzInput.parse(input);
  const userId = await requireUserId();
  try {
    await withUser(userId, (tx) => tx.insert(schema.khatmJuz).values({ khatmId, juz, userId }));
  } catch (err) {
    if (pgCode(err) !== "23505") throw err; // already claimed by someone else
  }
  refresh(circleId);
}

export async function setJuzRead(input: z.input<typeof JuzInput> & { read: boolean }) {
  const { circleId, khatmId, juz } = JuzInput.parse(input);
  const userId = await requireUserId();
  await withUser(userId, (tx) =>
    tx
      .update(schema.khatmJuz)
      .set({ completedAt: input.read ? new Date() : null })
      .where(and(eq(schema.khatmJuz.khatmId, khatmId), eq(schema.khatmJuz.juz, juz), eq(schema.khatmJuz.userId, userId))),
  );
  refresh(circleId);
}

export async function releaseJuz(input: z.input<typeof JuzInput>) {
  const { circleId, khatmId, juz } = JuzInput.parse(input);
  const userId = await requireUserId();
  await withUser(userId, (tx) =>
    tx.delete(schema.khatmJuz).where(and(eq(schema.khatmJuz.khatmId, khatmId), eq(schema.khatmJuz.juz, juz))),
  );
  refresh(circleId);
}
