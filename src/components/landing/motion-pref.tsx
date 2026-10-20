"use client";

import { useReducedMotion } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";

const Ctx = createContext<{ paused: boolean }>({ paused: false });

/**
 * Looping motion (aurora, card stack, marquee, ornaments) pauses for users who
 * ask their OS for reduced motion. (The on-page pause toggle was removed at the
 * owner’s request.)
 */
export function MotionPrefProvider({ children }: { children: ReactNode }) {
  const paused = !!useReducedMotion();
  return <Ctx value={{ paused }}>{children}</Ctx>;
}

export const useMotionPref = () => useContext(Ctx);
