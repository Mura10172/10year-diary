"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { applyDictionary } from "@/lib/dictionary";

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const stoppedRef = useRef(true);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInterim = useRef("");
  // Android では e.resultIndex が常に 0 を返すバグがある。
  // 自前で「次に処理すべきインデックス」を管理して再処理を防ぐ。
  const nextResultIdx = useRef(0);
  // onend でフラッシュした内容を記録し、再起動後のリプレイを除去する
  const flushedInterim = useRef("");
  const flushedInterimTime = useRef(0);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    const commitFinal = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // フラッシュしたinterimで始まっている場合は新しい部分だけ使う
      const now = Date.now();
      if (flushedInterim.current && now - flushedInterimTime.current < 4000) {
        const flushed = flushedInterim.current;
        if (trimmed === flushed) { flushedInterim.current = ""; return; }
        if (trimmed.startsWith(flushed)) {
          const newPart = trimmed.slice(flushed.length).trim();
          flushedInterim.current = "";
          if (newPart) callbackRef.current?.(applyDictionary(newPart));
          return;
        }
        flushedInterim.current = "";
      }

      callbackRef.current?.(applyDictionary(trimmed));
    };

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";

      // e.resultIndex は Android で信頼できないため、自前のインデックスと比較して大きい方を使う
      const startIdx = Math.max(e.resultIndex, nextResultIdx.current);

      for (let i = startIdx; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
          nextResultIdx.current = i + 1; // 処理済みとしてマーク
        } else {
          interimText += e.results[i][0].transcript;
        }
      }

      if (final) {
        commitFinal(final);
        pendingInterim.current = "";
        setInterim("");
      } else {
        pendingInterim.current = interimText;
        setInterim(interimText);
      }
    };

    rec.onend = () => {
      // セッション終了時にinterimが残っていれば確定
      if (pendingInterim.current) {
        const text = pendingInterim.current.trim();
        if (text) {
          flushedInterim.current = text;
          flushedInterimTime.current = Date.now();
          callbackRef.current?.(applyDictionary(text));
        }
        pendingInterim.current = "";
        setInterim("");
      }

      // 新セッション開始のためインデックスをリセット
      nextResultIdx.current = 0;

      if (stoppedRef.current) {
        setListening(false);
        return;
      }

      if (restartTimer.current) clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => {
        if (!stoppedRef.current) {
          try { rec.start(); } catch {}
        }
      }, 50);
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech") return;
      if (e.error === "aborted") return;
      if (e.error === "network") return;
      stoppedRef.current = true;
      setListening(false);
      setInterim("");
      pendingInterim.current = "";
    };

    recRef.current = rec;
    return () => {
      if (restartTimer.current) clearTimeout(restartTimer.current);
      try { rec.abort(); } catch {}
    };
  }, []);

  const start = useCallback((onFinal: (text: string) => void) => {
    callbackRef.current = onFinal;
    stoppedRef.current = false;
    pendingInterim.current = "";
    nextResultIdx.current = 0;
    flushedInterim.current = "";
    flushedInterimTime.current = 0;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    try {
      recRef.current?.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    setInterim("");
    pendingInterim.current = "";
  }, []);

  return { listening, interim, supported, start, stop };
}