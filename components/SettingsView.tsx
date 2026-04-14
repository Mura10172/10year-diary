"use client";
import { useState, useEffect } from "react";
import { THEME_IDS, THEMES, loadThemeId, saveThemeId } from "@/lib/theme";
import { GLOBAL_THEME_IDS, GLOBAL_THEMES, loadGlobalThemeId, saveGlobalThemeId } from "@/lib/theme";
import type { ThemeId, GlobalThemeId } from "@/lib/theme";

const THEME_LABELS: Record<string, string> = {
  sky: "スカイ", amber: "アンバー", sage: "セージ", rose: "ローズ", lavender: "ラベンダー",
};

const GLOBAL_THEME_LABELS: Record<string, string> = {
  light: "ライト", dark: "ダーク", cream: "クリーム", gray: "グレー", midnight: "ミッドナイト",
};

const GLOBAL_THEME_ICONS: Record<string, string> = {
  light: "☀️", dark: "🌙", cream: "📜", gray: "🩶", midnight: "🌃",
};

export default function SettingsView({
  onOpenDictionary,
}: {
  onOpenDictionary: () => void;
}) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("sky");
  const [currentGlobal, setCurrentGlobal] = useState<GlobalThemeId>("light");

  useEffect(() => {
    setCurrentTheme(loadThemeId());
    setCurrentGlobal(loadGlobalThemeId());
  }, []);

  const handleThemeChange = (id: ThemeId) => {
    saveThemeId(id);
    setCurrentTheme(id);
  };

  const handleGlobalChange = (id: GlobalThemeId) => {
    saveGlobalThemeId(id);
    setCurrentGlobal(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">設定</p>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* Global color theme */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm px-5 py-4">
        <p className="text-sm font-medium text-stone-700 mb-1">全体カラーテーマ</p>
        <p className="text-xs text-stone-400 mb-3">背景・カード・フォント全体の色</p>
        <div className="grid grid-cols-5 gap-2">
          {GLOBAL_THEME_IDS.map((id) => {
            const t = GLOBAL_THEMES[id];
            const selected = currentGlobal === id;
            return (
              <button
                key={id}
                onClick={() => handleGlobalChange(id)}
                className="flex flex-col items-center gap-1.5"
              >
                {/* Mini page mockup */}
                <div
                  className="w-full rounded-xl overflow-hidden border-2 transition-all"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: selected ? t.text1 : t.border,
                    boxShadow: selected ? `0 0 0 1px ${t.text1}30` : "none",
                    paddingBottom: "6px",
                  }}
                >
                  {/* Top bar */}
                  <div className="h-2" style={{ backgroundColor: t.pageBg }} />
                  {/* Card mockup */}
                  <div
                    className="mx-1.5 rounded-lg p-1.5"
                    style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}` }}
                  >
                    <div className="h-1 rounded-full mb-1" style={{ backgroundColor: t.text3, width: "60%" }} />
                    <div className="h-1 rounded-full mb-1" style={{ backgroundColor: t.text3, opacity: 0.6, width: "85%" }} />
                    <div className="h-1 rounded-full" style={{ backgroundColor: t.text3, opacity: 0.4, width: "45%" }} />
                  </div>
                  {/* Bottom bar */}
                  <div className="h-2" style={{ backgroundColor: t.pageBg }} />
                </div>
                {/* Label */}
                <p
                  className="text-[9px] font-medium leading-none"
                  style={{ color: selected ? t.text1 : "#a8a29e" }}
                >
                  {GLOBAL_THEME_ICONS[id]} {GLOBAL_THEME_LABELS[id]}
                </p>
                {selected && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.text1 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top color theme (DailyStar card) */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm px-5 py-4">
        <p className="text-sm font-medium text-stone-700 mb-1">トップカラーテーマ</p>
        <p className="text-xs text-stone-400 mb-3">トップのお気に入りカードの色</p>
        <div className="grid grid-cols-5 gap-2">
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const selected = currentTheme === id;
            return (
              <button
                key={id}
                onClick={() => handleThemeChange(id)}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-full rounded-xl p-2 border-2 transition-all"
                  style={{
                    backgroundColor: t.bg,
                    borderColor: selected ? t.accent : t.border,
                    boxShadow: selected ? `0 0 0 2px ${t.accent}40` : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-1.5 w-5 rounded-full bg-stone-200" />
                    <span style={{ color: t.accent }} className="text-[10px] leading-none">★</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-200 mb-1" />
                  <div className="h-1.5 w-4/5 rounded-full bg-stone-200 mb-1" />
                  <div className="h-1.5 w-3/5 rounded-full bg-stone-200" />
                </div>
                <p
                  className="text-[10px] font-medium leading-none"
                  style={{ color: selected ? t.accent : "#a8a29e" }}
                >
                  {THEME_LABELS[id]}
                </p>
                {selected && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dictionary */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <button
          onClick={onOpenDictionary}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-700">難読字・略語</p>
              <p className="text-xs text-stone-400 mt-0.5">読みと表示単位の変換ルールを登録</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
