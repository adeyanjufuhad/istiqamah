"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import CountUp from "@/components/reactbits/CountUp";
import Magnet from "@/components/reactbits/Magnet";
import ScrollReveal from "@/components/reactbits/ScrollReveal";
import ScrollVelocity from "@/components/reactbits/ScrollVelocity";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import StarBorder from "@/components/reactbits/StarBorder";
import { useReducedMotion } from "motion/react";
import { useI18n } from "@/i18n/client";
import { useMotionPref } from "./motion-pref";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-sky-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ocean-600">
      {children}
    </span>
  );
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <AnimatedContent distance={48} blur={8} duration={0.9} ease="power3.out" delay={delay} threshold={0.15} className={className}>
      {children}
    </AnimatedContent>
  );
}

/* ------------------------------------------------------------------ marquee */

export function PrayerMarquee({ first, second }: { first: string[]; second: string[] }) {
  const { paused } = useMotionPref();
  return (
    <section aria-label="Daily rhythm" className="border-y border-border/70 bg-white/60 py-8">
      <ScrollVelocity
        texts={[first.join("  ·  "), second.join("  ·  ")]}
        velocity={paused ? 0 : 40}
        numCopies={4}
        gap={48}
        fontSize="clamp(2.25rem, 6vw, 4.5rem)"
        fontWeight={800}
        color="#03045e"
        outlineAlternate
        fadeEdges
        className="tracking-[-0.03em]"
      />
    </section>
  );
}

/* ---------------------------------------------------------------- manifesto */

export function Manifesto() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-5xl px-4 py-28 sm:px-6 md:py-40">
      <ScrollReveal
        baseOpacity={0.12}
        enableBlur
        blurStrength={6}
        baseRotation={2}
        splitBy="words"
        effect="rise"
        containerClassName="m-0"
        textClassName="text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-navy-950 md:text-5xl"
      >
        {t("landing.manifesto")}
      </ScrollReveal>
    </section>
  );
}

/* -------------------------------------------------------------------- bento */

const spot = { spotlightColor: "rgba(0, 180, 216, 0.22)", theme: "light" as const, softness: 0.7 };

function BentoCard({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`rounded-[2rem] bg-white/60 p-1.5 ring-1 ring-navy-950/5 ${className}`}>
      <SpotlightCard {...spot} className="h-full rounded-[calc(2rem-6px)] bg-white p-7 shadow-[inset_0_1px_0_white] md:p-9">
        {children}
      </SpotlightCard>
    </div>
  );
}

const DAY = [
  { name: "Fajr", bg: "bg-sky-50", ink: "text-navy-950" },
  { name: "Dhuhr", bg: "bg-sky-100", ink: "text-navy-950" },
  { name: "Asr", bg: "bg-sky-300", ink: "text-navy-950" },
  { name: "Maghrib", bg: "bg-ocean-600", ink: "text-white" },
  { name: "Isha", bg: "bg-navy-950", ink: "text-white" },
];

