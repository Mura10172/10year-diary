"use client";
import { useEffect, useRef, useState } from "react";
import { Entry } from "@/types";

export default function PhotoViewer({
  url,
  entry,
  onClose,
  onDelete,
  onOpenEntry,
  onPrev,
  onNext,
}: {
  url: string;
  entry: Entry;
  onClose: () => void;
  onDelete: (url: string) => void;
  onOpenEntry: () => void;
  onPrev?: () => void; // ＜: 次に古い写真
  onNext?: () => void; // ＞: 次に新しい写真
}) {
  const [dragX, setDragX] = useState(0);
  const [scale, setScale] = useState(1);
  const [imgTx, setImgTx] = useState(0);
  const [imgTy, setImgTy] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const dragXRef = useRef(0);
  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const pinchStart = useRef<{ dist: number; scale: number; tx: number; ty: number; midX: number; midY: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTapTime = useRef(0);

  // ESC キーで閉じる / 矢印キーで前後の写真へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // URL が変わったら zoom/pan をリセット
  useEffect(() => {
    scaleRef.current = 1;
    txRef.current = 0;
    tyRef.current = 0;
    setScale(1);
    setImgTx(0);
    setImgTy(0);
  }, [url]);

  // フルスクリーン化（Chrome の URL バー等を隠す）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const doc: any = document;
    const req =
      (el as any).requestFullscreen ||
      (el as any).webkitRequestFullscreen ||
      (el as any).webkitEnterFullscreen;
    try {
      req?.call(el);
    } catch {}
    return () => {
      const exit =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.webkitCancelFullScreen;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        try { exit?.call(doc); } catch {}
      }
    };
  }, []);

  // ネイティブタッチハンドラ（ピンチズーム + パン + スワイプで閉じる + ダブルタップ）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    const applyScaleTranslate = (s: number, tx: number, ty: number) => {
      scaleRef.current = s;
      txRef.current = tx;
      tyRef.current = ty;
      setScale(s);
      setImgTx(tx);
      setImgTy(ty);
    };

    const onStart = (e: TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length >= 2) {
        // ピンチ開始
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        pinchStart.current = {
          dist: Math.hypot(dx, dy),
          scale: scaleRef.current,
          tx: txRef.current,
          ty: tyRef.current,
          midX: (t1.clientX + t2.clientX) / 2,
          midY: (t1.clientY + t2.clientY) / 2,
        };
        panStart.current = null;
        touchStartX.current = 0;
        dragXRef.current = 0;
        setDragX(0);
      } else if (e.touches.length === 1) {
        // ダブルタップ判定
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          // ダブルタップ → ズームトグル
          if (scaleRef.current > 1) {
            applyScaleTranslate(1, 0, 0);
          } else {
            applyScaleTranslate(2, 0, 0);
          }
          lastTapTime.current = 0;
          return;
        }
        lastTapTime.current = now;

        if (scaleRef.current > 1) {
          // パン開始
          panStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            tx: txRef.current,
            ty: tyRef.current,
          };
        } else {
          // スワイプで閉じる
          touchStartX.current = e.touches[0].clientX;
          dragXRef.current = 0;
        }
      }
    };

    const onMove = (e: TouchEvent) => {
      e.stopPropagation();
      if (pinchStart.current && e.touches.length >= 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / pinchStart.current.dist;
        const newScale = Math.max(MIN_SCALE * 0.5, Math.min(MAX_SCALE, pinchStart.current.scale * ratio));
        applyScaleTranslate(newScale, pinchStart.current.tx, pinchStart.current.ty);
        return;
      }
      if (panStart.current && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - panStart.current.x;
        const dy = e.touches[0].clientY - panStart.current.y;
        applyScaleTranslate(scaleRef.current, panStart.current.tx + dx, panStart.current.ty + dy);
        return;
      }
      if (touchStartX.current !== 0 && e.touches.length === 1 && scaleRef.current === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchStartX.current;
        dragXRef.current = dx;
        setDragX(dx);
      }
    };

    const onEnd = (e: TouchEvent) => {
      e.stopPropagation();
      // 1本以下になったらピンチ終了
      if (e.touches.length < 2) {
        pinchStart.current = null;
      }
      // 全部離れたら判定
      if (e.touches.length === 0) {
        panStart.current = null;

        // スケール 1 未満なら復帰
        if (scaleRef.current < 1) {
          applyScaleTranslate(1, 0, 0);
        }
        // スワイプで閉じる判定（スケール 1 のときのみ）
        if (scaleRef.current === 1 && Math.abs(dragXRef.current) > 80) {
          onClose();
        } else if (scaleRef.current === 1) {
          setDragX(0);
          dragXRef.current = 0;
        }
        touchStartX.current = 0;
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
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
      ref={containerRef}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      style={{
        transform: `translateX(${dragX}px)`,
        transition: dragX === 0 ? "transform 0.25s ease" : "none",
        opacity: 1 - Math.abs(dragX) / 300,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ＜ 前の写真（古い方向）— landscape のみ */}
      {onPrev && (
        <button
          onClick={onPrev}
          aria-label="前の写真"
          className="hidden landscape:flex absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all z-10 text-2xl"
        >
          ‹
        </button>
      )}
      {/* ＞ 次の写真（新しい方向）— landscape のみ */}
      {onNext && (
        <button
          onClick={onNext}
          aria-label="次の写真"
          className="hidden landscape:flex absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all z-10 text-2xl"
        >
          ›
        </button>
      )}

      {/* Close button (横向き時は absolute で浮かせる) */}
      <div className="flex justify-end p-4 landscape:absolute landscape:top-0 landscape:right-0 landscape:p-2 landscape:z-10">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Image */}
      <div ref={imgWrapRef} className="flex-1 flex items-center justify-center px-4 overflow-hidden landscape:px-0">
        <img
          src={url}
          alt="写真"
          draggable={false}
          style={{
            transform: `translate(${imgTx}px, ${imgTy}px) scale(${scale})`,
            transition: pinchStart.current || panStart.current ? "none" : "transform 0.2s ease",
            transformOrigin: "center center",
            touchAction: "none",
          }}
          className="max-w-full max-h-full object-contain rounded-lg landscape:rounded-none select-none"
        />
      </div>

      {/* Action buttons (横向き時は非表示) */}
      <div className="px-6 pb-10 pt-5 flex justify-around landscape:hidden">
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
