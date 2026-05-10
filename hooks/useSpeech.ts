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

  // Android対策: 前回onresultで受け取ったfull textを保持。
  // Androidは同じ認識区間を繰り返し送ってくる（前進・後退含む）ため、
  // 双方向でprevFinalとの関係をチェックし重複を除去する。
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

      const prev = prevFinal.current;

      if (prev) {
        // 1. 完全一致 → リプレイ、スキップ
        if (trimmed === prev) return;

        // 2. prevFinalで始まっている → 新しい部分だけ抽出（前進）
        if (trimmed.startsWith(prev)) {
          const newPart = trimmed.slice(prev.length).trim();
          if (!newPart) return;
          prevFinal.current = trimmed;
          callbackRef.current?.(applyDictionary(newPart));
          return;
        }

        // 3. prevFinalがtrimmedで始まっている → 逆行（既コミット範囲内）→ スキップ
        if (prev.startsWith(trimmed)) return;
      }

      // 4. 通常コミット（新しい内容）
      prevFinal.current = trimmed;
      callbackRef.current?.(applyDictionary(trimmed));
    };

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
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