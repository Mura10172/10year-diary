"use client";
import { useState, useEffect } from "react";
import { getEntry } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";

function getSummary(text: string, maxLen = 75): string {
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
  const [items, setItems] = useState<PastItem[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);

  const currentYear = parseInt(date.split("-")[0]);

  useEffect(() => {
    const [, m, d] = date.split("-").map(Number);
    const list = Array.from({ length: 10 }, (_, i) => {
      const year = currentYear - 1 - i;
      const dateStr = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { year, dateStr, entry: getEntry(dateStr) ?? null };
    });
    setItems(list);
    setSelected(null);
  }, [date, currentYear, refreshKey]);

  return (
    <>
      <section>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-stone-100" />
          <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
            過去のこの日
          </p>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        <div className="space-y-2">
          {items.map(({ year, dateStr, entry }) => {
            const yearsAgo = currentYear - year;
            return entry ? (
              <button
                key={dateStr}
                onClick={() => setSelected(entry)}
                className="w-full text-left bg-white rounded-2xl px-4 py-3.5 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150 group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-stone-500">
                    {year}年
                  </span>
                  <span className="text-xs text-stone-300 group-hover:text-stone-400 transition-colors">
                    {yearsAgo}年前 →
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {getSummary(entry.text)}
                </p>
              </button>
            ) : (
              <div
                key={dateStr}
                className="flex items-center justify-between px-4 py-3 bg-white/60 rounded-2xl border border-stone-50"
              >
                <span className="text-xs text-stone-300">{year}年</span>
                <span className="text-xs text-stone-200">—</span>
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
