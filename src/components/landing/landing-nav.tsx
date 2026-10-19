"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";
import { useI18n } from "@/i18n/client";

/** Floating glass pill, detached from the top edge. Collapses links into a sheet on mobile. */
export function LandingNav() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // IntersectionObserver on a sentinel instead of a scroll listener.
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: "#how", label: t("landing.navHow") },
    { href: "#circles", label: t("landing.navCircles") },
    { href: "#sources", label: t("landing.navTrust") },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <nav
        aria-label="Primary"
        className={`mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full py-2 pe-2 ps-4 ring-1 backdrop-blur-xl transition-[background-color,box-shadow] duration-500 ease-soft ${
          scrolled ? "bg-white/80 shadow-soft ring-navy-950/5" : "bg-white/40 ring-white/60"
        }`}
      >
        <Link href={`/${locale}`} className="flex items-center gap-2.5 rounded-full" translate="no">
          <LogoMark className="size-8" />
          <span className="font-bold tracking-tight text-navy-950">Istiqamah</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-4 py-2 text-sm font-semibold text-navy-950/80 transition-colors duration-300 hover:bg-white hover:text-navy-950">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/${locale}/auth/sign-in`}
            className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold text-navy-950 transition-colors duration-300 hover:bg-white sm:inline-flex"
          >
            {t("landing.navSignIn")}
          </Link>
          <Link
            href={`/${locale}/auth/sign-in`}
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-navy-950 px-4 text-sm font-semibold text-white sm:px-5 transition-[background-color,transform] duration-300 ease-soft hover:bg-navy-800 active:scale-[0.98]"
          >
            {t("landing.navStart")}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t("landing.navMenu")}
            className="relative grid size-11 place-items-center rounded-full md:hidden"
          >
            <span
              aria-hidden="true"
              className={`absolute h-0.5 w-5 rounded bg-navy-950 transition-transform duration-500 ease-soft ${open ? "rotate-45" : "-translate-y-1"}`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-0.5 w-5 rounded bg-navy-950 transition-transform duration-500 ease-soft ${open ? "-rotate-45" : "translate-y-1"}`}
            />
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="mx-auto mt-2 max-w-5xl overscroll-contain rounded-[2rem] bg-white/90 p-3 shadow-lift ring-1 ring-navy-950/5 backdrop-blur-xl md:hidden"
      >
        <ul className="flex flex-col">
          {links.map((l, i) => (
            <li key={l.href} style={{ animationDelay: `${i * 60}ms` }} className="animate-[menu-in_500ms_var(--ease-out-soft)_both]">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-2xl px-4 text-lg font-semibold text-navy-950 hover:bg-sky-50"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link href={`/${locale}/auth/sign-in`} className="flex min-h-12 items-center rounded-2xl px-4 text-lg font-semibold text-ocean-600 hover:bg-sky-50">
              {t("landing.navSignIn")}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
