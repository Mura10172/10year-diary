import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.APPS_SCRIPT_URL;

  // 未設定なら空配列を返す（アプリは localStorage で動作）
  if (!url) return NextResponse.json({ ok: true, entries: [] });

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();
    const data = JSON.parse(text);
    console.log("[entries] fetched", data.entries?.length ?? 0, "entries from Sheets");
    // 最初のエントリの日付を確認（デバッグ用）
    if (data.entries?.length > 0) {
      console.log("[entries] first entry date:", data.entries[0].date, "id:", data.entries[0].id);
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[entries] fetch error:", message);
    // 失敗しても localStorage のデータで動作継続
    return NextResponse.json({ ok: true, entries: [] });
  }
}
