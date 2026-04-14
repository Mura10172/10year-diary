"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import DateNav from "@/components/DateNav";
import TodayEntry from "@/components/TodayEntry";
import DailyStar from "@/components/DailyStar";
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
  const swipeRef = useRef<HTMLDivElement>(null);

  // 非ホームビューで左右スワイプ → ホームに戻る
  useEffect(() => {
    if (view === "home") return;
    const el = swipeRef.current;
    if (!el) return;
    const start = { x: 0, y: 0 };
    const onStart = (e: TouchEvent) => { start.x = e.touches[0].clientX; start.y = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setView("home");
        setDictionaryOpen(false);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [view]);

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

  // ホームに戻ったとき最上部（★カード）にスクロール
  useEffect(() => {
    if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [view]);

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

              <DailyStar refreshKey={refreshKey} />

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
          ) : (
            <div ref={swipeRef}>
              {view === "settings" ? (
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
