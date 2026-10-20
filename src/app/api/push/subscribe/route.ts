import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";

const Endpoint = z.url().startsWith("https://").max(1000);

const Subscribe = z.object({
  endpoint: Endpoint,
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  prayers: z.boolean(),
  adhkar: z.boolean(),
});

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Current preferences for this device's subscription (if it belongs to the user). */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const endpoint = Endpoint.safeParse(new URL(req.url).searchParams.get("endpoint"));
  if (!endpoint.success) return json({ error: "invalid" }, 400);
  const [row] = await withUser(user.id, (tx) =>
    tx
      .select({ prayers: schema.pushSubscriptions.prayers, adhkar: schema.pushSubscriptions.adhkar })
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint.data)),
  );
  return row ? json(row) : json({ error: "not-found" }, 404);
}

/** Create or update this device's subscription and preferences. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const parsed = Subscribe.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { endpoint, keys, prayers, adhkar } = parsed.data;
  try {
    await withUser(user.id, (tx) =>
      tx
        .insert(schema.pushSubscriptions)
        .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, prayers, adhkar })
        .onConflictDoUpdate({
          target: schema.pushSubscriptions.endpoint,
          set: { p256dh: sql`excluded.p256dh`, auth: sql`excluded.auth`, prayers, adhkar },
        }),
    );
  } catch {
    // The endpoint is registered to another account on this browser (RLS blocks the update).
    return json({ error: "conflict" }, 409);
  }
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const parsed = z.object({ endpoint: Endpoint }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  await withUser(user.id, (tx) =>
    tx
      .delete(schema.pushSubscriptions)
      .where(and(eq(schema.pushSubscriptions.endpoint, parsed.data.endpoint), eq(schema.pushSubscriptions.userId, user.id))),
  );
  return json({ ok: true });
}
