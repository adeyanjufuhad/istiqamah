/**
 * Gives the restricted runtime role `istiqamah_app` a fresh password and LOGIN,
 * then writes DATABASE_APP_URL into .env.local. Run after `db:migrate`, and
 * again whenever you want to rotate the password.
 *
 *   npm run db:setup-role
 *
 * The password never leaves your machine except via the env vars you set in
 * Vercel. It is not printed.
 */
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const ROLE = "istiqamah_app";
const ownerUrl = process.env.DATABASE_URL;
if (!ownerUrl) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}

async function main() {
  const password = randomBytes(24).toString("base64url");
  const pool = new Pool({ connectionString: ownerUrl });
  try {
    // Identifiers/literals can't be bound as parameters in ALTER ROLE; the
    // password is base64url so it contains no quote characters.
    await pool.query(`alter role ${ROLE} with login nobypassrls password '${password}'`);
    const { rows } = await pool.query<{ rolbypassrls: boolean; rolsuper: boolean }>(
      "select rolbypassrls, rolsuper from pg_roles where rolname = $1",
      [ROLE],
    );
    if (!rows[0] || rows[0].rolbypassrls || rows[0].rolsuper) {
      throw new Error(`${ROLE} must exist without BYPASSRLS/SUPERUSER`);
    }
  } finally {
    await pool.end();
  }

  // Same host/db as the owner URL, pooled endpoint for runtime traffic.
  const appUrl = new URL(ownerUrl!);
  appUrl.username = ROLE;
  appUrl.password = password;
  if (!appUrl.hostname.includes("-pooler.")) {
    appUrl.hostname = appUrl.hostname.replace(/^([^.]+)\./, "$1-pooler.");
  }

  const envPath = path.join(process.cwd(), ".env.local");
  let env = "";
  try {
    env = await readFile(envPath, "utf8");
  } catch {}
  const line = `DATABASE_APP_URL="${appUrl.toString()}"`;
  env = /^DATABASE_APP_URL=.*$/m.test(env)
    ? env.replace(/^DATABASE_APP_URL=.*$/m, line)
    : `${env.trimEnd()}\n${line}\n`;
  await writeFile(envPath, env);
  console.log(`${ROLE} can log in; DATABASE_APP_URL written to .env.local`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
