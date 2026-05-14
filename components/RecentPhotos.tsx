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
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first

    const collected: PhotoItem[] = [];
    for (const entry of entries) {
      if (entry.photos && entry.photos.length > 0) {
        for (const url of entry.photos) {
          collected.push({ url, entry });
        }
      }
    }
    // 配列を「古い→新しい」順に変更（左=最古、右=最新）
    collected.reverse();
    setPhotos(collected);
    // 初期は右端3列（最新）を表示
    const totalColsLocal = Math.ceil(collected.length / 2);
    setCurrentCol(Math.max(0, totalColsLocal - 3));
  }, [refreshKey]);

  // 2枚ずつ列にまとめる
  //   配列 = 古→新 なので、cols[i][0] が古、cols[i][1] が新（=列内：上=古、下=新）
  const cols: [PhotoItem, PhotoItem | null][] = [];
  for (let i = 0; i < photos.length; i += 2) {
    cols.push([photos[i], photos[i + 1] ?? null]);
  }
  const totalCols = cols.length;

  // 右スワイプ = 過去 = currentCol-- （配列左方向=古い方向）
  // 左スワイプ = 未来 = currentCol++ （配列右方向=新しい方向）
  const canOlder = currentCol > 0;
  const canNewer = currentCol < totalCols - 3;
  const canOlderRef = useRef(canOlder);
  const canNewerRef = useRef(canNewer);
  useEffect(() => {
    canOlderRef.current = canOlder;
    canNewerRef.current = canNewer;
  }, [canOlder, canNewer]);

  // ネイティブ touch + 直接 DOM 操作
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontal.current = null;
      dragDeltaRef.current = 0;
      el.style.transition = "none";
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

      // 端でゴムバンド
      // 右に引っ張る (dx>0) と過去方向 → canOlder=false ならゴム
      // 左に引っ張る (dx<0) と未来方向 → canNewer=false ならゴム
      let delta = dx;
      if (dx > 0 && !canOlderRef.current) delta = dx * 0.2;
      else if (dx < 0 && !canNewerRef.current) delta = dx * 0.2;
      dragDeltaRef.current = delta;

      el.style.transform = `translateX(calc(-${currentColRef.current * COL_PCT}% + ${delta}px))`;
    };

    const onEnd = () => {
      if (touchStartX.current === null) return;
      if (!isHorizontal.current) {
        touchStartX.current = null;
        el.style.transition = "transform 0.3s ease";
        el.style.transform = `translateX(-${currentColRef.current * COL_PCT}%)`;
        return;
      }

      // 閾値 = 列幅の半分
      const colWidth = el.offsetWidth / 3;
      const threshold = colWidth / 2;

      let newCol = currentColRef.current;
      // 右スワイプ (dragDelta>0) → 過去 → newCol--
      if (dragDeltaRef.current > threshold && canOlderRef.current) newCol--;
      // 左スワイプ (dragDelta<0) → 未来 → newCol++
      else if (dragDeltaRef.current < -threshold && canNewerRef.current) newCol++;

      el.style.transition = "transform 0.3s ease";
      el.style.transform = `translateX(-${newCol * COL_PCT}%)`;

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

  // ドット：配列が古→新なので、自然順で「左=最古、右=最新」
  const numDots = Math.max(1, Math.ceil(totalCols / 3));
  const activeDot = Math.min(numDots - 1, Math.floor(currentCol / 3));

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

        {numDots > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: numDots }, (_, i) => i).map((dotIdx) => (
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