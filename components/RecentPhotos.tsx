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
  const [pages, setPages] = useState<PhotoItem[][]>([]);
  const [pageIdx, setPageIdx] = useState(0);
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

    // 6枚ごとにページ分割
    const grouped: PhotoItem[][] = [];
    for (let i = 0; i < collected.length; i += 6) {
      grouped.push(collected.slice(i, i + 6));
    }
    setPages(grouped);
    setPageIdx(0);
  }, [refreshKey]);

  // canOlder: 右スワイプ → 過去 (pageIdx++)
  // canNewer: 左スワイプ → 未来 (pageIdx--)
  const canOlder = pageIdx < pages.length - 1;
  const canNewer = pageIdx > 0;

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

      // 最初の動きで横縦を判定
      if (isHorizontal.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }
      if (!isHorizontal.current) return;
      e.preventDefault();

      // 端でのゴムバンド
      if (dx > 0 && !canOlder) {
        dragDeltaRef.current = dx * 0.2;
      } else if (dx < 0 && !canNewer) {
        dragDeltaRef.current = dx * 0.2;
      } else {
        dragDeltaRef.current = dx;
      }
      setRenderDelta(dragDeltaRef.current);
    };

    const onEnd = () => {
      if (touchStartX.current === null || !isHorizontal.current) {
        touchStartX.current = null;
        return;
      }
      setIsAnimating(true);
      if (dragDeltaRef.current > 50 && canOlder) {
        setPageIdx((i) => i + 1); // 右スワイプ → 過去ページへ
      } else if (dragDeltaRef.current < -50 && canNewer) {
        setPageIdx((i) => i - 1); // 左スワイプ → 新しいページへ
      }
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

  if (pages.length === 0) return null;

  // 全ページを横並びにして translateX でスライド（PastEntries 方式）
  const translateX = `calc(-${pageIdx * 100}% + ${renderDelta}px)`;

  return (
    <>
      <section style={{ overflow: "hidden" }}>
        {/* スライドコンテナ */}
        <div
          ref={containerRef}
          style={{
            display: "flex",
            transform: `translateX(${translateX})`,
            transition: isAnimating ? "transform 0.3s ease" : "none",
          }}
          onTransitionEnd={() => setIsAnimating(false)}
        >
          {pages.map((photos, pi) => (
            <div
              key={pi}
              style={{
                minWidth: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)",
                gridAutoFlow: "column",
                gap: "3px",
              }}
            >
              {photos.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden cursor-pointer aspect-square"
                  onClick={() => setPhotoState(item)}
                >
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ページインジケーター */}
        {pages.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {pages.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === pageIdx ? "bg-stone-400" : "bg-stone-200"
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