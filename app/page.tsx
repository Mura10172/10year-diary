"use client";
import { useState, useCallback, useEffect } from "react";
import DateNav from "@/components/DateNav";
import TodayEntry from "@/components/TodayEntry";
import PastEntries from "@/components/PastEntries";
import MonthCalendars from "@/components/MonthCalendars";
import { saveEntry, clearAllEntries } from "@/lib/storage";
import { Entry } from "@/types";

function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + days);
  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function Home() {
  const [date, setDate] = useState(todayStr);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(true);
  const isToday = date === todayStr();

  // 起動時に Google Sheets から全データを読み込む
  useEffect(() => {
    async function loadFromSheets() {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (data.ok && Array.isArray(data.entries)) {
          clearAllEntries();
          data.entries.forEach((entry: Entry) => saveEntry(entry));
          setRefreshKey((k) => k + 1);
        }
      } catch {
        // 失敗しても localStorage のデータで動作継続
      } finally {
        setSyncing(false);
      }
    }
    loadFromSheets();
  }, []);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const goTo = useCallback(
    (days: number) => {
      const next = shiftDate(date, days);
      if (next <= todayStr()) setDate(next);
    },
    [date]
  );

  const handleSelect = useCallback((d: string) => {
    if (d <= todayStr()) setDate(d);
  }, []);

  return (
    <main className="min-h-screen px-4 py-10 pb-20">
      <div className="max-w-[520px] mx-auto space-y-5">
        {/* App title */}
        <div className="text-center pb-2">
          <h1 className="text-xs tracking-[0.3em] text-stone-400 font-light">
            10年日記
          </h1>
          {syncing && (
            <p className="text-[10px] text-stone-300 mt-1 animate-pulse">
              データを読み込み中...
            </p>
          )}
        </div>

        {/* Date navigation */}
        <DateNav
          date={date}
          onPrev={() => goTo(-1)}
          onNext={() => goTo(1)}
          isToday={isToday}
        />

        {/* Today's entry editor */}
        <TodayEntry date={date} onSaved={handleRefresh} refreshKey={refreshKey} />

        {/* Past 10 years for same M/D */}
        <PastEntries date={date} refreshKey={refreshKey} onRefresh={handleRefresh} />

        {/* 3-month calendars */}
        <MonthCalendars date={date} onSelect={handleSelect} refreshKey={refreshKey} />
      </div>
    </main>
  );
}
