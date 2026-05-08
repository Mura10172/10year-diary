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
  const pendingInterim = useRef(""); // セッション切れ時に失われるinterimを保持
  // 重複防止: 直前に確定したテキストと時刻を記録
  const lastFinalText = useRef("");
  const lastFinalTime = useRef(0);

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

    // 重複チェック付きでfinalテキストを確定する
    const commitFinal = (text: string) => {
      const now = Date.now();
      // 直前と同じテキストが2秒以内に来た場合は重複として無視
      if (text === lastFinalText.current && now - lastFinalTime.current < 2000) return;
      lastFinalText.current = text;
      lastFinalTime.current = now;
      callbackRef.current?.(applyDictionary(text));
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
      // セッション終了時点でinterimが残っていれば確定テキストとして保存
      if (pendingInterim.current) {
        commitFinal(pendingInterim.current);
        pendingInterim.current = "";
        setInterim("");
      }

      if (stoppedRef.current) {
        setListening(false);
        return;
      }

      // ユーザーが停止していない場合は即座に再開（50ms）
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
    lastFinalText.current = "";
    lastFinalTime.current = 0;
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