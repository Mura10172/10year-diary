"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function cleanText(text: string): string {
  return text.replace(/\n{2,}/g, "\n").trim();
}

export default function DailyStar({ refreshKey }: { refreshKey: number }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const all = getAllEntries();
    const starred = all.filter((e) => e.starred1 || e.starred2);
    if (starred.length === 0) { setEntry(null); return; }
    const key = todayDateKey();
    const hash = key.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    setEntry(starred[hash % starred.length]);
  }, [refreshKey]);

  if (!entry) return null;

  const [y, m, d] = entry.date.split("-").map(Number);
  const showText1 = !!entry.starred1 && !!entry.text;
  const showText2 = !!entry.starred2 && !!entry.text2;

  return (
    <>
      <div>
        <button
          onClick={() => setSelected(true)}
          className="w-full text-left bg-sky-50 rounded-2xl px-4 py-3 border border-sky-200 hover:border-sky-300 hover:shadow-sm transition-all duration-150"
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-stone-400">{y}年{m}月{d}日</p>
            <span className="text-xs text-sky-400">★</span>
          </div>
          {showText1 && (
            <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 whitespace-pre-line">
              {cleanText(entry.text!)}
            </p>
          )}
          {showText2 && (
            <p className={`text-sm text-stone-500 leading-relaxed line-clamp-4 whitespace-pre-line ${showText1 ? "mt-2" : ""}`}>
              {cleanText(entry.text2!)}
            </p>
          )}
        </button>
      </div>
      {selected && (
        <EntryModal entry={entry} onClose={() => setSelected(false)} />
      )}
    </>
  );
}
