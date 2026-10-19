"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { auth } from "@/lib/auth/server";
import { getSessionUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";

export type DeleteState = { error?: "mismatch" | "auth"; done?: boolean } | null;

export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const l = String(formData.get("locale") ?? "");
  const locale = isLocale(l) ? l : "en";
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") return { error: "mismatch" };

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/sign-in`);

  // App data first (cascades to habits, logs, memberships, nudges and owned circles),
  // then the auth identity itself, which also cascades if anything remains.
  await withUser(user.id, (tx) => tx.delete(schema.profiles).where(eq(schema.profiles.id, user.id)));
  const { error } = await auth.deleteUser();
  if (error) {
    console.error("deleteUser failed", error);
    return { error: "auth" };
  }
  await auth.signOut().catch(() => {});
  return { done: true };
}
