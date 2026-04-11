import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = process.env.APPS_SCRIPT_URL;

  console.log("[sync] APPS_SCRIPT_URL =", url ?? "undefined（未設定）");

  if (!url) return NextResponse.json({ ok: true, skipped: true });

  try {
    const body = await req.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    // レスポンスをまずテキストで受け取り、JSONかどうか確認する
    const text = await res.text();
    console.log("[sync] response status:", res.status);
    // HTMLエラーページのエラー文を抽出して出力
    const errorMatch = text.match(/<div[^>]*class="errorMessage"[^>]*>(.*?)<\/div>/s)
      ?? text.match(/<title>(.*?)<\/title>/);
    const errorHint = errorMatch ? errorMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    console.log("[sync] response body (raw):", text.slice(0, 500));
    console.log("[sync] error hint:", errorHint || "（抽出できず）");

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      // JSONでない場合（HTMLのログインページなど）
      return NextResponse.json(
        { ok: false, error: "Apps ScriptがJSONを返しませんでした", body: text.slice(0, 300) },
        { status: 502 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync] fetch error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
