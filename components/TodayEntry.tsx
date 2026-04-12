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

  // Section 1 state
  const [text1, setText1] = useState("");
  const [editing1, setEditing1] = useState(true);
  const speech1 = useSpeech();

  // Section 2 state
  const [text2, setText2] = useState("");
  const [editing2, setEditing2] = useState(true);
  const speech2 = useSpeech();

  useEffect(() => {
    speech1.stop();
    speech2.stop();
    const e = getEntry(date) ?? null;
    setEntry(e);
    setText1(e?.text ?? "");
    setText2(e?.text2 ?? "");
    setEditing1(!e?.text);
    setEditing2(!e?.text2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, refreshKey]);

  // --- Section 1 handlers ---
  const handleVoice1 = () => {
    if (speech1.listening) speech1.stop();
    else speech1.start((final) => setText1((prev) => prev + final));
  };

  const handleSave1 = () => {
    const t = text1.trim();
    if (!t) return;
    speech1.stop();
    const now = Date.now();
    const updated: Entry = {
      id: entry?.id ?? crypto.randomUUID(),
      date,
      text: t,
      text2: entry?.text2,
      starred1: entry?.starred1,
      starred2: entry?.starred2,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
    setText1(t);
    setEditing1(false);
    onSaved?.();
  };

  const handleCancel1 = () => {
    setText1(entry?.text ?? "");
    setEditing1(false);
    speech1.stop();
  };

  const handleDelete1 = () => {
    if (!confirm("この日記を削除しますか？（気づきも削除されます）")) return;
    deleteEntry(date);
    syncDelete(date);
    setEntry(null);
    setText1("");
    setText2("");
    setEditing1(true);
    setEditing2(true);
    speech1.stop();
    onSaved?.();
  };

  const handleStar1 = () => {
    if (!entry) return;
    const updated: Entry = { ...entry, starred1: !entry.starred1, updatedAt: Date.now() };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
  };

  // --- Section 2 handlers ---
  const handleVoice2 = () => {
    if (speech2.listening) speech2.stop();
    else speech2.start((final) => setText2((prev) => prev + final));
  };

  const handleSave2 = () => {
    const t = text2.trim();
    speech2.stop();
    const now = Date.now();
    const updated: Entry = {
      id: entry?.id ?? crypto.randomUUID(),
      date,
      text: entry?.text ?? "",
      text2: t || undefined,
      starred1: entry?.starred1,
      starred2: t ? entry?.starred2 : undefined,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
    setText2(t);
    setEditing2(!t);
    onSaved?.();
  };

  const handleCancel2 = () => {
    setText2(entry?.text2 ?? "");
    setEditing2(false);
    speech2.stop();
  };

  const handleDelete2 = () => {
    if (!entry) return;
    if (!confirm("この気づきを削除しますか？")) return;
    const updated: Entry = {
      ...entry,
      text2: undefined,
      starred2: undefined,
      updatedAt: Date.now(),
    };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
    setText2("");
    setEditing2(true);
    speech2.stop();
    onSaved?.();
  };

  const handleStar2 = () => {
    if (!entry) return;
    const updated: Entry = { ...entry, starred2: !entry.starred2, updatedAt: Date.now() };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-4">
      {/* Section 1 */}
      <div>
        {editing1 ? (
          <div className="space-y-3">
            <textarea
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="今日はどんな一日でしたか..."
              className="w-full min-h-[120px] text-sm text-stone-700 leading-relaxed resize-none outline-none placeholder-stone-200"
              autoFocus
            />
            {speech1.listening && speech1.interim && (
              <p className="text-xs text-stone-300 italic leading-relaxed">{speech1.interim}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-stone-50">
              <div>
                {speech1.supported && (
                  <button
                    onClick={handleVoice1}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      speech1.listening
                        ? "bg-red-50 text-red-500"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    <MicIcon listening={speech1.listening} />
                    {speech1.listening ? "録音停止" : "音声入力"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {entry?.text && (
                  <button
                    onClick={handleCancel1}
                    className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  onClick={handleSave1}
                  disabled={!text1.trim()}
                  className="px-4 py-1.5 bg-stone-800 text-white text-xs rounded-xl disabled:opacity-30 hover:bg-stone-700 active:scale-95 transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-700 leading-[1.9] whitespace-pre-wrap">{entry?.text}</p>
            <div className="flex justify-end gap-1 pt-2 border-t border-stone-50">
              <button onClick={() => setEditing1(true)} className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                編集
              </button>
              <button onClick={handleDelete1} className="px-3 py-1.5 text-xs text-stone-400 hover:text-red-400 transition-colors">
                削除
              </button>
              <button
                onClick={handleStar1}
                className={`px-3 py-1.5 text-xs transition-colors ${entry?.starred1 ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}
              >
                {entry?.starred1 ? "★" : "☆"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-stone-50" />

      {/* Section 2 */}
      <div>
        {editing2 ? (
          <div className="space-y-3">
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="日記からの気づき..."
              className="w-full min-h-[100px] text-sm text-stone-700 leading-relaxed resize-none outline-none placeholder-stone-200"
            />
            {speech2.listening && speech2.interim && (
              <p className="text-xs text-stone-300 italic leading-relaxed">{speech2.interim}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-stone-50">
              <div>
                {speech2.supported && (
                  <button
                    onClick={handleVoice2}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      speech2.listening
                        ? "bg-red-50 text-red-500"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    <MicIcon listening={speech2.listening} />
                    {speech2.listening ? "録音停止" : "音声入力"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {entry?.text2 && (
                  <button
                    onClick={handleCancel2}
                    className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  onClick={handleSave2}
                  className="px-4 py-1.5 bg-stone-800 text-white text-xs rounded-xl disabled:opacity-30 hover:bg-stone-700 active:scale-95 transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-600 leading-[1.9] whitespace-pre-wrap">{entry?.text2}</p>
            <div className="flex justify-end gap-1 pt-2 border-t border-stone-50">
              <button onClick={() => setEditing2(true)} className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                編集
              </button>
              <button onClick={handleDelete2} className="px-3 py-1.5 text-xs text-stone-400 hover:text-red-400 transition-colors">
                削除
              </button>
              <button
                onClick={handleStar2}
                className={`px-3 py-1.5 text-xs transition-colors ${entry?.starred2 ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}
              >
                {entry?.starred2 ? "★" : "☆"}
              </button>
            </div>
          </div>
        )}
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
