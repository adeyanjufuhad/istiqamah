import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Istiqamah",
    short_name: "Istiqamah",
    description: "A gentle daily companion for prayer, Quran, adhkar and fasting, with small circles of friends.",
    start_url: "/en/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5fbfd",
    theme_color: "#0077b6",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
