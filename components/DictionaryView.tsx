"use client";
import { useState, useEffect, useRef } from "react";
import { DictEntry, loadDictionary, syncDictionaryToSheets, syncDictionaryFromSheets } from "@/lib/dictionary";

export default function DictionaryView({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<DictEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const originalRef = useRef<DictEntry[]>([]);

  useEffect(() => {
    async function load() {
      const entries = await syncDictionaryFromSheets();
      const withEmpty = [...entries, { pronunciation: "", display: "" }];
      setRows(withEmpty);
      originalRef.current = entries;
      setSyncing(false);
    }
    load();
  }, []);

  const handleChange = (idx: number, field: keyof DictEntry, value: string) => {
    setRows((prev) => {
      const next = prev.map((r, i) => i === idx ? { ...r, [field]: value } : r);
      // 最終行に入力があったら新しい空行を追加
      const last = next[next.length - 1];
      if (last.pronunciation || last.display) {
        next.push({ pronunciation: "", display: "" });
      }
      return next;
    });
  };

  const handleDelete = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    const filtered = rows.filter((r) => r.pronunciation || r.display);
    await syncDictionaryToSheets(filtered);
    originalRef.current = filtered;
    setSaving(false);
    onBack();
  };

  const handleCancel = () => {
    onBack();
  };

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
        >
          ‹
        </button>
        <div className="flex-1 h-px bg-stone-100" />
        <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">音声認識 辞書</p>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {syncing ? (
        <p className="text-center text-[11px] text-stone-300 animate-pulse py-8">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          {/* 列ヘッダー */}
          <div className="flex items-center border-b border-stone-50 px-4 py-2">
            <div className="flex-1 text-[11px] text-stone-400 tracking-widest text-center">発音</div>
            <div className="w-6 text-center text-[11px] text-stone-200">→</div>
            <div className="flex-1 text-[11px] text-stone-400 tracking-widest text-center">表示単語</div>
            <div className="w-6" />
          </div>

          {/* 行 */}
          <div className="divide-y divide-stone-50">
            {rows.map((row, idx) => {
              const isLast = idx === rows.length - 1;
              return (
                <div key={idx} className="flex items-center px-4 py-2 gap-1">
                  <input
                    value={row.pronunciation}
                    onChange={(e) => handleChange(idx, "pronunciation", e.target.value)}
                    placeholder={isLast ? "発音を入力" : ""}
                    className="flex-1 text-sm text-stone-700 outline-none placeholder-stone-200 py-1"
                  />
                  <div className="w-6 text-center text-xs text-stone-300">→</div>
                  <input
                    value={row.display}
                    onChange={(e) => handleChange(idx, "display", e.target.value)}
                    placeholder={isLast ? "表示単語を入力" : ""}
                    className="flex-1 text-sm text-stone-700 outline-none placeholder-stone-200 py-1"
                  />
                  <div className="w-6 flex justify-end">
                    {!isLast && (
                      <button
                        onClick={() => handleDelete(idx)}
                        className="text-stone-200 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 保存・キャンセル */}
      {!syncing && (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-2xl text-sm text-stone-400 bg-white border border-stone-100 hover:bg-stone-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm text-white bg-stone-800 hover:bg-stone-700 disabled:opacity-50 transition-colors active:scale-95"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      )}
    </div>
  );
}