export function Bento() {
  const { t } = useI18n();
  return (
    <section id="circles" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-24 sm:px-6 md:py-32">
      <Reveal className="mb-12 flex max-w-2xl flex-col items-start gap-4">
        <Eyebrow>{t("landing.bentoEyebrow")}</Eyebrow>
        <h2 className="text-4xl font-bold tracking-[-0.02em] text-navy-950 md:text-5xl">{t("landing.bentoTitle")}</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <BentoCard className="h-full">
            <div className="flex h-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-sm flex-col gap-3">
                <h3 className="text-2xl font-bold tracking-tight text-navy-950">{t("landing.trackerTitle")}</h3>
                <p className="leading-relaxed text-muted">{t("landing.trackerBody")}</p>
              </div>
              <ul aria-hidden="true" className="flex shrink-0 flex-col gap-2">
                {["Fajr", "Quran · 2 pages", "Morning adhkar"].map((label, i) => (
                  <li
                    key={label}
                    style={{ animationDelay: `${600 + i * 450}ms` }}
                    className="flex min-w-56 items-center justify-between gap-6 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-navy-950"
                  >
                    {label}
                    <span
                      style={{ animationDelay: `${600 + i * 450}ms` }}
                      className="grid size-6 animate-[check-pop_700ms_var(--ease-out-soft)_both] place-items-center rounded-full bg-ocean-600 text-white"
                    >
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.5}>
                        <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </BentoCard>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.08}>
          <BentoCard className="h-full">
            <div className="flex h-full flex-col gap-5">
              <div aria-hidden="true" className="flex h-20 overflow-hidden rounded-2xl">
                {DAY.map((d) => (
                  <span key={d.name} className={`flex flex-1 items-end justify-center pb-2 text-[10px] font-bold ${d.bg} ${d.ink}`}>
                    {d.name}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-navy-950">{t("landing.timesTitle")}</h3>
              <p className="text-sm leading-relaxed text-muted">{t("landing.timesBody")}</p>
            </div>
          </BentoCard>
        </Reveal>

        <Reveal className="md:col-span-2">
          <BentoCard className="h-full">
            <div className="flex h-full flex-col gap-4">
              <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-ocean-600">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M3 9a13 13 0 0 1 18 0M6.5 12.5a8 8 0 0 1 11 0M10 16a3 3 0 0 1 4 0M12 19.5h.01M3 3l18 18" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="text-xl font-bold tracking-tight text-navy-950">{t("landing.offlineTitle")}</h3>
              <p className="text-sm leading-relaxed text-muted">{t("landing.offlineBody")}</p>
            </div>
          </BentoCard>
        </Reveal>

        <Reveal className="md:col-span-4" delay={0.08}>
          <BentoCard className="h-full">
            <div className="flex h-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex max-w-md flex-col gap-3">
                <h3 className="text-2xl font-bold tracking-tight text-navy-950">{t("landing.circlesTitle")}</h3>
                <p className="leading-relaxed text-muted">{t("landing.circlesBody")}</p>
              </div>
              <div aria-hidden="true" className="flex -space-x-3 rtl:space-x-reverse">
                {["A", "Y", "M", "H"].map((l, i) => (
                  <span
                    key={l}
                    className="grid size-14 animate-[float_6s_ease-in-out_infinite] place-items-center rounded-full text-lg font-bold text-white ring-4 ring-white"
                    style={{
                      animationDelay: `${i * 0.6}s`,
                      background: ["#0077b6", "#0096c7", "#023e8a", "#00b4d8"][i],
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </BentoCard>
        </Reveal>

        <Reveal className="md:col-span-3">
          <BentoCard className="h-full">
            <p className="flex items-baseline gap-3 text-navy-950">
              <CountUp to={30} from={1} duration={2.2} className="text-7xl font-extrabold tracking-[-0.04em] tabular-nums" />
              <span className="text-xl font-bold">{t("landing.khatmTitle")}</span>
            </p>
            <p className="mt-3 leading-relaxed text-muted">{t("landing.khatmBody")}</p>
          </BentoCard>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.08}>
          <BentoCard className="h-full">
            <div className="flex h-full flex-col gap-3">
              <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-ocean-600">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
                  <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="text-xl font-bold tracking-tight text-navy-950">{t("landing.privacyTitle")}</h3>
              <p className="text-sm leading-relaxed text-muted">{t("landing.privacyBody")}</p>
            </div>
          </BentoCard>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- steps */

export function Steps() {
  const { t } = useI18n();
  const steps = [
    { n: "01", title: t("landing.step1Title"), body: t("landing.step1Body") },
    { n: "02", title: t("landing.step2Title"), body: t("landing.step2Body") },
    { n: "03", title: t("landing.step3Title"), body: t("landing.step3Body") },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-24 sm:px-6 md:py-32">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <Reveal className="flex flex-col items-start gap-4 md:sticky md:top-32 md:self-start">
          <Eyebrow>{t("landing.stepsEyebrow")}</Eyebrow>
          <h2 className="text-4xl font-bold tracking-[-0.02em] text-navy-950 md:text-5xl">{t("landing.stepsTitle")}</h2>
        </Reveal>
        <ol className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.1}>
                <div className="flex gap-6 rounded-[2rem] bg-white p-7 ring-1 ring-navy-950/5 md:p-9">
                  <span className="text-sm font-bold tabular-nums text-ocean-500">{s.n}</span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-navy-950">{s.title}</h3>
                    <p className="leading-relaxed text-muted">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ sources */

export function Sources() {
  const { t } = useI18n();
  const sources = [
    { name: "Aladhan", what: t("landing.sourceAladhan"), href: "https://aladhan.com/prayer-times-api" },
    { name: "Al Quran Cloud", what: t("landing.sourceQuran"), href: "https://alquran.cloud/api" },
    { name: "Hisn al-Muslim", what: t("landing.sourceHisn"), href: "https://www.hisnmuslim.com" },
  ];
  return (
    <section id="sources" className="scroll-mt-28 px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-50 via-white to-sky-100 p-8 ring-1 ring-navy-950/5 md:p-14">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="flex flex-col items-start gap-4">
            <Eyebrow>{t("landing.trustEyebrow")}</Eyebrow>
            <h2 className="text-4xl font-bold tracking-[-0.02em] text-navy-950 md:text-5xl">{t("landing.trustTitle")}</h2>
            <p className="max-w-[48ch] text-lg leading-relaxed text-muted">{t("landing.trustBody")}</p>
            <p className="max-w-[48ch] rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-muted ring-1 ring-navy-950/5">
              {t("scholar.note")}
            </p>
          </Reveal>
          <ul className="flex flex-col gap-3 self-center">
            {sources.map((s, i) => (
              <li key={s.name}>
                <Reveal delay={i * 0.08}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-4 rounded-2xl bg-white px-6 py-5 ring-1 ring-navy-950/5 transition-[box-shadow,transform] duration-500 ease-soft hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <span className="flex flex-col">
                      <span className="font-bold text-navy-950" translate="no">
                        {s.name}
                      </span>
                      <span className="text-sm text-muted">{s.what}</span>
                    </span>
                    <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-sky-50 text-ocean-600 transition-transform duration-500 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      ↗
                    </span>
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- final cta */

export function FinalCta() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pb-28 pt-12 text-center sm:px-6 md:pb-40">
      <Reveal className="flex flex-col items-center gap-5">
        <h2 className="text-5xl font-extrabold tracking-[-0.03em] text-navy-950 md:text-7xl">{t("landing.finalTitle")}</h2>
        <p className="max-w-[46ch] text-lg leading-relaxed text-muted">{t("landing.finalBody")}</p>
      </Reveal>
      {reduce ? (
        <Link
          href={`/${locale}/auth/sign-in`}
          className="inline-flex min-h-14 items-center rounded-full bg-ocean-600 px-9 text-base font-semibold text-white hover:bg-navy-800"
        >
          {t("landing.cta")}
        </Link>
      ) : (
        <Magnet padding={70} magnetStrength={5}>
          <StarBorder
            as={Link}
            href={`/${locale}/auth/sign-in`}
            color="#00b4d8"
            theme="light"
            backgroundColor="#0077b6"
            textColor="#ffffff"
            radius={999}
            className="min-h-14 px-9 text-base font-semibold"
          >
            {t("landing.cta")}
          </StarBorder>
        </Magnet>
      )}
    </section>
  );
}
