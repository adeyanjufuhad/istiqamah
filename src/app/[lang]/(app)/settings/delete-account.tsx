"use client";

import { useActionState, useEffect } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { deleteAccount } from "./actions";

export function DeleteAccount() {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(deleteAccount, null);
  const error =
    state?.error === "mismatch" ? t("settings.deleteMismatch") : state?.error ? t("common.error") : undefined;

  useEffect(() => {
    if (!state?.done) return;
    // Drop anything cached offline before leaving.
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith("istiqamah-")).map((k) => caches.delete(k)));
        localStorage.clear();
      } catch {}
      window.location.replace(`/${locale}?deleted=1`);
    })();
  }, [state, locale]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <h3 className="font-semibold">{t("settings.deleteTitle")}</h3>
      <p className="text-sm text-muted">{t("settings.deleteBody")}</p>
      <input type="hidden" name="locale" value={locale} />
      <Field id="confirm-delete" label={t("settings.deleteConfirmLabel")} error={error}>
        <Input
          id="confirm-delete"
          name="confirm"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? "confirm-delete-error" : undefined}
        />
      </Field>
      <Button type="submit" variant="danger" disabled={pending || !!state?.done} className="self-start">
        {pending || state?.done ? t("settings.deleting") : t("settings.deleteButton")}
      </Button>
    </form>
  );
}
