/** Upright stroke (steadfastness) beneath a crescent. Decorative: callers supply the label. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="14" fill="var(--primary)" />
      <circle cx="24" cy="14.5" r="8" fill="var(--primary-ink)" />
      <circle cx="28.5" cy="11.5" r="6.5" fill="var(--primary)" />
      <rect x="21.5" y="22" width="5" height="17" rx="2.5" fill="var(--primary-ink)" />
    </svg>
  );
}
