"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);

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
