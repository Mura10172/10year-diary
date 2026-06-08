import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeInitializer from "@/components/ThemeInitializer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "10年日記",
  description: "その日の記録を、10年並べて見返す日記アプリ",
  applicationName: "10年日記",
  appleWebApp: {
    capable: true,
    title: "10年日記",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#44403c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <ThemeInitializer />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
