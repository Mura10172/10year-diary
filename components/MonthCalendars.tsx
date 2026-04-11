"use client";
import { useState, useEffect } from "react";
import { getEntryDatesForMonth } from "@/lib/storage";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function MonthCalendar({
  year,
  month,
  selectedDate,
  today,
  onSelect,
  refreshKey,
}: {
  year: number;
  month: number;
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
  refreshKey: number;
}) {
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEntryDates(getEntryDatesForMonth(year, month));
  }, [year, month, refreshKey]);

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl px-4 pt-4 pb-3 border border-stone-100">
      <p className="text-xs font-medium text-stone-500 text-center mb-3 tracking-wide">
        {year}年{month}月
      </p>
      <div className="grid grid-cols-7 gap-y-0.5">
        {DOW.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[10px] font-medium pb-1.5 ${
              i === 0 ? "text-red-300" : i === 6 ? "text-blue-300" : "text-stone-300"
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="h-8" />;

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
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
  );
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
  const [year, month] = date.split("-").map(Number);

  const months = [0, -1, -2].map((offset) => {
    const d = new Date(year, month - 1 + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">
          カレンダー
        </p>
        <div className="flex-1 h-px bg-stone-100" />
      </div>
      <div className="space-y-3">
        {months.map(({ year: y, month: m }) => (
          <MonthCalendar
            key={`${y}-${m}`}
            year={y}
            month={m}
            selectedDate={date}
            today={today}
            onSelect={onSelect}
            refreshKey={refreshKey}
          />
        ))}
      </div>
    </>
  );
}
