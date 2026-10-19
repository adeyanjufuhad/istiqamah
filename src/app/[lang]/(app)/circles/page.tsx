import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { getLocale, getT } from "@/i18n/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import { getInbox, listMyCircles } from "@/lib/circles/data";
import { CircleForms } from "./circle-forms";
import { Inbox } from "./inbox";

export const instant = false;

export const metadata: Metadata = { title: "Circles" };

export default async function CirclesPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user } = await requireOnboardedUser(locale);
  const [circles, inbox] = await Promise.all([listMyCircles(user.id), getInbox(user.id)]);

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("circles.title")}</h1>
        <p className="leading-relaxed text-muted">{t("circles.intro")}</p>
      </header>

      <Inbox items={inbox} />

      {circles.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {circles.map((c) => (
            <li key={c.id}>
              <Link
                href={`/${locale}/circles/${c.id}`}
                className="group flex min-h-20 items-center justify-between gap-4 rounded-[var(--radius-card)] bg-surface px-5 py-4 ring-1 ring-border transition-[box-shadow,transform] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-lg font-semibold">{c.name}</span>
                  <span className="text-sm text-muted">
                    {t("circles.members", { count: c.members })}
                    {c.role === "owner" && ` · ${t("circles.owner")}`}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-50 text-primary transition-transform duration-300 ease-soft group-hover:translate-x-0.5 rtl:-scale-x-100"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <p className="leading-relaxed text-muted">{t("circles.empty")}</p>
        </Card>
      )}

      <CircleForms />
    </>
  );
}
