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

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = true;       // 無音の間も認識を継続
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
      // resultIndex から処理して重複を防ぐ
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interimText += e.results[i][0].transcript;
      }
      if (final) {
        callbackRef.current?.(applyDictionary(final));
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };

    rec.onend = () => {
      // continuous=true でもブラウザが強制終了した場合に備えて再開
      if (!stoppedRef.current) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
        setInterim("");
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech") return; // 無音は無視
      if (e.error === "aborted") return;   // stop() によるものは無視
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
