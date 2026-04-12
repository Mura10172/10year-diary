"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import { useSwipe } from "@/hooks/useSwipe";

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
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const today = todayStr();
    const list = getAllEntries()
      .filter((e) => e.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));
    setEntries(list);
  }, [refreshKey]);

  // dateが変わったら該当日付以前で最も近いエントリを含むペアに移動
  useEffect(() => {
    if (entries.length === 0) return;
    const idx = entries.findIndex((e) => e.date <= date);
    const newOffset = idx >= 0 ? Math.floor(idx / 2) * 2 : 0;
    setOffset(newOffset);
  }, [date, entries]);

  // 2行分（最大2日付）を表示
  const visible = entries.slice(offset, offset + 2);
  // 左へ（過去）: offset+2、右へ（未来）: offset-2
  const canOlder = offset + 2 < entries.length;
  const canNewer = offset >= 2;

  // Rules of Hooks: 条件分岐より前にフックを呼ぶ
  const { onTouchStart, onTouchEnd } = useSwipe(
    () => { if (canOlder) setOffset((o) => o + 2); },   // swipe left = older
    () => { if (canNewer) setOffset((o) => o - 2); }    // swipe right = newer
  );

  if (entries.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-stone-100" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o + 2)}
            disabled={!canOlder}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ‹
          </button>
          <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
            直近の投稿
          </p>
          <button
            onClick={() => setOffset((o) => o - 2)}
            disabled={!canNewer}
            className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
          >
            ›
          </button>
        </div>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* 2列×2行グリッド。1行=1日付、左=投稿1、右=投稿2 */}
      <div
        className="grid grid-cols-2 gap-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {visible.flatMap((entry) => {
          const [y, m, d] = entry.date.split("-").map(Number);
          const label = `${y}年${m}月${d}日`;
          return [
            // 左セル: 投稿1
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
            // 右セル: 投稿2（なければ空白）
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
    </section>
  );
}
