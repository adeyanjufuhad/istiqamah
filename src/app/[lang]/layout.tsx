import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { I18nProvider } from "@/i18n/client";
import { dirFor, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-naskh", display: "swap" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: { default: dict.app.name, template: `%s · ${dict.app.name}` },
    description: dict.app.description,
    applicationName: dict.app.name,
    appleWebApp: { capable: true, title: dict.app.name, statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5fbfd",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${jakarta.variable} ${naskh.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-ink"
        >
          {dictionary.common.skipToContent}
        </a>
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
        </I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
