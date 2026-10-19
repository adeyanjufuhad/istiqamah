import { eq, or } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { schema, withUser } from "@/lib/db";

/** GDPR-style export of everything stored about the signed-in user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const data = await withUser(user.id, async (tx) => {
    const [profile] = await tx.select().from(schema.profiles).where(eq(schema.profiles.id, user.id));
    const habits = await tx.select().from(schema.habits).where(eq(schema.habits.userId, user.id));
    const habitLogs = await tx.select().from(schema.habitLogs).where(eq(schema.habitLogs.userId, user.id));
    const memberships = await tx.select().from(schema.circleMembers).where(eq(schema.circleMembers.userId, user.id));
    const circlesCreated = await tx.select().from(schema.circles).where(eq(schema.circles.createdBy, user.id));
    const nudges = await tx
      .select()
      .from(schema.nudges)
      .where(or(eq(schema.nudges.senderId, user.id), eq(schema.nudges.recipientId, user.id)));
    return { profile: profile ?? null, habits, habitLogs, circleMemberships: memberships, circlesCreated, nudges };
  });

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, name: user.name }, ...data },
    null,
    2,
  );
  const day = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="istiqamah-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
