import type { ComponentProps, ReactNode } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:opacity-90",
  secondary: "bg-surface text-ink border border-border hover:bg-surface-2",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger text-white dark:text-bg hover:opacity-90",
};

// Large tap targets: 48px minimum height throughout.
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cx(base, variants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cx("rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6", className)}
      {...props}
    />
  );
}

export function Field({
  id,
  label,
  help,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ms-1 font-normal text-muted">({optional})</span>}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-sm text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base text-ink placeholder:text-muted/80 focus:border-primary focus:outline-none focus-visible:outline-2";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(inputClass, "appearance-auto", className)} {...props} />;
}

export function ScholarNote({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm leading-relaxed text-muted" role="note">
      {text}
    </p>
  );
}
