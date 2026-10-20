import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import webpush, { WebPushError } from "web-push";
import { isLocale, type Locale } from "@/i18n/config";
import en from "@/i18n/dictionaries/en.json";
import ar from "@/i18n/dictionaries/ar.json";
import { mergeDictionary } from "@/i18n/translate";
import { localDate } from "@/lib/dates";
import { getPrayerDay } from "@/lib/prayer/aladhan";
import ws from "ws";
import { dueEvents, type PushEvent } from "./schedule";

neonConfig.webSocketConstructor = ws;

const dictionaries: Record<Locale, typeof en> = { en, ar: mergeDictionary(en, ar) };

type Row = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  prayers: boolean;
  adhkar: boolean;
  timezone: string;
  latitude: string | null;
  longitude: string | null;
  city: string | null;
  country: string | null;
  calc_method: number;
  asr_school: number;
  locale: string;
};

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("VAPID keys are not configured (see .env.example)");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Sends every reminder that is due right now. Safe to call as often as you like:
 * each (subscription, event, local date) is recorded before sending, so a
 * reminder goes out at most once. Runs as the restricted istiqamah_dispatch role.
 */
export async function dispatchReminders(now = new Date()) {
  const url = process.env.DATABASE_DISPATCH_URL;
  if (!url) throw new Error("DATABASE_DISPATCH_URL is not set");
  configureVapid();

  const pool = new Pool({ connectionString: url });
  const stats = { subscriptions: 0, sent: 0, pruned: 0, failed: 0 };
  try {
    const { rows } = await pool.query<Row>(
      `select s.id, s.endpoint, s.p256dh, s.auth, s.prayers, s.adhkar,
              p.timezone, p.latitude, p.longitude, p.city, p.country, p.calc_method, p.asr_school, p.locale
         from push_subscriptions s
         join profiles p on p.id = s.user_id
        where s.prayers or s.adhkar`,
    );
    stats.subscriptions = rows.length;

    for (const r of rows) {
      const date = localDate(r.timezone, now);
      const day = await getPrayerDay({
        date,
        latitude: r.latitude === null ? null : Number(r.latitude),
        longitude: r.longitude === null ? null : Number(r.longitude),
        city: r.city,
        country: r.country,
        method: r.calc_method,
        school: r.asr_school,
      });
      if (!day) continue;

      for (const event of dueEvents(day.times, r, now)) {
        const claimed = await pool.query(
          `insert into push_deliveries (subscription_id, event, event_date) values ($1, $2, $3)
           on conflict do nothing returning 1`,
          [r.id, event, date],
        );
        if (!claimed.rowCount) continue; // already sent

        const locale = isLocale(r.locale) ? r.locale : "en";
        const copy = dictionaries[locale].push[event as PushEvent];
        const payload = JSON.stringify({ title: copy.title, body: copy.body, url: `/${locale}/today`, tag: event });
        try {
          await webpush.sendNotification(
            { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
            payload,
            { TTL: 30 * 60, urgency: "high", topic: event },
          );
          await pool.query("update push_subscriptions set last_success_at = now() where id = $1", [r.id]);
          stats.sent++;
        } catch (err) {
          if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
            // The browser dropped this subscription: forget it.
            await pool.query("delete from push_subscriptions where id = $1", [r.id]);
            stats.pruned++;
            break;
          }
          // Transient failure: release the claim so the next run retries within the window.
          await pool.query("delete from push_deliveries where subscription_id = $1 and event = $2 and event_date = $3", [
            r.id,
            event,
            date,
          ]);
          stats.failed++;
          console.warn("[push] send failed", err instanceof Error ? err.message : err);
        }
      }
    }

    await pool.query("delete from push_deliveries where event_date < (now() at time zone 'utc')::date - 3");
    return stats;
  } finally {
    await pool.end();
  }
}
