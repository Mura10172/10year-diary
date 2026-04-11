import { NextResponse } from "next/server";

// "Sat Apr 11 2026..." や "2026-04-11" など様々な形式をYYYY-MM-DDに統一
function toDateStr(val: string): string {
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return val;
}

export async function GET() {
  const url = process.env.APPS_SCRIPT_URL;

  if (!url) return NextResponse.json({ ok: true, entries: [] });

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();
    const data = JSON.parse(text);

    // 日付形式を YYYY-MM-DD に統一
    const entries = (data.entries ?? []).map((entry: Record<string, unknown>) => {
      const date = toDateStr(String(entry.date ?? ""));
      return { ...entry, id: date, date };
    });

    console.log("[entries] fetched", entries.length, "entries from Sheets");
    if (entries.length > 0) {
      console.log("[entries] first entry date (normalized):", entries[0].date);
    }

    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[entries] fetch error:", message);
    return NextResponse.json({ ok: true, entries: [] });
  }
}
