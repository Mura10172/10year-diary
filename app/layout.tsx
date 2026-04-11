import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "10年日記",
  description: "同じ日の記憶を、10年分並べて見る日記アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">{children}</body>
    </html>
  );
}
