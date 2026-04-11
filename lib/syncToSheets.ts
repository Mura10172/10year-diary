import { Entry } from "@/types";

/** 保存時にGoogle Sheetsへ同期（fire-and-forget） */
export function syncSave(entry: Entry): void {
  fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", entry }),
  }).catch(() => {
    // Sheets連携が失敗してもアプリは正常動作
  });
}

/** 削除時にGoogle Sheetsから削除（fire-and-forget） */
export function syncDelete(date: string): void {
  fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", date }),
  }).catch(() => {
    // Sheets連携が失敗してもアプリは正常動作
  });
}
