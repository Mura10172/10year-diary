"use client";
import { useState, useEffect, useRef } from "react";
import { getEntryDatesForMonth } from "@/lib/storage";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MonthCalendars({
  date,
  onSelect,
  refreshKey,
}: {
  date: string;
  onSelect: (date: string) => void;
  refreshKey: number;
}) {
  const today = todayStr();
  const [ty, tm] = today.split("-").map(Number);

  const [calYear, setCalYear] = useState(() => parseInt(date.split("-")[0]));
  const [calMonth, setCalMonth] = useState(() => parseInt(date.split("-")[1]));
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(calYear);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntryDates(getEntryDatesForMonth(calYear, calMonth));
  }, [calYear, calMonth, refreshKey]);

  // カレンダーを選択日に追従
  useEffect(() => {
    const [y, m] = date.split("-").map(Number);
    setCalYear(y);
    setCalMonth(m);
  }, [date]);

  // ピッカー外クリックで閉じる
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calYear > ty || (calYear === ty && calMonth >= tm)) return;
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const canNextMonth = !(calYear >= ty && calMonth >= tm);

  const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
          カレンダー
        </p>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      <div className="bg-white rounded-2xl px-4 pt-4 pb-3 border border-stone-100">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors text-base leading-none"
          >
            ‹
          </button>

          {/* 月ピッカー */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => {
                setPickerYear(calYear);
                setShowPicker((p) => !p);
              }}
              className="text-xs font-medium text-stone-600 hover:text-stone-800 px-2 py-1 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {calYear}年{calMonth}月 ▾
            </button>

            {showPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-stone-200 rounded-2xl shadow-lg z-50 p-3 w-52">
                <div className="flex items-center justify-between mb-2 px-1">
                  <button
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="text-xs text-stone-400 hover:text-stone-600 px-2 py-0.5"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-medium text-stone-600">
                    {pickerYear}年
                  </span>
                  <button
                    onClick={() => setPickerYear((y) => y + 1)}
                    disabled={pickerYear >= ty}
                    className="text-xs text-stone-400 hover:text-stone-600 px-2 py-0.5 disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isFuture =
                      pickerYear > ty || (pickerYear === ty && m > tm);
                    const isSelected =
                      pickerYear === calYear && m === calMonth;
                    return (
                      <button
                        key={m}
                        disabled={isFuture}
                        onClick={() => {
                          setCalYear(pickerYear);
                          setCalMonth(m);
                          setShowPicker(false);
                          const firstDay = `${pickerYear}-${String(m).padStart(2, "0")}-01`;
                          if (firstDay <= today) onSelect(firstDay);
                        }}
                        className={`py-1.5 text-xs rounded-lg transition-colors ${
                          isSelected
                            ? "bg-stone-800 text-white"
                            : isFuture
                            ? "text-stone-200 cursor-default"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {m}月
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={nextMonth}
            disabled={!canNextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors text-base leading-none"
          >
            ›
          </button>
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {DOW.map((w, i) => (
            <div
              key={w}
              className={`text-center text-[10px] font-medium pb-1.5 ${
                i === 0
                  ? "text-red-300"
                  : i === 6
                  ? "text-blue-300"
                  : "text-stone-300"
              }`}
            >
              {w}
            </div>
          ))}

          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="h-8" />;
            const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === date;
            const isToday = dateStr === today;
            const isFuture = dateStr > today;
            const hasEntry = entryDates.has(dateStr);
            const col = i % 7;

            return (
              <button
                key={day}
                onClick={() => !isFuture && onSelect(dateStr)}
                disabled={isFuture}
                className={`relative h-8 w-full flex items-center justify-center text-xs rounded-lg transition-all ${
                  isSelected
                    ? "bg-stone-800 text-white font-medium"
                    : isToday
                    ? "bg-amber-50 text-amber-500 font-medium"
                    : isFuture
                    ? "text-stone-200 cursor-default"
                    : col === 0
                    ? "text-red-400 hover:bg-red-50"
                    : col === 6
                    ? "text-blue-400 hover:bg-blue-50"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {day}
                {hasEntry && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
