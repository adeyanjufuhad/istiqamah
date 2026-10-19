/**
 * Static, illustrative app UI used inside the hero card stack.
 * Visual only (aria-hidden by the caller): the real app is behind sign-in.
 */

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function CardShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4 bg-white p-6 text-navy-950">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ocean-500">{label}</p>
      {children}
    </div>
  );
}

/** Semicircle "sun arc" showing progress through the day toward the next prayer. */
export function NextPrayerCard({ label, prayer, time, eta }: { label: string; prayer: string; time: string; eta: string }) {
  return (
    <CardShell label={label}>
      <div className="relative mx-auto mt-2 w-full max-w-[15rem]">
        <svg viewBox="0 0 200 110" className="w-full">
          <defs>
            <linearGradient id="arc" x1="0" x2="1">
              <stop offset="0%" stopColor="#caf0f8" />
              <stop offset="55%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#0077b6" />
            </linearGradient>
          </defs>
          <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#eef7fa" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M10 100 A90 90 0 0 1 190 100"
            fill="none"
            stroke="url(#arc)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset="85"
          />
          <circle cx="157" cy="36" r="9" fill="#ffffff" stroke="#0077b6" strokeWidth="4" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-4xl font-extrabold tracking-tight tabular-nums">{time}</p>
          <p className="text-sm font-semibold text-ocean-600">
            {prayer} · {eta}
          </p>
        </div>
      </div>
    </CardShell>
  );
}

export function TodayCard({ label, summary }: { label: string; summary: string }) {
  return (
    <CardShell label={label}>
      <ul className="flex flex-col gap-2">
        {PRAYERS.map((p, i) => {
          const done = i < 3;
          return (
            <li
              key={p}
              className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                done ? "bg-sky-50" : "bg-[#f5fbfd] ring-1 ring-[#d7e9f0]"
              }`}
            >
              {p}
              <span
                className={`grid size-6 place-items-center rounded-full ${done ? "bg-ocean-600 text-white" : "ring-2 ring-[#d7e9f0]"}`}
              >
                {done && (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.5}>
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto text-sm font-medium text-[#4a5b7c]">{summary}</p>
    </CardShell>
  );
}

export function KhatmCard({ label, value }: { label: string; value: string }) {
  return (
    <CardShell label={label}>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 30 }, (_, i) => {
          const state = i < 12 ? "read" : i < 18 ? "claimed" : "open";
          return (
            <span
              key={i}
              className={`grid aspect-square place-items-center rounded-lg text-[10px] font-bold tabular-nums ${
                state === "read" ? "bg-ocean-600 text-white" : state === "claimed" ? "bg-sky-100 text-navy-950" : "bg-[#f5fbfd] text-[#4a5b7c] ring-1 ring-[#d7e9f0]"
              }`}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
      <p className="mt-auto text-sm font-medium text-[#4a5b7c]">{value}</p>
    </CardShell>
  );
}

export function NudgeCard({ from, message }: { from: string; message: string }) {
  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-ocean-600 to-navy-950 p-6 text-white">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-white/15 text-base font-bold">Y</span>
        <p className="text-sm font-semibold text-white/85">{from}</p>
      </div>
      <p className="text-2xl font-bold leading-snug tracking-tight">{message}</p>
      <div className="flex gap-2">
        <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold">Ameen</span>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy-950">Reply with a dua</span>
      </div>
    </div>
  );
}
