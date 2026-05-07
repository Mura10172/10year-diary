import { Entry } from "@/types";

/** 保存時にGoogle Sheetsへ同期（fire-and-forget） */
export function syncSave(entry: Entry): void {
  fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", entry }),
  }).catch(() => {});
}

/** 保存時にGoogle Sheetsへ同期（結果を返す版） */
export async function syncSaveAsync(entry: Entry): Promise<boolean> {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", entry }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

/** 削除時にGoogle Sheetsから削除（fire-and-forget） */
export function syncDelete(date: string): void {
  fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", date }),
  }).catch(() => {});
}
