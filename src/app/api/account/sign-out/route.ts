import { isLocale } from "@/i18n/config";
import { auth } from "@/lib/auth/server";

/**
 * Signs out and tells the browser to drop cached pages and the service worker,
 * so nothing personal stays readable offline on a shared device.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const l = String(form?.get("locale") ?? "");
  const locale = isLocale(l) ? l : "en";

  await auth.signOut().catch(() => {});

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/${locale}`,
      "Clear-Site-Data": '"cache", "storage"',
      "Cache-Control": "no-store",
    },
  });
}
