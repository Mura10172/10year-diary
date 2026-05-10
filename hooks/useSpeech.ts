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

  // Android対策:
  // Androidは e.resultIndex=0 を常に返し、かつ「前回確定テキスト＋新テキスト」を
  // 蓄積した文字列で送ってくる。prevFinal に前回処理した full text を保持し、
  // 次のresultからそのprefixを除去することで新しい部分だけを取り出す。
  const prevFinal = useRef("");

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

      let toCommit = trimmed;

      if (prevFinal.current) {
        if (trimmed === prevFinal.current) {
          // 完全一致 = リプレイ → スキップ（prevFinalは更新しない）
          return;
        }
        if (trimmed.startsWith(prevFinal.current)) {
          // 前回テキストで始まっている → 新しい部分だけ抽出
          toCommit = trimmed.slice(prevFinal.current.length).trim();
          if (!toCommit) return;
        }
      }

      // 今回の full text を記録（次回のprefix除去用）
      prevFinal.current = trimmed;
      callbackRef.current?.(applyDictionary(toCommit));
    };

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
      // e.resultIndex はAndroidでは信頼できないが、prevFinalで重複を除去するので
      // ここではブラウザの値をそのまま使う
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
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
      if (pendingInterim.current) {
        commitFinal(pendingInterim.current);
        pendingInterim.current = "";
        setInterim("");
      }

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
    prevFinal.current = "";
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