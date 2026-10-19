/**
 * End-to-end RLS check against the real database.
 * Seeds three throwaway users with the owner role, then exercises the policies
 * through the restricted `istiqamah_app` role exactly as the app does.
 * All test users are deleted at the end (cascade removes their data).
 *
 *   npm run db:test-rls
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool, neonConfig, type PoolClient } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const owner = new Pool({ connectionString: process.env.DATABASE_URL });
const app = new Pool({ connectionString: process.env.DATABASE_APP_URL });

const A = randomUUID();
const B = randomUUID();
const C = randomUUID();

async function as<T>(userId: string | null, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await app.connect();
  try {
    await c.query("begin");
    if (userId) await c.query("select set_config('app.user_id', $1, true)", [userId]);
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}

async function rejects(p: Promise<unknown>, label: string) {
  await assert.rejects(p, label);
  console.log(`  ✓ ${label}`);
}

function ok(cond: boolean, label: string) {
  assert.ok(cond, label);
  console.log(`  ✓ ${label}`);
}

async function main() {
  const who = await app.query<{ rolbypassrls: boolean }>(
    "select rolbypassrls from pg_roles where rolname = current_user",
  );
  ok(who.rows[0]?.rolbypassrls === false, "runtime role cannot bypass RLS");

  for (const [id, n] of [[A, "a"], [B, "b"], [C, "c"]] as const) {
    await owner.query(
      `insert into neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       values ($1, $2, $3, true, now(), now())`,
      [id, `rls-test-${n}`, `rls-test-${n}-${id}@example.invalid`],
    );
  }

  console.log("profiles");
  await as(A, (c) => c.query("insert into profiles (display_name) values ('Aisha')"));
  await as(B, (c) => c.query("insert into profiles (display_name) values ('Bilal')"));
  await as(C, (c) => c.query("insert into profiles (display_name) values ('Camila')"));
  await rejects(
    as(B, (c) => c.query("insert into profiles (id, display_name) values ($1, 'x')", [randomUUID()])),
    "cannot create a profile for someone else",
  );
  ok((await as(B, (c) => c.query("select * from profiles"))).rowCount === 1, "only sees own profile");
  ok((await as(null, (c) => c.query("select * from profiles"))).rowCount === 0, "no session sees nothing");

  console.log("habits + logs");
  const { sharedId, privateId } = await as(A, async (c) => {
    const s = await c.query("insert into habits (kind, share_with_circles) values ('fajr', true) returning id");
    const p = await c.query("insert into habits (kind, title) values ('custom', 'Private habit') returning id");
    await c.query("insert into habit_logs (habit_id, log_date) values ($1, current_date), ($2, current_date)", [
      s.rows[0].id,
      p.rows[0].id,
    ]);
    return { sharedId: s.rows[0].id as string, privateId: p.rows[0].id as string };
  });
  ok((await as(B, (c) => c.query("select * from habits"))).rowCount === 0, "stranger sees none of A's habits");
  ok((await as(B, (c) => c.query("select * from habit_logs"))).rowCount === 0, "stranger sees none of A's logs");
  await rejects(
    as(B, (c) => c.query("insert into habits (user_id, kind) values ($1, 'isha')", [A])),
    "cannot create a habit for someone else",
  );
  await rejects(
    as(B, (c) => c.query("insert into habit_logs (habit_id, log_date) values ($1, current_date)", [sharedId])),
    "cannot log against someone else's habit",
  );
  ok(
    (await as(B, (c) => c.query("update habits set is_active = false where id = $1", [sharedId]))).rowCount === 0,
    "cannot update someone else's habit",
  );
  // Same upsert the tracker's /api/logs uses.
  const upsert = `insert into habit_logs (habit_id, log_date, completed, value) values ($1, current_date, $2, $3)
    on conflict (habit_id, log_date) do update set completed = excluded.completed, value = excluded.value`;
  await as(A, (c) => c.query(upsert, [sharedId, false, 0]));
  await as(A, (c) => c.query(upsert, [sharedId, true, 3]));
  const mine = await as(A, (c) => c.query("select completed, value from habit_logs where habit_id = $1", [sharedId]));
  ok(mine.rowCount === 1 && mine.rows[0].completed === true && mine.rows[0].value === 3, "tracker upsert keeps one row per day");
  await rejects(as(B, (c) => c.query(upsert, [sharedId, false, 0])), "cannot upsert over someone else's check-in");

  console.log("circles");
  const circle = await as(A, async (c) => {
    const r = await c.query("insert into circles (name) values ('Fajr friends') returning id, invite_code");
    return r.rows[0] as { id: string; invite_code: string };
  });
  ok(
    (await as(A, (c) => c.query("select * from circle_members where circle_id = $1", [circle.id]))).rows[0]?.role ===
      "owner",
    "creator becomes owner",
  );
  ok((await as(B, (c) => c.query("select * from circles"))).rowCount === 0, "non-member cannot see circle");
  await rejects(
    as(B, (c) => c.query("insert into circle_members (circle_id, user_id) values ($1, $2)", [circle.id, B])),
    "cannot join by inserting directly",
  );
  await rejects(as(B, (c) => c.query("select app.join_circle('WRONGCODE')")), "invalid invite code is rejected");
  await as(B, (c) => c.query("select app.join_circle($1)", [circle.invite_code.toLowerCase()]));
  ok((await as(B, (c) => c.query("select * from circles"))).rowCount === 1, "member sees circle after joining");

  const bHabits = await as(B, (c) => c.query("select id from habits"));
  ok(
    bHabits.rowCount === 1 && bHabits.rows[0].id === sharedId,
    "member sees A's shared habit only, not the private one",
  );
  const bLogs = await as(B, (c) => c.query("select habit_id from habit_logs"));
  ok(bLogs.rowCount === 1 && bLogs.rows[0].habit_id === sharedId, "member sees logs of shared habit only");
  ok(
    (await as(B, (c) => c.query("select * from habit_logs where habit_id = $1", [privateId]))).rowCount === 0,
    "private habit logs stay private",
  );
  ok((await as(B, (c) => c.query("select * from profiles where id = $1", [A]))).rowCount === 0, "member cannot read A's profile row");
  const names = await as(B, (c) =>
    c.query("select display_name from circle_member_profiles where circle_id = $1 order by display_name", [circle.id]),
  );
  ok(names.rows.map((r) => r.display_name).join(",") === "Aisha,Bilal", "member sees co-member display names only");
  ok(
    (await as(C, (c) => c.query("select * from circle_member_profiles"))).rowCount === 0,
    "non-member sees no member list",
  );
  ok(
    (await as(B, (c) => c.query("update circles set name = 'hijack' where id = $1", [circle.id]))).rowCount === 0,
    "member cannot rename circle",
  );

  console.log("nudges");
  await as(B, (c) =>
    c.query("insert into nudges (circle_id, recipient_id, kind, message_key) values ($1, $2, 'nudge', 'pray_together')", [
      circle.id,
      A,
    ]),
  );
  await rejects(
    as(C, (c) =>
      c.query("insert into nudges (circle_id, recipient_id, kind, message_key) values ($1, $2, 'nudge', 'pray_together')", [
        circle.id,
        A,
      ]),
    ),
    "non-member cannot nudge",
  );
  ok((await as(A, (c) => c.query("select * from nudges"))).rowCount === 1, "recipient sees nudge");
  ok((await as(C, (c) => c.query("select * from nudges"))).rowCount === 0, "others cannot see nudge");

  console.log("leaving");
  await as(B, (c) => c.query("delete from circle_members where circle_id = $1 and user_id = $2", [circle.id, B]));
  ok((await as(B, (c) => c.query("select * from habits"))).rowCount === 0, "after leaving, shared habits disappear");

  console.log("\nAll RLS checks passed.");
}

main()
  .catch((err) => {
    console.error("\nRLS check FAILED:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await owner.query(`delete from neon_auth."user" where id = any($1::uuid[])`, [[A, B, C]]).catch(() => {});
    await owner.end();
    await app.end();
  });
