"use client";
import { useState, useEffect } from "react";
import { getEntry, saveEntry, deleteEntry } from "@/lib/storage";
import { syncSave, syncDelete } from "@/lib/syncToSheets";
import { useSpeech } from "@/hooks/useSpeech";
import { Entry } from "@/types";

export default function TodayEntry({
  date,
  onSaved,
  refreshKey,
}: {
  date: string;
  onSaved?: () => void;
  refreshKey?: number;
}) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(true);
  const { listening, interim, supported, start, stop } = useSpeech();

  useEffect(() => {
    stop();
    const e = getEntry(date) ?? null;
    setEntry(e);
    setText(e?.text ?? "");
    setEditing(!e);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, stop, refreshKey]);

  const handleVoice = () => {
    if (listening) {
      stop();
    } else {
      start((final) => setText((prev) => prev + final));
    }
  };

  const handleSave = () => {
    const t = text.trim();
    if (!t) return;
    stop();
    const now = Date.now();
    const updated: Entry = {
      id: entry?.id ?? crypto.randomUUID(),
      date,
      text: t,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
    setText(t);
    setEditing(false);
    onSaved?.();
  };

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setText(entry?.text ?? "");
    setEditing(false);
    stop();
  };

  const handleDelete = () => {
    if (!confirm("この日記を削除しますか？")) return;
    deleteEntry(date);
    syncDelete(date);
    setEntry(null);
    setText("");
    setEditing(true);
    stop();
    onSaved?.();
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="今日はどんな一日でしたか..."
            className="w-full min-h-[160px] text-sm text-stone-700 leading-relaxed resize-none outline-none placeholder-stone-200"
            autoFocus
          />
          {listening && interim && (
            <p className="text-xs text-stone-300 italic leading-relaxed px-0.5">
              {interim}
            </p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-stone-50">
            <div>
              {supported && (
                <button
                  onClick={handleVoice}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    listening
                      ? "bg-red-50 text-red-500"
                      : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  <MicIcon listening={listening} />
                  {listening ? "録音停止" : "音声入力"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {entry && (
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!text.trim()}
                className="px-4 py-1.5 bg-stone-800 text-white text-xs rounded-xl disabled:opacity-30 hover:bg-stone-700 active:scale-95 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-700 leading-[1.9] whitespace-pre-wrap">
            {entry?.text}
          </p>
          <div className="flex justify-end gap-1 pt-2 border-t border-stone-50">
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-red-400 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg
      className={`w-3 h-3 ${listening ? "animate-pulse" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}
