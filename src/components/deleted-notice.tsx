"use client";

import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";

export function DeletedNotice() {
  const { t } = useI18n();
  if (useSearchParams().get("deleted") !== "1") return null;
  return (
    <p role="status" className="rounded-2xl bg-primary-soft px-4 py-3 text-primary-soft-ink">
      {t("landing.deleted")}
    </p>
  );
}
