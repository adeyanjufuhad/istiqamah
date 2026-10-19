"use client";

import { useState, useTransition } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import type { JuzClaim } from "@/lib/circles/data";
import { claimJuz, releaseJuz, setJuzRead, startKhatm } from "../actions";

type Khatm = { id: string; title: string | null; claims: JuzClaim[] } | null;

export function KhatmSection({
  circleId,
  khatm,
  completedKhatms,
  myId,
  isOwner,
}: {
  circleId: string;
  khatm: Khatm;
  completedKhatms: number;
  myId: string;
  isOwner: boolean;
}) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<number | null>(null);

  if (!khatm) {
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t("khatm.title")}</h2>
          <p className="text-sm leading-relaxed text-muted">{t("khatm.intro")}</p>
          {completedKhatms > 0 && <p className="text-sm font-medium text-primary">{t("khatm.completed", { count: completedKhatms })}</p>}
        </div>
        <form action={startKhatm} className="flex flex-col gap-3">
          <input type="hidden" name="circleId" value={circleId} />
          <Field id="khatm-title" label={t("khatm.titleLabel")}>
            <Input id="khatm-title" name="title" maxLength={80} autoComplete="off" placeholder={t("khatm.titlePlaceholder")} />
          </Field>
          <Button type="submit" className="self-start">
            {t("khatm.start")}
          </Button>
        </form>
      </Card>
    );
  }

  const byJuz = new Map(khatm.claims.map((c) => [c.juz, c]));
  const read = khatm.claims.filter((c) => c.read).length;
  const sel = selected ? byJuz.get(selected) : undefined;
  const run = (fn: () => Promise<void>) => start(fn);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{khatm.title || t("khatm.title")}</h2>
        <p className="text-sm text-muted">{t("khatm.progress", { read, claimed: khatm.claims.length })}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-soft" style={{ width: `${(read / 30) * 100}%` }} />
        </div>
      </div>

      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label={t("khatm.title")}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
          const c = byJuz.get(n);
          const mine = c?.userId === myId;
          const state = !c
            ? t("khatm.stateOpen")
            : mine
              ? c.read
                ? t("khatm.stateMineRead")
                : t("khatm.stateMine")
              : c.read
                ? t("khatm.stateOtherRead", { name: c.displayName })
                : t("khatm.stateOther", { name: c.displayName });
          return (
            <li key={n}>
              <button
                type="button"
                disabled={pending}
                aria-pressed={selected === n}
                aria-label={t("khatm.cellLabel", { n, state })}
                title={state}
                onClick={() => {
                  if (!c) run(() => claimJuz({ circleId, khatmId: khatm.id, juz: n }));
                  else setSelected(selected === n ? null : n);
                }}
                className={`flex aspect-square w-full flex-col items-center justify-center rounded-2xl text-sm font-bold tabular-nums transition-[transform,background-color] duration-200 ease-soft active:scale-95 disabled:opacity-70 ${
                  c?.read
                    ? "bg-primary text-primary-ink"
                    : c
                      ? mine
                        ? "bg-sky-100 text-ink ring-2 ring-primary"
                        : "bg-sky-50 text-ink"
                      : "bg-surface text-muted ring-1 ring-border hover:bg-sky-50"
                } ${selected === n ? "outline-3 outline-offset-2 outline-[var(--focus)]" : ""}`}
              >
                {n}
                {c && <span className="max-w-full truncate px-1 text-[10px] font-semibold opacity-80">{mine ? t("circles.you") : c.displayName}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {sel && selected && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface-2 p-3" aria-live="polite">
          <span className="me-auto text-sm font-semibold">
            {t("khatm.juz", { n: selected })} · {sel.userId === myId ? t("circles.you") : sel.displayName}
          </span>
          {sel.userId === myId && (
            <Button
              type="button"
              className="min-h-11 text-sm"
              disabled={pending}
              onClick={() => run(() => setJuzRead({ circleId, khatmId: khatm.id, juz: selected, read: !sel.read }))}
            >
              {sel.read ? t("khatm.unmark") : t("khatm.markRead")}
            </Button>
          )}
          {(sel.userId === myId || isOwner) && !sel.read && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 text-sm"
              disabled={pending}
              onClick={() => {
                run(() => releaseJuz({ circleId, khatmId: khatm.id, juz: selected }));
                setSelected(null);
              }}
            >
              {t("khatm.release")}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded ring-1 ring-border" /> {t("khatm.legendOpen")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-sky-100" /> {t("khatm.legendClaimed")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary" /> {t("khatm.legendRead")}
        </span>
      </div>
      {completedKhatms > 0 && <p className="text-sm font-medium text-primary">{t("khatm.completed", { count: completedKhatms })}</p>}
    </Card>
  );
}
