import { Button, Card } from "@/components/ui";
import { DuaBlock } from "@/components/dua-block";
import { getLocale, getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translate";
import type { InboxItem } from "@/lib/circles/data";
import { getHisnDua, parseDuaKey } from "@/lib/content/hisn";
import { markInboxRead } from "./actions";

export async function Inbox({ items }: { items: InboxItem[] }) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  if (!items.length) return null;

  const duas = await Promise.all(
    items.map((i) => {
      const ref = i.kind === "dua" ? parseDuaKey(i.messageKey) : null;
      return ref ? getHisnDua(ref) : Promise.resolve(null);
    }),
  );
  const unread = items.some((i) => !i.readAt);
  const time = new Intl.DateTimeFormat(locale, { weekday: "short", hour: "numeric", minute: "2-digit" });

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("circles.inboxTitle")}</h2>
        {unread && (
          <form action={markInboxRead}>
            <Button type="submit" variant="ghost" className="min-h-10 px-3 text-sm">
              {t("circles.markRead")}
            </Button>
          </form>
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, idx) => {
          const dua = duas[idx];
          return (
            <li
              key={item.id}
              className={`flex flex-col gap-2 rounded-2xl px-4 py-3 ${item.readAt ? "bg-surface-2" : "bg-sky-50 ring-1 ring-sky-100"}`}
            >
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-muted">
                <span className="font-semibold text-ink">{t("circles.fromIn", { name: item.senderName, circle: item.circleName })}</span>
                <time dateTime={item.createdAt.toISOString()}>{time.format(item.createdAt)}</time>
              </p>
              {item.kind === "nudge" ? (
                <p className="text-base font-medium">{t(item.messageKey.replace(/^nudge\./, "nudges.") as MessageKey)}</p>
              ) : dua ? (
                <DuaBlock dua={dua} />
              ) : (
                <p className="text-sm text-muted">{t("circles.duaUnavailable")}</p>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
