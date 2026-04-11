"use client";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatJapanese(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

export default function DateNav({
  date,
  onPrev,
  onNext,
  isToday,
}: {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  isToday: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrev}
        className="w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all text-xl"
        aria-label="前の日"
      >
        ‹
      </button>

      <div className="text-center">
        <p className="text-base font-light tracking-wide text-stone-700">
          {formatJapanese(date)}
        </p>
        <p className="text-xs mt-0.5 h-4">
          {isToday && (
            <span className="text-amber-500 tracking-widest font-medium">今日</span>
          )}
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={isToday}
        className="w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-xl"
        aria-label="次の日"
      >
        ›
      </button>
    </div>
  );
}
