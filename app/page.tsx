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
import SettingsView from "@/components/SettingsView";
import DictionaryView from "@/components/DictionaryView";
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
  const [editTrigger, setEditTrigger] = useState(0);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
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
      setScrollTrigger((k) => k + 1);
    }
  }, []);

  const handleSelectEdit = useCallback((d: string) => {
    if (d <= todayStr()) {
      setDate(d);
      setView("home");
      setEditTrigger((k) => k + 1);
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
                <p className="text-center text-[11px] text-stone-300 animate-pulse">
                  データを読み込み中...
                </p>
              )}

              <DateNav
                date={date}
                onPrev={() => goTo(-1)}
                onNext={() => goTo(1)}
                onToday={() => setDate(todayStr())}
                isToday={isToday}
              />

              <TodayEntry date={date} onSaved={handleRefresh} refreshKey={refreshKey} onPrev={() => goTo(-1)} onNext={() => goTo(1)} startEditing={editTrigger} scrollTrigger={scrollTrigger} />

              <RecentEntries date={date} onSelect={handleSelect} refreshKey={refreshKey} />

              <MonthCalendars date={date} onSelect={handleSelect} onSelectEdit={handleSelectEdit} refreshKey={refreshKey} />

              <PastEntries date={date} refreshKey={refreshKey} onRefresh={handleRefresh} />
            </>
          ) : view === "settings" ? (
            dictionaryOpen ? (
              <DictionaryView onBack={() => setDictionaryOpen(false)} />
            ) : (
              <SettingsView onOpenDictionary={() => setDictionaryOpen(true)} />
            )
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

      <BottomNav view={view} onChangeView={(v) => { setView(v); setDictionaryOpen(false); }} />

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
