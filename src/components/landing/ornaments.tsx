"use client";

/**
 * Decorative Islamic ornaments for the landing page: crescent, stars, mosque
 * skyline, lanterns, eight-point star pattern and a faint Arabic-script texture.
 * All are aria-hidden, objects/architecture only, transform/opacity animation only,
 * and they freeze with the motion toggle or prefers-reduced-motion.
 */
import type { CSSProperties } from "react";
import { useMotionPref } from "./motion-pref";

function usePlayState(): CSSProperties {
  const { paused } = useMotionPref();
  return { animationPlayState: paused ? "paused" : "running" };
}

/* ----------------------------------------------------------- crescent moon */

export function CrescentMoon({ className = "" }: { className?: string }) {
  const play = usePlayState();
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <div className="animate-[float_9s_ease-in-out_infinite]" style={play}>
        <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#caf0f8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#caf0f8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="moon-face" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ade8f4" />
            </linearGradient>
            <mask id="crescent-cut">
              <rect width="120" height="120" fill="white" />
              <circle cx="74" cy="46" r="34" fill="black" />
            </mask>
          </defs>
          <circle cx="60" cy="60" r="58" fill="url(#moon-glow)" />
          <circle cx="60" cy="60" r="38" fill="url(#moon-face)" mask="url(#crescent-cut)" />
          <circle cx="60" cy="60" r="38" fill="none" stroke="#0077b6" strokeOpacity="0.18" strokeWidth="1.2" mask="url(#crescent-cut)" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- stars */

const STAR_POINTS = "M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z";

export function Stars({ stars, className = "" }: { stars: { x: string; y: string; s: number; d: number }[]; className?: string }) {
  const play = usePlayState();
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {stars.map((st, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="absolute animate-[twinkle_4s_ease-in-out_infinite] text-sky-300"
          style={{ left: st.x, top: st.y, width: st.s, height: st.s, animationDelay: `${st.d}s`, ...play }}
        >
          <path d={STAR_POINTS} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- mosque skyline */

type Building =
  | { type: "dome"; x: number; w: number; h: number; base: number }
  | { type: "minaret"; x: number; w: number; h: number };

/** Builds one silhouette path (viewBox 0 0 1200 220, ground at y=220). */
function skylinePath(buildings: Building[]) {
  const G = 220;
  let d = "";
  for (const b of buildings) {
    if (b.type === "minaret") {
      const { x, w, h } = b;
      const top = G - h;
      const cx = x + w / 2;
      d += `M${x} ${G}V${top + 26}h${-3}v-6h${w + 6}v6h-3V${G}Z`; // shaft + balcony
      d += `M${x + 2} ${top + 20}V${top + 12}Q${cx} ${top - 6} ${x + w - 2} ${top + 12}V${top + 20}Z`; // cap
      d += `M${cx - 0.8} ${top + 2}V${top - 12}h1.6V${top + 2}Z`; // spire
    } else {
      const { x, w, h, base } = b;
      const r = w / 2;
      const cx = x + r;
      const domeBase = G - base;
      d += `M${x - 10} ${G}V${domeBase}H${x + w + 10}V${G}Z`; // hall
      d += `M${x} ${domeBase}C${x} ${domeBase - h * 0.7} ${cx - r * 0.35} ${domeBase - h} ${cx} ${domeBase - h - 8}C${cx + r * 0.35} ${domeBase - h} ${x + w} ${domeBase - h * 0.7} ${x + w} ${domeBase}Z`; // onion dome
      d += `M${cx - 0.9} ${domeBase - h - 6}V${domeBase - h - 22}h1.8V${domeBase - h - 6}Z`; // finial
      d += `M${cx + 4} ${domeBase - h - 26}a5 5 0 1 1 -1 -6a4 4 0 1 0 1 6Z`; // tiny crescent on finial
    }
  }
  return d;
}

const BACK: Building[] = [
  { type: "minaret", x: 70, w: 16, h: 170 },
  { type: "dome", x: 130, w: 110, h: 70, base: 70 },
  { type: "minaret", x: 280, w: 14, h: 140 },
  { type: "dome", x: 560, w: 150, h: 92, base: 86 },
  { type: "minaret", x: 520, w: 16, h: 196 },
  { type: "minaret", x: 734, w: 16, h: 196 },
  { type: "dome", x: 930, w: 96, h: 60, base: 64 },
  { type: "minaret", x: 1070, w: 14, h: 150 },
];

const FRONT: Building[] = [
  { type: "dome", x: 20, w: 80, h: 48, base: 44 },
  { type: "dome", x: 330, w: 120, h: 64, base: 50 },
  { type: "minaret", x: 470, w: 12, h: 120 },
  { type: "dome", x: 790, w: 110, h: 58, base: 48 },
  { type: "minaret", x: 920, w: 12, h: 110 },
  { type: "dome", x: 1100, w: 90, h: 50, base: 42 },
];

export function MosqueSkyline({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <path d={skylinePath(BACK)} fill="#caf0f8" />
        <rect x="0" y="206" width="1200" height="14" fill="#caf0f8" />
        <path d={skylinePath(FRONT)} fill="#e6f6fa" />
        <rect x="0" y="212" width="1200" height="8" fill="#e6f6fa" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ lantern */

export function Lantern({ drop = 80, size = 56, delay = 0, className = "" }: { drop?: number; size?: number; delay?: number; className?: string }) {
  const play = usePlayState();
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <div className="origin-top animate-[swing_5s_ease-in-out_infinite]" style={{ animationDelay: `${delay}s`, ...play }}>
        <div className="mx-auto w-px bg-gradient-to-b from-transparent to-ocean-600/40" style={{ height: drop }} />
        <svg viewBox="0 0 60 110" style={{ width: size, height: size * 1.83 }} className="mx-auto -mt-px overflow-visible">
          <defs>
            <radialGradient id={`lantern-light-${delay}`} cx="50%" cy="58%" r="55%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#caf0f8" />
              <stop offset="100%" stopColor="#48cae4" stopOpacity="0.6" />
            </radialGradient>
          </defs>
          <circle cx="30" cy="62" r="34" fill="#90e0ef" opacity="0.25" />
          <path d="M30 0v8" stroke="#023e8a" strokeWidth="2" />
          <path d="M22 8h16l4 8H18z" fill="#023e8a" />
          <path d="M18 16h24l8 20H10z" fill="#0077b6" />
          <path d="M10 36h40l-4 46H14z" fill={`url(#lantern-light-${delay})`} stroke="#0077b6" strokeWidth="2" />
          <path d="M30 36v46M20 36l-2 46M40 36l2 46" stroke="#0077b6" strokeOpacity="0.45" strokeWidth="1.5" />
          <path d="M14 82h32l-6 10H20z" fill="#0077b6" />
          <path d="M24 92h12l-6 12z" fill="#023e8a" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- eight-point star tile */

export function StarPattern({ id, className = "", opacity = 0.08 }: { id: string; className?: string; opacity?: number }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} style={{ opacity }}>
      <defs>
        <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
          {/* Khatam: two overlapping squares, the classic eight-point star, plus linking diamonds. */}
          <g fill="none" stroke="#0077b6" strokeWidth="1.2">
            <rect x="21" y="21" width="30" height="30" />
            <rect x="21" y="21" width="30" height="30" transform="rotate(45 36 36)" />
            <circle cx="36" cy="36" r="6" />
            <path d="M0 0l8 8M72 0l-8 8M0 72l8-8M72 72l-8-8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------ Arabic script texture */

/**
 * Faint, slowly drifting rows of Arabic letterforms and the app name استقامة
 * ("steadfastness"). Deliberately no Quran, dhikr or names of Allah: sacred text
 * isn't used as background decoration.
 */
const LETTERS = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي";
const ROWS = [
  `استقامة  ${LETTERS}  استقامة`,
  `${LETTERS}  استقامة  ${LETTERS}`,
  `استقامة  ${LETTERS.split(" ").reverse().join(" ")}  استقامة`,
];

export function ArabicTexture({ className = "" }: { className?: string }) {
  const play = usePlayState();
  return (
    <div
      aria-hidden="true"
      lang="ar"
      dir="rtl"
      translate="no"
      className={`pointer-events-none absolute inset-0 flex select-none flex-col justify-center gap-10 overflow-hidden font-arabic text-navy-950 ${className}`}
    >
      {ROWS.map((row, i) => (
        <div
          key={i}
          className="flex w-max animate-[drift_120s_linear_infinite] whitespace-nowrap text-[clamp(3rem,9vw,7rem)] leading-none"
          style={{ animationDirection: i % 2 ? "reverse" : "normal", animationDuration: `${110 + i * 25}s`, ...play }}
        >
          <span className="pe-16">{row}</span>
          <span className="pe-16">{row}</span>
        </div>
      ))}
    </div>
  );
}
