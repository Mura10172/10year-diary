"use client";
import { useState, useEffect } from "react";
import { saveEntry, deleteEntry } from "@/lib/storage";
import { syncSave, syncDelete } from "@/lib/syncToSheets";
import { useSpeech } from "@/hooks/useSpeech";
import { formatJapanese } from "@/components/DateNav";
import { Entry } from "@/types";

export default function EntryModal({
  entry: initialEntry,
  onClose,
}: {
  entry: Entry;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialEntry.text);
  const { listening, interim, supported, start, stop } = useSpeech();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { stop(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, stop]);

  const handleVoice = () => {
    if (listening) stop();
    else start((final) => setText((prev) => prev + final));
  };

  const handleSave = () => {
    const t = text.trim();
    if (!t) return;
    stop();
    const updated: Entry = { ...entry, text: t, updatedAt: Date.now() };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirm("この日記を削除しますか？")) return;
    deleteEntry(entry.date);
    syncDelete(entry.date);
    stop();
    onClose();
  };

  const handleCancelEdit = () => {
    setText(entry.text);
    setEditing(false);
    stop();
  };

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) { stop(); onClose(); } }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-50">
          <div>
            <p className="text-sm font-medium text-stone-700">
              {formatJapanese(entry.date)}
            </p>
            {entry.updatedAt !== entry.createdAt && (
              <p className="text-xs text-stone-300 mt-0.5">
                編集済み
              </p>
            )}
          </div>
          <button
            onClick={() => { stop(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-stone-300 hover:text-stone-500 hover:bg-stone-100 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {editing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[200px] text-sm text-stone-700 leading-[1.9] resize-none outline-none"
              autoFocus
            />
          ) : (
            <p className="text-sm text-stone-700 leading-[1.9] whitespace-pre-wrap">
              {entry.text}
            </p>
          )}
          {listening && interim && (
            <p className="text-xs text-stone-300 italic mt-2">{interim}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-3 border-t border-stone-50">
          {editing ? (
            <>
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
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={!text.trim()}
                  className="px-4 py-1.5 bg-stone-800 text-white text-xs rounded-xl disabled:opacity-30 hover:bg-stone-700 active:scale-95 transition-all"
                >
                  保存
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs text-stone-300 hover:text-red-400 transition-colors"
              >
                削除
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-1.5 bg-stone-100 text-stone-600 text-xs rounded-xl hover:bg-stone-200 transition-all"
              >
                編集
              </button>
            </>
          )}
        </div>
      </div>
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
