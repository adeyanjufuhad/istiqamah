"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/client";

type State =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "no-sw" }
  | { kind: "denied" }
  | { kind: "off" }
  | { kind: "on"; endpoint: string; prayers: boolean; adhkar: boolean };

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function save(sub: PushSubscription, prefs: { prayers: boolean; adhkar: boolean }) {
  const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, keys, ...prefs }),
  });
  if (!res.ok) throw new Error(`subscribe ${res.status}`);
}

export function Reminders({ hasLocation }: { hasLocation: boolean }) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const set = (s: State) => !cancelled && setState(s);
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return set({ kind: "unsupported" });
      if (Notification.permission === "denied") return set({ kind: "denied" });
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return set({ kind: "no-sw" });
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return set({ kind: "off" });
      const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`);
      if (!res.ok) return set({ kind: "off" });
      const prefs = (await res.json()) as { prayers: boolean; adhkar: boolean };
      set({ kind: "on", endpoint: sub.endpoint, ...prefs });
    })().catch(() => setState({ kind: "off" }));
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState({ kind: permission === "denied" ? "denied" : "off" });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("missing VAPID key");
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
      const prefs = { prayers: true, adhkar: true };
      await save(sub, prefs);
      setState({ kind: "on", endpoint: sub.endpoint, ...prefs });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (state.kind !== "on") return;
    setBusy(true);
    setError(false);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: state.endpoint }),
      });
      await sub?.unsubscribe();
      setState({ kind: "off" });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(field: "prayers" | "adhkar", value: boolean) {
    if (state.kind !== "on") return;
    const next = { prayers: state.prayers, adhkar: state.adhkar, [field]: value };
    setState({ ...state, ...next });
    setError(false);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await save(sub, next);
    } catch {
      setError(true);
      setState(state);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t("reminders.title")}</h2>
        <p className="text-sm leading-relaxed text-muted">{t("reminders.intro")}</p>
      </div>

      {!hasLocation && <p className="text-sm text-muted">{t("reminders.needsLocation")}</p>}

      <div aria-live="polite" className="flex flex-col gap-3">
        {state.kind === "unsupported" && <p className="text-sm text-muted">{t("reminders.unsupported")}</p>}
        {state.kind === "denied" && <p className="text-sm text-muted">{t("reminders.denied")}</p>}
        {state.kind === "no-sw" && <p className="text-sm text-muted">{t("reminders.devOnly")}</p>}

        {state.kind === "off" && (
          <Button type="button" onClick={enable} disabled={busy || !hasLocation} className="self-start">
            {busy ? t("reminders.enabling") : t("reminders.enable")}
          </Button>
        )}

        {state.kind === "on" && (
          <>
            <p className="text-sm font-medium text-primary">{t("reminders.on")}</p>
            {(["prayers", "adhkar"] as const).map((field) => (
              <label key={field} className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface-2 px-4 py-2">
                <span className="text-sm font-semibold">{t(`reminders.${field}`)}</span>
                <input
                  type="checkbox"
                  role="switch"
                  className="peer sr-only"
                  checked={state[field]}
                  onChange={(e) => toggle(field, e.target.checked)}
                />
                <span
                  aria-hidden="true"
                  className="relative h-7 w-12 shrink-0 rounded-full bg-border transition-[background-color] duration-300 ease-soft after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-soft peer-checked:bg-primary peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]"
                />
              </label>
            ))}
            <Button type="button" variant="secondary" onClick={disable} disabled={busy} className="self-start">
              {t("reminders.disable")}
            </Button>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t("reminders.error")}
          </p>
        )}
      </div>
    </Card>
  );
}
