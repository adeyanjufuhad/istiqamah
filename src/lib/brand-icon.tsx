import { ImageResponse } from "next/og";

/**
 * Renders the app mark as a PNG. `padded` leaves the ~20% safe zone that
 * maskable icons need so launchers can crop to any shape.
 */
export function brandIcon(size: number, { padded = false, rounded = true } = {}) {
  const mark = padded ? size * 0.6 : size;
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f6b4f",
          borderRadius: rounded && !padded ? size * 0.29 : 0,
        }}
      >
        <svg width={mark} height={mark} viewBox="0 0 48 48">
          <circle cx="24" cy="14.5" r="8" fill="#fffdf8" />
          <circle cx="28.5" cy="11.5" r="6.5" fill="#2f6b4f" />
          <rect x="21.5" y="22" width="5" height="17" rx="2.5" fill="#fffdf8" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
