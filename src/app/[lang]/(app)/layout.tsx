import { AppNav } from "@/components/app-nav";

export default function AppLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <>
      <main id="main" className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 pb-28 pt-8">
        {children}
      </main>
      <AppNav />
    </>
  );
}
