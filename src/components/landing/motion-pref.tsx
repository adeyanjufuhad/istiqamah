"use client";

import { useReducedMotion } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";

type MotionPref = { paused: boolean; toggle: () => void };

const Ctx = createContext<MotionPref>({ paused: false, toggle: () => {} });

/**
 * Looping motion (aurora, card stack, marquee) runs longer than 5 seconds, so
 * WCAG 2.2.2 requires a way to pause it. Reduced-motion users start paused.
 */
export function MotionPrefProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? !!reduce;
  return <Ctx value={{ paused, toggle: () => setUserPaused(!paused) }}>{children}</Ctx>;
}

export const useMotionPref = () => useContext(Ctx);

export function MotionToggle() {
  const { t } = useI18n();
  const { paused, toggle } = useMotionPref();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-semibold text-navy-950 shadow-soft ring-1 ring-navy-950/5 backdrop-blur-xl transition-[background-color] duration-300 hover:bg-white"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M8 5.5v13l11-6.5z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
      </svg>
      {paused ? t("landing.playMotion") : t("landing.pauseMotion")}
    </button>
  );
}
