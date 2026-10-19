"use client";

import { useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui";

/** Runs a server action only after the user confirms (destructive actions are never immediate). */
export function ConfirmButton({
  action,
  fields,
  confirm,
  children,
  variant = "secondary",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  confirm: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        if (!window.confirm(confirm)) return;
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, v);
        start(() => action(fd));
      }}
    >
      {children}
    </Button>
  );
}
