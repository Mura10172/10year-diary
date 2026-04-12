"use client";
import { useEffect, useState } from "react";

export type View = "home" | "post1" | "post2" | "star";

const TABS: { id: View; label: string }[] = [
  { id: "home", label: "ホーム" },
  { id: "post1", label: "投稿１" },
  { id: "post2", label: "投稿２" },
  { id: "star", label: "★" },
];

export default function BottomNav({
  view,
  onChangeView,
}: {
  view: View;
  onChangeView: (v: View) => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    const handler = () => {
      const y = window.scrollY;
      if (y < 60) {
        setVisible(true);
      } else {
        setVisible(y <= lastY);
      }
      lastY = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Reset visibility on tab change
  useEffect(() => {
    setVisible(true);
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-100 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex max-w-[520px] mx-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChangeView(tab.id)}
            className={`flex-1 py-3.5 text-xs font-medium transition-colors ${
              view === tab.id
                ? "text-stone-800"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
