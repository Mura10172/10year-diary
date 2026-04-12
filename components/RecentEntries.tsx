"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";

function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function RecentEntries({
  date,
  onSelect,
  refreshKey,
}: {
  date: string;
  onSelect: (date: string) => void;
  refreshKey: number;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Touch / drag state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const today = todayStr();
    const list = getAllEntries()
      .filter((e) => e.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));
    setEntries(list);
  }, [refreshKey]);

  // Group entries into pages of 2
  const pages: Entry[][] = [];
  for (let i = 0; i < entries.length; i += 2) {
    pages.push(entries.slice(i, i + 2));
  }

  // When date changes, move to the page containing the closest entry
  useEffect(() => {
    if (entries.length === 0) return;
    const idx = entries.findIndex((e) => e.date <= date);
    const targetPage = idx >= 0 ? Math.floor(idx / 2) : 0;
    setCurrentPage(targetPage);
  }, [date, entries]);

  const canOlder = currentPage < pages.length - 1;
  const canNewer = currentPage > 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    // Clamp drag so you can't pull past edge pages
    if (!canOlder && delta < 0) setDragDelta(delta * 0.2);
    else if (!canNewer && delta > 0) setDragDelta(delta * 0.2);
    else setDragDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    setIsAnimating(true);
    if (dragDelta < -50 && canOlder) {
      setCurrentPage((p) => p + 1);
    } else if (dragDelta > 50 && canNewer) {
      setCurrentPage((p) => p - 1);
    }
    setDragDelta(0);
    setTouchStartX(null);
  };

  if (entries.length === 0) return null;

  const translateX = `calc(${-currentPage * 100}% + ${dragDelta}px)`;

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-stone-100" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsAnimating(true); setCurrentPage((p) => p + 1); }}
            disabled={!canOlder}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ‹
          </button>
          <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
            直近の投稿
          </p>
          <button
            onClick={() => { setIsAnimating(true); setCurrentPage((p) => p - 1); }}
            disabled={!canNewer}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ›
          </button>
        </div>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* Carousel container */}
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            transform: `translateX(${translateX})`,
            transition: isAnimating ? "transform 0.3s ease" : "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTransitionEnd={() => setIsAnimating(false)}
        >
          {pages.map((pagePair, pageIdx) => (
            <div
              key={pageIdx}
              style={{ minWidth: "100%" }}
              className="grid grid-cols-2 gap-2"
            >
              {pagePair.flatMap((entry) => {
                const [y, m, d] = entry.date.split("-").map(Number);
                const label = `${y}年${m}月${d}日`;
                return [
                  // Post1 cell
                  <button
                    key={`${entry.date}-1`}
                    onClick={() => onSelect(entry.date)}
                    className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
                  >
                    <p className="text-[10px] text-stone-400 mb-1.5">{label}</p>
                    <p className="text-xs text-stone-500 leading-relaxed h-[7rem] overflow-hidden">
                      {entry.text}
                    </p>
                  </button>,
                  // Post2 cell (blank if missing)
                  entry.text2 ? (
                    <button
                      key={`${entry.date}-2`}
                      onClick={() => onSelect(entry.date)}
                      className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
                    >
                      <p className="text-[10px] text-stone-400 mb-1.5">{label}</p>
                      <p className="text-xs text-stone-400 leading-relaxed h-[7rem] overflow-hidden">
                        {entry.text2}
                      </p>
                    </button>
                  ) : (
                    <div
                      key={`${entry.date}-2`}
                      className="rounded-2xl border border-stone-50 bg-white/40"
                    />
                  ),
                ];
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
