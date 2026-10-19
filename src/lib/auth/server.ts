import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    // Magic links and OAuth return via a cross-site navigation; `strict` would drop the cookie.
    sameSite: "lax",
  },
  logLevel: (process.env.NEON_AUTH_LOG_LEVEL as "silent" | "error" | "warn" | "info" | "debug" | undefined) ?? "warn",
});
