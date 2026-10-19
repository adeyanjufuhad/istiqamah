import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { schema, withUser } from "@/lib/db";
import type { Habit } from "@/lib/db/schema";
import { addDays, type ISODate } from "@/lib/dates";
import { computeStreak, type Streak } from "@/lib/habits/streaks";

export type LogEntry = { completed: boolean; value: number | null };
/** logs[habitId][date] */
export type LogMap = Record<string, Record<ISODate, LogEntry>>;

export type TrackerHabit = Pick<Habit, "id" | "kind" | "title" | "targetValue" | "unit" | "isActive" | "shareWithCircles">;

/** Active habits plus their logs between `from` and `to` (inclusive). */
export async function getTracker(userId: string, from: ISODate, to: ISODate) {
  return withUser(userId, async (tx) => {
    const habits = await tx
      .select({
        id: schema.habits.id,
        kind: schema.habits.kind,
        title: schema.habits.title,
        targetValue: schema.habits.targetValue,
        unit: schema.habits.unit,
        isActive: schema.habits.isActive,
        shareWithCircles: schema.habits.shareWithCircles,
      })
      .from(schema.habits)
      .where(and(eq(schema.habits.userId, userId), eq(schema.habits.isActive, true)))
      .orderBy(asc(schema.habits.position), asc(schema.habits.createdAt));

    const rows = await tx
      .select({
        habitId: schema.habitLogs.habitId,
        logDate: schema.habitLogs.logDate,
        completed: schema.habitLogs.completed,
        value: schema.habitLogs.value,
      })
      .from(schema.habitLogs)
      .where(
        and(
          eq(schema.habitLogs.userId, userId),
          gte(schema.habitLogs.logDate, from),
          lte(schema.habitLogs.logDate, to),
        ),
      );

    const logs: LogMap = {};
    for (const r of rows) (logs[r.habitId] ??= {})[r.logDate] = { completed: r.completed, value: r.value };
    return { habits: habits as TrackerHabit[], logs };
  });
}

/** Streak per habit, looking back up to a year. */
export async function getStreaks(userId: string, today: ISODate): Promise<Record<string, Streak>> {
  const from = addDays(today, -366);
  const rows = await withUser(userId, (tx) =>
    tx
      .select({ habitId: schema.habitLogs.habitId, logDate: schema.habitLogs.logDate })
      .from(schema.habitLogs)
      .where(
        and(
          eq(schema.habitLogs.userId, userId),
          eq(schema.habitLogs.completed, true),
          gte(schema.habitLogs.logDate, from),
          lte(schema.habitLogs.logDate, today),
        ),
      ),
  );
  const byHabit = new Map<string, Set<ISODate>>();
  for (const r of rows) {
    let set = byHabit.get(r.habitId);
    if (!set) byHabit.set(r.habitId, (set = new Set()));
    set.add(r.logDate);
  }
  const out: Record<string, Streak> = {};
  for (const [id, dates] of byHabit) out[id] = computeStreak(dates, today);
  return out;
}
