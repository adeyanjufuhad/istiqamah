"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { joinCircle } from "../../(app)/circles/actions";

export function JoinButton({ code }: { code: string }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(joinCircle, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="locale" value={locale} />
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error === "full" ? t("circles.errorFull") : t("circles.errorInvalidCode")}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("circles.joining") : t("circles.join")}
      </Button>
    </form>
  );
}
