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
  // Androidリプレイ対策: onendでフラッシュした内容を記録し、
  // 再起動後に同内容がonresultで来たら除去する
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

    // finalテキストを確定する（重複除去付き）
    const commitFinal = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const now = Date.now();
      const flushed = flushedInterim.current;
      const age = now - flushedInterimTime.current;

      if (flushed && age < 4000) {
        // 完全一致 → スキップ
        if (trimmed === flushed) {
          flushedInterim.current = "";
          return;
        }
        // flushedで始まっている → 新しい部分だけ取り出す（Androidリプレイ）
        if (trimmed.startsWith(flushed)) {
          const newPart = trimmed.slice(flushed.length).trim();
          flushedInterim.current = "";
          if (newPart) callbackRef.current?.(applyDictionary(newPart));
          return;
        }
        // 一致しないなら通常処理
        flushedInterim.current = "";
      }

      callbackRef.current?.(applyDictionary(trimmed));
    };

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interimText += e.results[i][0].transcript;
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
        const text = pendingInterim.current.trim();
        if (text) {
          // フラッシュした内容を記録してから確定
          flushedInterim.current = text;
          flushedInterimTime.current = Date.now();
          callbackRef.current?.(applyDictionary(text));
        }
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