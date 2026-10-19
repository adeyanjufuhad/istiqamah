import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <ProsePage page="privacy" />;
}
