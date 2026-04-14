import type { Metadata } from "next";
import "./globals.css";
import ThemeInitializer from "@/components/ThemeInitializer";

export const metadata: Metadata = {
  title: "10年日記",
  description: "その日の記録を、10年並べて見返す日記アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
