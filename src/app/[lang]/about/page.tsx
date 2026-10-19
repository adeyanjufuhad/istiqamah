import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <ProsePage page="about" />;
}
