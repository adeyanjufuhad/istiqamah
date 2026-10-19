"use client";

import { useActionState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { createCircle, joinCircle } from "./actions";

export function CircleForms() {
  const { t, locale } = useI18n();
  const [createState, create, creating] = useActionState(createCircle, null);
  const [joinState, join, joining] = useActionState(joinCircle, null);
  const joinError =
    joinState?.error === "full" ? t("circles.errorFull") : joinState?.error ? t("circles.errorInvalidCode") : undefined;

  return (
    <div className="grid gap-4">
      <Card>
        <form action={join} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("circles.joinTitle")}</h2>
          <input type="hidden" name="locale" value={locale} />
          <Field id="invite-code" label={t("circles.codeLabel")} error={joinError}>
            <Input
              id="invite-code"
              name="code"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              placeholder={t("circles.codePlaceholder")}
              className="font-semibold uppercase tracking-[0.2em] placeholder:normal-case placeholder:tracking-normal"
              aria-invalid={!!joinError}
              aria-describedby={joinError ? "invite-code-error" : undefined}
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={joining}>
            {joining ? t("circles.joining") : t("circles.join")}
          </Button>
        </form>
      </Card>

      <Card>
        <form action={create} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("circles.createTitle")}</h2>
          <input type="hidden" name="locale" value={locale} />
          <Field id="circle-name" label={t("circles.nameLabel")} error={createState?.error ? t("common.error") : undefined}>
            <Input id="circle-name" name="name" required maxLength={60} autoComplete="off" placeholder={t("circles.namePlaceholder")} />
          </Field>
          <Field id="circle-desc" label={t("circles.descLabel")} optional={t("common.optional")}>
            <Input id="circle-desc" name="description" maxLength={280} autoComplete="off" placeholder={t("circles.descPlaceholder")} />
          </Field>
          <Button type="submit" disabled={creating}>
            {creating ? t("circles.creating") : t("circles.create")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
