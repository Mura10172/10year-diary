import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "10年日記",
    short_name: "10年日記",
    description: "その日の記録を、10年並べて見返す日記アプリ",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#faf8f4",
    theme_color: "#44403c",
    lang: "ja",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
