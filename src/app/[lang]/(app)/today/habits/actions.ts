"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";
import { habitKind } from "@/lib/db/schema";

async function userOrRedirect() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
}

function done() {
  revalidatePath("/[lang]/today", "layout");
  revalidatePath("/[lang]/week", "page");
}

const nextPosition = sql<number>`coalesce((select max(position) + 1 from habits where user_id = app.current_user_id()), 0)`;

const CustomHabit = z.object({
  name: z.string().trim().min(1).max(80),
  goal: z.enum(["none", "count", "minutes"]),
  amount: z.coerce.number().int().min(1).max(10000).optional(),
});

export async function addCustomHabit(_prev: { error?: string; ok?: number } | null, formData: FormData) {
  const parsed = CustomHabit.safeParse({
    name: formData.get("name"),
    goal: formData.get("goal"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) return { error: "invalid" };
  const { name, goal, amount } = parsed.data;
  const user = await userOrRedirect();
  await withUser(user.id, (tx) =>
    tx.insert(schema.habits).values({
      userId: user.id,
      kind: "custom",
      title: name,
      targetValue: goal === "none" ? null : (amount ?? 1),
      unit: goal === "none" ? null : goal,
      position: nextPosition,
    }),
  );
  done();
  return { ok: Date.now() };
}

export async function setHabitActive(habitId: string, active: boolean) {
  const id = z.uuid().parse(habitId);
  const user = await userOrRedirect();
  await withUser(user.id, (tx) =>
    tx
      .update(schema.habits)
      .set({ isActive: active })
      .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, user.id))),
  );
  done();
}

const BuiltIn = z.enum(habitKind.enumValues).exclude(["custom"]);

export async function trackBuiltIn(kind: string) {
  const k = BuiltIn.parse(kind);
  const user = await userOrRedirect();
  await withUser(user.id, async (tx) => {
    const isQuran = k === "quran";
    await tx
      .insert(schema.habits)
      .values({
        userId: user.id,
        kind: k,
        position: nextPosition,
        targetValue: isQuran ? 2 : null,
        unit: isQuran ? "pages" : null,
      })
      .onConflictDoNothing();
    // Already existed but was stopped: resume it.
    await tx
      .update(schema.habits)
      .set({ isActive: true })
      .where(and(eq(schema.habits.userId, user.id), eq(schema.habits.kind, k)));
  });
  done();
}

const Target = z.object({
  habitId: z.uuid(),
  amount: z.coerce.number().int().min(1).max(10000),
  unit: z.enum(["pages", "minutes", "count"]),
});

export async function updateTarget(_prev: { ok?: number; error?: string } | null, formData: FormData) {
  const parsed = Target.safeParse({
    habitId: formData.get("habitId"),
    amount: formData.get("amount"),
    unit: formData.get("unit"),
  });
  if (!parsed.success) return { error: "invalid" };
  const user = await userOrRedirect();
  await withUser(user.id, (tx) =>
    tx
      .update(schema.habits)
      .set({ targetValue: parsed.data.amount, unit: parsed.data.unit })
      .where(and(eq(schema.habits.id, parsed.data.habitId), eq(schema.habits.userId, user.id))),
  );
  done();
  return { ok: Date.now() };
}

/** Permanently removes a custom habit and its history. Built-ins can only be stopped. */
export async function deleteCustomHabit(habitId: string) {
  const id = z.uuid().parse(habitId);
  const user = await userOrRedirect();
  await withUser(user.id, (tx) =>
    tx
      .delete(schema.habits)
      .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, user.id), eq(schema.habits.kind, "custom"))),
  );
  done();
}
