"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const stoppedRef = useRef(true); // ユーザーが明示的に停止したか

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = false;    // 1発話ごとにセッションを区切る（モバイル重複防止）
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interimText += e.results[i][0].transcript;
      }
      if (final) {
        callbackRef.current?.(final);
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };

    rec.onend = () => {
      // ユーザーが停止していなければ次の発話のために再開
      if (!stoppedRef.current) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
        setInterim("");
      }
    };

    rec.onerror = (e: any) => {
      // no-speech は無視して再開、それ以外は停止
      if (e.error === "no-speech") return;
      stoppedRef.current = true;
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
    };
  }, []);

  const start = useCallback((onFinal: (text: string) => void) => {
    callbackRef.current = onFinal;
    stoppedRef.current = false;
    try {
      recRef.current?.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    setInterim("");
  }, []);

  return { listening, interim, supported, start, stop };
}
