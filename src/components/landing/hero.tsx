"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import Aurora from "@/components/reactbits/Aurora";
import BlurText from "@/components/reactbits/BlurText";
import CardSwap, { Card } from "@/components/reactbits/CardSwap";
import Magnet from "@/components/reactbits/Magnet";
import RotatingText from "@/components/reactbits/RotatingText";
import SplitText from "@/components/reactbits/SplitText";
import { useI18n } from "@/i18n/client";
import { useMotionPref } from "./motion-pref";
import { KhatmCard, NextPrayerCard, NudgeCard, TodayCard } from "./preview-cards";

export function Hero({ rotating }: { rotating: string[] }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const { paused } = useMotionPref();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Atmosphere: soft aurora in the owner palette, fading into the canvas. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] opacity-80">
        <Aurora colorStops={["#90e0ef", "#00b4d8", "#caf0f8"]} amplitude={0.9} blend={0.55} speed={0.6} lightMode paused={paused} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f5fbfd]/40 to-[#f5fbfd]" />
      </div>

      <div className="mx-auto grid min-h-[100dvh] max-w-6xl grid-cols-1 items-center gap-14 px-4 pb-20 pt-32 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:gap-8 md:pt-28">
        <div className="flex flex-col items-start gap-7">
          <span className="max-w-full rounded-full bg-white/70 px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-ocean-600 ring-1 ring-navy-950/5 backdrop-blur">
            {t("landing.eyebrow")}
          </span>

          {reduce ? (
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] text-navy-950 md:text-7xl">
              {t("landing.headline")}
            </h1>
          ) : (
            <SplitText
              text={t("landing.headline")}
              tag="h1"
              splitType="words"
              effect="blur"
              delay={70}
              duration={1.1}
              trigger="load"
              textAlign="start"
              className="text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] text-navy-950 md:text-7xl"
            />
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-2xl font-semibold tracking-tight text-navy-950 md:text-3xl">
            <span>{t("landing.keepUp")}</span>
            <RotatingText
              texts={rotating}
              effect="blur"
              rotationInterval={2400}
              auto={!paused}
              staggerDuration={0.02}
              mainClassName="overflow-hidden rounded-2xl bg-ocean-600 px-3.5 py-1 text-white"
              aria-live="off"
            />
          </p>

          {reduce ? (
            <p className="max-w-[52ch] text-lg leading-relaxed text-muted">{t("landing.body")}</p>
          ) : (
            <BlurText
              text={t("landing.body")}
              animateBy="words"
              direction="bottom"
              delay={18}
              trigger="load"
              className="max-w-[52ch] text-lg leading-relaxed text-muted"
            />
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Magnet padding={60} magnetStrength={6} disabled={!!reduce}>
              <Link
                href={`/${locale}/auth/sign-in`}
                className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-ocean-600 py-2 pe-2 ps-7 text-base font-semibold text-white shadow-[0_18px_40px_-16px_rgb(0_119_182/0.7)] transition-[background-color,transform] duration-300 ease-soft hover:bg-navy-800 active:scale-[0.98]"
              >
                {t("landing.cta")}
                <span className="grid size-10 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-soft group-hover:-translate-y-px group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  <svg viewBox="0 0 24 24" className="size-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </Magnet>
            <a
              href="#how"
              className="inline-flex min-h-14 items-center rounded-full px-6 font-semibold text-navy-950 ring-1 ring-navy-950/10 transition-[background-color] duration-300 ease-soft hover:bg-white/70"
            >
              {t("landing.ctaSecondary")}
            </a>
          </div>
          <p className="text-sm font-medium text-muted">{t("landing.trust")}</p>
        </div>

        {/* Live-looking app preview. Decorative (inert: hidden from AT and focus); the copy carries the meaning. */}
        <div inert className="relative mx-auto h-[28rem] w-full max-w-[24rem] md:h-[36rem] md:max-w-none">
          <div className="absolute inset-10 -z-10 rounded-full bg-sky-300/35 blur-3xl" />
          <CardSwap
            width={300}
            height={360}
            cardDistance={40}
            verticalDistance={48}
            delay={4200}
            autoplay={!paused}
            theme="light"
            cardRadius={28}
          >
            <Card>
              <NextPrayerCard label={t("landing.previewNext")} prayer="Asr" time="15:52" eta={t("landing.previewIn")} />
            </Card>
            <Card>
              <TodayCard label={t("landing.previewToday")} summary={t("landing.previewDone")} />
            </Card>
            <Card>
              <KhatmCard label={t("landing.previewKhatm")} value={t("landing.previewKhatmValue")} />
            </Card>
            <Card>
              <NudgeCard from={t("landing.previewNudgeFrom")} message={t("landing.previewNudge")} />
            </Card>
          </CardSwap>
        </div>
      </div>
    </section>
  );
}
