export type ThemeId = "sky" | "amber" | "sage" | "rose" | "lavender";

export interface ColorTheme {
  id: ThemeId;
  bg: string;
  border: string;
  hoverBorder: string;
  accent: string;
}

export const THEMES: Record<ThemeId, ColorTheme> = {
  sky:      { id: "sky",      bg: "#f0f9ff", border: "#bae6fd", hoverBorder: "#7dd3fc", accent: "#38bdf8" },
  amber:    { id: "amber",    bg: "#fffbeb", border: "#fde68a", hoverBorder: "#fcd34d", accent: "#fbbf24" },
  sage:     { id: "sage",     bg: "#f0fdfa", border: "#99f6e4", hoverBorder: "#5eead4", accent: "#2dd4bf" },
  rose:     { id: "rose",     bg: "#fff1f2", border: "#fecdd3", hoverBorder: "#fda4af", accent: "#fb7185" },
  lavender: { id: "lavender", bg: "#f5f3ff", border: "#ddd6fe", hoverBorder: "#c4b5fd", accent: "#a78bfa" },
};

export const THEME_IDS: ThemeId[] = ["sky", "amber", "sage", "rose", "lavender"];

const STORAGE_KEY = "diary-color-theme";
export const DEFAULT_THEME_ID: ThemeId = "sky";

export function loadThemeId(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  return (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? DEFAULT_THEME_ID;
}

export function saveThemeId(id: ThemeId): void {
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event("themechange"));
}

export function getTheme(id?: ThemeId): ColorTheme {
  return THEMES[id ?? loadThemeId()];
}
