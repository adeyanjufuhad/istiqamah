import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { schema, withUser } from "@/lib/db";
import type { ISODate } from "@/lib/dates";

const { circles, circleMemberProfiles, habits, habitLogs, khatms, khatmJuz, nudges } = schema;

export async function listMyCircles(userId: string) {
  return withUser(userId, async (tx) => {
    const rows = await tx
      .select({
        id: circles.id,
        name: circles.name,
        description: circles.description,
        role: circleMemberProfiles.role,
        members: sql<number>`(select count(*)::int from circle_members m where m.circle_id = ${circles.id})`,
      })
      .from(circles)
      .innerJoin(circleMemberProfiles, and(eq(circleMemberProfiles.circleId, circles.id), eq(circleMemberProfiles.userId, userId)))
      .orderBy(asc(circles.createdAt));
    return rows;
  });
}

export type InboxItem = {
  id: string;
  circleId: string;
  circleName: string;
  senderName: string;
  kind: "nudge" | "dua";
  messageKey: string;
  createdAt: Date;
  readAt: Date | null;
};

export async function getInbox(userId: string, limit = 20): Promise<InboxItem[]> {
  return withUser(userId, (tx) =>
    tx
      .select({
        id: nudges.id,
        circleId: nudges.circleId,
        circleName: circles.name,
        senderName: circleMemberProfiles.displayName,
        kind: nudges.kind,
        messageKey: nudges.messageKey,
        createdAt: nudges.createdAt,
        readAt: nudges.readAt,
      })
      .from(nudges)
      .innerJoin(circles, eq(circles.id, nudges.circleId))
      .innerJoin(
        circleMemberProfiles,
        and(eq(circleMemberProfiles.circleId, nudges.circleId), eq(circleMemberProfiles.userId, nudges.senderId)),
      )
      .where(eq(nudges.recipientId, userId))
      .orderBy(desc(nudges.createdAt))
      .limit(limit),
  );
}

export type CircleMember = {
  userId: string;
  displayName: string;
  role: "owner" | "member";
  isMe: boolean;
  shared: { habitId: string; kind: string; title: string | null; done: boolean }[];
};

export type JuzClaim = { juz: number; userId: string; displayName: string; read: boolean };

/** Everything the circle page needs. Returns null if the viewer isn't a member (RLS hides it). */
export async function getCircle(userId: string, circleId: string, today: ISODate) {
  return withUser(userId, async (tx) => {
    const [circle] = await tx.select().from(circles).where(eq(circles.id, circleId));
    if (!circle) return null;

    const members = await tx
      .select()
      .from(circleMemberProfiles)
      .where(eq(circleMemberProfiles.circleId, circleId))
      .orderBy(asc(circleMemberProfiles.joinedAt));
    const me = members.find((m) => m.userId === userId);
    if (!me) return null;

    const ids = members.map((m) => m.userId);
    // RLS returns only habits each member chose to share (plus the viewer's own).
    const shared = await tx
      .select({ id: habits.id, userId: habits.userId, kind: habits.kind, title: habits.title })
      .from(habits)
      .where(and(inArray(habits.userId, ids), eq(habits.shareWithCircles, true), eq(habits.isActive, true)))
      .orderBy(asc(habits.position));
    const logs = shared.length
      ? await tx
          .select({ habitId: habitLogs.habitId })
          .from(habitLogs)
          .where(
            and(
              inArray(
                habitLogs.habitId,
                shared.map((h) => h.id),
              ),
              eq(habitLogs.logDate, today),
              eq(habitLogs.completed, true),
            ),
          )
      : [];
    const doneSet = new Set(logs.map((l) => l.habitId));

    const memberList: CircleMember[] = members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      role: m.role,
      isMe: m.userId === userId,
      shared: shared
        .filter((h) => h.userId === m.userId)
        .map((h) => ({ habitId: h.id, kind: h.kind, title: h.title, done: doneSet.has(h.id) })),
    }));

    const [activeKhatm] = await tx
      .select()
      .from(khatms)
      .where(and(eq(khatms.circleId, circleId), isNull(khatms.completedAt)));
    const [{ completedKhatms }] = await tx
      .select({ completedKhatms: sql<number>`count(*)::int` })
      .from(khatms)
      .where(and(eq(khatms.circleId, circleId), sql`${khatms.completedAt} is not null`));

    let claims: JuzClaim[] = [];
    if (activeKhatm) {
      const rows = await tx
        .select({ juz: khatmJuz.juz, userId: khatmJuz.userId, completedAt: khatmJuz.completedAt })
        .from(khatmJuz)
        .where(eq(khatmJuz.khatmId, activeKhatm.id));
      const names = new Map(members.map((m) => [m.userId, m.displayName]));
      claims = rows.map((r) => ({
        juz: r.juz,
        userId: r.userId,
        displayName: names.get(r.userId) ?? "—",
        read: r.completedAt !== null,
      }));
    }

    return {
      circle,
      myRole: me.role,
      members: memberList,
      khatm: activeKhatm ? { id: activeKhatm.id, title: activeKhatm.title, claims } : null,
      completedKhatms,
    };
  });
}
