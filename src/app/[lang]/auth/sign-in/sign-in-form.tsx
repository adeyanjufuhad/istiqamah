"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInForm() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "google">("idle");
  const [error, setError] = useState<string | null>(null);
  const callbackURL = `/${locale}/today`;

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    setError(null);
    setStatus("sending");
    const { error } = await authClient.signIn.magicLink({ email: value, callbackURL });
    if (error) {
      setError(error.message || t("common.error"));
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  async function google() {
    setError(null);
    setStatus("google");
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL });
    if (error) {
      setError(error.message || t("common.error"));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <Card aria-live="polite" className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t("auth.checkEmailTitle")}</h2>
        <p className="leading-relaxed text-muted">{t("auth.checkEmailBody", { email: email.trim() })}</p>
        <Button variant="ghost" className="self-start px-0" onClick={() => setStatus("idle")}>
          {t("auth.useDifferentEmail")}
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={sendLink} noValidate className="flex flex-col gap-4">
        <Field id="email" label={t("auth.emailLabel")} error={error ?? undefined}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            aria-invalid={!!error}
            aria-describedby={error ? "email-error" : undefined}
          />
        </Field>
        <Button type="submit" disabled={status !== "idle"}>
          {status === "sending" ? t("auth.sending") : t("auth.sendLink")}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="secondary" onClick={google} disabled={status !== "idle"}>
        <GoogleIcon />
        {t("auth.google")}
      </Button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}
