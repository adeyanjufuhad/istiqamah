import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

type DB = NeonDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { istiqamahPool?: Pool };

function getDb(): DB {
  const url = process.env.DATABASE_APP_URL;
  if (!url) throw new Error("DATABASE_APP_URL is not set (see .env.example)");
  // Restricted role only: the app never holds owner credentials, so every
  // query below is subject to Row Level Security.
  globalForDb.istiqamahPool ??= new Pool({ connectionString: url });
  return drizzle({ client: globalForDb.istiqamahPool, schema });
}

/**
 * Runs `fn` in a transaction scoped to `userId`. RLS policies read the id via
 * app.current_user_id(); it is set with `is_local = true`, so it can't leak to
 * other requests sharing the pooled connection.
 *
 * Only call this with an id from a verified session (see lib/auth/session.ts).
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    return fn(tx);
  });
}

export { schema };
