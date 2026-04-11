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

function getSummary(text: string, maxLen = 55): string {
  const oneLiner = text.replace(/\n+/g, " ").trim();
  return oneLiner.length > maxLen ? oneLiner.slice(0, maxLen) + "…" : oneLiner;
}

export default function RecentEntries({
  onSelect,
  refreshKey,
}: {
  onSelect: (date: string) => void;
  refreshKey: number;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const today = todayStr();
    const list = getAllEntries()
      .filter((e) => e.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));
    setEntries(list);
    setOffset(0);
  }, [refreshKey]);

  if (entries.length === 0) return null;

  const visible = entries.slice(offset, offset + 2);
  const canPrev = offset + 2 < entries.length;
  const canNext = offset > 0;

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-stone-100" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={!canPrev}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ‹
          </button>
          <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
            直近の投稿
          </p>
          <button
            onClick={() => setOffset((o) => o - 1)}
            disabled={!canNext}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ›
          </button>
        </div>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visible.map((entry) => {
          const [y, m, d] = entry.date.split("-").map(Number);
          return (
            <button
              key={entry.date}
              onClick={() => onSelect(entry.date)}
              className="text-left bg-white rounded-2xl px-3 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
            >
              <p className="text-[10px] text-stone-400 mb-1.5">
                {y}年{m}月{d}日
              </p>
              <p className="text-xs text-stone-500 leading-relaxed">
                {getSummary(entry.text)}
              </p>
            </button>
          );
        })}
        {visible.length === 1 && <div />}
      </div>
    </section>
  );
}
