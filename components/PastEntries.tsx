"use client";
import { useState, useEffect, useRef } from "react";
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

type PageData = { year: number; left: Entry | null; right: Entry | null };

/** その年の中でこの日に近い順に最大2つ返す */
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

export default function PastEntries({
  date,
  refreshKey,
  onRefresh,
}: {
  date: string;
  refreshKey: number;
  onRefresh?: () => void;
}) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<Entry | null>(null);

  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const swipeDirRef = useRef<"h" | "v" | null>(null);
  const canOlderRef = useRef(false);
  const canNewerRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const currentYear = parseInt(date.split("-")[0]);
  const [, m, d] = date.split("-").map(Number);

  const maxPage = 9; // 10ページ = 10年前まで

  useEffect(() => {
    setCurrentPage(0);
    setSelected(null);
  }, [date]);

  useEffect(() => {
    const today = todayStr();
    const entries = getAllEntries().filter((e) => e.date < today);

    const built: PageData[] = [];
    for (let p = 0; p <= maxPage; p++) {
      const year = currentYear - 1 - p;
      const [left, right] = findTwoClosest(entries, year, m, d);
      built.push({ year, left, right });
    }
    setPages(built);
  }, [date, refreshKey, currentYear, m, d]);

  const canOlder = currentPage < maxPage;
  const canNewer = currentPage > 0;

  canOlderRef.current = canOlder;
  canNewerRef.current = canNewer;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      dragDeltaRef.current = 0;
      swipeDirRef.current = null;
      setIsAnimating(false);
      setDragDelta(0);
    };

    const onMove = (e: TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      const dx = e.touches[0].clientX - touchStartXRef.current;
      const dy = e.touches[0].clientY - touchStartYRef.current;
      if (!swipeDirRef.current) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        swipeDirRef.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (swipeDirRef.current === "v") return;
      e.preventDefault();
      const older = canOlderRef.current;
      const newer = canNewerRef.current;
      let delta = dx;
      if (!older && delta < 0) delta = dx * 0.2;
      else if (!newer && delta > 0) delta = dx * 0.2;
      dragDeltaRef.current = delta;
      setDragDelta(delta);
    };

    const onEnd = () => {
      if (touchStartXRef.current === null) return;
      const delta = dragDeltaRef.current;
      setIsAnimating(true);
      if (delta < -50 && canOlderRef.current) setCurrentPage((p) => p + 1);
      else if (delta > 50 && canNewerRef.current) setCurrentPage((p) => p - 1);
      dragDeltaRef.current = 0;
      setDragDelta(0);
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      swipeDirRef.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);



  if (pages.length === 0) return null;

  const translateX = `calc(${-currentPage * 100}% + ${dragDelta}px)`;

  function entryLabel(entry: Entry) {
    const [, em, ed] = entry.date.split("-").map(Number);
    return `${em}月${ed}日`;
  }

  function Post1Cell({ entry, year }: { entry: Entry | null; year: number }) {
    if (!entry) {
      return (
        <div className="flex flex-col px-3 py-3 bg-white/60 rounded-2xl border border-stone-50">
          <span className="text-[10px] text-stone-300 mb-1.5">{year}年</span>
          <div className="h-[7rem] flex items-center">
            <span className="text-xs text-stone-200">—</span>
          </div>
        </div>
      );
    }
    return (
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
    );
  }

  function Post2Cell({ entry, year }: { entry: Entry | null; year: number }) {
    if (!entry?.text2) {
      return (
        <div className="rounded-2xl border border-stone-50 bg-white/40 h-[7rem]" />
      );
    }
    return (
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
    );
  }

  return (
    <>
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-stone-100" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsAnimating(true); setCurrentPage((p) => p + 1); }}
              disabled={!canOlder}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 disabled:opacity-30 text-sm leading-none"
            >
              ‹
            </button>
            <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
              過去のこの日に近い投稿
            </p>
            <button
              onClick={() => { setIsAnimating(true); setCurrentPage((p) => p - 1); }}
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
            ref={trackRef}
            style={{
              display: "flex",
              transform: `translateX(${translateX})`,
              transition: isAnimating ? "transform 0.3s ease" : "none",
            }}
            onTransitionEnd={() => setIsAnimating(false)}
          >
            {pages.map(({ year, left, right }, pageIdx) => (
              <div
                key={pageIdx}
                style={{ minWidth: "100%" }}
                className="grid grid-cols-2 gap-2"
              >
                {/* 行1: 投稿１ × 2列 */}
                <Post1Cell entry={left} year={year} />
                <Post1Cell entry={right} year={year} />
                {/* 行2: 投稿２ × 2列 */}
                <Post2Cell entry={left} year={year} />
                <Post2Cell entry={right} year={year} />
              </div>
            ))}
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
