/**
 * Applies db/migrations/*.sql in order, once each, inside a transaction.
 * Uses DATABASE_URL (the owner role) — never the runtime app role.
 *
 *   npm run db:migrate
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}

const dir = path.join(process.cwd(), "db", "migrations");
const pool = new Pool({ connectionString: url });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      create schema if not exists meta;
      create table if not exists meta.migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      );
      alter table meta.migrations enable row level security;
    `);

    const applied = new Set(
      (await client.query<{ name: string }>("select name from meta.migrations")).rows.map((r) => r.name),
    );
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      process.stdout.write(`→ ${file} … `);
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into meta.migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log("ok");
        count++;
      } catch (err) {
        await client.query("rollback");
        console.log("failed");
        throw err;
      }
    }
    console.log(count ? `Applied ${count} migration(s).` : "Database is up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
