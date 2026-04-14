"use client";
import { useEffect } from "react";
import { loadGlobalThemeId } from "@/lib/theme";

export default function ThemeInitializer() {
  useEffect(() => {
    const id = loadGlobalThemeId();
    if (id !== "light") {
      document.documentElement.setAttribute("data-theme", id);
    }
  }, []);
  return null;
}
