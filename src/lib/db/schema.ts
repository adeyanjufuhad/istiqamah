/**
 * Typed mirror of db/migrations/*.sql for querying with Drizzle.
 * The SQL migrations are the source of truth (including RLS); keep this in sync.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const habitKind = pgEnum("habit_kind", [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
  "quran",
  "adhkar_morning",
  "adhkar_evening",
  "fasting",
  "custom",
]);
export const habitUnit = pgEnum("habit_unit", ["pages", "minutes", "count"]);
export const circleRole = pgEnum("circle_role", ["owner", "member"]);
export const nudgeKind = pgEnum("nudge_kind", ["nudge", "dua"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  city: text("city"),
  country: text("country"),
  latitude: numeric("latitude", { precision: 5, scale: 2, mode: "number" }),
  longitude: numeric("longitude", { precision: 5, scale: 2, mode: "number" }),
  calcMethod: smallint("calc_method").notNull().default(3),
  asrSchool: smallint("asr_school").notNull().default(0),
  locale: text("locale").notNull().default("en"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  ...timestamps,
});

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  kind: habitKind("kind").notNull(),
  title: text("title"),
  targetValue: integer("target_value"),
  unit: habitUnit("unit"),
  position: smallint("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  shareWithCircles: boolean("share_with_circles").notNull().default(false),
  ...timestamps,
});

export const habitLogs = pgTable("habit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  habitId: uuid("habit_id").notNull(),
  userId: uuid("user_id").notNull(),
  logDate: date("log_date").notNull(),
  completed: boolean("completed").notNull().default(true),
  value: integer("value"),
  ...timestamps,
});

export const circles = pgTable("circles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  inviteCode: text("invite_code").notNull().default(sql`app.gen_invite_code()`),
  maxMembers: smallint("max_members").notNull().default(12),
  // Nullable since 0002: a circle outlives its creator.
  createdBy: uuid("created_by"),
  ...timestamps,
});

export const circleMembers = pgTable(
  "circle_members",
  {
    circleId: uuid("circle_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: circleRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.userId] })],
);

export const circleMemberProfiles = pgView("circle_member_profiles", {
  circleId: uuid("circle_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: circleRole("role").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
  displayName: text("display_name").notNull(),
}).existing();

export const nudges = pgTable("nudges", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").notNull(),
  senderId: uuid("sender_id").notNull(),
  recipientId: uuid("recipient_id").notNull(),
  kind: nudgeKind("kind").notNull(),
  messageKey: text("message_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const khatms = pgTable("khatms", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").notNull(),
  title: text("title"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const khatmJuz = pgTable(
  "khatm_juz",
  {
    khatmId: uuid("khatm_id").notNull(),
    juz: smallint("juz").notNull(),
    userId: uuid("user_id").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.khatmId, t.juz] })],
);

export type Profile = typeof profiles.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitKind = (typeof habitKind.enumValues)[number];
