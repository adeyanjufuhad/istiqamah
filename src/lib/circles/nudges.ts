/**
 * Preset encouragement only: no free text between members (keeps circles kind
 * and avoids unvetted religious content). Copy lives in i18n under `nudges.*`.
 */
export const NUDGE_PRESETS = [
  "nudge.pray_together",
  "nudge.thinking_of_you",
  "nudge.quran_together",
  "nudge.begin_again",
  "nudge.made_dua",
] as const;

export type NudgePreset = (typeof NUDGE_PRESETS)[number];

export const isNudgePreset = (key: string): key is NudgePreset => (NUDGE_PRESETS as readonly string[]).includes(key);
