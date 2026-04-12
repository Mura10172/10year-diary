"use client";
import { useEffect, useRef } from "react";
import { getAllEntries } from "@/lib/storage";

export default function SideMenu({
  onClose,
  onSelect,
  refreshKey,
}: {
  onClose: () => void;
  onSelect: (ym: string) => void;
  refreshKey: number;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  const entries = getAllEntries().sort((a, b) => b.date.localeCompare(a.date));

  // Unique year-months sorted desc
  const yms = [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort(
    (a, b) => b.localeCompare(a)
  );

  // Group months by year
  const yearGroups: Record<string, string[]> = {};
  for (const ym of yms) {
    const y = ym.slice(0, 4);
    if (!yearGroups[y]) yearGroups[y] = [];
    yearGroups[y].push(ym);
  }
  const sortedYears = Object.keys(yearGroups).sort((a, b) => b.localeCompare(a));

  // Slide in animation
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    el.style.transform = "translateX(100%)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.25s ease";
      el.style.transform = "translateX(0)";
    });
  }, []);

  const handleClose = () => {
    const el = menuRef.current;
    if (el) {
      el.style.transform = "translateX(100%)";
      setTimeout(onClose, 250);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={menuRef}
        className="w-64 bg-white h-full overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-stone-50">
          <p className="text-sm font-medium text-stone-700">年月から移動</p>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-stone-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {yms.length === 0 ? (
          <p className="text-xs text-stone-300 text-center py-8">投稿がありません</p>
        ) : (
          <div className="px-5 py-4 space-y-5">
            {sortedYears.map((year) => (
              <div key={year}>
                <p className="text-xs font-medium text-stone-400 mb-2">{year}年</p>
                <div className="flex flex-wrap gap-1.5">
                  {yearGroups[year].map((ym) => {
                    const m = parseInt(ym.slice(5));
                    return (
                      <button
                        key={ym}
                        onClick={() => {
                          onSelect(ym);
                          handleClose();
                        }}
                        className="px-3 py-1.5 bg-stone-50 rounded-lg text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        {m}月
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
