"use client";
import { useState, useEffect } from "react";
import { saveEntry, deleteEntry } from "@/lib/storage";
import { syncSave, syncDelete } from "@/lib/syncToSheets";
import { useSpeech } from "@/hooks/useSpeech";
import { formatJapanese } from "@/components/DateNav";
import { Entry } from "@/types";
import PhotoViewer from "@/components/PhotoViewer";

export default function EntryModal({
  entry: initialEntry,
  onClose,
}: {
  entry: Entry;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [editing, setEditing] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [text1, setText1] = useState(initialEntry.text);
  const [text2, setText2] = useState(initialEntry.text2 ?? "");
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
    else start((final) => setText1((prev) => prev + final));
  };

  const handleSave = () => {
    const t = text1.trim();
    stop();
    const now = Date.now();
    const updated: Entry = {
      ...entry,
      text: t,
      text2: text2.trim() || undefined,
      updatedAt: now,
    };
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

  const handlePhotoDelete = (url: string) => {
    const newPhotos = (entry.photos ?? []).filter((p) => p !== url);
    const updated = { ...entry, photos: newPhotos.length > 0 ? newPhotos : undefined, updatedAt: Date.now() };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
  };

  const handleCancelEdit = () => {
    setText1(entry.text);
    setText2(entry.text2 ?? "");
    setEditing(false);
    stop();
  };

  const handleStar1 = () => {
    const updated: Entry = { ...entry, starred1: !entry.starred1, updatedAt: Date.now() };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
  };

  const handleStar2 = () => {
    const updated: Entry = { ...entry, starred2: !entry.starred2, updatedAt: Date.now() };
    saveEntry(updated);
    syncSave(updated);
    setEntry(updated);
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
              <p className="text-xs text-stone-300 mt-0.5">編集済み</p>
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
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">
          {editing ? (
            <>
              <div>
                <p className="text-[11px] text-stone-300 tracking-widest mb-2">日記</p>
                <textarea
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  className="w-full min-h-[140px] text-sm text-stone-700 leading-[1.9] resize-none outline-none"
                  autoFocus
                />
                {listening && interim && (
                  <p className="text-xs text-stone-300 italic mt-1">{interim}</p>
                )}
              </div>
              <div className="h-px bg-stone-50" />
              <div>
                <p className="text-[11px] text-stone-300 tracking-widest mb-2">気づき</p>
                <textarea
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  placeholder="日記からの気づき..."
                  className="w-full min-h-[80px] text-sm text-stone-600 leading-[1.9] resize-none outline-none placeholder-stone-200"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[11px] text-stone-300 tracking-widest mb-2">日記</p>
                <p className="text-sm text-stone-700 leading-[1.9] whitespace-pre-wrap">{entry.text}</p>
              </div>
              {entry.text2 && (
                <>
                  <div className="h-px bg-stone-50" />
                  <div>
                    <p className="text-[11px] text-stone-300 tracking-widest mb-2">気づき</p>
                    <p className="text-sm text-stone-600 leading-[1.9] whitespace-pre-wrap">{entry.text2}</p>
                  </div>
                </>
              )}
            </>
          )}
          {/* Photos */}
          {!editing && entry.photos && entry.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {entry.photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setViewingPhoto(url)}
                  className="w-full aspect-square rounded-xl overflow-hidden border border-stone-100"
                >
                  <img src={url} alt={`写真${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-stone-50">
          {editing ? (
            <div className="flex items-center justify-between">
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
                  disabled={!text1.trim()}
                  className="px-4 py-1.5 bg-stone-800 text-white text-xs rounded-xl disabled:opacity-30 hover:bg-stone-700 active:scale-95 transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs text-stone-300 hover:text-red-400 transition-colors"
              >
                削除
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-stone-300 mr-1">投稿１</span>
                <button
                  onClick={handleStar1}
                  className={`px-2 py-1.5 text-sm transition-colors ${entry.starred1 ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}
                >
                  {entry.starred1 ? "★" : "☆"}
                </button>
                <span className="text-[11px] text-stone-300 ml-2 mr-1">投稿２</span>
                <button
                  onClick={handleStar2}
                  className={`px-2 py-1.5 text-sm transition-colors ${entry.starred2 ? "text-amber-400" : "text-stone-300 hover:text-amber-400"}`}
                >
                  {entry.starred2 ? "★" : "☆"}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="ml-3 px-4 py-1.5 bg-stone-100 text-stone-600 text-xs rounded-xl hover:bg-stone-200 transition-all"
                >
                  編集
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    {viewingPhoto && (
      <PhotoViewer
        url={viewingPhoto}
        entry={entry}
        onClose={() => setViewingPhoto(null)}
        onDelete={handlePhotoDelete}
        onOpenEntry={() => setViewingPhoto(null)}
      />
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
