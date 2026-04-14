"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";
import PhotoViewer from "@/components/PhotoViewer";

function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function findTwoClosest(
  allEntries: Entry[],
  year: number,
  month: number,
  day: number
): [Entry | null, Entry | null] {
  const yearEntries = allEntries.filter((e) => e.date.startsWith(`${year}-`));
  if (yearEntries.length === 0) return [null, null];
  const targetMs = new Date(year, month - 1, day).getTime();
  const sorted = [...yearEntries].sort((a, b) => {
    const [ay, am, ad] = a.date.split("-").map(Number);
    const [by, bm, bd] = b.date.split("-").map(Number);
    return (
      Math.abs(new Date(ay, am - 1, ad).getTime() - targetMs) -
      Math.abs(new Date(by, bm - 1, bd).getTime() - targetMs)
    );
  });
  return [sorted[0] ?? null, sorted[1] ?? null];
}

type ColData = { year: number; entry: Entry | null };

export default function PastEntries({
  date,
  refreshKey,
  onRefresh,
}: {
  date: string;
  refreshKey: number;
  onRefresh?: () => void;
}) {
  const [cols, setCols] = useState<ColData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [photoState, setPhotoState] = useState<{ url: string; entry: Entry } | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentYear = parseInt(date.split("-")[0]);
  const [, m, d] = date.split("-").map(Number);
  const maxYears = currentYear - 1972; // 1972年まで遡る

  useEffect(() => {
    setCurrentIdx(0);
    setSelected(null);
  }, [date]);

  useEffect(() => {
    const today = todayStr();
    const entries = getAllEntries().filter((e) => e.date < today);
    const built: ColData[] = [];
    for (let p = maxYears - 1; p >= 0; p--) {
      const year = currentYear - 1 - p;
      const [left, right] = findTwoClosest(entries, year, m, d);
      if (left) built.push({ year, entry: left });
      if (right) built.push({ year, entry: right });
    }
    setCols(built);
    setCurrentIdx(Math.max(0, built.length - 2));
  }, [date, refreshKey, currentYear, m, d]);

  const canOlder = currentIdx > 0;
  const canNewer = currentIdx < cols.length - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    if (!canOlder && delta > 0) setDragDelta(delta * 0.2);
    else if (!canNewer && delta < 0) setDragDelta(delta * 0.2);
    else setDragDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    setIsAnimating(true);
    if (dragDelta > 50 && canOlder) setCurrentIdx((i) => i - 1);    // right = older
    else if (dragDelta < -50 && canNewer) setCurrentIdx((i) => i + 1); // left = newer
    setDragDelta(0);
    setTouchStartX(null);
  };

  if (cols.length === 0) return null;

  const translateX = `calc(-${currentIdx * 50}% + ${dragDelta}px)`;

  function renderCol(col: ColData | undefined, colKey: string) {
    if (!col) return <div key={colKey} style={{ minWidth: "50%", padding: "0 4px" }} />;
    const { year, entry } = col;
    const label = entry
      ? (() => { const [, em, ed] = entry.date.split("-").map(Number); return `${em}月${ed}日`; })()
      : "";
    const photoGrid = entry?.photos && entry.photos.length > 0 ? (
      <div className="grid grid-cols-3 gap-1 mt-1 shrink-0">
        {entry.photos.slice(0, 3).map((url: string, i: number) => (
          <div
            key={i}
            className="h-7 rounded overflow-hidden cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setPhotoState({ url, entry }); }}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    ) : null;
    return (
      <div key={colKey} style={{ minWidth: "50%", padding: "0 4px" }} className="flex flex-col gap-2">
        {/* 投稿１ (invisible spacer when no entry to keep 投稿２ at bottom) */}
        {entry ? (
          <button
            onClick={() => setSelected(entry)}
            className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150 h-[8.5rem] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5 shrink-0">
              <span className="text-[11px] font-medium text-stone-500">{year}年{label}</span>
              <span className="text-[11px] text-stone-300">{currentYear - year}年前</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed flex-1 overflow-hidden">{entry.text}</p>
            {photoGrid}
          </button>
        ) : (
          <div className="h-[8.5rem] bg-white/60 rounded-2xl border border-stone-50" />
        )}
        {/* 投稿２ */}
        {entry?.text2 && (
          <button
            onClick={() => setSelected(entry)}
            className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150 h-[7.5rem] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5 shrink-0">
              <span className="text-[11px] font-medium text-stone-500">{year}年{label}</span>
              <span className="text-[11px] text-stone-300">{currentYear - year}年前</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed flex-1 overflow-hidden">{entry.text2}</p>
          </button>
        )}
      </div>
    );
  }


  return (
    <>
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-stone-100" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsAnimating(true); setCurrentIdx((i) => i - 1); }}
              disabled={!canOlder}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ‹
            </button>
            <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
              過去のこの日に近い投稿
            </p>
            <button
              onClick={() => { setIsAnimating(true); setCurrentIdx((i) => i + 1); }}
              disabled={!canNewer}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ›
            </button>
          </div>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

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
            {cols.map((col, i) => renderCol(col, String(i)))}
            {renderCol(undefined, "__trail")}
          </div>
        </div>
      </section>

      {selected && (
        <EntryModal
          entry={selected}
          onClose={() => {
            setSelected(null);
            onRefresh?.();
          }}
        />
      )}

      {photoState && (
        <PhotoViewer
          url={photoState.url}
          entry={photoState.entry}
          onClose={() => setPhotoState(null)}
          onDelete={() => {}}
          onOpenEntry={() => { setPhotoState(null); setSelected(photoState.entry); }}
        />
      )}
    </>
  );
}
