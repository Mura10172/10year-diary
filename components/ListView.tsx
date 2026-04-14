"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";
import type { View } from "@/components/BottomNav";

function cleanText(text: string): string { return text.replace(/\n{2,}/g, "\n").trim(); }

function formatYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}年${m}月`;
}

export default function ListView({
  type,
  refreshKey,
  onRefresh,
  onMenuOpen,
}: {
  type: Exclude<View, "home" | "settings">;
  refreshKey: number;
  onRefresh?: () => void;
  onMenuOpen: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);

  useEffect(() => {
    const all = getAllEntries()
      .filter((e) => {
        if (type === "post1") return !!e.text;
        if (type === "post2") return !!e.text2;
        if (type === "both") return !!e.text || !!e.text2;
        if (type === "star") return e.starred1 || e.starred2;
        return false;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    setEntries(all);
  }, [type, refreshKey]);

  // Group by YYYY-MM
  const groups: Record<string, Entry[]> = {};
  for (const e of entries) {
    const ym = e.date.slice(0, 7);
    if (!groups[ym]) groups[ym] = [];
    groups[ym].push(e);
  }
  const sortedYMs = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const typeLabels: Record<Exclude<View, "home" | "settings">, string> = {
    post1: "投稿１",
    post2: "投稿２",
    both: "投稿１と２",
    star: "お気に入り",
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-stone-50/95 backdrop-blur-sm py-2 -mx-4 px-4 z-10">
        <p className="text-sm font-medium text-stone-700">{typeLabels[type]}</p>
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-all"
          aria-label="年月メニュー"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-stone-300 text-center py-16">投稿がありません</p>
      ) : (
        <div className="space-y-6">
          {sortedYMs.map((ym) => (
            <section key={ym} id={`month-${ym}`}>
              <p className="text-[11px] text-stone-300 tracking-widest mb-2">
                {formatYM(ym)}
              </p>
              <div className="space-y-2">
                {groups[ym].map((entry) => {
                  const [y, m, d] = entry.date.split("-").map(Number);
                  return (
                    <button
                      key={entry.date}
                      onClick={() => setSelected(entry)}
                      className="w-full text-left bg-white rounded-2xl px-4 py-3 border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all duration-150"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] text-stone-400">
                          {y}年{m}月{d}日
                        </p>
                        {(entry.starred1 || entry.starred2) && (
                          <span className="text-xs text-amber-400">★</span>
                        )}
                      </div>

                      {/* 投稿1 */}
                      {(type === "post1" || type === "both" || type === "star") && entry.text && (
                        <div className={type === "star" && entry.starred1 ? "relative" : ""}>
                          {type === "star" && entry.starred1 && (
                            <span className="absolute -left-1 top-0 text-[11px] text-amber-400">★</span>
                          )}
                          <p className={`text-sm text-stone-600 leading-relaxed line-clamp-4 whitespace-pre-line ${type === "star" && entry.starred1 ? "pl-3" : ""}`}>
                            {cleanText(entry.text)}
                          </p>
                        </div>
                      )}

                      {/* 投稿1と2の区切り */}
                      {(type === "both" || type === "star") && entry.text && entry.text2 && (
                        <div className="h-px bg-stone-50 my-3" />
                      )}

                      {/* 投稿2 */}
                      {(type === "post2" || type === "both" || type === "star") && entry.text2 && (
                        <div className={type === "star" && entry.starred2 ? "relative" : ""}>
                          {type === "star" && entry.starred2 && (
                            <span className="absolute -left-1 top-0 text-[11px] text-amber-400">★</span>
                          )}
                          <p className={`text-sm text-stone-500 leading-relaxed line-clamp-4 whitespace-pre-line ${type === "star" && entry.starred2 ? "pl-3" : ""}`}>
                            {cleanText(entry.text2)}
                          </p>
                        </div>
                      )}

                      {/* 写真 */}
                      {entry.photos && entry.photos.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {entry.photos.slice(0, 3).map((url, i) => (
                            <div
                              key={i}
                              className="w-[30%] aspect-square rounded-lg overflow-hidden border border-stone-100 flex-shrink-0"
                            >
                              <img src={url} alt={`写真${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

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
