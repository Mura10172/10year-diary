"use client";
import { useState, useEffect, useRef } from "react";
import { getAllEntries } from "@/lib/storage";
import { Entry } from "@/types";
import PhotoViewer from "@/components/PhotoViewer";

function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type PhotoItem = { url: string; entry: Entry };

const COL_PCT = 100 / 3; // 各列は viewport の 1/3 幅（常に3列表示）

export default function RecentPhotos({
  refreshKey,
  onOpenEntry,
}: {
  refreshKey: number;
  onOpenEntry: (date: string) => void;
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [currentCol, setCurrentCol] = useState(0);
  const [photoState, setPhotoState] = useState<PhotoItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const currentColRef = useRef(0);

  useEffect(() => {
    currentColRef.current = currentCol;
  }, [currentCol]);

  useEffect(() => {
    const today = todayStr();
    const entries = getAllEntries()
      .filter((e) => e.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));

    const collected: PhotoItem[] = [];
    for (const entry of entries) {
      if (entry.photos && entry.photos.length > 0) {
        for (const url of entry.photos) {
          collected.push({ url, entry });
        }
      }
    }
    setPhotos(collected);
    setCurrentCol(0);
  }, [refreshKey]);

  // 2枚ずつ列にまとめる（上=新しい / 下=古い）
  const cols: [PhotoItem, PhotoItem | null][] = [];
  for (let i = 0; i < photos.length; i += 2) {
    cols.push([photos[i], photos[i + 1] ?? null]);
  }
  const totalCols = cols.length;

  // 右スワイプ = 過去（currentCol++）、左スワイプ = 未来（currentCol--）
  const canOlder = currentCol < totalCols - 3;
  const canNewer = currentCol > 0;
  const canOlderRef = useRef(canOlder);
  const canNewerRef = useRef(canNewer);
  useEffect(() => {
    canOlderRef.current = canOlder;
    canNewerRef.current = canNewer;
  }, [canOlder, canNewer]);

  // ネイティブ touch ハンドラ + 直接 DOM 操作（React 再レンダリングを介さずスムーズに）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const applyStaticTransform = () => {
      el.style.transition = "transform 0.3s ease";
      el.style.transform = `translateX(-${currentColRef.current * COL_PCT}%)`;
    };

    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontal.current = null;
      dragDeltaRef.current = 0;
      // ドラッグ中はトランジション無効化
      el.style.transition = "none";
    };

    const onMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      // 最初の動きで横/縦を判定
      if (isHorizontal.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }
      if (!isHorizontal.current) return;
      e.preventDefault();

      // 端でゴムバンド
      let delta = dx;
      if (dx > 0 && !canOlderRef.current) delta = dx * 0.2;
      else if (dx < 0 && !canNewerRef.current) delta = dx * 0.2;
      dragDeltaRef.current = delta;

      // 直接 DOM 更新（毎フレーム React 再レンダリングしない）
      el.style.transform = `translateX(calc(-${currentColRef.current * COL_PCT}% + ${delta}px))`;
    };

    const onEnd = () => {
      if (touchStartX.current === null) return;
      if (!isHorizontal.current) {
        touchStartX.current = null;
        applyStaticTransform();
        return;
      }

      // 閾値は「列幅の半分」（=コンテナ幅の 1/6）
      const colWidth = el.offsetWidth / 3;
      const threshold = colWidth / 2;

      let newCol = currentColRef.current;
      if (dragDeltaRef.current > threshold && canOlderRef.current) newCol++;
      else if (dragDeltaRef.current < -threshold && canNewerRef.current) newCol--;

      // スナップアニメーション（DOM 経由）
      el.style.transition = "transform 0.3s ease";
      el.style.transform = `translateX(-${newCol * COL_PCT}%)`;

      // React state も同期
      if (newCol !== currentColRef.current) {
        setCurrentCol(newCol);
      }
      dragDeltaRef.current = 0;
      touchStartX.current = null;
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
  }, [photos.length]);

  if (photos.length === 0) return null;

  // ドット：右端 = 最新（col 0）、左端 = 最古
  const numDots = Math.max(1, Math.ceil(totalCols / 3));
  const activeDot = Math.floor(currentCol / 3);

  return (
    <>
      <section style={{ overflow: "hidden" }}>
        <div
          ref={containerRef}
          style={{
            display: "flex",
            transform: `translateX(-${currentCol * COL_PCT}%)`,
            transition: "transform 0.3s ease",
            willChange: "transform",
          }}
        >
          {cols.map(([top, bottom], ci) => (
            <div
              key={ci}
              style={{
                minWidth: `${COL_PCT}%`,
                padding: "0 1.5px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div
                className="rounded-lg overflow-hidden cursor-pointer aspect-square"
                onClick={() => setPhotoState(top)}
              >
                <img src={top.url} alt="" className="w-full h-full object-cover" />
              </div>
              {bottom && (
                <div
                  className="rounded-lg overflow-hidden cursor-pointer aspect-square"
                  onClick={() => setPhotoState(bottom)}
                >
                  <img src={bottom.url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ドット：右端 = 最新、左端 = 最古 */}
        {numDots > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: numDots }, (_, i) => numDots - 1 - i).map((dotIdx) => (
              <div
                key={dotIdx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  dotIdx === activeDot ? "bg-stone-400" : "bg-stone-200"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {photoState && (
        <PhotoViewer
          url={photoState.url}
          entry={photoState.entry}
          onClose={() => setPhotoState(null)}
          onDelete={() => {}}
          onOpenEntry={() => {
            setPhotoState(null);
            onOpenEntry(photoState.entry.date);
          }}
        />
      )}
    </>
  );
}