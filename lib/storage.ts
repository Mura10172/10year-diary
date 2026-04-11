import { Entry } from "@/types";

const KEY = "10year-diary";

type Store = Record<string, Entry>;

function getStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function setStore(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getEntry(date: string): Entry | undefined {
  return getStore()[date];
}

export function getEntriesForMonthDay(month: number, day: number): Entry[] {
  return Object.values(getStore()).filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d.getMonth() + 1 === month && d.getDate() === day;
  });
}

export function saveEntry(entry: Entry): void {
  const store = getStore();
  store[entry.date] = entry;
  setStore(store);
}

export function deleteEntry(date: string): void {
  const store = getStore();
  delete store[date];
  setStore(store);
}
