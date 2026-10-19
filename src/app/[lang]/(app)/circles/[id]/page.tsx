import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Card, ScholarNote } from "@/components/ui";
import { getLocale, getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/translate";
import { requireOnboardedUser } from "@/lib/auth/session";
import { getCircle } from "@/lib/circles/data";
import { getEncouragementDuas } from "@/lib/content/hisn";
import { localDate } from "@/lib/dates";
import { deleteCircle, leaveCircle, newInviteCode, removeMember } from "../actions";
import { ConfirmButton } from "./confirm-button";
import { EncourageButton } from "./encourage";
import { InviteCard } from "./invite-card";
import { KhatmSection } from "./khatm";

export const instant = false;

export const metadata: Metadata = { title: "Circle" };

export default async function CirclePage({ params }: PageProps<"/[lang]/circles/[id]">) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const { user, profile } = await requireOnboardedUser(locale);
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  const [data, duas] = await Promise.all([getCircle(user.id, id.data, localDate(profile.timezone)), getEncouragementDuas()]);
  if (!data) notFound();
  const { circle, myRole, members, khatm, completedKhatms } = data;
  const isOwner = myRole === "owner";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const label = (kind: string, title: string | null) => (kind === "custom" ? (title ?? "") : t(`habits.${kind}` as MessageKey));

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link href={`/${locale}/circles`} className="w-fit text-sm font-semibold text-primary underline-offset-4 hover:underline">
          <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
            ←
          </span>{" "}
          {t("circles.back")}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{circle.name}</h1>
        {circle.description && <p className="leading-relaxed text-muted">{circle.description}</p>}
        <p className="text-sm text-muted">{t("circles.members", { count: members.length })}</p>
      </header>

      <InviteCard circleName={circle.name} code={circle.inviteCode} link={`${origin}/${locale}/join/${circle.inviteCode}`}>
        {isOwner && (
          <ConfirmButton
            action={newInviteCode}
            fields={{ circleId: circle.id }}
            confirm={t("circles.newCodeConfirm")}
            className="min-h-11 px-4 text-sm"
            variant="ghost"
          >
            {t("circles.newCode")}
          </ConfirmButton>
        )}
      </InviteCard>

      <section aria-labelledby="members-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="members-heading" className="text-sm font-semibold uppercase tracking-wider text-muted">
            {t("circles.todayShared")}
          </h2>
          <Link href={`/${locale}/today/habits`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            {t("circles.manageSharing")}
          </Link>
        </div>
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-5 ring-1 ring-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-50 text-base font-bold text-primary">
                    {m.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">
                      {m.displayName}
                      {m.isMe && <span className="font-normal text-muted"> ({t("circles.you")})</span>}
                    </span>
                    {m.role === "owner" && <span className="text-xs font-semibold text-primary">{t("circles.owner")}</span>}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!m.isMe && <EncourageButton circleId={circle.id} recipientId={m.userId} name={m.displayName} duas={duas} />}
                  {isOwner && !m.isMe && (
                    <ConfirmButton
                      action={removeMember}
                      fields={{ circleId: circle.id, memberId: m.userId }}
                      confirm={t("circles.removeConfirm", { name: m.displayName })}
                      variant="ghost"
                      className="min-h-11 px-3 text-sm text-danger"
                    >
                      {t("circles.remove")}
                    </ConfirmButton>
                  )}
                </div>
              </div>
              {m.shared.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label={t("circles.todayShared")}>
                  {m.shared.map((h) => (
                    <li
                      key={h.habitId}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                        h.done ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"
                      }`}
                    >
                      {h.done && (
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {label(h.kind, h.title)}
                      <span className="sr-only">{h.done ? `: ${t("week.done")}` : `: ${t("week.notDone")}`}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{m.isMe ? t("circles.youShareNothing") : t("circles.nothingShared")}</p>
              )}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">{t("circles.sharingNote")}</p>
      </section>

      <KhatmSection circleId={circle.id} khatm={khatm} completedKhatms={completedKhatms} myId={user.id} isOwner={isOwner} />

      <Card className="flex flex-wrap gap-2">
        <ConfirmButton
          action={leaveCircle}
          fields={{ circleId: circle.id, locale }}
          confirm={t("circles.leaveConfirm")}
          variant="secondary"
          className="min-h-11 text-sm"
        >
          {t("circles.leave")}
        </ConfirmButton>
        {isOwner && (
          <ConfirmButton
            action={deleteCircle}
            fields={{ circleId: circle.id, locale }}
            confirm={t("circles.deleteConfirm")}
            variant="danger"
            className="min-h-11 text-sm"
          >
            {t("circles.deleteCircle")}
          </ConfirmButton>
        )}
      </Card>

      <ScholarNote text={t("scholar.note")} />
    </>
  );
}

