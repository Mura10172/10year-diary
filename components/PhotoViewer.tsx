"use client";
import { useEffect } from "react";
import { Entry } from "@/types";

export default function PhotoViewer({
  url,
  entry,
  onClose,
  onDelete,
  onOpenEntry,
}: {
  url: string;
  entry: Entry;
  onClose: () => void;
  onDelete: (url: string) => void;
  onOpenEntry: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("URLをコピーしました");
      }
    } catch {}
  };

  const handleSave = () => {
    // Cloudinary: insert fl_attachment for forced download
    const downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "photo.jpg";
    a.target = "_blank";
    a.click();
  };

  const handleDelete = () => {
    if (!confirm("この写真を削除しますか？")) return;
    onDelete(url);
    onClose();
  };

  const [, em, ed] = entry.date.split("-").map(Number);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <img
          src={url}
          alt="写真"
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-10 pt-5 flex justify-around">
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1.5 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-[11px]">シェア</span>
        </button>

        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1.5 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-[11px]">保存する</span>
        </button>

        <button
          onClick={() => { onOpenEntry(); onClose(); }}
          className="flex flex-col items-center gap-1.5 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-[11px]">{entry.date.slice(0,4)}年{em}月{ed}日</span>
        </button>

        <button
          onClick={handleDelete}
          className="flex flex-col items-center gap-1.5 text-white/60 hover:text-red-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-[11px]">削除</span>
        </button>
      </div>
    </div>
  );
}
