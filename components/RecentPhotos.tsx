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
  const [isAnimating, setIsAnimating] = useState(false);
  const [renderDelta, setRenderDelta] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

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

  // 2枚ずつ列にまとめる（上・下）
  const cols: [PhotoItem, PhotoItem | null][] = [];
  for (let i = 0; i < photos.length; i += 2) {
    cols.push([photos[i], photos[i + 1] ?? null]);
  }

  const totalCols = cols.length;
  // 3列表示。右スワイプ = 過去、左スワイプ = 未来
  const canOlder = currentCol < totalCols - 3; // まだ右に列がある
  const canNewer = currentCol > 0;             // 左（新しい方）に戻れる

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontal.current = null;
      dragDeltaRef.current = 0;
      setIsAnimating(false);
    };

    const onMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      if (isHorizontal.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }
      if (!isHorizontal.current) return;
      e.preventDefault();

      if (dx > 0 && !canOlder) dragDeltaRef.current = dx * 0.2;
      else if (dx < 0 && !canNewer) dragDeltaRef.current = dx * 0.2;
      else dragDeltaRef.current = dx;
      setRenderDelta(dragDeltaRef.current);
    };

    const onEnd = () => {
      if (touchStartX.current === null || !isHorizontal.current) {
        touchStartX.current = null;
        return;
      }
      setIsAnimating(true);
      if (dragDeltaRef.current > 50 && canOlder) setCurrentCol((i) => i + 1);
      else if (dragDeltaRef.current < -50 && canNewer) setCurrentCol((i) => i - 1);
      dragDeltaRef.current = 0;
      setRenderDelta(0);
      touchStartX.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [canOlder, canNewer]);

  if (photos.length === 0) return null;

  const PCT = 100 / 3;
  const translateX = `calc(-${currentCol * PCT}% + ${renderDelta}px)`;

  // ドット：3列ごとに1つ。右端 = 最新（col0）、左端 = 最古
  const numDots = Math.max(1, Math.ceil(totalCols / 3));
  const activeDot = Math.floor(currentCol / 3);

  return (
    <>
      <section style={{ overflow: "hidden" }}>
        <div
          ref={containerRef}
          style={{
            display: "flex",
            transform: `translateX(${translateX})`,
            transition: isAnimating ? "transform 0.3s ease" : "none",
          }}
          onTransitionEnd={() => setIsAnimating(false)}
        >
          {cols.map(([top, bottom], ci) => (
            <div
              key={ci}
              style={{
                minWidth: `${PCT}%`,
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