"use client";
import { useState, useEffect } from "react";
import { getEntry } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";
import { useSwipe } from "@/hooks/useSwipe";

function getSummary(text: string, maxLen = 55): string {
  const oneLiner = text.replace(/\n+/g, " ").trim();
  return oneLiner.length > maxLen ? oneLiner.slice(0, maxLen) + "…" : oneLiner;
}

type PastItem = { year: number; dateStr: string; entry: Entry | null };

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

  // 日付が変わったらオフセットをリセット
  useEffect(() => {
    setOffset(0);
    setSelected(null);
  }, [date]);

  // 2件分のデータを読み込む
  useEffect(() => {
    const year1 = currentYear - 1 - offset;
    const year2 = currentYear - 2 - offset;
    const pad = (n: number) => String(n).padStart(2, "0");
    const ds1 = `${year1}-${pad(m)}-${pad(d)}`;
    const ds2 = `${year2}-${pad(m)}-${pad(d)}`;
    setItems([
      { year: year1, dateStr: ds1, entry: getEntry(ds1) ?? null },
      { year: year2, dateStr: ds2, entry: getEntry(ds2) ?? null },
    ]);
  }, [date, offset, refreshKey, currentYear, m, d]);

  const maxOffset = 8; // 最大10年前まで

  const { onTouchStart, onTouchEnd } = useSwipe(
    () => { if (offset < maxOffset) setOffset((o) => o + 1); },
    () => { if (offset > 0) setOffset((o) => o - 1); }
  );

  return (
    <>
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-stone-100" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((o) => Math.min(o + 1, maxOffset))}
              disabled={offset >= maxOffset}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ‹
            </button>
            <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
              過去のこの日
            </p>
            <button
              onClick={() => setOffset((o) => Math.max(o - 1, 0))}
              disabled={offset === 0}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ›
            </button>
          </div>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        <div className="grid grid-cols-2 gap-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {items.map(({ year, dateStr, entry }) => {
            const yearsAgo = currentYear - year;
            return entry ? (
              <button
                key={dateStr}
                onClick={() => setSelected(entry)}
                className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-stone-500">
                    {year}年
                  </span>
                  <span className="text-[10px] text-stone-300">
                    {yearsAgo}年前
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed h-[7rem] overflow-hidden">
                  {entry.text}
                </p>
              </button>
            ) : (
              <div
                key={dateStr}
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
