"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";

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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentYear = parseInt(date.split("-")[0]);
  const [, m, d] = date.split("-").map(Number);
  const maxYears = 10;

  useEffect(() => {
    setCurrentIdx(0);
    setSelected(null);
  }, [date]);

  useEffect(() => {
    const today = todayStr();
    const entries = getAllEntries().filter((e) => e.date < today);
    const built: ColData[] = [];
    for (let p = 0; p < maxYears; p++) {
      const year = currentYear - 1 - p;
      const [left, right] = findTwoClosest(entries, year, m, d);
      built.push({ year, entry: left });
      built.push({ year, entry: right });
    }
    setCols(built);
  }, [date, refreshKey, currentYear, m, d]);

  const canOlder = currentIdx < cols.length - 1;
  const canNewer = currentIdx > 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    if (!canOlder && delta < 0) setDragDelta(delta * 0.2);
    else if (!canNewer && delta > 0) setDragDelta(delta * 0.2);
    else setDragDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    setIsAnimating(true);
    if (dragDelta < -50 && canOlder) setCurrentIdx((i) => i + 1);
    else if (dragDelta > 50 && canNewer) setCurrentIdx((i) => i - 1);
    setDragDelta(0);
    setTouchStartX(null);
  };

  if (cols.length === 0) return null;

  const translateX = `calc(-${currentIdx * 50}% + ${dragDelta}px)`;

  function entryLabel(entry: Entry) {
    const [, em, ed] = entry.date.split("-").map(Number);
    return `${em}月${ed}日`;
  }

  function ColContent({ col, colKey }: { col: ColData; colKey: string }) {
    const { year, entry } = col;
    return (
      <div key={colKey} style={{ minWidth: "50%", padding: "0 4px" }} className="flex flex-col gap-2">
        {entry ? (
          <button
            onClick={() => setSelected(entry)}
            className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-stone-500">
                {year}年{entryLabel(entry)}
              </span>
              <span className="text-[10px] text-stone-300">
                {currentYear - year}年前
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed h-[7rem] overflow-hidden">
              {entry.text}
            </p>
          </button>
        ) : (
          <div className="flex flex-col px-3 py-3 bg-white/60 rounded-2xl border border-stone-50">
            <span className="text-[10px] text-stone-300 mb-1.5">{year}年</span>
            <div className="h-[7rem] flex items-center">
              <span className="text-xs text-stone-200">—</span>
            </div>
          </div>
        )}
        {entry?.text2 ? (
          <button
            onClick={() => setSelected(entry)}
            className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-stone-500">
                {year}年{entryLabel(entry)}
              </span>
              <span className="text-[10px] text-stone-300">
                {currentYear - year}年前
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed h-[7rem] overflow-hidden">
              {entry.text2}
            </p>
          </button>
        ) : (
          <div className="bg-white/40 rounded-2xl border border-stone-50 px-3 py-3">
            <div style={{ visibility: "hidden" }} className="text-[10px] mb-1.5">x</div>
            <div className="h-[7rem]" />
          </div>
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
              onClick={() => { setIsAnimating(true); setCurrentIdx((i) => i + 1); }}
              disabled={!canOlder}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ‹
            </button>
            <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
              過去のこの日に近い投稿
            </p>
            <button
              onClick={() => { setIsAnimating(true); setCurrentIdx((i) => i - 1); }}
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
            {cols.map((col, i) => (
              <ColContent key={i} col={col} colKey={String(i)} />
            ))}
            <div style={{ minWidth: "50%", padding: "0 4px" }} />
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
    </>
  );
}
