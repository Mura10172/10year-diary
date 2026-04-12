"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const lastFinalTextRef = useRef("");
  const lastFinalTimeRef = useRef(0);

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

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const transcript = e.results[i][0].transcript;
          const now = Date.now();
          // 1.5秒以内に同じテキストが来たら重複とみなしスキップ
          if (
            transcript.trim() === lastFinalTextRef.current.trim() &&
            now - lastFinalTimeRef.current < 1500
          ) {
            continue;
          }
          final += transcript;
          lastFinalTextRef.current = transcript;
          lastFinalTimeRef.current = now;
        } else {
          interimText += e.results[i][0].transcript;
        }
      }
      if (final) {
        callbackRef.current?.(final);
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    rec.onerror = () => {
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
    lastFinalTextRef.current = "";
    lastFinalTimeRef.current = 0;
    try {
      recRef.current?.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    setInterim("");
  }, []);

  return { listening, interim, supported, start, stop };
}
