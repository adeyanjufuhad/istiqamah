"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/translate";
import { ONBOARDING_CHOICES, QURAN_UNITS, type OnboardingChoice, type QuranUnit } from "@/lib/habits/defaults";
import { CALCULATION_METHODS, suggestMethod } from "@/lib/prayer/methods";
import { saveOnboarding } from "./actions";

type Initial = {
  displayName: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string;
  country: string;
  calcMethod: number | null;
  asrSchool: 0 | 1;
};

type Step = "name" | "timezone" | "location" | "habits";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function OnboardingForm({ mode, initial }: { mode: "setup" | "edit"; initial: Initial }) {
  const { t, locale } = useI18n();
  const steps: Step[] = mode === "setup" ? ["name", "timezone", "location", "habits"] : ["name", "timezone", "location"];
  const [index, setIndex] = useState(0);
  const step = steps[index];

  const detectedTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [detectedTz];
    }
  }, [detectedTz]);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [timezone, setTimezone] = useState(initial.timezone ?? detectedTz);
  const [coords, setCoords] = useState(
    initial.latitude !== null && initial.longitude !== null ? { lat: initial.latitude, lng: initial.longitude } : null,
  );
  const [geo, setGeo] = useState<"idle" | "locating" | "denied">("idle");
  const [city, setCity] = useState(initial.city);
  const [country, setCountry] = useState(initial.country);
  const [calcMethod, setCalcMethod] = useState(initial.calcMethod ?? suggestMethod(initial.timezone ?? detectedTz));
  const [asrSchool, setAsrSchool] = useState<0 | 1>(initial.asrSchool);
  const [habits, setHabits] = useState<OnboardingChoice[]>(["prayers", "quran", "adhkar_morning", "adhkar_evening"]);
  const [quranTarget, setQuranTarget] = useState(2);
  const [quranUnit, setQuranUnit] = useState<QuranUnit>("pages");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Move focus to the new step's heading so screen readers announce it.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  function locate() {
    if (!("geolocation" in navigator)) return setGeo("denied");
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: round2(pos.coords.latitude), lng: round2(pos.coords.longitude) });
        setGeo("idle");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  }

  function next(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === "name" && !displayName.trim()) return;
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    startTransition(async () => {
      const result = await saveOnboarding({
        locale,
        mode,
        displayName,
        timezone,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        city: city.trim() || null,
        country: country.trim() || null,
        calcMethod,
        asrSchool,
        habits,
        quranTarget,
        quranUnit,
      });
      if (result?.error) setError(t("common.error"));
    });
  }

  const toggleHabit = (c: OnboardingChoice) =>
    setHabits((h) => (h.includes(c) ? h.filter((x) => x !== c) : [...h, c]));

  const isLast = index === steps.length - 1;

  return (
    <form onSubmit={next} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted">
          {t("onboarding.stepOf", { current: index + 1, total: steps.length })}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {step === "name" && (
        <section className="flex flex-col gap-4">
          <StepHeading ref={headingRef} title={t("onboarding.nameTitle")} />
          <Field id="displayName" label={t("onboarding.nameLabel")} help={t("onboarding.nameHelp")}>
            <Input
              id="displayName"
              autoComplete="given-name"
              maxLength={60}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-describedby="displayName-help"
            />
          </Field>
        </section>
      )}

      {step === "timezone" && (
        <section className="flex flex-col gap-4">
          <StepHeading ref={headingRef} title={t("onboarding.timezoneTitle")} body={t("onboarding.timezoneHelp")} />
          <Field id="timezone" label={t("onboarding.timezoneLabel")}>
            <Select
              id="timezone"
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                if (initial.calcMethod === null) setCalcMethod(suggestMethod(e.target.value));
              }}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </section>
      )}

      {step === "location" && (
        <section className="flex flex-col gap-5">
          <StepHeading ref={headingRef} title={t("onboarding.locationTitle")} body={t("onboarding.locationHelp")} />
          <div className="flex flex-col gap-2" aria-live="polite">
            <Button type="button" variant="secondary" onClick={locate} disabled={geo === "locating"}>
              {geo === "locating" ? t("onboarding.locating") : t("onboarding.useMyLocation")}
            </Button>
            {coords && geo !== "locating" && (
              <p className="text-sm text-primary-soft-ink">
                {t("onboarding.locationSet", { lat: coords.lat.toFixed(2), lng: coords.lng.toFixed(2) })}
              </p>
            )}
            {geo === "denied" && <p className="text-sm text-muted">{t("onboarding.locationDenied")}</p>}
          </div>
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">{t("onboarding.orCity")}</legend>
            <Field id="city" label={t("onboarding.cityLabel")} optional={t("common.optional")}>
              <Input id="city" autoComplete="address-level2" maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field id="country" label={t("onboarding.countryLabel")} optional={t("common.optional")}>
              <Input id="country" autoComplete="country-name" maxLength={80} value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
          </fieldset>
          <Field id="calcMethod" label={t("onboarding.methodLabel")} help={t("onboarding.methodHelp")}>
            <Select
              id="calcMethod"
              value={calcMethod}
              onChange={(e) => setCalcMethod(Number(e.target.value))}
              aria-describedby="calcMethod-help"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">{t("onboarding.asrLabel")}</legend>
            {([0, 1] as const).map((v) => (
              <ChoiceRow
                key={v}
                type="radio"
                name="asr"
                checked={asrSchool === v}
                onChange={() => setAsrSchool(v)}
                label={v === 0 ? t("onboarding.asrStandard") : t("onboarding.asrHanafi")}
              />
            ))}
          </fieldset>
        </section>
      )}

      {step === "habits" && (
        <section className="flex flex-col gap-4">
          <StepHeading ref={headingRef} title={t("onboarding.habitsTitle")} body={t("onboarding.habitsHelp")} />
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t("onboarding.habitsTitle")}</legend>
            {ONBOARDING_CHOICES.map((c) => {
              const labelKey = (c === "prayers" ? "habits.prayers" : `habits.${c}`) as MessageKey;
              const helpKey = `habits.${c}Help` as MessageKey;
              return (
                <ChoiceRow
                  key={c}
                  type="checkbox"
                  name="habits"
                  checked={habits.includes(c)}
                  onChange={() => toggleHabit(c)}
                  label={t(labelKey)}
                  help={t(helpKey)}
                />
              );
            })}
          </fieldset>
          {habits.includes("quran") && (
            <Card className="flex flex-col gap-3 p-4">
              <p className="text-sm font-semibold" id="quran-goal-label">
                {t("onboarding.quranTarget")}
              </p>
              <div className="flex gap-2" role="group" aria-labelledby="quran-goal-label">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  value={quranTarget}
                  onChange={(e) => setQuranTarget(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
                  className="w-28"
                  aria-label={t("onboarding.quranTarget")}
                />
                <Select
                  value={quranUnit}
                  onChange={(e) => setQuranUnit(e.target.value as QuranUnit)}
                  aria-label={t("onboarding.quranTarget")}
                >
                  {QURAN_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t(`habits.units.${u}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {index > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setIndex(index - 1)} disabled={pending}>
            {t("common.back")}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending || (step === "name" && !displayName.trim())} className="sm:min-w-40">
          {pending
            ? t(mode === "edit" ? "common.saving" : "onboarding.finishing")
            : isLast
              ? t(mode === "edit" ? "common.save" : "onboarding.finish")
              : t("common.continue")}
        </Button>
      </div>
    </form>
  );
}

function StepHeading({ ref, title, body }: { ref: React.Ref<HTMLHeadingElement>; title: string; body?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 ref={ref} tabIndex={-1} className="text-2xl font-bold tracking-tight focus:outline-none">
        {title}
      </h2>
      {body && <p className="leading-relaxed text-muted">{body}</p>}
    </div>
  );
}

function ChoiceRow({
  type,
  name,
  checked,
  onChange,
  label,
  help,
}: {
  type: "checkbox" | "radio";
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]">
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[var(--primary)]" />
      <span className="flex flex-col">
        <span className="font-semibold">{label}</span>
        {help && <span className="text-sm text-muted">{help}</span>}
      </span>
    </label>
  );
}
