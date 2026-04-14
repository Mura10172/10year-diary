"use client";
import { useState, useEffect } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import EntryModal from "@/components/EntryModal";
import { loadThemeId, getTheme } from "@/lib/theme";
import type { ColorTheme } from "@/lib/theme";

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function cleanText(text: string): string {
  return text.replace(/\n{2,}/g, "\n").trim();
}

export default function DailyStar({ refreshKey }: { refreshKey: number }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState(false);
  const [theme, setTheme] = useState<ColorTheme>(() => getTheme());

  useEffect(() => {
    const all = getAllEntries();
    const starred = all.filter((e) => e.starred1 || e.starred2);
    if (starred.length === 0) { setEntry(null); return; }
    const key = todayDateKey();
    const hash = key.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    setEntry(starred[hash % starred.length]);
  }, [refreshKey]);

  useEffect(() => {
    const onThemeChange = () => setTheme(getTheme());
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  if (!entry) return null;

  const [y, m, d] = entry.date.split("-").map(Number);
  const showText1 = !!entry.starred1 && !!entry.text;
  const showText2 = !!entry.starred2 && !!entry.text2;

  return (
    <>
      <div>
        <button
          onClick={() => setSelected(true)}
          className="w-full text-left rounded-2xl px-4 py-3 border hover:shadow-sm transition-all duration-150"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.border,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.hoverBorder)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-stone-400">{y}年{m}月{d}日</p>
            <span className="text-xs" style={{ color: theme.accent }}>★</span>
          </div>
          {showText1 && (
            <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 whitespace-pre-line">
              {cleanText(entry.text!)}
            </p>
          )}
          {showText2 && (
            <p className={`text-sm text-stone-500 leading-relaxed line-clamp-4 whitespace-pre-line ${showText1 ? "mt-2" : ""}`}>
              {cleanText(entry.text2!)}
            </p>
          )}
        </button>
      </div>
      {selected && (
        <EntryModal entry={entry} onClose={() => setSelected(false)} />
      )}
    </>
  );
}
