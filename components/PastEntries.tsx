"use client";
import { useState, useEffect } from "react";
import { getEntriesForMonthDay } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";

function getSummary(text: string, maxLen = 75): string {
  const oneLiner = text.replace(/\n+/g, " ").trim();
  return oneLiner.length > maxLen ? oneLiner.slice(0, maxLen) + "…" : oneLiner;
}

export default function PastEntries({
  date,
  refreshKey,
}: {
  date: string;
  refreshKey: number;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [modalRefresh, setModalRefresh] = useState(0);

  const currentYear = parseInt(date.split("-")[0]);

  useEffect(() => {
    const [, m, d] = date.split("-").map(Number);
    const past = getEntriesForMonthDay(m, d)
      .filter((e) => parseInt(e.date.split("-")[0]) !== currentYear)
      .sort((a, b) => b.date.localeCompare(a.date));
    setEntries(past);
    setSelected(null);
  }, [date, currentYear, refreshKey, modalRefresh]);

  if (entries.length === 0) return null;

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
          {entries.map((entry) => {
            const year = parseInt(entry.date.split("-")[0]);
            const yearsAgo = currentYear - year;
            return (
              <button
                key={entry.id}
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
            );
          })}
        </div>
      </section>

      {selected && (
        <EntryModal
          entry={selected}
          onClose={() => {
            setSelected(null);
            setModalRefresh((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
