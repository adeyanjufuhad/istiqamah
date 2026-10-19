"use client";

import { useState, type ReactNode } from "react";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/client";

export function InviteCard({ circleName, code, link, children }: { circleName: string; code: string; link: string; children?: ReactNode }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  // Fall back to the current origin if NEXT_PUBLIC_APP_URL isn't configured.
  const url = () => (link.startsWith("http") ? link : `${window.location.origin}${link}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: circleName, text: t("circles.shareText"), url: url() });
        return;
      } catch {
        return; // user cancelled
      }
    }
    copy();
  }

  return (
    <Card className="flex flex-col gap-4 bg-gradient-to-br from-white to-sky-50">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t("circles.invite")}</h2>
        <p className="text-sm text-muted">{t("circles.inviteBody")}</p>
      </div>
      <p
        className="w-fit rounded-2xl bg-white px-5 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-ink ring-1 ring-sky-100 tabular-nums"
        aria-label={`${t("circles.codeLabel")}: ${code.split("").join(" ")}`}
        translate="no"
      >
        {code}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={share}>
          {t("circles.share")}
        </Button>
        <Button type="button" variant="secondary" onClick={copy} aria-live="polite">
          {copied ? t("circles.copied") : t("circles.copyLink")}
        </Button>
        {children}
      </div>
    </Card>
  );
}
