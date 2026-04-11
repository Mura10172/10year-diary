import { NextResponse } from "next/server";

// "Sat Apr 11 2026..." や "2026-04-11" など様々な形式をYYYY-MM-DDに統一
function toDateStr(val: string): string {
  // すでに YYYY-MM-DD 形式ならそのまま返す
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    // "Sat Apr 11 2026 00:00:00 GMT+0900" のようなタイムゾーン付き文字列の場合、
    // Vercel サーバー（UTC）で getDate() すると日付がずれる。
    // GMT オフセットを文字列から取り出して UTC 時刻をシフトし、元のタイムゾーンの日付を得る。
    const tzMatch = val.match(/GMT([+-])(\d{2})(\d{2})/);
    if (tzMatch) {
      const sign = tzMatch[1] === "+" ? 1 : -1;
      const offsetMin = sign * (parseInt(tzMatch[2]) * 60 + parseInt(tzMatch[3]));
      const shifted = new Date(d.getTime() + offsetMin * 60 * 1000);
      const y = shifted.getUTCFullYear();
      const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
      const day = String(shifted.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    // タイムゾーン情報がない場合はローカル日付で処理
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
