import { Suspense } from "react";
import { DeletedNotice } from "@/components/deleted-notice";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { MotionPrefProvider, MotionToggle } from "@/components/landing/motion-pref";
import { Bento, FinalCta, Manifesto, PrayerMarquee, Sources, Steps } from "@/components/landing/sections";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/i18n/server";

export default async function Landing() {
  const dict = await getDictionary();

  return (
    <>
      <span id="top-sentinel" aria-hidden="true" className="absolute top-0 h-px w-px" />
      <MotionPrefProvider>
        <LandingNav />
        <main id="main" className="overflow-x-clip">
          <div className="fixed inset-x-0 top-24 z-30 mx-auto max-w-md px-4">
            <Suspense>
              <DeletedNotice />
            </Suspense>
          </div>
          <Hero rotating={dict.landing.rotating} />
          <PrayerMarquee first={dict.landing.marquee} second={dict.landing.marquee2} />
          <Manifesto />
          <Bento />
          <Steps />
          <Sources />
          <FinalCta />
        </main>
        <SiteFooter />
        <MotionToggle />
      </MotionPrefProvider>
    </>
  );
}
