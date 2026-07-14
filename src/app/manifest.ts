import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Back in the Game",
    short_name: "BITG",
    description:
      "Daily recovery tracker for an L4-L5 herniated disc, Tokyo to Kuala Lumpur.",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF3F1",
    theme_color: "#0E7C66",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
