import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return NextResponse.json({ ok: true, entries: [] });

  try {
    const res = await fetch(`${url}?action=getDictionary`, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return NextResponse.json({ ok: true, entries: data.entries ?? [] });
  } catch {
    return NextResponse.json({ ok: true, entries: [] });
  }
}

export async function POST(req: Request) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return NextResponse.json({ ok: false });

  try {
    const body = await req.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveDictionary", entries: body.entries }),
      redirect: "follow",
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false });
  }
}
