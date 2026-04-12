"use client";
import { useRef, useCallback } from "react";

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
) {
  const startX = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null) return;
      const diff = startX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
