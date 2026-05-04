import type { MetadataRoute } from "next";

const brandColor = "#111217";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parrillero Pro",
    short_name: "Parrillero",
    description: "Smart grilling assistant for timing, fire zones, and live cooking guidance.",
    start_url: "/",
    display: "standalone",
    background_color: brandColor,
    theme_color: brandColor,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
