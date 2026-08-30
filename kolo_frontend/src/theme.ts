import { createContext, useContext } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "kolo-theme";

export function loadThemeMode(): ThemeMode {
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === "light" ? "light" : "dark";
}

/** Flips the token scope; all components read CSS custom properties only. */
export function applyThemeMode(mode: ThemeMode): void {
	document.documentElement.dataset.theme = mode;
	localStorage.setItem(STORAGE_KEY, mode);
}

export interface ThemeModeContextValue {
	mode: ThemeMode;
	toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
	mode: "dark",
	toggleMode: () => {},
});

export function useThemeMode(): ThemeModeContextValue {
	return useContext(ThemeModeContext);
}

/** @deprecated MUI-era brand color; only referenced by legacy pages awaiting redesign. */
export const navy = "#1E3E62";
