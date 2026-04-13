export type DictEntry = { pronunciation: string; display: string };

const STORAGE_KEY = "speech_dictionary";

export function loadDictionary(): DictEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDictionaryLocal(entries: DictEntry[]): void {
  const filtered = entries.filter((e) => e.pronunciation || e.display);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** 音声認識テキストに辞書変換を適用 */
export function applyDictionary(text: string): string {
  const entries = loadDictionary();
  let result = text;
  for (const entry of entries) {
    if (entry.pronunciation && entry.display) {
      result = result.split(entry.pronunciation).join(entry.display);
    }
  }
  return result;
}

/** Sheets から辞書を取得して localStorage に保存 */
export async function syncDictionaryFromSheets(): Promise<DictEntry[]> {
  try {
    const res = await fetch("/api/dictionary");
    const data = await res.json();
    if (data.ok && Array.isArray(data.entries)) {
      saveDictionaryLocal(data.entries);
      return data.entries;
    }
  } catch {}
  return loadDictionary();
}

/** 辞書を localStorage に保存し Sheets にも同期 */
export async function syncDictionaryToSheets(entries: DictEntry[]): Promise<void> {
  saveDictionaryLocal(entries);
  try {
    await fetch("/api/dictionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
  } catch {}
}
