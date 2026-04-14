"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import PhotoViewer from "@/components/PhotoViewer";

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
  // entries: newest first
  const [entries, setEntries] = useState<Entry[]>([]);
  const [photoState, setPhotoState] = useState<{ url: string; entry: Entry } | null>(null);
  // currentIdx: index into trackEntries (oldest-first). right-swipe → older (idx--)
  const [currentIdx, setCurrentIdx] = useState(0);
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

  // Track is oldest-first so that dragging right reveals older content naturally
  const trackEntries = [...entries].reverse();

  // Sync currentIdx: prefer the entry matching `date`, else show newest pair
  useEffect(() => {
    if (entries.length === 0) return;
    const fwdIdx = entries.findIndex((e) => e.date <= date);
    if (fwdIdx >= 0) {
      const trackIdx = entries.length - 1 - fwdIdx;
      setCurrentIdx(Math.max(0, trackIdx - 1));
    } else {
      setCurrentIdx(Math.max(0, entries.length - 2));
    }
  }, [date, entries]);

  // canOlder: can move left in the track (lower index = older)
  const canOlder = currentIdx > 0;
  // canNewer: can move right in the track (higher index = newer)
  const canNewer = currentIdx < trackEntries.length - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    // Rubber-band at edges
    if (!canOlder && delta > 0) setDragDelta(delta * 0.2);
    else if (!canNewer && delta < 0) setDragDelta(delta * 0.2);
    else setDragDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    setIsAnimating(true);
    if (dragDelta > 50 && canOlder) setCurrentIdx((i) => i - 1);      // right = older
    else if (dragDelta < -50 && canNewer) setCurrentIdx((i) => i + 1); // left  = newer
    setDragDelta(0);
    setTouchStartX(null);
  };

  if (entries.length === 0) return null;

  // translateX: each entry column is 50% of the container width
  const translateX = `calc(-${currentIdx * 50}% + ${dragDelta}px)`;

  function renderCol(entry: Entry | undefined, colKey: string) {
    if (!entry) return <div key={colKey} style={{ minWidth: "50%", padding: "0 4px" }} />;
    const [y, m, d] = entry.date.split("-").map(Number);
    const label = `${y}年${m}月${d}日`;
    const photoGrid = entry.photos && entry.photos.length > 0 ? (
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
        {/* 投稿１ (invisible spacer when no text to keep 投稿２ at bottom) */}
        {entry.text ? (
          <button
            onClick={() => onSelect(entry.date)}
            className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150 overflow-hidden"
          >
            <p className="text-[11px] text-stone-400 mb-1.5">{label}</p>
            <p className="text-xs text-stone-500 leading-relaxed line-clamp-4">{entry.text}</p>
            {photoGrid}
          </button>
        ) : (
          <div className="h-[8.5rem] bg-white/40 rounded-2xl border border-stone-50" />
        )}
        {/* 投稿２ */}
        {entry.text2 && (
          <button
            onClick={() => onSelect(entry.date)}
            className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150 overflow-hidden"
          >
            {!entry.text && <p className="text-[11px] text-stone-400 mb-1.5">{label}</p>}
            <p className="text-xs text-stone-400 leading-relaxed line-clamp-4">{entry.text2}</p>
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
          {/* ‹ = older (go left in track = smaller idx) */}
          <button
            onClick={() => { setIsAnimating(true); setCurrentIdx((i) => i - 1); }}
            disabled={!canOlder}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ‹
          </button>
          <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
            直近の投稿
          </p>
          {/* › = newer (go right in track = larger idx) */}
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
          {trackEntries.map((entry, i) => renderCol(entry, entry.date))}
          {/* Trailing blank so the last entry always has a right neighbor */}
          {renderCol(undefined, "__trail")}
        </div>
      </div>
    </section>

      {photoState && (
        <PhotoViewer
          url={photoState.url}
          entry={photoState.entry}
          onClose={() => setPhotoState(null)}
          onDelete={() => {}}
          onOpenEntry={() => { setPhotoState(null); onSelect(photoState.entry.date); }}
        />
      )}
    </>
  );
}
