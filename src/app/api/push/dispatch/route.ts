import { timingSafeEqual } from "node:crypto";
import { dispatchReminders } from "@/lib/push/dispatch";

/**
 * Called on a schedule (every 5 minutes) by Vercel Cron or the GitHub Actions
 * workflow in .github/workflows/push-dispatch.yml. Requires
 * `Authorization: Bearer $CRON_SECRET` (the header Vercel Cron sends).
 */
function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const stats = await dispatchReminders();
  return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
