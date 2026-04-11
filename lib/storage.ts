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

export function clearAllEntries(): void {
  setStore({});
}

export function getAllEntries(): Entry[] {
  return Object.values(getStore());
}

export function deleteEntry(date: string): void {
  const store = getStore();
  delete store[date];
  setStore(store);
}

export function getEntryDatesForMonth(year: number, month: number): Set<string> {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const dates = new Set<string>();
  Object.keys(getStore()).forEach((date) => {
    if (date.startsWith(prefix)) dates.add(date);
  });
  return dates;
}
