import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";
import { addDays, EDIT_WINDOW_DAYS, ISO_DATE_RE, localDate } from "@/lib/dates";

const Entry = z.object({
  habitId: z.uuid(),
  logDate: z.string().regex(ISO_DATE_RE),
  completed: z.boolean(),
  value: z.number().int().min(0).max(100000).nullable(),
});
const Body = z.object({ entries: z.array(Entry).min(1).max(200) });

/**
 * Upserts check-ins. Used directly by the tracker and to flush the offline
 * outbox, so it accepts batches and is idempotent (last write per habit/day wins).
 * Ownership is enforced by RLS: logging against someone else's habit fails.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  try {
    const result = await withUser(user.id, async (tx) => {
      const [profile] = await tx
        .select({ timezone: schema.profiles.timezone })
        .from(schema.profiles)
        .where(eq(schema.profiles.id, user.id));
      if (!profile) return { status: 409 as const };

      // Allow today plus a short window back; one day ahead absorbs device/profile timezone skew.
      const today = localDate(profile.timezone);
      const earliest = addDays(today, -EDIT_WINDOW_DAYS);
      const latest = addDays(today, 1);
      const entries = parsed.data.entries.filter((e) => e.logDate >= earliest && e.logDate <= latest);
      if (!entries.length) return { status: 200 as const, saved: 0 };

      await tx
        .insert(schema.habitLogs)
        .values(entries.map((e) => ({ ...e, userId: user.id })))
        .onConflictDoUpdate({
          target: [schema.habitLogs.habitId, schema.habitLogs.logDate],
          set: { completed: sql`excluded.completed`, value: sql`excluded.value` },
        });
      return { status: 200 as const, saved: entries.length };
    });

    if (result.status === 409) return Response.json({ error: "no-profile" }, { status: 409 });
    return Response.json({ saved: result.saved }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/logs] upsert failed", err);
    return Response.json({ error: "rejected" }, { status: 422 });
  }
}
