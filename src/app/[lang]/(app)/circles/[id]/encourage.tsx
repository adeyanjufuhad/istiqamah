"use client";

import { useRef, useState, useTransition } from "react";
import { DuaBlock } from "@/components/dua-block";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";
import { NUDGE_PRESETS } from "@/lib/circles/nudges";
import { duaKey, type HisnDua } from "@/lib/content/hisn-shared";
import { sendNudge } from "../actions";

export function EncourageButton({
  circleId,
  recipientId,
  name,
  duas,
}: {
  circleId: string;
  recipientId: string;
  name: string;
  duas: HisnDua[];
}) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "sent" | "limit" | "error">("idle");
  const [pending, start] = useTransition();

  const send = (messageKey: string) =>
    start(async () => {
      const res = await sendNudge({ circleId, recipientId, messageKey });
      setStatus(res.ok ? "sent" : res.error === "limit" ? "limit" : "error");
    });

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 px-4 text-sm"
        onClick={() => {
          setStatus("idle");
          dialog.current?.showModal();
        }}
      >
        {t("circles.encourage")}
      </Button>

      <dialog
        ref={dialog}
        aria-labelledby={`enc-${recipientId}`}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] overscroll-contain rounded-[var(--radius-card)] bg-surface p-0 text-ink shadow-lift backdrop:bg-navy-950/30 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="flex max-h-[85dvh] flex-col gap-5 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={`enc-${recipientId}`} className="text-xl font-bold tracking-tight">
              {t("circles.encourageTitle", { name })}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t("circles.close")}
              className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-2"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p role="status" aria-live="polite" className={status === "idle" ? "sr-only" : "rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium"}>
            {status === "sent" ? t("circles.sent") : status === "limit" ? t("circles.limit") : status === "error" ? t("common.error") : ""}
          </p>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted">{t("circles.presetsLabel")}</h3>
            <ul className="flex flex-col gap-2">
              {NUDGE_PRESETS.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => send(key)}
                    className="flex min-h-12 w-full items-center rounded-2xl bg-surface-2 px-4 py-3 text-start font-medium transition-[background-color] duration-200 hover:bg-sky-50 disabled:opacity-60"
                  >
                    {t(key.replace(/^nudge\./, "nudges.") as MessageKey)}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted">{t("circles.duasLabel")}</h3>
            {duas.length === 0 ? (
              <p className="text-sm text-muted">{t("circles.duaUnavailable")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {duas.map((d) => (
                  <li key={duaKey(d)} className="flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-border">
                    <DuaBlock dua={d} compact />
                    <Button type="button" variant="secondary" disabled={pending} onClick={() => send(duaKey(d))} className="self-start min-h-11 text-sm">
                      {t("circles.encourage")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </dialog>
    </>
  );
}
