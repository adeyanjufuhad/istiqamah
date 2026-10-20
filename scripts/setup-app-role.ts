/**
 * Gives the restricted runtime roles fresh passwords and LOGIN, then writes
 * their connection strings into .env.local. Run after `db:migrate`, and again
 * whenever you want to rotate the passwords.
 *
 *   npm run db:setup-role
 *
 *   istiqamah_app       → DATABASE_APP_URL       (all user-facing requests)
 *   istiqamah_dispatch  → DATABASE_DISPATCH_URL  (scheduled push reminders only)
 *
 * Passwords never leave your machine except via the env vars you set in
 * Vercel. They are not printed.
 */
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const ROLES = [
  { role: "istiqamah_app", env: "DATABASE_APP_URL" },
  { role: "istiqamah_dispatch", env: "DATABASE_DISPATCH_URL" },
] as const;

const ownerUrl = process.env.DATABASE_URL;
if (!ownerUrl) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}

function setEnv(env: string, key: string, value: string) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
}

async function main() {
  const only = process.argv[2];
  const pool = new Pool({ connectionString: ownerUrl });
  const envPath = path.join(process.cwd(), ".env.local");
  let env = "";
  try {
    env = await readFile(envPath, "utf8");
  } catch {}

  try {
    for (const { role, env: key } of ROLES) {
      if (only && only !== role) continue;
      const password = randomBytes(24).toString("base64url");
      // ALTER ROLE can't take bind parameters; base64url passwords contain no quotes.
      await pool.query(`alter role ${role} with login nobypassrls password '${password}'`);
      const { rows } = await pool.query<{ rolbypassrls: boolean; rolsuper: boolean }>(
        "select rolbypassrls, rolsuper from pg_roles where rolname = $1",
        [role],
      );
      if (!rows[0] || rows[0].rolbypassrls || rows[0].rolsuper) throw new Error(`${role} must exist without BYPASSRLS/SUPERUSER`);

      // Same host/db as the owner URL, pooled endpoint for runtime traffic.
      const url = new URL(ownerUrl!);
      url.username = role;
      url.password = password;
      if (!url.hostname.includes("-pooler.")) url.hostname = url.hostname.replace(/^([^.]+)\./, "$1-pooler.");
      env = setEnv(env, key, url.toString());
      console.log(`${role} can log in; ${key} written to .env.local`);
    }
  } finally {
    await pool.end();
  }
  await writeFile(envPath, env);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
