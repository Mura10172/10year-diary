"use client";
import { useState, useCallback, useEffect } from "react";
import DateNav from "@/components/DateNav";
import TodayEntry from "@/components/TodayEntry";
import PastEntries from "@/components/PastEntries";
import MonthCalendars from "@/components/MonthCalendars";
import RecentEntries from "@/components/RecentEntries";
import BottomNav from "@/components/BottomNav";
import type { View } from "@/components/BottomNav";
import ListView from "@/components/ListView";
import SideMenu from "@/components/SideMenu";
import HomeMenu from "@/components/HomeMenu";
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
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
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
    if (d <= todayStr()) {
      setDate(d);
      setView("home");
    }
  }, []);

  const handleMenuSelect = useCallback((ym: string) => {
    // Scroll to the month section in ListView after menu closes
    setTimeout(() => {
      document.getElementById(`month-${ym}`)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-stone-50 px-4 py-8 pb-24">
        <div className="max-w-[520px] mx-auto space-y-5">
          {view === "home" ? (
            <>
              {syncing && (
                <p className="text-center text-[10px] text-stone-300 animate-pulse">
                  データを読み込み中...
                </p>
              )}

              <div className="flex justify-end -mt-2 mb-1">
                <button
                  onClick={() => setHomeMenuOpen(true)}
                  className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-all"
                  aria-label="メニュー"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <DateNav
                date={date}
                onPrev={() => goTo(-1)}
                onNext={() => goTo(1)}
                onToday={() => setDate(todayStr())}
                isToday={isToday}
              />

              <TodayEntry date={date} onSaved={handleRefresh} refreshKey={refreshKey} />

              <RecentEntries date={date} onSelect={handleSelect} refreshKey={refreshKey} />

              <MonthCalendars date={date} onSelect={handleSelect} refreshKey={refreshKey} />

              <PastEntries date={date} refreshKey={refreshKey} onRefresh={handleRefresh} />
            </>
          ) : (
            <ListView
              type={view}
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
              onMenuOpen={() => setMenuOpen(true)}
            />
          )}
        </div>
      </main>

      <BottomNav view={view} onChangeView={setView} />

      {homeMenuOpen && (
        <HomeMenu
          onClose={() => setHomeMenuOpen(false)}
          onSelect={(v) => { setView(v); setHomeMenuOpen(false); }}
        />
      )}

      {menuOpen && (
        <SideMenu
          onClose={() => setMenuOpen(false)}
          onSelect={handleMenuSelect}
          refreshKey={refreshKey}
        />
      )}
    </>
  );
}
