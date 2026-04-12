"use client";
import { useEffect, useRef } from "react";
import type { View } from "@/components/BottomNav";

const ITEMS: { id: Exclude<View, "home">; label: string }[] = [
  { id: "post1", label: "投稿１" },
  { id: "post2", label: "投稿２" },
  { id: "both",  label: "投稿１と２" },
  { id: "star",  label: "お気に入り" },
];

export default function HomeMenu({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (v: Exclude<View, "home">) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    el.style.transform = "translateX(100%)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.25s ease";
      el.style.transform = "translateX(0)";
    });
  }, []);

  const handleClose = () => {
    const el = menuRef.current;
    if (el) {
      el.style.transform = "translateX(100%)";
      setTimeout(onClose, 250);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div ref={menuRef} className="w-56 bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-stone-50">
          <p className="text-sm font-medium text-stone-700">ビューを選択</p>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-stone-500 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-4 space-y-1">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); handleClose(); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
