import { brandIcon } from "@/lib/brand-icon";

const ICONS: Record<string, { size: number; padded?: boolean }> = {
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "maskable-512.png": { size: 512, padded: true },
};

export async function GET(_req: Request, { params }: RouteContext<"/icons/[file]">) {
  const icon = ICONS[(await params).file];
  if (!icon) return new Response("Not found", { status: 404 });
  const res = brandIcon(icon.size, { padded: icon.padded });
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return res;
}
