import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KlipBoard - Your clipboard, everywhere",
    short_name: "Klip",
    description:
      "KlipBoard is a cross-device clipboard. Write text or code in a notepad and it's instantly available on every device you sign into.",
    start_url: "/",
    display: "standalone",
    background_color: "#17181c",
    theme_color: "#17181c",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}