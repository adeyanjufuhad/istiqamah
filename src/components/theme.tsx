"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";

export type ThemeChoice = "system" | "light" | "dark";

/** Runs before paint (inlined in <head>) so there is no flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

function apply(choice: ThemeChoice) {
  const dark =
    choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const listeners = new Set<() => void>();

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function ThemePicker() {
  const { t } = useI18n();
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as const);

  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  function select(next: ThemeChoice) {
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    apply(next);
    listeners.forEach((l) => l());
  }

  const options: { value: ThemeChoice; label: string }[] = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{t("settings.theme")}</legend>
      <div className="grid grid-cols-3 gap-2" role="radiogroup">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface px-3 text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]"
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={choice === o.value}
              onChange={() => select(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
