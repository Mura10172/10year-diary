import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = process.env.APPS_SCRIPT_URL;

  // 環境変数が未設定の場合は何もしない（アプリは通常通り動作）
  if (!url) return NextResponse.json({ ok: true, skipped: true });

  try {
    const body = await req.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[sheets sync error]", err);
    return NextResponse.json({ ok: false });
  }
}
