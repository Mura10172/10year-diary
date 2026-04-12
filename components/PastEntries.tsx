"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";
import { useSwipe } from "@/hooks/useSwipe";

function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type PastItem = { year: number; entry: Entry | null; actualDate: string };

function findClosestEntry(
  allEntries: Entry[],
  year: number,
  month: number,
  day: number
): Entry | null {
  const yearEntries = allEntries.filter((e) =>
    e.date.startsWith(`${year}-`)
  );
  if (yearEntries.length === 0) return null;

  const targetMs = new Date(year, month - 1, day).getTime();
  let closest = yearEntries[0];
  let minDist = Infinity;

  for (const e of yearEntries) {
    const [ey, em, ed] = e.date.split("-").map(Number);
    const dist = Math.abs(new Date(ey, em - 1, ed).getTime() - targetMs);
    if (dist < minDist) {
      minDist = dist;
      closest = e;
    }
  }
  return closest;
}

export default function PastEntries({
  date,
  refreshKey,
  onRefresh,
}: {
  date: string;
  refreshKey: number;
  onRefresh?: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<PastItem[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);

  const currentYear = parseInt(date.split("-")[0]);
  const [, m, d] = date.split("-").map(Number);

  useEffect(() => {
    setOffset(0);
    setSelected(null);
  }, [date]);

  useEffect(() => {
    const today = todayStr();
    const allEntries = getAllEntries().filter((e) => e.date < today);
    const year1 = currentYear - 1 - offset;
    const year2 = currentYear - 2 - offset;

    const entry1 = findClosestEntry(allEntries, year1, m, d);
    const entry2 = findClosestEntry(allEntries, year2, m, d);

    setItems([
      { year: year1, entry: entry1, actualDate: entry1?.date ?? "" },
      { year: year2, entry: entry2, actualDate: entry2?.date ?? "" },
    ]);
  }, [date, offset, refreshKey, currentYear, m, d]);

  const maxOffset = 8;

  const { onTouchStart, onTouchEnd } = useSwipe(
    () => { if (offset > 0) setOffset((o) => o - 1); },
    () => { if (offset < maxOffset) setOffset((o) => o + 1); }
  );

  return (
    <>
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-stone-100" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((o) => Math.max(o - 1, 0))}
              disabled={offset === 0}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ‹
            </button>
            <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
              過去のこの日に近い投稿
            </p>
            <button
              onClick={() => setOffset((o) => Math.min(o + 1, maxOffset))}
              disabled={offset >= maxOffset}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ›
            </button>
          </div>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        <div className="flex flex-col gap-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {items.map(({ year, entry, actualDate }) => {
            const yearsAgo = currentYear - year;
            const [, am, ad] = actualDate
              ? actualDate.split("-").map(Number)
              : [0, 0, 0];

            return entry ? (
              <button
                key={year}
                onClick={() => setSelected(entry)}
                className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-stone-500">
                    {year}年{am}月{ad}日
                  </span>
                  <span className="text-[10px] text-stone-300">
                    {yearsAgo}年前
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed h-[7rem] overflow-hidden">
                  {entry.text}
                </p>
                {entry.text2 && (
                  <p className="text-xs text-stone-300 leading-relaxed h-[4rem] overflow-hidden mt-2 pt-2 border-t border-stone-50">
                    {entry.text2}
                  </p>
                )}
              </button>
            ) : (
              <div
                key={year}
                className="flex flex-col px-3 py-3 bg-white/60 rounded-2xl border border-stone-50"
              >
                <span className="text-[10px] text-stone-300 mb-1.5">
                  {year}年
                </span>
                <div className="h-[7rem] flex items-center">
                  <span className="text-xs text-stone-200">—</span>
                </div>
              </div>
            );
          })}
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
