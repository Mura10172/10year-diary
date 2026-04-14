// ---- Top Color Theme (DailyStar card accent) ----

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

// ---- Global Color Theme (whole app) ----

export type GlobalThemeId = "light" | "dark" | "cream" | "gray" | "midnight";

export interface GlobalTheme {
  id: GlobalThemeId;
  pageBg: string;
  cardBg: string;
  border: string;
  text1: string;
  text3: string;
}

export const GLOBAL_THEMES: Record<GlobalThemeId, GlobalTheme> = {
  light:    { id: "light",    pageBg: "#faf8f4", cardBg: "#ffffff", border: "#f5f5f4", text1: "#44403c", text3: "#a8a29e" },
  dark:     { id: "dark",     pageBg: "#1c1917", cardBg: "#292524", border: "#44403c", text1: "#e7e5e4", text3: "#a8a29e" },
  cream:    { id: "cream",    pageBg: "#fdf6e3", cardBg: "#fefcf6", border: "#eddfc0", text1: "#5c3d1e", text3: "#b8956a" },
  gray:     { id: "gray",     pageBg: "#f1f5f9", cardBg: "#ffffff", border: "#e2e8f0", text1: "#334155", text3: "#94a3b8" },
  midnight: { id: "midnight", pageBg: "#0f172a", cardBg: "#1e293b", border: "#334155", text1: "#e2e8f0", text3: "#94a3b8" },
};

export const GLOBAL_THEME_IDS: GlobalThemeId[] = ["light", "dark", "cream", "gray", "midnight"];

const GLOBAL_STORAGE_KEY = "diary-global-theme";
export const DEFAULT_GLOBAL_THEME_ID: GlobalThemeId = "light";

export function loadGlobalThemeId(): GlobalThemeId {
  if (typeof window === "undefined") return DEFAULT_GLOBAL_THEME_ID;
  return (localStorage.getItem(GLOBAL_STORAGE_KEY) as GlobalThemeId | null) ?? DEFAULT_GLOBAL_THEME_ID;
}

export function saveGlobalThemeId(id: GlobalThemeId): void {
  localStorage.setItem(GLOBAL_STORAGE_KEY, id);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", id);
  }
  window.dispatchEvent(new Event("globalthemechange"));
}
