"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { applyDictionary } from "@/lib/dictionary";

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const SRClass = useRef<any>(null);
  const recRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const stoppedRef = useRef(true);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    SRClass.current = SR;
    setSupported(true);
    return () => { try { recRef.current?.abort(); } catch {} };
  }, []);

  // セッションを新規作成して開始（iOS では同インスタンス再利用が不安定なため毎回生成）
  const createAndStart = useCallback(() => {
    const SR = SRClass.current;
    if (!SR || stoppedRef.current) return;

    try { recRef.current?.abort(); } catch {}

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = true;    // 無音をまたいで継続
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      let final = "";
      let interimText = "";
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
      if (!stoppedRef.current) {
        // 新インスタンスで即再開（古いインスタンスの状態を引き継がない）
        setTimeout(() => createAndStart(), 150);
      } else {
        setListening(false);
        setInterim("");
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech") return;  // 無音は無視、onend で再開
      if (e.error === "aborted") return;    // stop()/abort() 由来は無視
      if (e.error === "network") return;    // ネットワークエラーは再開に任せる
      // それ以外（not-allowed 等）は停止
      stoppedRef.current = true;
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    try { rec.start(); } catch {}
  }, []);

  const start = useCallback((onFinal: (text: string) => void) => {
    callbackRef.current = onFinal;
    stoppedRef.current = false;
    setListening(true);
    createAndStart();
  }, [createAndStart]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    setInterim("");
  }, []);

  return { listening, interim, supported, start, stop };
}
