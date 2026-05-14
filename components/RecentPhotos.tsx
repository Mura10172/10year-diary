"use client";
import { useState, useEffect } from "react";
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
  const [photoState, setPhotoState] = useState<PhotoItem | null>(null);

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
          if (collected.length >= 6) break;
        }
      }
      if (collected.length >= 6) break;
    }
    setPhotos(collected);
  }, [refreshKey]);

  if (photos.length === 0) return null;

  return (
    <>
      <section>
        {/* grid-auto-flow: column で 1,3,5 / 2,4,6 の列優先順に並ぶ */}
        <div
          style={{
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