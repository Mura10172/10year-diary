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
import { saveEntry, getEntry } from "@/lib/storage";
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

const PULL_THRESHOLD = 72; // px pulled down to trigger reload

export default function Home() {
  const [date, setDate] = useState(todayStr);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editTrigger, setEditTrigger] = useState(0);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const isToday = date === todayStr();
  const swipeRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef<number | null>(null);
  const syncingRef = useRef(false);

  // --- Google Sheets sync (called on pull-to-refresh) ---
  const loadFromSheets = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      if (data.ok && Array.isArray(data.entries)) {
        data.entries.forEach((entry: Entry) => {
          const local = getEntry(entry.date);
          if (!local || entry.updatedAt > local.updatedAt) {
            saveEntry(entry);
          }
        });
        setRefreshKey((k) => k + 1);
      }
    } catch {
      // 失敗しても localStorage のデータで動作継続
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // --- PC: 起動時に自動ロード（タッチデバイス以外のみ） ---
  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (!isTouch) {
      loadFromSheets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Pull-to-refresh touch handlers (home view only) ---
  useEffect(() => {
    if (view !== "home") return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (pullStartY.current === null) return;
      const dist = e.touches[0].clientY - pullStartY.current;
      if (dist > 0 && window.scrollY === 0) {
        setPullDist(Math.min(dist * 0.5, PULL_THRESHOLD + 16));
      } else {
        pullStartY.current = null;
        setPullDist(0);
      }
    };
    const onTouchEnd = () => {
      if (pullDist >= PULL_THRESHOLD * 0.5) {
        loadFromSheets();
      }
      pullStartY.current = null;
      setPullDist(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [view, pullDist, loadFromSheets]);

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
    if (view === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [view]);

  const handleMenuSelect = useCallback((ym: string) => {
    setTimeout(() => {
      document.getElementById(`month-${ym}`)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);

  // Pull indicator style
  const pulling = pullDist > 0;
  const pullReady = pullDist >= PULL_THRESHOLD * 0.5;

  return (
    <>
      <main className="min-h-screen bg-stone-50 px-4 pb-24"
        style={{ paddingTop: pulling ? `${Math.max(32, pullDist + 8)}px` : "2rem", transition: pulling ? "none" : "padding-top 0.2s ease" }}
      >
        {/* Pull-to-refresh indicator */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: `${Math.max(0, pullDist)}px`,
            overflow: "hidden",
            transition: pulling ? "none" : "height 0.2s ease",
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          {(pulling || syncing) && (
            <div className="flex items-center gap-1.5">
              {syncing ? (
                <svg className="w-3.5 h-3.5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-stone-400"
                  style={{ transform: `rotate(${pullReady ? 180 : 0}deg)`, transition: "transform 0.2s" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              <p className="text-[11px] text-stone-400">
                {syncing ? "読み込み中..." : pullReady ? "離して更新" : "引っ張って更新"}
              </p>
            </div>
          )}
        </div>

        <div className="max-w-[520px] mx-auto space-y-5">
          {view === "home" ? (
            <>
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
