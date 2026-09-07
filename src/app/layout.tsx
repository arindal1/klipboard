import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/pwa/RegisterSW";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "KlipBoard | Your clipboard, everywhere";
const DESCRIPTION =
  "KlipBoard is a cross-device clipboard. Write text or code in a notepad and it's instantly available on every device you sign into.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s > KlipBoard",
  },
  description: DESCRIPTION,
  keywords: [
    "KlipBoard",
    "notepad",
    "cross-device sync",
    "code snippets",
    "note taking app",
    "clipboard"
  ],
  applicationName: "KlipBoard",
  authors: [{ name: "Arindal", url: "https://github.com/arindal1" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "KlipBoard",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17181c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}