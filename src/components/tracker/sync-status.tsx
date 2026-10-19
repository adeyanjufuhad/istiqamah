"use client";

import { useI18n } from "@/i18n/client";
import type { SyncState } from "./use-logs";

export function SyncStatus({ sync }: { sync: SyncState }) {
  const { t } = useI18n();
  let text: string | null = null;
  if (sync.last === "unauthorized") text = t("today.sync.unauthorized");
  else if (!sync.online && sync.pendingCount > 0) text = t("today.sync.offline");
  else if (sync.pendingCount > 0) text = t("today.sync.pending", { count: sync.pendingCount });
  return (
    <p role="status" aria-live="polite" className={text ? "rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted" : "sr-only"}>
      {text}
    </p>
  );
}
